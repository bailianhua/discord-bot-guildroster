const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");
const {
  createRoster,
  getAllRostersInGuild,
  getAutoRosterTargets
} = require("../store");
const {
  buildRegisterButton,
  buildRosterActionRow,
  buildRosterEmbed,
  buildRosterExportRow
} = require("../ui/builders");
const { getMissingPostPerms } = require("./permissions");
const { deleteRosterWithMessage } = require("./roster-messages");

const DEFAULT_TIMEZONE = "Asia/Bangkok";
const DEFAULT_HOUR = 19;
const DEFAULT_MINUTE = 30;
const DEFAULT_WEEKDAY_INDEX = 2; // Tuesday

function parseBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "on", "y"].includes(normalized)) return true;
  if (["0", "false", "no", "off", "n"].includes(normalized)) return false;
  return fallback;
}

function toInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function resolveTimeZone(raw) {
  const configuredTimezone = raw || DEFAULT_TIMEZONE;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: configuredTimezone }).format(new Date());
    return configuredTimezone;
  } catch {
    console.warn(
      `[weekly-roster] invalid timezone "${configuredTimezone}", falling back to ${DEFAULT_TIMEZONE}`
    );
    return DEFAULT_TIMEZONE;
  }
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function resolveScheduledWeekday(raw) {
  const map = {
    sun: 0,
    sunday: 0,
    mon: 1,
    monday: 1,
    tue: 2,
    tues: 2,
    tuesday: 2,
    wed: 3,
    wednesday: 3,
    thu: 4,
    thur: 4,
    thurs: 4,
    thursday: 4,
    fri: 5,
    friday: 5,
    sat: 6,
    saturday: 6
  };
  const normalized = String(raw || "").trim().toLowerCase();
  if (!normalized) {
    return DEFAULT_WEEKDAY_INDEX;
  }
  if (Object.prototype.hasOwnProperty.call(map, normalized)) {
    return map[normalized];
  }
  console.warn(
    `[weekly-roster] invalid AUTO_ROSTER_DAY "${raw}", falling back to "tue"`
  );
  return DEFAULT_WEEKDAY_INDEX;
}

function weekdayShortLabel(index) {
  return ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][index] || "tue";
}

function addDaysToYmd(year, month, day, delta) {
  const ms = Date.UTC(year, month - 1, day) + delta * 24 * 60 * 60 * 1000;
  const d = new Date(ms);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate()
  };
}

function getZonedNow(date, timeZone) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
  const parts = dtf.formatToParts(date);
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const weekday = byType.weekday;
  const weekdayIndex = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6
  }[weekday];
  const year = toInt(byType.year, 0);
  const month = toInt(byType.month, 1);
  const day = toInt(byType.day, 1);
  const hour = toInt(byType.hour, 0);
  const minute = toInt(byType.minute, 0);

  const mondayOffset = weekdayIndex === 0 ? -6 : 1 - weekdayIndex;
  const monday = addDaysToYmd(year, month, day, mondayOffset);
  const weekKey = `${monday.year}-${pad2(monday.month)}-${pad2(monday.day)}`;
  const dateKey = `${year}-${pad2(month)}-${pad2(day)}`;

  return {
    weekdayIndex,
    year,
    month,
    day,
    hour,
    minute,
    weekKey,
    dateKey
  };
}

function getEventBatch(
  weekdayIndex,
  hour,
  minute,
  scheduledWeekdayIndex,
  scheduledHour,
  scheduledMinute,
  forcedEventKey = null
) {
  const afterSchedule =
    hour > scheduledHour || (hour === scheduledHour && minute >= scheduledMinute);
  if (!afterSchedule) return [];

  const makeEvent = (eventKey) => ({ eventKey });

  if (forcedEventKey === "guildwar") {
    return [makeEvent(forcedEventKey)];
  }

  // Weekly batch publish: post one guild war roster on configured day.
  if (weekdayIndex === scheduledWeekdayIndex) {
    return [makeEvent("guildwar")];
  }

  return [];
}

async function removeOldAutoRosters(guild, channelId, currentWeekKey) {
  const rosters = getAllRostersInGuild(guild.id);
  const oldAuto = rosters.filter((roster) => {
    const meta = roster.meta || {};
    return (
      meta.autoWeeklyGuildWar === true &&
      roster.channelId === channelId &&
      meta.weekKey &&
      meta.weekKey !== currentWeekKey
    );
  });

  for (const roster of oldAuto) {
    await deleteRosterWithMessage(guild, roster);
  }
  return oldAuto.length;
}

async function ensureWeeklyRoster({
  client,
  guildId,
  channelId,
  weekKey,
  timeZone,
  eventKey,
  title,
  skipCleanup = false
}) {
  const guild = await client.guilds.fetch(guildId).catch(() => null);
  if (!guild) return "skip";

  const channel = await guild.channels.fetch(channelId).catch(() => null);
  if (!channel || !channel.isTextBased()) return "skip";

  const missingPerms = getMissingPostPerms(channel, client.user.id);
  if (missingPerms.length > 0) {
    console.warn(
      `[weekly-roster] skip create, missing channel perms: ${missingPerms.join(", ")}`
    );
    return "skip";
  }

  if (!skipCleanup) {
    await removeOldAutoRosters(guild, channelId, weekKey);
  }

  const existing = getAllRostersInGuild(guildId).find((roster) => {
    const meta = roster.meta || {};
    return (
      roster.channelId === channelId &&
      meta.autoWeeklyGuildWar === true &&
      meta.eventKey === eventKey &&
      meta.weekKey === weekKey
    );
  });
  if (existing) return "exists";

  const pendingEmbed = buildRosterEmbed(title, []);
  const pendingRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("pending")
      .setLabel("เข้าร่วมกิจกรรม")
      .setStyle(ButtonStyle.Success)
      .setDisabled(true),
    buildRegisterButton(ButtonStyle.Secondary)
  );

  const rosterMessage = await channel.send({
    embeds: [pendingEmbed],
    components: [pendingRow]
  });

  createRoster({
    messageId: rosterMessage.id,
    guildId,
    channelId,
    title,
    createdBy: client.user.id,
    meta: {
      autoWeeklyGuildWar: true,
      eventKey,
      weekKey,
      timeZone
    }
  });

  const liveRow = buildRosterActionRow(rosterMessage.id);
  const exportRow = buildRosterExportRow(rosterMessage.id);
  await rosterMessage.edit({ components: [liveRow, exportRow] });
  console.log(`[weekly-roster] created ${eventKey} roster for week ${weekKey}`);
  return "created";
}

function getEventTitle(eventKey) {
  if (eventKey === "guildwar") {
    return process.env.AUTO_ROSTER_TITLE || "Guild War";
  }
  return process.env.AUTO_ROSTER_TITLE || "Guild War";
}

function formatYmd({ year, month, day }) {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function guildWarDateSuffix(weekKey) {
  const parts = String(weekKey || "").split("-").map((part) => Number.parseInt(part, 10));
  if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) {
    return "";
  }

  const [year, month, day] = parts;
  const saturday = addDaysToYmd(year, month, day, 5);
  const sunday = addDaysToYmd(year, month, day, 6);
  return `วันเสาร์ ${formatYmd(saturday)} | วันอาทิตย์ ${formatYmd(sunday)}`;
}

function buildEventTitle(eventKey, weekKey) {
  const baseTitle = getEventTitle(eventKey);
  if (eventKey !== "guildwar") return baseTitle;

  const suffix = guildWarDateSuffix(weekKey);
  if (!suffix) return baseTitle;
  return `${baseTitle} (${suffix})`;
}

async function runWeeklyRosterBatchOnce(
  client,
  { guildId, channelId, timeZone, weekKey, eventKeys = ["guildwar"] }
) {
  const guild = await client.guilds.fetch(guildId).catch(() => null);
  if (!guild) {
    return { error: "GUILD_NOT_FOUND" };
  }

  const channel = await guild.channels.fetch(channelId).catch(() => null);
  if (!channel || !channel.isTextBased()) {
    return { error: "CHANNEL_NOT_FOUND" };
  }

  const missingPerms = getMissingPostPerms(channel, client.user.id);
  if (missingPerms.length > 0) {
    return { error: "MISSING_PERMS", missingPerms };
  }

  const normalizedTimeZone = resolveTimeZone(timeZone);
  const resolvedWeekKey = weekKey || getZonedNow(new Date(), normalizedTimeZone).weekKey;
  const cleanupCount = await removeOldAutoRosters(guild, channelId, resolvedWeekKey);
  const created = [];
  const exists = [];
  const skipped = [];

  for (const eventKey of eventKeys) {
    if (eventKey !== "guildwar") {
      skipped.push(eventKey);
      continue;
    }

    const result = await ensureWeeklyRoster({
      client,
      guildId,
      channelId,
      weekKey: resolvedWeekKey,
      timeZone: normalizedTimeZone,
      eventKey,
      title: buildEventTitle(eventKey, resolvedWeekKey),
      skipCleanup: true
    });

    if (result === "created") created.push(eventKey);
    else if (result === "exists") exists.push(eventKey);
    else skipped.push(eventKey);
  }

  return {
    weekKey: resolvedWeekKey,
    timeZone: normalizedTimeZone,
    cleanupCount,
    created,
    exists,
    skipped
  };
}

async function clearOldAutoRostersOnce(client, { guildId, channelId, timeZone, weekKey }) {
  const guild = await client.guilds.fetch(guildId).catch(() => null);
  if (!guild) {
    return { error: "GUILD_NOT_FOUND" };
  }

  const channel = await guild.channels.fetch(channelId).catch(() => null);
  if (!channel || !channel.isTextBased()) {
    return { error: "CHANNEL_NOT_FOUND" };
  }

  const normalizedTimeZone = resolveTimeZone(timeZone);
  const resolvedWeekKey = weekKey || getZonedNow(new Date(), normalizedTimeZone).weekKey;
  const rosters = getAllRostersInGuild(guild.id);
  const autoInChannel = rosters.filter((roster) => {
    const meta = roster.meta || {};
    return meta.autoWeeklyGuildWar === true && roster.channelId === channelId;
  });

  for (const roster of autoInChannel) {
    await deleteRosterWithMessage(guild, roster);
  }

  return {
    weekKey: resolvedWeekKey,
    timeZone: normalizedTimeZone,
    deletedCount: autoInChannel.length
  };
}

function resolveSchedulerTargets() {
  const envGuildId = String(process.env.AUTO_ROSTER_GUILD_ID || "").trim();
  const envChannelId = String(process.env.AUTO_ROSTER_CHANNEL_ID || "").trim();
  const savedTargets = getAutoRosterTargets();
  const targets = [];
  const seen = new Set();

  const addTarget = (guildId, channelId, source) => {
    if (!guildId || !channelId) return;
    const key = `${guildId}:${channelId}`;
    if (seen.has(key)) return;
    seen.add(key);
    targets.push({ guildId, channelId, source });
  };

  for (const target of savedTargets) {
    addTarget(target.guildId, target.channelId, "saved");
  }

  if (envGuildId && envChannelId) {
    addTarget(envGuildId, envChannelId, "env");
  }

  return targets;
}

function startWeeklyRosterScheduler(client) {
  const enabled = parseBoolean(process.env.AUTO_ROSTER_ENABLED, true);
  if (!enabled) {
    console.log("[weekly-roster] scheduler disabled by AUTO_ROSTER_ENABLED");
    return;
  }

  const timeZone = resolveTimeZone(process.env.AUTO_ROSTER_TIMEZONE);

  const scheduledWeekdayIndex = resolveScheduledWeekday(process.env.AUTO_ROSTER_DAY);
  const scheduledWeekdayLabel = weekdayShortLabel(scheduledWeekdayIndex);
  const scheduledHour = toInt(process.env.AUTO_ROSTER_HOUR, DEFAULT_HOUR);
  const scheduledMinute = toInt(process.env.AUTO_ROSTER_MINUTE, DEFAULT_MINUTE);
  const forcedEventRaw = String(process.env.AUTO_ROSTER_FORCE_EVENT || "")
    .trim()
    .toLowerCase();
  const forcedEventKey =
    forcedEventRaw === "guildwar" ? forcedEventRaw : null;
  let running = false;
  let lastRunDate = "";
  const runTokensForDate = new Set();
  let warnedMissingTarget = false;

  const tick = async () => {
    if (running || !client.isReady()) return;
    running = true;
    try {
      const targets = resolveSchedulerTargets();
      if (!Array.isArray(targets) || targets.length === 0) {
        if (!warnedMissingTarget) {
          warnedMissingTarget = true;
          console.log(
            "[weekly-roster] waiting for targets; run /triggerweeklybatch in each target channel or set AUTO_ROSTER_GUILD_ID+AUTO_ROSTER_CHANNEL_ID"
          );
        }
        return;
      }
      warnedMissingTarget = false;

      const now = getZonedNow(new Date(), timeZone);
      if (lastRunDate !== now.dateKey) {
        lastRunDate = now.dateKey;
        runTokensForDate.clear();
      }

      const events = getEventBatch(
        now.weekdayIndex,
        now.hour,
        now.minute,
        scheduledWeekdayIndex,
        scheduledHour,
        scheduledMinute,
        forcedEventKey
      );
      if (events.length === 0) return;

      for (const targetItem of targets) {
        for (const event of events) {
          const runToken = `${now.dateKey}:${targetItem.guildId}:${targetItem.channelId}:${event.eventKey}`;
          if (runTokensForDate.has(runToken)) continue;

          const result = await ensureWeeklyRoster({
            client,
            guildId: targetItem.guildId,
            channelId: targetItem.channelId,
            weekKey: now.weekKey,
            timeZone,
            eventKey: event.eventKey,
            title: buildEventTitle(event.eventKey, now.weekKey)
          });
          if (result === "created" || result === "exists") {
            runTokensForDate.add(runToken);
          }
        }
      }
    } catch (error) {
      console.error("[weekly-roster] scheduler tick failed", error);
    } finally {
      running = false;
    }
  };

  tick();
  setInterval(tick, 30 * 1000);
  const initialTargets = resolveSchedulerTargets();
  console.log(
    `[weekly-roster] scheduler enabled ${
      initialTargets.length > 0
        ? `targets=${initialTargets.length}`
        : "(target pending)"
    } ${timeZone} ${pad2(scheduledHour)}:${pad2(scheduledMinute)} (${
      forcedEventKey
        ? `forced=${forcedEventKey}`
        : `${scheduledWeekdayLabel} batch: Guild War`
    })`
  );
}

module.exports = {
  clearOldAutoRostersOnce,
  runWeeklyRosterBatchOnce,
  startWeeklyRosterScheduler
};
