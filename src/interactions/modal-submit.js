const { PermissionFlagsBits } = require("discord.js");
const {
  getMemberInfo,
  getRoster,
  getRosterEntries,
  setMemberInfo,
  setMemberTeamInRoster
} = require("../store");
const { buildRegistrationEmbed, buildRosterEmbed } = require("../ui/builders");
const { syncRosterMessage } = require("../services/roster-messages");

async function handleModalSubmit(interaction) {
  if (!interaction.guildId) {
    await interaction.reply({
      content: "กรุณาใช้ระบบนี้ในเซิร์ฟเวอร์",
      ephemeral: true
    });
    return;
  }

  if (interaction.customId === "setteam_modal" || interaction.customId.startsWith("setteam_modal:")) {
    if (
      !interaction.memberPermissions ||
      !interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)
    ) {
      await interaction.reply({
        content: "เฉพาะผู้ดูแลระบบเท่านั้นที่ตั้งทีมได้",
        ephemeral: true
      });
      return;
    }

    const selectedUsers = interaction.fields.getSelectedUsers(
      "setteam_member_value",
      true
    );
    const members = [...selectedUsers.values()];
    if (members.length === 0) {
      await interaction.reply({
        content: "ไม่พบสมาชิกที่เลือก กรุณาลองใหม่",
        ephemeral: true
      });
      return;
    }

    const team = interaction.fields.getStringSelectValues("setteam_team_value")[0];
    const lockedRosterId = interaction.customId.startsWith("setteam_modal:")
      ? interaction.customId.split(":")[1]
      : null;
    const targetRosterId = lockedRosterId;
    if (!targetRosterId) {
      await interaction.reply({
        content: "ไม่พบกิจกรรมที่ต้องการตั้งทีม กรุณาเปิดผ่าน /setteam หรือปุ่มตั้งทีมในกิจกรรม",
        ephemeral: true
      });
      return;
    }
    const targetRoster = getRoster(targetRosterId);

    if (!targetRoster) {
      await interaction.reply({
        content: "ไม่พบกิจกรรมที่เลือก อาจถูกลบไปแล้ว กรุณาลองใหม่",
        ephemeral: true
      });
      return;
    }

    const selectedIds = members.map((member) => member.id);
    const missingProfileIds = [];
    const notInRosterIds = [];
    const validIds = [];
    const rosterMemberSet = new Set(targetRoster.memberIds || []);

    for (const memberId of selectedIds) {
      const profile = getMemberInfo(interaction.guildId, memberId);
      if (!profile) {
        missingProfileIds.push(memberId);
        continue;
      }

      if (!rosterMemberSet.has(memberId)) {
        notInRosterIds.push(memberId);
        continue;
      }

      validIds.push(memberId);
    }

    if (validIds.length === 0) {
      const lines = ["ไม่สามารถกำหนดทีมได้ เพราะไม่พบสมาชิกที่ผ่านเงื่อนไข"];
      if (missingProfileIds.length > 0) {
        lines.push(
          `ยังไม่มีโปรไฟล์ (${missingProfileIds.length}): ${missingProfileIds
            .map((id) => `<@${id}>`)
            .join(", ")}`
        );
      }
      if (notInRosterIds.length > 0) {
        lines.push(
          `ยังไม่ได้ลงชื่อในกิจกรรม (${notInRosterIds.length}): ${notInRosterIds
            .map((id) => `<@${id}>`)
            .join(", ")}`
        );
      }
      await interaction.reply({
        content: lines.join("\n"),
        ephemeral: true
      });
      return;
    }

    const assignedIds = [];
    for (const memberId of validIds) {
      setMemberTeamInRoster(targetRoster.messageId, memberId, team);
      assignedIds.push(memberId);
    }

    await syncRosterMessage(interaction.guild, targetRoster.messageId, targetRoster.title);

    const data = getRosterEntries(targetRoster.messageId);
    const embed = buildRosterEmbed(targetRoster.title, data.entries);

    const summaryLines = [
      `กำหนดทีม **${team === "attack" ? "Attack" : "Defense"}** ให้สมาชิก ${assignedIds.length} คนเรียบร้อย`
    ];
    if (missingProfileIds.length > 0) {
      summaryLines.push(
        `ข้าม (ไม่มีโปรไฟล์) ${missingProfileIds.length}: ${missingProfileIds
          .map((id) => `<@${id}>`)
          .join(", ")}`
      );
    }
    if (notInRosterIds.length > 0) {
      summaryLines.push(
        `ข้าม (ยังไม่ได้ลงชื่อกิจกรรม) ${notInRosterIds.length}: ${notInRosterIds
          .map((id) => `<@${id}>`)
          .join(", ")}`
      );
    }

    await interaction.reply({
      content: summaryLines.join("\n"),
      embeds: [embed],
      ephemeral: true
    });
    return;
  }

  if (interaction.customId !== "register_profile") return;

  const ign = interaction.fields.getTextInputValue("register_ign_value").trim();
  const playerPath = interaction.fields.getStringSelectValues("register_path_value")[0];
  const weapon = interaction.fields.getStringSelectValues("register_weapon_value")[0];

  setMemberInfo(interaction.guildId, interaction.user.id, {
    ign,
    class: playerPath,
    path: playerPath,
    weapon
  });

  await interaction.reply({
    embeds: [
      buildRegistrationEmbed({
        ign,
        playerPath,
        weapon
      }).setFooter({ text: "บันทึกการลงทะเบียนแล้ว พิมพ์ /register เพื่ออัปเดตข้อมูลได้ตลอดเวลา" })
    ],
    ephemeral: true
  });
}

module.exports = { handleModalSubmit };
