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
    new ButtonBuilder()
      .setCustomId(`join_roster:${messageId}`)
      .setLabel("ลงทะเบียนกิจกรรม")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`leave_roster:${messageId}`)
      .setLabel("ยกเลิกลงชื่อ")
      .setStyle(ButtonStyle.Danger),
    buildRegisterButton(ButtonStyle.Secondary)
  );
}

function buildRosterExportRow(messageId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`download_roster_excel:${messageId}`)
      .setLabel("ดาวน์โหลด Excel")
      .setStyle(ButtonStyle.Secondary)
  );
}

function buildRosterDayChoiceModal(roster) {
  const modal = new ModalBuilder()
    .setCustomId(`join_roster_modal:${roster.messageId}`)
    .setTitle(`ลงทะเบียน: ${truncateLabel(roster.title || "Guild War", 30)}`);

  const dayChoiceSelect = new StringSelectMenuBuilder()
    .setCustomId("join_roster_day_choice")
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

function buildRegisterModal() {
  const modal = new ModalBuilder()
    .setCustomId("register_profile")
    .setTitle("ลงทะเบียนกิลด์");

  const ignInput = {
    type: 4,
    custom_id: "register_ign_value",
    style: TextInputStyle.Short,
    required: true,
    max_length: 32,
    placeholder: "ระบุชื่อในเกมของคุณ (IGN)"
  };

  const pathSelect = new StringSelectMenuBuilder()
    .setCustomId("register_path_value")
    .setPlaceholder("เลือกสายอาชีพของคุณ")
    .setRequired(true)
    .setMinValues(1)
    .setMaxValues(1)
    .addOptions(PATH_OPTIONS);

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

function buildRosterEmbed(title, entries) {
  const pathLabelByValue = Object.fromEntries(
    PATH_OPTIONS.map((option) => [option.value, option.label])
  );

  const buckets = createDayChoiceBuckets();

  entries.forEach((entry) => {
    buckets[dayChoiceKey(entry.dayChoice)].push(entry);
  });

  const formatMemberLine = (entry, idx) => {
    const p = entry.profile;
    if (!p) return `${idx + 1}. <@${entry.userId}> | ไม่พบข้อมูลโปรไฟล์`;

    const profilePath = p.path || p.class || "-";
    const pathLabel = pathLabelByValue[profilePath] || profilePath;
    return `${idx + 1}. <@${entry.userId}> | ${p.ign} | ${pathLabel}`;
  };

  const buildBucketFields = (bucketLabel, list) => {
    if (list.length === 0) {
      return [{ name: `${bucketLabel} (0)`, value: "ไม่มีสมาชิก" }];
    }

    const lines = list.map((entry, idx) => formatMemberLine(entry, idx));
    const chunks = splitLinesIntoChunks(lines, 1000);
    return chunks.map((chunk, idx) => ({
      name:
        idx === 0
          ? `${bucketLabel} (${list.length})`
          : `${bucketLabel} (ต่อ ${idx + 1}/${chunks.length})`,
      value: chunk
    }));
  };

  const total = entries.length;
  const saturdayCount = buckets.saturday.length;
  const sundayCount = buckets.sunday.length;
  const bothCount = buckets.both.length;
  const unspecifiedCount = buckets.unspecified.length;

  const fields = [
    ...buildBucketFields("วันเสาร์", buckets.saturday),
    ...buildBucketFields("วันอาทิตย์", buckets.sunday),
    ...buildBucketFields("ทั้งเสาร์และอาทิตย์", buckets.both),
    ...buildBucketFields("ไม่ระบุ", buckets.unspecified)
  ];

  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(
      `สมาชิกทั้งหมด ${total} คน | วันเสาร์ ${saturdayCount} | วันอาทิตย์ ${sundayCount} | ทั้งสองวัน ${bothCount} | ไม่ระบุ ${unspecifiedCount}`
    )
    .addFields(fields)
    .setColor(0x00b894)
    .setTimestamp();
}

function buildRosterComponentsV2(title, entries, rosterMessageId) {
  const pathLabelByValue = Object.fromEntries(
    PATH_OPTIONS.map((option) => [option.value, option.label])
  );

  const buckets = createDayChoiceBuckets();

  entries.forEach((entry) => {
    buckets[dayChoiceKey(entry.dayChoice)].push(entry);
  });

  const formatMemberLine = (entry, idx) => {
    const p = entry.profile;
    if (!p) return `${idx + 1}. <@${entry.userId}> | ไม่พบข้อมูลโปรไฟล์`;

    const profilePath = p.path || p.class || "-";
    const pathLabel = pathLabelByValue[profilePath] || profilePath;
    return `${idx + 1}. <@${entry.userId}> | ${p.ign} | ${pathLabel}`;
  };

  const splitBucketChunks = (list, maxChars = 3400) => {
    if (list.length === 0) return ["ไม่มีสมาชิก"];
    const lines = list.map((entry, idx) => formatMemberLine(entry, idx));
    return splitLinesIntoChunks(lines, maxChars);
  };

  const total = entries.length;
  const saturdayCount = buckets.saturday.length;
  const sundayCount = buckets.sunday.length;
  const bothCount = buckets.both.length;
  const unspecifiedCount = buckets.unspecified.length;

  const container = new ContainerBuilder()
    .setAccentColor(0x00b894)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`## ${title || "รายละเอียดกิจกรรม"}`),
      new TextDisplayBuilder().setContent(
        `สมาชิกทั้งหมด ${total} คน | วันเสาร์ ${saturdayCount} | วันอาทิตย์ ${sundayCount} | ทั้งสองวัน ${bothCount} | ไม่ระบุ ${unspecifiedCount}`
      )
    );

  const addBucketSection = (teamLabel, list) => {
    const chunks = splitBucketChunks(list);
    container
      .addSeparatorComponents(new SeparatorBuilder())
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${teamLabel} (${list.length})\n${chunks[0]}`
        )
      );

    for (let i = 1; i < chunks.length; i += 1) {
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `### ${teamLabel} (ต่อ ${i + 1}/${chunks.length})\n${chunks[i]}`
        )
      );
    }
  };

  addBucketSection("วันเสาร์", buckets.saturday);
  addBucketSection("วันอาทิตย์", buckets.sunday);
  addBucketSection("ทั้งเสาร์และอาทิตย์", buckets.both);
  addBucketSection("ไม่ระบุ", buckets.unspecified);

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
      const dayChoice = roster.memberDays?.[user.id] || null;
      return `${idx + 1}. **${roster.title || `Roster ${roster.messageId}`}** | วัน: ${dayChoiceLabel(
        dayChoice
      )} | <#${roster.channelId}> | ${createdAt}`;
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
      const dayChoice = roster.memberDays?.[user.id] || null;
      return `${idx + 1}. **${roster.title || `Roster ${roster.messageId}`}** | วัน: ${dayChoiceLabel(
        dayChoice
      )} | <#${roster.channelId}> | ${createdAt}`;
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
    const { total, saturdayCount, sundayCount, bothCount, unspecifiedCount } =
      countMemberDayChoices(roster.memberIds || [], roster.memberDays || {});

    return [
      `${idx + 1}) **${roster.title || `Roster ${roster.messageId}`}**`,
      `สมาชิก ${total} | วันเสาร์ ${saturdayCount} | วันอาทิตย์ ${sundayCount} | ทั้งสองวัน ${bothCount} | ไม่ระบุ ${unspecifiedCount}`,
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
    const { total, saturdayCount, sundayCount, bothCount, unspecifiedCount } =
      countMemberDayChoices(roster.memberIds || [], roster.memberDays || {});

    return [
      `### ${idx + 1}. ${roster.title || `Roster ${roster.messageId}`}`,
      `**ทั้งหมด:** ${total} | **วันเสาร์:** ${saturdayCount} | **วันอาทิตย์:** ${sundayCount} | **ทั้งสองวัน:** ${bothCount} | **ไม่ระบุ:** ${unspecifiedCount}`,
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
