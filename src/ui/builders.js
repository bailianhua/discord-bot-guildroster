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
  TextInputBuilder,
  TextInputStyle,
  UserSelectMenuBuilder
} = require("discord.js");
const {
  MENU_BUTTONS,
  PROFILE_OPTION_ACTIONS,
  REGISTER_BUTTON_ID
} = require("../constants");
const {
  ROLE_OPTIONS,
  WEAPON_OPTIONS,
  TEAM_OPTIONS
} = require("../config/select-options");
const {
  countMemberDayChoices,
  createDayChoiceBuckets,
  dayChoiceKey,
  dayChoiceLabel
} = require("../utils/day-choice");
const {
  buildRosterCalendarData,
  getTodayYmdParts
} = require("../utils/roster-calendar");
const { formatThaiDateTime } = require("../utils/date-time");

const MANUAL_EVENT_MONTH_SELECT_OPTIONS = [
  { label: "มกราคม (01)", value: "01", description: "เดือนมกราคม" },
  { label: "กุมภาพันธ์ (02)", value: "02", description: "เดือนกุมภาพันธ์" },
  { label: "มีนาคม (03)", value: "03", description: "เดือนมีนาคม" },
  { label: "เมษายน (04)", value: "04", description: "เดือนเมษายน" },
  { label: "พฤษภาคม (05)", value: "05", description: "เดือนพฤษภาคม" },
  { label: "มิถุนายน (06)", value: "06", description: "เดือนมิถุนายน" },
  { label: "กรกฎาคม (07)", value: "07", description: "เดือนกรกฎาคม" },
  { label: "สิงหาคม (08)", value: "08", description: "เดือนสิงหาคม" },
  { label: "กันยายน (09)", value: "09", description: "เดือนกันยายน" },
  { label: "ตุลาคม (10)", value: "10", description: "เดือนตุลาคม" },
  { label: "พฤศจิกายน (11)", value: "11", description: "เดือนพฤศจิกายน" },
  { label: "ธันวาคม (12)", value: "12", description: "เดือนธันวาคม" }
];

function normalizeRoleValue(raw) {
  const value = String(raw || "").trim();
  return value || null;
}

function inferRoleFromLegacyProfile(profile) {
  const legacy = String(profile?.path || profile?.class || "").trim().toLowerCase();
  if (!legacy) return null;
  if (legacy.includes("tank")) return "tank";
  if (legacy.includes("healer")) return "healer";
  if (legacy.includes("dps")) return "dps";
  return null;
}

function resolveProfileRoleValue(profile) {
  return normalizeRoleValue(profile?.role) || inferRoleFromLegacyProfile(profile);
}

function resolveProfileWeaponValue(profile) {
  const weapon = String(profile?.weapon || profile?.path || profile?.class || "").trim();
  return weapon || "-";
}

function buildRoleLabelMap(roleOptions = ROLE_OPTIONS) {
  return Object.fromEntries(roleOptions.map((option) => [option.value, option.label]));
}

function resolveRoleLabel(roleValue, roleLabelByValue) {
  if (!roleValue) return "-";
  const direct = roleLabelByValue[roleValue];
  if (direct) return direct;
  const lower = roleLabelByValue[String(roleValue).toLowerCase()];
  if (lower) return lower;
  return String(roleValue);
}

function formatProfileSummary(profile, roleLabelByValue) {
  if (!profile) return "ยังไม่ได้ลงทะเบียนโปรไฟล์";
  const roleValue = resolveProfileRoleValue(profile);
  const roleLabel = resolveRoleLabel(roleValue, roleLabelByValue);
  const weapon = resolveProfileWeaponValue(profile);
  return `${profile.ign || "-"} | ${roleLabel} | ${weapon}`;
}

function buildManualEventYearSelectOptions(selectedYear) {
  const currentYear = getTodayYmdParts(
    process.env.MANUAL_EVENT_TIMEZONE ||
    process.env.AUTO_ROSTER_TIMEZONE ||
    "Asia/Bangkok"
  ).year;
  const startYear = currentYear - 1;
  const endYear = currentYear + 8;
  const options = [];
  for (let year = startYear; year <= endYear; year += 1) {
    options.push({
      label: String(year),
      value: String(year),
      description: `ปี ${year}`,
      ...(String(year) === String(selectedYear) ? { default: true } : {})
    });
  }
  return options;
}

function buildRegistrationEmbed({
  ign = "-",
  role = "-",
  weapon = "-",
  roleOptions = ROLE_OPTIONS
}) {
  const roleLabelByValue = buildRoleLabelMap(roleOptions);
  const normalizedRole = normalizeRoleValue(role);
  const roleLabel = normalizedRole ? resolveRoleLabel(normalizedRole, roleLabelByValue) : role;

  return new EmbedBuilder()
    .setTitle("การ์ดลงทะเบียนกิลด์")
    .setDescription("ลงทะเบียนเสร็จสมบูรณ์")
    .addFields(
      { name: "ชื่อในเกม (IGN)", value: ign, inline: true },
      { name: "Role", value: roleLabel || "-", inline: true },
      { name: "Main Weapon", value: weapon || "-", inline: true }
    )
    .setColor(0x3498db)
    .setTimestamp();
}

function buildRegistrationPanelEmbed() {
  return new EmbedBuilder()
    .setTitle("ลงทะเบียนสมาชิกกิลด์")
    .setDescription("คลิกที่ปุ่ม **ลงทะเบียนโปรไฟล์** เพื่อระบุชื่อ, role และ main weapon")
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
          new TextDisplayBuilder().setContent("**ตั้งค่า Role/Weapon**\nแก้ตัวเลือกในฟอร์มลงทะเบียน")
        )
        .setButtonAccessory(
          new ButtonBuilder()
            .setCustomId(MENU_BUTTONS.manageProfileOptions)
            .setLabel("ตั้งค่า")
            .setStyle(ButtonStyle.Secondary)
        ),
      new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent("**ปฏิทินกิจกรรม**\nแสดงปฏิทินจาก roster ล่าสุดที่มีวันที่")
        )
        .setButtonAccessory(
          new ButtonBuilder()
            .setCustomId(MENU_BUTTONS.calendar)
            .setLabel("ปฏิทิน")
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

function buildRosterActionRow(messageId, { eventMode = false } = {}) {
  const row = new ActionRowBuilder().addComponents(
    buildRegisterButton(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`join_roster:${messageId}`)
      .setLabel("ลงทะเบียนกิจกรรม")
      .setStyle(ButtonStyle.Success)
  );

  row.addComponents(
    new ButtonBuilder()
      .setCustomId(`reserve_roster:${messageId}`)
      .setLabel("ลงทะเบียนสำรอง")
      .setStyle(ButtonStyle.Secondary)
  );

  row.addComponents(
    new ButtonBuilder()
      .setCustomId(`leave_roster:${messageId}`)
      .setLabel("ยกเลิกลงชื่อ")
      .setStyle(ButtonStyle.Danger)
  );

  return row;
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

function buildRegisterModal(
  profile = null,
  { roleOptions = ROLE_OPTIONS, weaponOptions = WEAPON_OPTIONS } = {}
) {
  const modal = new ModalBuilder()
    .setCustomId("register_profile")
    .setTitle("ลงทะเบียนกิลด์");

  const currentIgn = String(profile?.ign || "").trim();
  const currentRole = resolveProfileRoleValue(profile);
  const currentWeapon = String(profile?.weapon || profile?.path || profile?.class || "").trim();

  const ignInput = {
    type: 4,
    custom_id: "register_ign_value",
    style: TextInputStyle.Short,
    required: true,
    max_length: 32,
    placeholder: "ระบุชื่อในเกมของคุณ (IGN)",
    ...(currentIgn ? { value: currentIgn } : {})
  };

  const selectedRoleOptions = roleOptions.map((option) => ({
    ...option,
    ...(currentRole && option.value === currentRole ? { default: true } : {})
  }));

  const roleSelect = new StringSelectMenuBuilder()
    .setCustomId("register_role_value")
    .setPlaceholder("เลือก role ของคุณ")
    .setRequired(true)
    .setMinValues(1)
    .setMaxValues(1)
    .addOptions(selectedRoleOptions);

  const selectedWeaponOptions = weaponOptions.map((option) => ({
    ...option,
    ...(currentWeapon && option.value === currentWeapon ? { default: true } : {})
  }));

  const weaponSelect = new StringSelectMenuBuilder()
    .setCustomId("register_weapon_value")
    .setPlaceholder("เลือกอาวุธหลักของคุณ")
    .setRequired(true)
    .setMinValues(1)
    .setMaxValues(1)
    .addOptions(selectedWeaponOptions);

  modal.addLabelComponents(
    new LabelBuilder()
      .setLabel("ชื่อในเกม (IGN)")
      .setDescription("ระบุชื่อตัวละครของคุณ")
      .setTextInputComponent(ignInput),
    new LabelBuilder()
      .setLabel("Role")
      .setDescription("เลือกมา 1 role: tank / healer / dps")
      .setStringSelectMenuComponent(roleSelect),
    new LabelBuilder()
      .setLabel("Main Weapon")
      .setDescription("เลือกมา 1 อาวุธหลัก")
      .setStringSelectMenuComponent(weaponSelect),
  );

  return modal;
}

function buildProfileOptionPreviewLines(options, { limit = 10 } = {}) {
  const lines = options.slice(0, limit).map((option, idx) => {
    const label = truncateLabel(option.label || option.value || "-", 60);
    const value = truncateLabel(option.value || "-", 40);
    const description = option.description
      ? ` - ${truncateLabel(option.description, 50)}`
      : "";
    return `${idx + 1}. ${label} (\`${value}\`)${description}`;
  });

  const hidden = options.length - lines.length;
  if (hidden > 0) {
    lines.push(`... และอีก ${hidden} รายการ`);
  }
  return lines;
}

function buildManageProfileOptionsPayload({
  roleOptions = ROLE_OPTIONS,
  weaponOptions = WEAPON_OPTIONS
} = {}) {
  const roleLines = buildProfileOptionPreviewLines(roleOptions);
  const weaponLines = buildProfileOptionPreviewLines(weaponOptions);

  let content = [
    "### ตั้งค่า Role/Weapon",
    "จัดการตัวเลือกในฟอร์มลงทะเบียน (สูงสุดประเภทละ 25 รายการ)",
    "",
    `**Role (${roleOptions.length})**`,
    ...roleLines,
    "",
    `**Weapon (${weaponOptions.length})**`,
    ...weaponLines
  ].join("\n");
  if (content.length > 1900) {
    content = `${content.slice(0, 1860)}\n...(แสดงไม่ครบ กรุณาใช้ปุ่มเพิ่ม/ลบเพื่อจัดการรายการ)`;
  }

  const actionsRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(PROFILE_OPTION_ACTIONS.addRole)
      .setLabel("เพิ่ม Role")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(PROFILE_OPTION_ACTIONS.deleteRole)
      .setLabel("ลบ Role")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(PROFILE_OPTION_ACTIONS.addWeapon)
      .setLabel("เพิ่ม Weapon")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(PROFILE_OPTION_ACTIONS.deleteWeapon)
      .setLabel("ลบ Weapon")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(PROFILE_OPTION_ACTIONS.refresh)
      .setLabel("รีเฟรช")
      .setStyle(ButtonStyle.Secondary)
  );

  return {
    content,
    components: [actionsRow]
  };
}

function buildAddProfileOptionModal(kind = "role") {
  const isRole = kind === "role";
  const modal = new ModalBuilder()
    .setCustomId(
      isRole ? PROFILE_OPTION_ACTIONS.addRoleModal : PROFILE_OPTION_ACTIONS.addWeaponModal
    )
    .setTitle(isRole ? "เพิ่ม Role Option" : "เพิ่ม Weapon Option");

  const labelInput = new TextInputBuilder()
    .setCustomId("profile_option_label")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(100)
    .setPlaceholder(isRole ? "เช่น Tank" : "เช่น Stonesplit - Might");

  const valueInput = new TextInputBuilder()
    .setCustomId("profile_option_value")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(100)
    .setPlaceholder(isRole ? "เช่น tank" : "เช่น Stonesplit - Might");

  const descriptionInput = new TextInputBuilder()
    .setCustomId("profile_option_description")
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setMaxLength(100)
    .setPlaceholder("คำอธิบาย (ไม่บังคับ)");

  modal.addLabelComponents(
    new LabelBuilder()
      .setLabel("Label")
      .setDescription("ชื่อที่จะแสดงใน dropdown")
      .setTextInputComponent(labelInput),
    new LabelBuilder()
      .setLabel("Value")
      .setDescription("ค่าอ้างอิงของตัวเลือกนี้")
      .setTextInputComponent(valueInput),
    new LabelBuilder()
      .setLabel("Description")
      .setDescription("ไม่บังคับ")
      .setTextInputComponent(descriptionInput)
  );

  return modal;
}

function buildDeleteProfileOptionPrompt(kind = "role", options = []) {
  const isRole = kind === "role";
  const customId = isRole
    ? PROFILE_OPTION_ACTIONS.deleteRoleSelect
    : PROFILE_OPTION_ACTIONS.deleteWeaponSelect;
  const placeholder = isRole ? "เลือก Role ที่ต้องการลบ" : "เลือก Weapon ที่ต้องการลบ";

  const selectOptions = options.map((option) => ({
    label: truncateLabel(option.label || option.value || "-", 100),
    value: option.value,
    description: truncateLabel(
      option.description || `value: ${option.value}`,
      100
    )
  }));

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(customId)
    .setPlaceholder(placeholder)
    .setMinValues(1)
    .setMaxValues(1)
    .addOptions(selectOptions);

  return {
    content: isRole ? "เลือก Role ที่ต้องการลบ" : "เลือก Weapon ที่ต้องการลบ",
    components: [
      new ActionRowBuilder().addComponents(selectMenu)
    ]
  };
}

function buildStartRosterModal() {
  const eventTimeZone =
    process.env.MANUAL_EVENT_TIMEZONE ||
    process.env.AUTO_ROSTER_TIMEZONE ||
    "Asia/Bangkok";
  const todayParts = getTodayYmdParts(eventTimeZone);
  const defaultMonthValue = String(todayParts.month).padStart(2, "0");
  const monthSelectOptions = MANUAL_EVENT_MONTH_SELECT_OPTIONS.map((option) => ({
    ...option,
    ...(option.value === defaultMonthValue ? { default: true } : {})
  }));

  const modal = new ModalBuilder()
    .setCustomId("start_roster_modal")
    .setTitle("เริ่มกิจกรรม");

  const dayInput = new TextInputBuilder()
    .setCustomId("start_roster_day_v2")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMinLength(1)
    .setMaxLength(2)
    .setPlaceholder("เช่น 7 หรือ 07")
    .setValue(String(todayParts.day));


  const monthSelect = new StringSelectMenuBuilder()
    .setCustomId("start_roster_month_v2")
    .setPlaceholder("เลือกเดือน")
    .setRequired(true)
    .setMinValues(1)
    .setMaxValues(1)
    .addOptions(monthSelectOptions);

  const yearSelect = new StringSelectMenuBuilder()
    .setCustomId("start_roster_year_v2")
    .setPlaceholder("เลือกปี")
    .setRequired(true)
    .setMinValues(1)
    .setMaxValues(1)
    .addOptions(buildManualEventYearSelectOptions(todayParts.year));

  const titleInput = new TextInputBuilder()
    .setCustomId("start_roster_title")
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setMaxLength(80)
    .setPlaceholder("ลงชื่อสมาชิกกิลด์");

  modal.addLabelComponents(
    new LabelBuilder()
      .setLabel("หัวข้อกิจกรรม (ไม่บังคับ)")
      .setDescription("เว้นว่างเพื่อใช้หัวข้อเริ่มต้น")
      .setTextInputComponent(titleInput),
    new LabelBuilder()
      .setLabel("วัน")
      .setDescription("ระบุเป็นตัวเลข 1-31")
      .setTextInputComponent(dayInput),
    new LabelBuilder()
      .setLabel("เดือน")
      .setDescription("เลือกเดือนของกิจกรรม")
      .setStringSelectMenuComponent(monthSelect),
    new LabelBuilder()
      .setLabel("ปี")
      .setDescription("เลือกปีของกิจกรรม")
      .setStringSelectMenuComponent(yearSelect)
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

function formatRosterMemberLine(entry, idx, roleLabelByValue) {
  const reserveTag = entry.isReserve ? " [สำรอง]" : "";
  const profile = entry.profile;
  if (!profile) {
    return `${idx + 1}. <@${entry.userId}>${reserveTag} | ไม่พบข้อมูลโปรไฟล์`;
  }

  const roleValue = resolveProfileRoleValue(profile);
  const roleLabel = resolveRoleLabel(roleValue, roleLabelByValue);
  const weapon = resolveProfileWeaponValue(profile);
  return `${idx + 1}. <@${entry.userId}>${reserveTag} | ${profile.ign} | ${roleLabel} | ${weapon}`;
}

function buildBucketLines(joinedEntries, reserveEntries, roleLabelByValue) {
  const joinedLines = joinedEntries.map((entry, idx) =>
    formatRosterMemberLine(entry, idx, roleLabelByValue)
  );
  const reserveLines = reserveEntries.map((entry, idx) =>
    formatRosterMemberLine(entry, idx + joinedEntries.length, roleLabelByValue)
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

function isEventRoster(roster) {
  if (!roster || typeof roster !== "object") return false;
  if (roster.meta?.autoWeeklyGuildWar === true) return false;
  const rosterKind = String(roster.meta?.rosterKind || "").trim().toLowerCase();
  if (rosterKind) {
    return rosterKind === "event";
  }
  return roster.meta?.manualEvent === true || !roster.meta;
}

function splitEventEntries(entries) {
  return {
    joined: entries.filter((entry) => !entry.isReserve),
    reserve: entries.filter((entry) => entry.isReserve)
  };
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

function buildRosterEmbed(
  title,
  entries,
  { roster = null, eventMode = false, roleOptions = ROLE_OPTIONS } = {}
) {
  const isEventMode = eventMode || isEventRoster(roster);
  if (isEventMode) {
    const roleLabelByValue = buildRoleLabelMap(roleOptions);
    const eventEntries = splitEventEntries(entries);
    const joinedEntries = eventEntries.joined;
    const reserveEntries = eventEntries.reserve;
    const total = countUniqueMembersInEntries(entries);
    const joinedTotal = joinedEntries.length;
    const reserveTotal = reserveEntries.length;
    const buildSectionFields = (titleText, targetEntries) => {
      const lines = targetEntries.map((entry, idx) =>
        formatRosterMemberLine(entry, idx, roleLabelByValue)
      );
      const chunks = lines.length > 0 ? splitLinesIntoChunks(lines, 1000) : ["ไม่มีสมาชิก"];
      return chunks.map((chunk, idx) => ({
        name: idx === 0 ? titleText : `${titleText} (ต่อ ${idx + 1}/${chunks.length})`,
        value: chunk
      }));
    };
    const fields = [
      ...buildSectionFields("ลงชื่อ", joinedEntries),
      ...buildSectionFields("สำรอง", reserveEntries)
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

  const roleLabelByValue = buildRoleLabelMap(roleOptions);
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
    const lines = buildBucketLines(joinedEntries, reserveEntries, roleLabelByValue);

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

function buildRosterComponentsV2(
  title,
  entries,
  rosterMessageId,
  { roster = null, eventMode = false, roleOptions = ROLE_OPTIONS } = {}
) {
  const isEventMode = eventMode || isEventRoster(roster);
  if (isEventMode) {
    const roleLabelByValue = buildRoleLabelMap(roleOptions);
    const eventEntries = splitEventEntries(entries);
    const joinedEntries = eventEntries.joined;
    const reserveEntries = eventEntries.reserve;
    const total = countUniqueMembersInEntries(entries);
    const joinedTotal = joinedEntries.length;
    const reserveTotal = reserveEntries.length;

    const container = new ContainerBuilder()
      .setAccentColor(0x00b894)
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`## ${title || "รายละเอียดกิจกรรม"}`),
        new TextDisplayBuilder().setContent(
          `สมาชิกทั้งหมด ${total} คน | ลงชื่อ ${joinedTotal} คน | สำรอง ${reserveTotal} คน`
        )
      );

    const addSimpleSection = (sectionTitle, targetEntries) => {
      const lines = targetEntries.map((entry, idx) =>
        formatRosterMemberLine(entry, idx, roleLabelByValue)
      );
      const chunks = lines.length > 0 ? splitLinesIntoChunks(lines, 3400) : ["ไม่มีสมาชิก"];

      container
        .addSeparatorComponents(new SeparatorBuilder())
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(`### ${sectionTitle}\n${chunks[0]}`)
        );

      for (let i = 1; i < chunks.length; i += 1) {
        container.addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            `### ${sectionTitle} (ต่อ ${i + 1}/${chunks.length})\n${chunks[i]}`
          )
        );
      }
    };

    addSimpleSection("ลงชื่อ", joinedEntries);
    addSimpleSection("สำรอง", reserveEntries);

    if (rosterMessageId) {
      container.addSeparatorComponents(new SeparatorBuilder()).addActionRowComponents(
        buildRosterActionRow(rosterMessageId, { eventMode: true }),
        buildRosterExportRow(rosterMessageId)
      );
    }

    return [container];
  }

  const roleLabelByValue = buildRoleLabelMap(roleOptions);
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
    const lines = buildBucketLines(joinedEntries, reserveEntries, roleLabelByValue);
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

function buildMyRosterEmbed(user, profile, rosters, { roleOptions = ROLE_OPTIONS } = {}) {
  const roleLabelByValue = buildRoleLabelMap(roleOptions);
  const profileText = formatProfileSummary(profile, roleLabelByValue);

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

function buildMyRosterComponentsV2(
  user,
  profile,
  rosters,
  { roleOptions = ROLE_OPTIONS } = {}
) {
  const roleLabelByValue = buildRoleLabelMap(roleOptions);
  const profileText = formatProfileSummary(profile, roleLabelByValue);

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

function buildEventLine(item, fallbackEventName = null) {
  const dayLabel = String(item?.dayLabel || "วันกิจกรรม");
  const date = String(item?.date || "-");
  const eventName = String(item?.eventName || fallbackEventName || "").trim();
  if (!eventName) return `${dayLabel}: ${date}`;
  return `${dayLabel}: ${date} - ${eventName}`;
}

function buildAutoRosterCalendarEmbed(
  roster,
  { imageFileName = null, calendarDataOverride = null } = {}
) {
  const calendarData = calendarDataOverride || buildRosterCalendarData(roster);
  if (!calendarData) return null;
  const totalEvents = (calendarData.eventItems || []).length;

  const embed = new EmbedBuilder()
    .setTitle("ปฏิทินกิจกรรม LadpraoBros")
    .setDescription(
      [
        `กิจกรรม: **${roster?.title || "รวมกิจกรรมล่วงหน้า"}**`,
        ...(calendarData.weekKey ? [`สัปดาห์: ${calendarData.weekKey}`] : []),
        ...(calendarData.window
          ? [`ช่วงวันที่: ${calendarData.window.from} ถึง ${calendarData.window.to}`]
          : []),
        `จำนวนกิจกรรม: ${totalEvents} รายการ`,
        ...(!imageFileName
          ? (calendarData.eventItems || [])
            .slice(0, 10)
            .map((item) => buildEventLine(item, roster?.title || "Guild War"))
          : []),
        ...(!imageFileName && totalEvents > 10
          ? [`และอีก ${totalEvents - 10} รายการ`]
          : []),
        `เขตเวลา: ${calendarData.timeZone}`
      ].join("\n")
    );

  if (imageFileName) {
    embed.setImage(`attachment://${imageFileName}`);
  }

  embed.setColor(0x3498db).setTimestamp();
  return embed;
}

module.exports = {
  buildAutoRosterCalendarEmbed,
  buildAdminMenuComponentsV2,
  buildAddProfileOptionModal,
  buildDeleteProfileOptionPrompt,
  buildManageProfileOptionsPayload,
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
