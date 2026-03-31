const fs = require("node:fs");
const path = require("node:path");
const {
  ROLE_OPTIONS,
  WEAPON_OPTIONS
} = require("./config/select-options");

const dataDir = path.join(process.cwd(), "data");
const dataFile = path.join(dataDir, "store.json");

function ensureStore() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(dataFile)) {
    const base = {
      members: {},
      rosters: {},
      rosterListViews: {},
      autoRosterTargets: [],
      guildProfileOptions: {}
    };
    fs.writeFileSync(dataFile, JSON.stringify(base, null, 2), "utf8");
  }
}

function readStore() {
  ensureStore();
  const raw = fs.readFileSync(dataFile, "utf8");
  return JSON.parse(raw);
}

function writeStore(store) {
  ensureStore();
  fs.writeFileSync(dataFile, JSON.stringify(store, null, 2), "utf8");
}

function sanitizeOption(raw, idx, sourceName) {
  const label = String(raw?.label || "").trim();
  const value = String(raw?.value || "").trim();
  const description = String(raw?.description || "").trim();
  if (!label || !value) {
    throw new Error(
      `${sourceName}[${idx}] ต้องมี label และ value ที่เป็นข้อความและไม่ว่าง`
    );
  }

  return {
    label: label.slice(0, 100),
    value: value.slice(0, 100),
    ...(description ? { description: description.slice(0, 100) } : {})
  };
}

function sanitizeOptionArray(raw, sourceName) {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new Error(`${sourceName} ต้องเป็น JSON array และมีอย่างน้อย 1 รายการ`);
  }

  const options = raw.map((item, idx) => sanitizeOption(item, idx, sourceName));
  if (options.length > 25) {
    return options.slice(0, 25);
  }
  return options;
}

function readGuildProfileOptionsRecord(store, guildId) {
  if (!guildId) return null;
  if (!store.guildProfileOptions || typeof store.guildProfileOptions !== "object") {
    return null;
  }
  return store.guildProfileOptions[guildId] || null;
}

function getGuildProfileSelectOptions(guildId) {
  if (!guildId) {
    return {
      roleOptions: ROLE_OPTIONS,
      weaponOptions: WEAPON_OPTIONS
    };
  }

  const store = readStore();
  const saved = readGuildProfileOptionsRecord(store, guildId);
  if (!saved) {
    return {
      roleOptions: ROLE_OPTIONS,
      weaponOptions: WEAPON_OPTIONS
    };
  }

  let roleOptions = ROLE_OPTIONS;
  let weaponOptions = WEAPON_OPTIONS;

  try {
    roleOptions = sanitizeOptionArray(saved.roleOptions, "guildProfileOptions.roleOptions");
  } catch {
    roleOptions = ROLE_OPTIONS;
  }

  try {
    weaponOptions = sanitizeOptionArray(saved.weaponOptions, "guildProfileOptions.weaponOptions");
  } catch {
    weaponOptions = WEAPON_OPTIONS;
  }

  return {
    roleOptions,
    weaponOptions
  };
}

function setGuildProfileSelectOptions(guildId, { roleOptions, weaponOptions }) {
  const normalizedGuildId = String(guildId || "").trim();
  if (!normalizedGuildId) {
    throw new Error("guildId ไม่ถูกต้อง");
  }

  const nextRoleOptions = sanitizeOptionArray(roleOptions, "roleOptions");
  const nextWeaponOptions = sanitizeOptionArray(weaponOptions, "weaponOptions");

  const store = readStore();
  if (!store.guildProfileOptions || typeof store.guildProfileOptions !== "object") {
    store.guildProfileOptions = {};
  }

  store.guildProfileOptions[normalizedGuildId] = {
    roleOptions: nextRoleOptions,
    weaponOptions: nextWeaponOptions,
    updatedAt: new Date().toISOString()
  };
  writeStore(store);

  return store.guildProfileOptions[normalizedGuildId];
}

function setMemberInfo(guildId, userId, profile) {
  const store = readStore();
  if (!store.members[guildId]) {
    store.members[guildId] = {};
  }

  store.members[guildId][userId] = {
    ...profile,
    updatedAt: new Date().toISOString()
  };
  writeStore(store);
  return store.members[guildId][userId];
}

function getMemberInfo(guildId, userId) {
  const store = readStore();
  return store.members[guildId]?.[userId] || null;
}

function createRoster({ messageId, guildId, channelId, title, createdBy, meta = null }) {
  const store = readStore();
  store.rosters[messageId] = {
    messageId,
    guildId,
    channelId,
    title,
    createdBy,
    createdAt: new Date().toISOString(),
    memberIds: [],
    memberDays: {},
    reserveMemberIds: [],
    reserveMemberDays: {},
    memberTeams: {},
    mirrorMessages: [],
    ...(meta && typeof meta === "object" ? { meta } : {})
  };
  writeStore(store);
  return store.rosters[messageId];
}

function addRosterMirrorMessage(rosterMessageId, channelId, messageId) {
  const store = readStore();
  const roster = store.rosters[rosterMessageId];
  if (!roster) return null;
  if (!channelId || !messageId) return roster;

  if (!Array.isArray(roster.mirrorMessages)) {
    roster.mirrorMessages = [];
  }

  const exists = roster.mirrorMessages.some((ref) => ref.messageId === messageId);
  if (!exists) {
    roster.mirrorMessages.push({
      channelId,
      messageId,
      createdAt: new Date().toISOString()
    });
    writeStore(store);
  }

  return roster;
}

function getRosterMirrorMessages(rosterMessageId) {
  const store = readStore();
  const roster = store.rosters[rosterMessageId];
  if (!roster) return [];
  if (!Array.isArray(roster.mirrorMessages)) return [];
  return roster.mirrorMessages;
}

function removeRosterMirrorMessage(rosterMessageId, messageId) {
  const store = readStore();
  const roster = store.rosters[rosterMessageId];
  if (!roster || !Array.isArray(roster.mirrorMessages)) return false;

  const before = roster.mirrorMessages.length;
  roster.mirrorMessages = roster.mirrorMessages.filter((ref) => ref.messageId !== messageId);
  const changed = roster.mirrorMessages.length !== before;
  if (changed) {
    writeStore(store);
  }
  return changed;
}

function setRosterListViewMessage(guildId, channelId, messageId) {
  const store = readStore();
  if (!store.rosterListViews || typeof store.rosterListViews !== "object") {
    store.rosterListViews = {};
  }

  store.rosterListViews[guildId] = {
    guildId,
    channelId,
    messageId,
    updatedAt: new Date().toISOString()
  };
  writeStore(store);
  return store.rosterListViews[guildId];
}

function getRosterListViewMessage(guildId) {
  const store = readStore();
  return store.rosterListViews?.[guildId] || null;
}

function clearRosterListViewMessage(guildId) {
  const store = readStore();
  if (!store.rosterListViews || !store.rosterListViews[guildId]) {
    return false;
  }
  delete store.rosterListViews[guildId];
  writeStore(store);
  return true;
}

function normalizeAutoRosterTargets(store) {
  const raw = store.autoRosterTargets;
  const values = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object"
      ? Object.values(raw)
      : [];

  const seen = new Set();
  const normalized = [];
  for (const item of values) {
    const guildId = String(item?.guildId || "").trim();
    const channelId = String(item?.channelId || "").trim();
    if (!guildId || !channelId) continue;

    const key = `${guildId}:${channelId}`;
    if (seen.has(key)) continue;
    seen.add(key);

    normalized.push({
      guildId,
      channelId,
      updatedAt: item?.updatedAt || new Date().toISOString()
    });
  }
  return normalized;
}

function setAutoRosterTarget(guildId, channelId) {
  const normalizedGuildId = String(guildId || "").trim();
  const normalizedChannelId = String(channelId || "").trim();
  if (!normalizedGuildId || !normalizedChannelId) return null;

  const store = readStore();
  const targets = normalizeAutoRosterTargets(store);
  const idx = targets.findIndex(
    (target) =>
      target.guildId === normalizedGuildId &&
      target.channelId === normalizedChannelId
  );

  const next = {
    guildId: normalizedGuildId,
    channelId: normalizedChannelId,
    updatedAt: new Date().toISOString()
  };

  if (idx >= 0) {
    targets[idx] = next;
  } else {
    targets.push(next);
  }

  store.autoRosterTargets = targets;
  writeStore(store);
  return next;
}

function getAutoRosterTargets() {
  const store = readStore();
  return normalizeAutoRosterTargets(store).sort(
    (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
  );
}

function getAutoRosterTarget(guildId) {
  if (!guildId) return null;
  const targets = getAutoRosterTargets().filter((target) => target.guildId === guildId);
  return targets[0] || null;
}

function getLatestAutoRosterTarget() {
  const targets = getAutoRosterTargets();
  return targets[0] || null;
}

function getRoster(messageId) {
  const store = readStore();
  return store.rosters[messageId] || null;
}

function getLatestRosterInChannel(guildId, channelId) {
  const store = readStore();
  const rosters = Object.values(store.rosters)
    .filter((r) => r.guildId === guildId && r.channelId === channelId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return rosters[0] || null;
}

function getRecentRostersInChannel(guildId, channelId, limit = 25) {
  const store = readStore();
  return Object.values(store.rosters)
    .filter((r) => r.guildId === guildId && r.channelId === channelId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);
}

function getRecentRostersInGuild(guildId, limit = 25) {
  const store = readStore();
  return Object.values(store.rosters)
    .filter((r) => r.guildId === guildId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);
}

function getAllRostersInGuild(guildId) {
  const store = readStore();
  return Object.values(store.rosters)
    .filter((r) => r.guildId === guildId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function getUserRostersInGuild(guildId, userId, limit = 25) {
  const store = readStore();
  return Object.values(store.rosters)
    .filter((r) => {
      const inMembers = Array.isArray(r.memberIds) && r.memberIds.includes(userId);
      const inDays = Boolean(r.memberDays?.[userId]);
      const inTeams = Boolean(r.memberTeams?.[userId]);
      const inReserveMembers =
        Array.isArray(r.reserveMemberIds) && r.reserveMemberIds.includes(userId);
      const inReserveDays = Boolean(r.reserveMemberDays?.[userId]);
      return (
        r.guildId === guildId &&
        (inMembers || inDays || inTeams || inReserveMembers || inReserveDays)
      );
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);
}

function dayChoiceToFlags(dayChoice) {
  return {
    saturday: dayChoice === "saturday" || dayChoice === "both",
    sunday: dayChoice === "sunday" || dayChoice === "both"
  };
}

function flagsToDayChoice({ saturday, sunday }) {
  if (saturday && sunday) return "both";
  if (saturday) return "saturday";
  if (sunday) return "sunday";
  return null;
}

function ensureRosterMemberCollections(roster) {
  if (!Array.isArray(roster.memberIds)) {
    roster.memberIds = [];
  }

  if (!roster.memberDays) {
    roster.memberDays = {};
  }

  if (!Array.isArray(roster.reserveMemberIds)) {
    roster.reserveMemberIds = [];
  }

  if (!roster.reserveMemberDays) {
    roster.reserveMemberDays = {};
  }

  if (!roster.memberTeams) {
    roster.memberTeams = {};
  }
}

function isEventRoster(roster) {
  if (!roster || typeof roster !== "object") return false;
  if (roster.meta?.autoWeeklyGuildWar === true) return false;
  const rosterKind = String(roster.meta?.rosterKind || "").trim().toLowerCase();
  if (rosterKind) {
    return rosterKind === "event";
  }
  return roster.meta?.manualEvent === true || !roster.meta;
}

function applyEventMemberStatus(roster, userId, mode = "join") {
  const isReserveMode = mode === "reserve";
  let changed = false;

  if (isReserveMode) {
    if (!roster.reserveMemberIds.includes(userId)) {
      roster.reserveMemberIds.push(userId);
      changed = true;
    }
  } else if (!roster.memberIds.includes(userId)) {
    roster.memberIds.push(userId);
    changed = true;
  }

  if (isReserveMode) {
    const beforeJoinedCount = roster.memberIds.length;
    roster.memberIds = roster.memberIds.filter((id) => id !== userId);
    if (roster.memberIds.length !== beforeJoinedCount) {
      changed = true;
    }
  } else {
    const beforeReserveCount = roster.reserveMemberIds.length;
    roster.reserveMemberIds = roster.reserveMemberIds.filter((id) => id !== userId);
    if (roster.reserveMemberIds.length !== beforeReserveCount) {
      changed = true;
    }
  }

  if (Object.prototype.hasOwnProperty.call(roster.memberDays, userId)) {
    delete roster.memberDays[userId];
    changed = true;
  }

  if (Object.prototype.hasOwnProperty.call(roster.reserveMemberDays, userId)) {
    delete roster.reserveMemberDays[userId];
    changed = true;
  }

  if (isReserveMode && Object.prototype.hasOwnProperty.call(roster.memberTeams, userId)) {
    delete roster.memberTeams[userId];
    changed = true;
  }

  return changed;
}

function applyMemberStatusByDay(roster, userId, dayChoice, mode) {
  const isJoinMode = mode === "join";
  const selected = dayChoiceToFlags(dayChoice);
  if (!selected.saturday && !selected.sunday) {
    return false;
  }

  const currentJoined = dayChoiceToFlags(roster.memberDays[userId]);
  const currentReserve = dayChoiceToFlags(roster.reserveMemberDays[userId]);

  for (const day of ["saturday", "sunday"]) {
    if (!selected[day]) continue;
    if (isJoinMode) {
      currentJoined[day] = true;
      currentReserve[day] = false;
    } else {
      currentReserve[day] = true;
      currentJoined[day] = false;
    }
  }

  const nextJoinedChoice = flagsToDayChoice(currentJoined);
  const nextReserveChoice = flagsToDayChoice(currentReserve);

  let changed = false;

  const prevJoinedChoice = roster.memberDays[userId] || null;
  if (nextJoinedChoice) {
    if (prevJoinedChoice !== nextJoinedChoice) {
      roster.memberDays[userId] = nextJoinedChoice;
      changed = true;
    }
  } else if (Object.prototype.hasOwnProperty.call(roster.memberDays, userId)) {
    delete roster.memberDays[userId];
    changed = true;
  }

  const prevReserveChoice = roster.reserveMemberDays[userId] || null;
  if (nextReserveChoice) {
    if (prevReserveChoice !== nextReserveChoice) {
      roster.reserveMemberDays[userId] = nextReserveChoice;
      changed = true;
    }
  } else if (Object.prototype.hasOwnProperty.call(roster.reserveMemberDays, userId)) {
    delete roster.reserveMemberDays[userId];
    changed = true;
  }

  const hasJoined = Boolean(nextJoinedChoice);
  const hasReserve = Boolean(nextReserveChoice);

  if (hasJoined && !roster.memberIds.includes(userId)) {
    roster.memberIds.push(userId);
    changed = true;
  }
  if (!hasJoined) {
    const before = roster.memberIds.length;
    roster.memberIds = roster.memberIds.filter((id) => id !== userId);
    if (roster.memberIds.length !== before) {
      changed = true;
    }
  }

  if (hasReserve && !roster.reserveMemberIds.includes(userId)) {
    roster.reserveMemberIds.push(userId);
    changed = true;
  }
  if (!hasReserve) {
    const before = roster.reserveMemberIds.length;
    roster.reserveMemberIds = roster.reserveMemberIds.filter((id) => id !== userId);
    if (roster.reserveMemberIds.length !== before) {
      changed = true;
    }
  }

  if (!hasJoined && Object.prototype.hasOwnProperty.call(roster.memberTeams, userId)) {
    delete roster.memberTeams[userId];
    changed = true;
  }

  return changed;
}

function addMemberToRoster(messageId, userId, dayChoice = null) {
  const store = readStore();
  const roster = store.rosters[messageId];
  if (!roster) return null;

  ensureRosterMemberCollections(roster);
  const changed = isEventRoster(roster)
    ? applyEventMemberStatus(roster, userId, "join")
    : applyMemberStatusByDay(roster, userId, dayChoice, "join");

  if (changed) {
    writeStore(store);
  }
  return roster;
}

function addReserveMemberToRoster(messageId, userId, dayChoice = null) {
  const store = readStore();
  const roster = store.rosters[messageId];
  if (!roster) return null;

  ensureRosterMemberCollections(roster);
  const changed = isEventRoster(roster)
    ? applyEventMemberStatus(roster, userId, "reserve")
    : applyMemberStatusByDay(roster, userId, dayChoice, "reserve");

  if (changed) {
    writeStore(store);
  }

  return roster;
}

function removeMemberFromRoster(messageId, userId) {
  const store = readStore();
  const roster = store.rosters[messageId];
  if (!roster) return null;

  ensureRosterMemberCollections(roster);

  const beforeCount = roster.memberIds.length;
  roster.memberIds = roster.memberIds.filter((id) => id !== userId);
  const removedFromMemberList = roster.memberIds.length !== beforeCount;

  const beforeReserveCount = roster.reserveMemberIds.length;
  roster.reserveMemberIds = roster.reserveMemberIds.filter((id) => id !== userId);
  const removedFromReserveList = roster.reserveMemberIds.length !== beforeReserveCount;

  const hadTeam = Object.prototype.hasOwnProperty.call(roster.memberTeams, userId);
  if (hadTeam) {
    delete roster.memberTeams[userId];
  }

  const hadDay = Object.prototype.hasOwnProperty.call(roster.memberDays, userId);
  if (hadDay) {
    delete roster.memberDays[userId];
  }

  const hadReserveDay = Object.prototype.hasOwnProperty.call(
    roster.reserveMemberDays,
    userId
  );
  if (hadReserveDay) {
    delete roster.reserveMemberDays[userId];
  }

  const changed =
    removedFromMemberList ||
    removedFromReserveList ||
    hadTeam ||
    hadDay ||
    hadReserveDay;
  if (changed) {
    writeStore(store);
  }

  return {
    roster,
    removed: changed
  };
}

function setMemberTeamInRoster(messageId, userId, team) {
  const store = readStore();
  const roster = store.rosters[messageId];
  if (!roster) return null;

  if (!roster.memberTeams) {
    roster.memberTeams = {};
  }

  roster.memberTeams[userId] = team;
  writeStore(store);
  return roster;
}

function getRosterEntries(messageId) {
  const store = readStore();
  const roster = store.rosters[messageId];
  if (!roster) return null;

  ensureRosterMemberCollections(roster);

  const membersByGuild = store.members[roster.guildId] || {};
  const joinedEntries = roster.memberIds.map((userId) => ({
    userId,
    profile: membersByGuild[userId] || null,
    dayChoice: roster.memberDays[userId] || null,
    team: roster.memberTeams[userId] || null,
    isReserve: false
  }));
  const reserveEntries = roster.reserveMemberIds.map((userId) => ({
    userId,
    profile: membersByGuild[userId] || null,
    dayChoice: roster.reserveMemberDays[userId] || null,
    team: null,
    isReserve: true
  }));
  const entries = [...joinedEntries, ...reserveEntries];

  return {
    roster,
    entries
  };
}

function deleteRoster(messageId) {
  const store = readStore();
  const roster = store.rosters[messageId];
  if (!roster) return null;

  delete store.rosters[messageId];
  writeStore(store);
  return roster;
}

module.exports = {
  addMemberToRoster,
  addReserveMemberToRoster,
  addRosterMirrorMessage,
  clearRosterListViewMessage,
  createRoster,
  deleteRoster,
  getAutoRosterTarget,
  getAutoRosterTargets,
  getAllRostersInGuild,
  getGuildProfileSelectOptions,
  getLatestAutoRosterTarget,
  getLatestRosterInChannel,
  getRosterListViewMessage,
  getRosterMirrorMessages,
  getRecentRostersInGuild,
  getRecentRostersInChannel,
  getUserRostersInGuild,
  getMemberInfo,
  getRoster,
  getRosterEntries,
  removeRosterMirrorMessage,
  removeMemberFromRoster,
  setAutoRosterTarget,
  setGuildProfileSelectOptions,
  setRosterListViewMessage,
  setMemberTeamInRoster,
  setMemberInfo
};
