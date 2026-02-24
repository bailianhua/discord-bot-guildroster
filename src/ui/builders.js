const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  EmbedBuilder,
  LabelBuilder,
  ModalBuilder,
  SectionBuilder,
  StringSelectMenuBuilder,
  TextDisplayBuilder,
  TextInputStyle,
  UserSelectMenuBuilder
} = require("discord.js");
const { MENU_BUTTONS, REGISTER_BUTTON_ID } = require("../constants");
const {
  PATH_OPTIONS,
  TEAM_OPTIONS,
  WEAPON_OPTIONS
} = require("../config/select-options");

function buildRegistrationEmbed({ ign = "-", playerPath = "-", weapon = "-" }) {
  return new EmbedBuilder()
    .setTitle("การ์ดลงทะเบียนกิลด์")
    .setDescription("ลงทะเบียนเสร็จสมบูรณ์")
    .addFields(
      { name: "ชื่อในเกม (IGN)", value: ign, inline: true },
      { name: "สายอาชีพ (Path)", value: playerPath, inline: true },
      { name: "อาวุธ (Weapon)", value: weapon, inline: true }
    )
    .setColor(0x3498db)
    .setTimestamp();
}

function buildRegistrationPanelEmbed() {
  return new EmbedBuilder()
    .setTitle("ลงทะเบียนสมาชิกกิลด์")
    .setDescription("คลิกที่ปุ่ม **ลงทะเบียนโปรไฟล์** เพื่อระบุชื่อ, สายอาชีพ และอาวุธของคุณ")
    .setColor(0x5865f2)
    .setTimestamp();
}

function buildMenuComponentsV2() {
  const container = new ContainerBuilder()
    .setAccentColor(0xf1c40f)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        [
          "## Guild Menu",
          "กดปุ่มด้านขวาของแต่ละรายการเพื่อใช้งานทันที",
          "ปุ่มลบกิจกรรมใช้ได้เฉพาะแอดมิน"
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
      .setLabel("เข้าร่วมกิจกรรม")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`leave_roster:${messageId}`)
      .setLabel("ยกเลิกลงชื่อ")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`setteam_roster:${messageId}`)
      .setLabel("ตั้งทีม (แอดมิน)")
      .setStyle(ButtonStyle.Secondary),
    buildRegisterButton(ButtonStyle.Secondary)
  );
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

  const weaponSelect = new StringSelectMenuBuilder()
    .setCustomId("register_weapon_value")
    .setPlaceholder("เลือกอาวุธของคุณ")
    .setRequired(true)
    .setMinValues(1)
    .setMaxValues(1)
    .addOptions(WEAPON_OPTIONS);

  modal.addLabelComponents(
    new LabelBuilder()
      .setLabel("ชื่อในเกม (IGN)")
      .setDescription("ระบุชื่อตัวละครของคุณ")
      .setTextInputComponent(ignInput),
    new LabelBuilder()
      .setLabel("สายอาชีพ (Path)")
      .setDescription("เลือกมา 1 สายอาชีพ")
      .setStringSelectMenuComponent(pathSelect),
    new LabelBuilder()
      .setLabel("อาวุธ (Weapon)")
      .setDescription("เลือกอาวุธที่ใช้")
      .setStringSelectMenuComponent(weaponSelect)
  );

  return modal;
}

function buildSetTeamModal(rosters) {
  const modal = new ModalBuilder()
    .setCustomId("setteam_modal")
    .setTitle("กำหนดทีมสมาชิก");

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

  const rosterSelect = new StringSelectMenuBuilder()
    .setCustomId("setteam_roster_value")
    .setPlaceholder("เลือกกิจกรรมที่ต้องการกำหนดทีม")
    .setRequired(true)
    .setMinValues(1)
    .setMaxValues(1)
    .addOptions(
      rosters.map((roster) => {
        const when = new Date(roster.createdAt).toLocaleString("th-TH");
        return {
          label: truncateLabel(roster.title || `Roster ${roster.messageId}`, 100),
          description: truncateLabel(`สร้างเมื่อ ${when}`, 100),
          value: roster.messageId
        };
      })
    );

  modal.addLabelComponents(
    new LabelBuilder()
      .setLabel("สมาชิก")
      .setDescription("เลือกสมาชิกที่ต้องการกำหนดทีม (เลือกได้หลายคน)")
      .setUserSelectMenuComponent(memberSelect),
    new LabelBuilder()
      .setLabel("ทีม")
      .setDescription("เลือกทีมที่ต้องการกำหนด")
      .setStringSelectMenuComponent(teamSelect),
    new LabelBuilder()
      .setLabel("กิจกรรม")
      .setDescription("เลือกกิจกรรมที่ต้องการกำหนดทีม")
      .setStringSelectMenuComponent(rosterSelect)
  );

  return modal;
}

function truncateLabel(text, max = 100) {
  const value = (text || "").trim();
  if (!value) return "-";
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function buildRosterEmbed(title, entries) {
  const pathLabelByValue = Object.fromEntries(
    PATH_OPTIONS.map((option) => [option.value, option.label])
  );
  const weaponLabelByValue = Object.fromEntries(
    WEAPON_OPTIONS.map((option) => [option.value, option.label])
  );

  const getTeamBucket = (team) => {
    if (team === "attack") return "attack";
    if (team === "defense") return "defense";
    return "unassigned";
  };
  const buckets = {
    attack: [],
    defense: [],
    unassigned: []
  };

  entries.forEach((entry) => {
    buckets[getTeamBucket(entry.team)].push(entry);
  });

  const formatMemberLine = (entry, idx) => {
    const p = entry.profile;
    if (!p) return `${idx + 1}. <@${entry.userId}> | ไม่พบข้อมูลโปรไฟล์`;

    const profilePath = p.path || p.class || "-";
    const pathLabel = pathLabelByValue[profilePath] || profilePath;
    const weaponLabel = weaponLabelByValue[p.weapon] || p.weapon || "-";
    return `${idx + 1}. <@${entry.userId}> | ${p.ign} | ${pathLabel} | ${weaponLabel}`;
  };

  const formatBucket = (list) => {
    if (list.length === 0) return "ไม่มีสมาชิก";
    const lines = list.map((entry, idx) => formatMemberLine(entry, idx));
    const maxChars = 1000;
    const joined = lines.join("\n");
    if (joined.length <= maxChars) return joined;

    let kept = [];
    let used = 0;
    for (const line of lines) {
      if (used + line.length + 1 > maxChars - 24) break;
      kept.push(line);
      used += line.length + 1;
    }
    const hidden = lines.length - kept.length;
    return `${kept.join("\n")}\n...และอีก ${hidden} คน`;
  };

  const total = entries.length;
  const attackCount = buckets.attack.length;
  const defenseCount = buckets.defense.length;
  const unassignedCount = buckets.unassigned.length;

  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(
      `สมาชิกทั้งหมด ${total} คน | Attack ${attackCount} | Defense ${defenseCount} | Unassigned ${unassignedCount}`
    )
    .addFields(
      {
        name: `Attack Team (${attackCount})`,
        value: formatBucket(buckets.attack)
      },
      {
        name: `Defense Team (${defenseCount})`,
        value: formatBucket(buckets.defense)
      },
      {
        name: `Unassigned (${unassignedCount})`,
        value: formatBucket(buckets.unassigned)
      }
    )
    .setColor(0x00b894)
    .setTimestamp();
}

function buildMyRosterEmbed(user, profile, rosters) {
  const teamLabel = (team) => {
    if (team === "attack") return "Attack";
    if (team === "defense") return "Defense";
    return "Unassigned";
  };

  const profilePath = profile?.path || profile?.class || "-";
  const profileText = profile
    ? `${profile.ign} | ${profilePath} | ${profile.weapon}`
    : "ยังไม่ได้ลงทะเบียนโปรไฟล์";

  const rosterLines = rosters.length
    ? rosters.map((roster, idx) => {
      const createdAt = new Date(roster.createdAt).toLocaleString("th-TH");
      const team = roster.memberTeams?.[user.id] || null;
      return `${idx + 1}. **${truncateLabel(roster.title, 65)}** | ทีม: ${teamLabel(
        team
      )} | <#${roster.channelId}> | ${createdAt}`;
    }).join("\n")
    : "ยังไม่พบกิจกรรมที่คุณเข้าร่วมหรือถูกกำหนดทีม";

  return new EmbedBuilder()
    .setTitle(`ข้อมูลของ ${user.username}`)
    .addFields(
      { name: "โปรไฟล์", value: profileText },
      { name: "กิจกรรมของฉัน", value: rosterLines }
    )
    .setColor(0x1abc9c)
    .setTimestamp();
}

function buildRosterPickerMenu(customId, placeholder, rosters) {
  const options = rosters.map((roster) => {
    const when = new Date(roster.createdAt).toLocaleString("th-TH");
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
    const createdAt = new Date(roster.createdAt).toLocaleString("th-TH");
    const count = roster.memberIds?.length || 0;
    const memberIds = roster.memberIds || [];
    const attackCount = memberIds.filter(
      (userId) => roster.memberTeams?.[userId] === "attack"
    ).length;
    const defenseCount = memberIds.filter(
      (userId) => roster.memberTeams?.[userId] === "defense"
    ).length;
    const unassignedCount = count - attackCount - defenseCount;

    return [
      `${idx + 1}) **${truncateLabel(roster.title || `Roster ${roster.messageId}`, 70)}**`,
      `สมาชิก ${count} | A ${attackCount} | D ${defenseCount} | U ${unassignedCount}`,
      `ห้อง <#${roster.channelId}> | ${createdAt}`
    ].join("\n");
  });

  return new EmbedBuilder()
    .setTitle("รายการกิจกรรมที่สร้างไว้")
    .setDescription(lines.join("\n\n"))
    .setFooter({ text: "ใช้ /showroster เพื่อเลือกดูรายละเอียดกิจกรรม" })
    .setColor(0x2ecc71)
    .setTimestamp();
}

module.exports = {
  buildMenuComponentsV2,
  buildMyRosterEmbed,
  buildRegisterButton,
  buildRegisterModal,
  buildRegistrationEmbed,
  buildRegistrationPanelEmbed,
  buildRosterActionRow,
  buildRosterEmbed,
  buildRosterListEmbed,
  buildRosterPickerMenu,
  buildSetTeamModal,
  truncateLabel
};
