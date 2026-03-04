const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  EmbedBuilder,
  LabelBuilder,
  ModalBuilder,
  SeparatorBuilder,
  SectionBuilder,
  StringSelectMenuBuilder,
  TextDisplayBuilder,
  TextInputStyle,
  UserSelectMenuBuilder
} = require("discord.js");
const { MENU_BUTTONS, REGISTER_BUTTON_ID } = require("../constants");
const {
  PATH_OPTIONS,
  TEAM_OPTIONS
} = require("../config/select-options");
const {
  countMemberDayChoices,
  createDayChoiceBuckets,
  dayChoiceKey,
  dayChoiceLabel
} = require("../utils/day-choice");
const { formatThaiDateTime } = require("../utils/date-time");

function buildRegistrationEmbed({ ign = "-", playerPath = "-" }) {
  return new EmbedBuilder()
    .setTitle("การ์ดลงทะเบียนกิลด์")
    .setDescription("ลงทะเบียนเสร็จสมบูรณ์")
    .addFields(
      { name: "ชื่อในเกม (IGN)", value: ign, inline: true },
      { name: "สายอาชีพ (Path)", value: playerPath, inline: true }
    )
    .setColor(0x3498db)
    .setTimestamp();
}

function buildRegistrationPanelEmbed() {
  return new EmbedBuilder()
    .setTitle("ลงทะเบียนสมาชิกกิลด์")
    .setDescription("คลิกที่ปุ่ม **ลงทะเบียนโปรไฟล์** เพื่อระบุชื่อและสายอาชีพของคุณ")
    .setColor(0x5865f2)
    .setTimestamp();
}

function buildUserMenuComponentsV2() {
  const container = new ContainerBuilder()
    .setAccentColor(0xf1c40f)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        [
          "## Guild Menu",
          "เมนูสำหรับสมาชิกทั่วไป",
          "กดปุ่มด้านขวาของแต่ละรายการเพื่อใช้งานทันที"
        ].join("\n")
      )
    )
    .addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent("**ลงทะเบียน**\nสร้างหรืออัปเดตโปรไฟล์")
        )
        .setButtonAccessory(
          new ButtonBuilder()
            .setCustomId(MENU_BUTTONS.register)
            .setLabel("ลงทะเบียน")
            .setStyle(ButtonStyle.Primary)
        ),
      new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent("**ข้อมูลของฉัน**\nดูโปรไฟล์และกิจกรรมของตัวเอง")
        )
        .setButtonAccessory(
          new ButtonBuilder()
            .setCustomId(MENU_BUTTONS.myRoster)
            .setLabel("ดูข้อมูล")
            .setStyle(ButtonStyle.Secondary)
        ),
      new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent("**รายการกิจกรรม**\nดูรายการโรสเตอร์ทั้งหมด")
        )
        .setButtonAccessory(
          new ButtonBuilder()
            .setCustomId(MENU_BUTTONS.rosterList)
            .setLabel("รายการ")
            .setStyle(ButtonStyle.Secondary)
        ),
      new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent("**เลือกดูกิจกรรม**\nเลือกกิจกรรมและดูรายละเอียด")
        )
        .setButtonAccessory(
          new ButtonBuilder()
            .setCustomId(MENU_BUTTONS.showRoster)
            .setLabel("เลือก")
            .setStyle(ButtonStyle.Success)
        )
    );

  return [container];
}

function buildAdminMenuComponentsV2() {
  const container = new ContainerBuilder()
    .setAccentColor(0xe67e22)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        [
          "## Admin Menu",
          "เมนูสำหรับผู้ดูแลระบบ",
          "ใช้สำหรับสร้าง/ประกาศ/ลบกิจกรรม"
        ].join("\n")
      )
    )
    .addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent("**เริ่มกิจกรรม**\nสร้างโพสต์ลงชื่อกิจกรรมใหม่")
        )
        .setButtonAccessory(
          new ButtonBuilder()
            .setCustomId(MENU_BUTTONS.startRoster)
            .setLabel("เริ่ม")
            .setStyle(ButtonStyle.Primary)
        ),
      new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent("**ประกาศกิจกรรม**\nเลือกกิจกรรมแล้วประกาศในช่องนี้")
        )
        .setButtonAccessory(
          new ButtonBuilder()
            .setCustomId(MENU_BUTTONS.announceRoster)
            .setLabel("ประกาศ")
            .setStyle(ButtonStyle.Secondary)
        ),
      new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent("**ลบกิจกรรม**\nลบโรสเตอร์เก่า (แอดมินเท่านั้น)")
        )
        .setButtonAccessory(
          new ButtonBuilder()
            .setCustomId(MENU_BUTTONS.deleteRoster)
            .setLabel("ลบ")
            .setStyle(ButtonStyle.Danger)
        ),
      new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent("**รัน Weekly Batch**\nสร้าง Guild War และบันทึกช่องนี้เข้า scheduler")
        )
        .setButtonAccessory(
          new ButtonBuilder()
            .setCustomId(MENU_BUTTONS.triggerWeeklyBatch)
            .setLabel("รันแบตช์")
            .setStyle(ButtonStyle.Success)
        ),
      new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent("**ล้าง Auto Roster**\nลบโรสเตอร์อัตโนมัติในช่องปัจจุบัน")
        )
        .setButtonAccessory(
          new ButtonBuilder()
            .setCustomId(MENU_BUTTONS.clearOldRoster)
            .setLabel("ล้างอัตโนมัติ")
            .setStyle(ButtonStyle.Secondary)
        )
    );

  return [container];
}

function buildRegisterButton(style = ButtonStyle.Primary) {
  return new ButtonBuilder()
    .setCustomId(REGISTER_BUTTON_ID)
    .setLabel("ลงทะเบียนโปรไฟล์")
    .setStyle(style);
}

function buildRosterActionRow(messageId) {
  return new ActionRowBuilder().addComponents(
    buildRegisterButton(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`join_roster:${messageId}`)
      .setLabel("ลงทะเบียนกิจกรรม")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`reserve_roster:${messageId}`)
      .setLabel("ลงทะเบียนสำรอง")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`leave_roster:${messageId}`)
      .setLabel("ยกเลิกลงชื่อ")
      .setStyle(ButtonStyle.Danger)
  );
}

function buildRosterExportRow(messageId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`download_roster_csv:${messageId}`)
      .setLabel("ดาวน์โหลด CSV")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`download_roster_xlsx:${messageId}`)
      .setLabel("ดาวน์โหลด Excel")
      .setStyle(ButtonStyle.Primary)
  );
}

function buildRosterDayChoiceModalByType(roster, { mode = "join" } = {}) {
  const isReserve = mode === "reserve";
  const customId = isReserve
    ? `reserve_roster_modal:${roster.messageId}`
    : `join_roster_modal:${roster.messageId}`;
  const selectCustomId = isReserve
    ? "reserve_roster_day_choice"
    : "join_roster_day_choice";
  const titlePrefix = isReserve ? "สำรอง" : "ลงทะเบียน";

  const modal = new ModalBuilder()
    .setCustomId(customId)
    .setTitle(`${titlePrefix}: ${truncateLabel(roster.title || "Guild War", 30)}`);

  const dayChoiceSelect = new StringSelectMenuBuilder()
    .setCustomId(selectCustomId)
    .setPlaceholder("เลือกวันที่เข้าร่วม")
    .setRequired(true)
    .setMinValues(1)
    .setMaxValues(1)
    .addOptions(
      {
        label: "วันเสาร์",
        value: "saturday",
        description: "เข้าร่วมเฉพาะวันเสาร์"
      },
      {
        label: "วันอาทิตย์",
        value: "sunday",
        description: "เข้าร่วมเฉพาะวันอาทิตย์"
      },
      {
        label: "ทั้งเสาร์และอาทิตย์",
        value: "both",
        description: "เข้าร่วมทั้งวันเสาร์และอาทิตย์"
      }
    );

  modal.addLabelComponents(
    new LabelBuilder()
      .setLabel("วันที่ต้องการเข้าร่วม")
      .setDescription("เลือกได้ 1 ตัวเลือก")
      .setStringSelectMenuComponent(dayChoiceSelect)
  );

  return modal;
}

function buildRosterDayChoiceModal(roster) {
  return buildRosterDayChoiceModalByType(roster, { mode: "join" });
}

function buildReserveDayChoiceModal(roster) {
  return buildRosterDayChoiceModalByType(roster, { mode: "reserve" });
}

function buildRegisterModal(profile = null) {
  const modal = new ModalBuilder()
    .setCustomId("register_profile")
    .setTitle("ลงทะเบียนกิลด์");

  const currentIgn = String(profile?.ign || "").trim();
  const currentPath = String(profile?.path || profile?.class || "").trim();

  const ignInput = {
    type: 4,
    custom_id: "register_ign_value",
    style: TextInputStyle.Short,
    required: true,
    max_length: 32,
    placeholder: "ระบุชื่อในเกมของคุณ (IGN)",
    ...(currentIgn ? { value: currentIgn } : {})
  };

  const pathOptions = PATH_OPTIONS.map((option) => ({
    ...option,
    ...(currentPath && option.value === currentPath ? { default: true } : {})
  }));

  const pathSelect = new StringSelectMenuBuilder()
    .setCustomId("register_path_value")
    .setPlaceholder("เลือกสายอาชีพของคุณ")
    .setRequired(true)
    .setMinValues(1)
    .setMaxValues(1)
    .addOptions(pathOptions);

  modal.addLabelComponents(
    new LabelBuilder()
      .setLabel("ชื่อในเกม (IGN)")
      .setDescription("ระบุชื่อตัวละครของคุณ")
      .setTextInputComponent(ignInput),
    new LabelBuilder()
      .setLabel("สายอาชีพ (Path)")
      .setDescription("เลือกมา 1 สายอาชีพ")
      .setStringSelectMenuComponent(pathSelect),
  );

  return modal;
}

function buildStartRosterModal() {
  const modal = new ModalBuilder()
    .setCustomId("start_roster_modal")
    .setTitle("เริ่มกิจกรรม");

  const titleInput = {
    type: 4,
    custom_id: "start_roster_title",
    style: TextInputStyle.Short,
    required: false,
    max_length: 80,
    placeholder: "ลงชื่อสมาชิกกิลด์"
  };

  modal.addLabelComponents(
    new LabelBuilder()
      .setLabel("หัวข้อกิจกรรม (ไม่บังคับ)")
      .setDescription("เว้นว่างเพื่อใช้หัวข้อเริ่มต้น")
      .setTextInputComponent(titleInput)
  );

  return modal;
}

function buildSetTeamModal(roster) {
  const modal = new ModalBuilder()
    .setCustomId(`setteam_modal:${roster.messageId}`)
    .setTitle(`กำหนดทีม: ${truncateLabel(roster.title || "Roster", 32)}`);

  const memberSelect = new UserSelectMenuBuilder()
    .setCustomId("setteam_member_value")
    .setPlaceholder("เลือกสมาชิกหลายคนได้")
    .setRequired(true)
    .setMinValues(1)
    .setMaxValues(25);

  const teamSelect = new StringSelectMenuBuilder()
    .setCustomId("setteam_team_value")
    .setPlaceholder("เลือกทีม")
    .setRequired(true)
    .setMinValues(1)
    .setMaxValues(1)
    .addOptions(TEAM_OPTIONS);

  modal.addLabelComponents(
    new LabelBuilder()
      .setLabel("สมาชิก")
      .setDescription("เลือกสมาชิกที่ต้องการกำหนดทีม (เลือกได้หลายคน)")
      .setUserSelectMenuComponent(memberSelect),
    new LabelBuilder()
      .setLabel("ทีม")
      .setDescription("เลือกทีมที่ต้องการกำหนด")
      .setStringSelectMenuComponent(teamSelect)
  );

  return modal;
}

function truncateLabel(text, max = 100) {
  const value = (text || "").trim();
  if (!value) return "-";
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function splitLinesIntoChunks(lines, maxChars) {
  if (!Array.isArray(lines) || lines.length === 0) {
    return [];
  }

  const chunks = [];
  let current = "";

  const pushLine = (line) => {
    if (!line) return;
    if (!current) {
      current = line;
      return;
    }

    const next = `${current}\n${line}`;
    if (next.length <= maxChars) {
      current = next;
      return;
    }

    chunks.push(current);
    current = line;
  };

  for (const rawLine of lines) {
    const line = String(rawLine ?? "");
    if (line.length <= maxChars) {
      pushLine(line);
      continue;
    }

    if (current) {
      chunks.push(current);
      current = "";
    }

    for (let i = 0; i < line.length; i += maxChars) {
      const segment = line.slice(i, i + maxChars);
      if (segment.length === maxChars) {
        chunks.push(segment);
      } else {
        current = segment;
      }
    }
  }

  if (current) {
    chunks.push(current);
  }

  return chunks;
}

function buildRosterDayBuckets(entries) {
  const joined = createDayChoiceBuckets();
  const reserve = createDayChoiceBuckets();

  entries.forEach((entry) => {
    const key = dayChoiceKey(entry.dayChoice);
    if (entry.isReserve) {
      reserve[key].push(entry);
      return;
    }
    joined[key].push(entry);
  });

  return { joined, reserve };
}

function buildPathLabelMap() {
  return Object.fromEntries(PATH_OPTIONS.map((option) => [option.value, option.label]));
}

function formatRosterMemberLine(entry, idx, pathLabelByValue) {
  const reserveTag = entry.isReserve ? " [สำรอง]" : "";
  const profile = entry.profile;
  if (!profile) {
    return `${idx + 1}. <@${entry.userId}>${reserveTag} | ไม่พบข้อมูลโปรไฟล์`;
  }

  const profilePath = profile.path || profile.class || "-";
  const pathLabel = pathLabelByValue[profilePath] || profilePath;
  return `${idx + 1}. <@${entry.userId}>${reserveTag} | ${profile.ign} | ${pathLabel}`;
}

function buildBucketLines(joinedEntries, reserveEntries, pathLabelByValue) {
  const joinedLines = joinedEntries.map((entry, idx) =>
    formatRosterMemberLine(entry, idx, pathLabelByValue)
  );
  const reserveLines = reserveEntries.map((entry, idx) =>
    formatRosterMemberLine(entry, idx + joinedEntries.length, pathLabelByValue)
  );
  return [...joinedLines, ...reserveLines];
}

function countUniqueMembersInEntries(entries) {
  return new Set(entries.map((entry) => entry.userId)).size;
}

function countUniqueMembersInRoster(roster) {
  const joinedIds = Array.isArray(roster.memberIds) ? roster.memberIds : [];
  const reserveIds = Array.isArray(roster.reserveMemberIds) ? roster.reserveMemberIds : [];
  return new Set([...joinedIds, ...reserveIds]).size;
}

function resolveMyRosterStatus(roster, userId) {
  const inJoinedIds = Array.isArray(roster.memberIds) && roster.memberIds.includes(userId);
  const joinedDayChoice = roster.memberDays?.[userId] || null;
  const hasJoinedTeam = Boolean(roster.memberTeams?.[userId]);
  const inReserveIds =
    Array.isArray(roster.reserveMemberIds) && roster.reserveMemberIds.includes(userId);
  const reserveDayChoice = roster.reserveMemberDays?.[userId] || null;
  const hasJoined = inJoinedIds || joinedDayChoice || hasJoinedTeam;
  const hasReserve = inReserveIds || reserveDayChoice;

  if (hasJoined && hasReserve) {
    return {
      statusLabel: "ลงชื่อ+สำรอง",
      dayText: `ลงชื่อ ${dayChoiceLabel(joinedDayChoice)} | สำรอง ${dayChoiceLabel(
        reserveDayChoice
      )}`
    };
  }

  if (hasJoined) {
    return {
      statusLabel: "ลงชื่อ",
      dayText: dayChoiceLabel(joinedDayChoice)
    };
  }

  if (hasReserve) {
    return {
      statusLabel: "สำรอง",
      dayText: dayChoiceLabel(reserveDayChoice)
    };
  }

  return {
    statusLabel: "-",
    dayText: dayChoiceLabel(null)
  };
}

function buildRosterEmbed(title, entries) {
  const pathLabelByValue = buildPathLabelMap();
  const buckets = buildRosterDayBuckets(entries);
  const joinedTotal = entries.filter((entry) => !entry.isReserve).length;
  const reserveTotal = entries.length - joinedTotal;
  const total = countUniqueMembersInEntries(entries);

  const buildBucketFields = (bucketLabel, key) => {
    const joinedEntries = buckets.joined[key];
    const reserveEntries = buckets.reserve[key];
    const joinedCount = joinedEntries.length;
    const reserveCount = reserveEntries.length;
    const header = `${bucketLabel} (ลงชื่อ ${joinedCount}) (สำรอง ${reserveCount})`;
    const lines = buildBucketLines(joinedEntries, reserveEntries, pathLabelByValue);

    if (lines.length === 0) {
      return [{ name: header, value: "ไม่มีสมาชิก" }];
    }

    const chunks = splitLinesIntoChunks(lines, 1000);
    return chunks.map((chunk, idx) => ({
      name:
        idx === 0
          ? header
          : `${header} (ต่อ ${idx + 1}/${chunks.length})`,
      value: chunk
    }));
  };

  const fields = [
    ...buildBucketFields("วันเสาร์", "saturday"),
    ...buildBucketFields("วันอาทิตย์", "sunday"),
    ...buildBucketFields("ทั้งเสาร์และอาทิตย์", "both"),
    ...buildBucketFields("ไม่ระบุ", "unspecified")
  ];

  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(
      `สมาชิกทั้งหมด ${total} คน | ลงชื่อ ${joinedTotal} คน | สำรอง ${reserveTotal} คน`
    )
    .addFields(fields)
    .setColor(0x00b894)
    .setTimestamp();
}

function buildRosterComponentsV2(title, entries, rosterMessageId) {
  const pathLabelByValue = buildPathLabelMap();
  const buckets = buildRosterDayBuckets(entries);
  const joinedTotal = entries.filter((entry) => !entry.isReserve).length;
  const reserveTotal = entries.length - joinedTotal;
  const total = countUniqueMembersInEntries(entries);

  const container = new ContainerBuilder()
    .setAccentColor(0x00b894)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`## ${title || "รายละเอียดกิจกรรม"}`),
      new TextDisplayBuilder().setContent(
        `สมาชิกทั้งหมด ${total} คน | ลงชื่อ ${joinedTotal} คน | สำรอง ${reserveTotal} คน`
      )
    );

  const addBucketSection = (bucketLabel, key) => {
    const joinedEntries = buckets.joined[key];
    const reserveEntries = buckets.reserve[key];
    const joinedCount = joinedEntries.length;
    const reserveCount = reserveEntries.length;
    const sectionTitle = `${bucketLabel} (ลงชื่อ ${joinedCount}) (สำรอง ${reserveCount})`;
    const lines = buildBucketLines(joinedEntries, reserveEntries, pathLabelByValue);
    const chunks =
      lines.length > 0 ? splitLinesIntoChunks(lines, 3400) : ["ไม่มีสมาชิก"];

    container
      .addSeparatorComponents(new SeparatorBuilder())
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${sectionTitle}\n${chunks[0]}`
        )
      );

    for (let i = 1; i < chunks.length; i += 1) {
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${sectionTitle} (ต่อ ${i + 1}/${chunks.length})\n${chunks[i]}`
        )
      );
    }
  };

  addBucketSection("วันเสาร์", "saturday");
  addBucketSection("วันอาทิตย์", "sunday");
  addBucketSection("ทั้งเสาร์และอาทิตย์", "both");
  addBucketSection("ไม่ระบุ", "unspecified");

  if (rosterMessageId) {
    container.addSeparatorComponents(new SeparatorBuilder()).addActionRowComponents(
      buildRosterActionRow(rosterMessageId),
      buildRosterExportRow(rosterMessageId)
    );
  }

  return [container];
}

function buildMyRosterEmbed(user, profile, rosters) {
  const profilePath = profile?.path || profile?.class || "-";
  const profileText = profile
    ? `${profile.ign} | ${profilePath}`
    : "ยังไม่ได้ลงทะเบียนโปรไฟล์";

  const rosterLines = rosters.length
    ? rosters.map((roster, idx) => {
      const createdAt = formatThaiDateTime(roster.createdAt);
      const { statusLabel, dayText } = resolveMyRosterStatus(roster, user.id);
      return `${idx + 1}. **${roster.title || `Roster ${roster.messageId}`}** | วัน: ${dayText} | สถานะ: ${statusLabel} | <#${roster.channelId}> | ${createdAt}`;
    })
    : ["ยังไม่พบกิจกรรมที่คุณเข้าร่วมหรือถูกกำหนดทีม"];

  const rosterChunks = splitLinesIntoChunks(rosterLines, 1000);
  const rosterFields = rosterChunks.map((chunk, idx) => ({
    name:
      idx === 0
        ? "กิจกรรมของฉัน"
        : `กิจกรรมของฉัน (ต่อ ${idx + 1}/${rosterChunks.length})`,
    value: chunk
  }));

  return new EmbedBuilder()
    .setTitle(`ข้อมูลของ ${user.username}`)
    .addFields(
      { name: "โปรไฟล์", value: profileText },
      ...rosterFields
    )
    .setColor(0x1abc9c)
    .setTimestamp();
}

function buildMyRosterComponentsV2(user, profile, rosters) {
  const profilePath = profile?.path || profile?.class || "-";
  const profileText = profile
    ? `${profile.ign} | ${profilePath}`
    : "ยังไม่ได้ลงทะเบียนโปรไฟล์";

  const rosterLines = rosters.length
    ? rosters.map((roster, idx) => {
      const createdAt = formatThaiDateTime(roster.createdAt);
      const { statusLabel, dayText } = resolveMyRosterStatus(roster, user.id);
      return `${idx + 1}. **${roster.title || `Roster ${roster.messageId}`}** | วัน: ${dayText} | สถานะ: ${statusLabel} | <#${roster.channelId}> | ${createdAt}`;
    })
    : ["ยังไม่พบกิจกรรมที่คุณเข้าร่วมหรือถูกกำหนดทีม"];
  const rosterChunks = splitLinesIntoChunks(rosterLines, 3400);

  const container = new ContainerBuilder()
    .setAccentColor(0x1abc9c)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`## ข้อมูลของ ${user.username}`),
      new TextDisplayBuilder().setContent(`### โปรไฟล์\n${profileText}`)
    );

  rosterChunks.forEach((chunk, idx) => {
    container
      .addSeparatorComponents(new SeparatorBuilder())
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          idx === 0
            ? `### กิจกรรมของฉัน\n${chunk}`
            : `### กิจกรรมของฉัน (ต่อ ${idx + 1}/${rosterChunks.length})\n${chunk}`
        )
      );
  });

  return [container];
}

function buildRosterPickerMenu(customId, placeholder, rosters) {
  const options = rosters.map((roster) => {
    const when = formatThaiDateTime(roster.createdAt);
    return {
      label: truncateLabel(roster.title || `Roster ${roster.messageId}`, 100),
      description: truncateLabel(`สร้างเมื่อ ${when} | ห้อง ${roster.channelId}`, 100),
      value: roster.messageId
    };
  });

  return new StringSelectMenuBuilder()
    .setCustomId(customId)
    .setPlaceholder(placeholder)
    .setMinValues(1)
    .setMaxValues(1)
    .addOptions(options);
}

function buildRosterListEmbed(rosters) {
  const lines = rosters.map((roster, idx) => {
    const createdAt = formatThaiDateTime(roster.createdAt);
    const joined =
      countMemberDayChoices(roster.memberIds || [], roster.memberDays || {});
    const reserve =
      countMemberDayChoices(roster.reserveMemberIds || [], roster.reserveMemberDays || {});
    const total = countUniqueMembersInRoster(roster);

    return [
      `${idx + 1}) **${roster.title || `Roster ${roster.messageId}`}**`,
      `สมาชิกทั้งหมด ${total} | ลงชื่อ ${joined.total} | สำรอง ${reserve.total}`,
      `ห้อง <#${roster.channelId}> | ${createdAt}`
    ].join("\n");
  });

  const chunks = splitLinesIntoChunks(lines, 1000);
  const fields = chunks.map((chunk, idx) => ({
    name: idx === 0 ? "รายการกิจกรรม" : `รายการกิจกรรม (ต่อ ${idx + 1}/${chunks.length})`,
    value: chunk
  }));

  return new EmbedBuilder()
    .setTitle("รายการกิจกรรมที่สร้างไว้")
    .addFields(fields)
    .setFooter({ text: "ใช้ /showroster เพื่อเลือกดูรายละเอียดกิจกรรม" })
    .setColor(0x2ecc71)
    .setTimestamp();
}

function buildRosterListComponentsV2(rosters) {
  const lines = rosters.map((roster, idx) => {
    const createdAt = formatThaiDateTime(roster.createdAt);
    const joined =
      countMemberDayChoices(roster.memberIds || [], roster.memberDays || {});
    const reserve =
      countMemberDayChoices(roster.reserveMemberIds || [], roster.reserveMemberDays || {});
    const total = countUniqueMembersInRoster(roster);

    return [
      `### ${idx + 1}. ${roster.title || `Roster ${roster.messageId}`}`,
      `**สมาชิกทั้งหมด:** ${total} | **ลงชื่อ:** ${joined.total} | **สำรอง:** ${reserve.total}`,
      `ห้อง <#${roster.channelId}> | ${createdAt}`
    ].join("\n");
  });
  const chunks = splitLinesIntoChunks(lines, 3400);

  const container = new ContainerBuilder()
    .setAccentColor(0x2ecc71)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent("## รายการกิจกรรมที่สร้างไว้"),
      new TextDisplayBuilder().setContent(
        `แสดงทั้งหมด ${rosters.length} รายการ | ใช้ \`/showroster\` เพื่อดูรายละเอียดกิจกรรม`
      )
    );

  chunks.forEach((chunk) => {
    container
      .addSeparatorComponents(new SeparatorBuilder())
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(chunk));
  });

  return [container];
}

module.exports = {
  buildAdminMenuComponentsV2,
  buildMyRosterComponentsV2,
  buildMyRosterEmbed,
  buildUserMenuComponentsV2,
  buildRegisterButton,
  buildRegisterModal,
  buildReserveDayChoiceModal,
  buildRosterDayChoiceModal,
  buildStartRosterModal,
  buildRegistrationEmbed,
  buildRegistrationPanelEmbed,
  buildRosterActionRow,
  buildRosterExportRow,
  buildRosterComponentsV2,
  buildRosterEmbed,
  buildRosterListComponentsV2,
  buildRosterListEmbed,
  buildRosterPickerMenu,
  buildSetTeamModal,
  truncateLabel
};
