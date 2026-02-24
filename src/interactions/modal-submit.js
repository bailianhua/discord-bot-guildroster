const { PermissionFlagsBits } = require("discord.js");
const {
  addMemberToRoster,
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

  if (interaction.customId === "setteam_modal") {
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
    const targetRosterId = interaction.fields.getStringSelectValues(
      "setteam_roster_value"
    )[0];
    const targetRoster = getRoster(targetRosterId);

    if (!targetRoster) {
      await interaction.reply({
        content: "ไม่พบกิจกรรมที่เลือก อาจถูกลบไปแล้ว กรุณาลองใหม่",
        ephemeral: true
      });
      return;
    }

    const assignedIds = [];
    const missingProfileIds = [];

    for (const member of members) {
      const profile = getMemberInfo(interaction.guildId, member.id);
      if (!profile) {
        missingProfileIds.push(member.id);
        continue;
      }

      addMemberToRoster(targetRoster.messageId, member.id);
      setMemberTeamInRoster(targetRoster.messageId, member.id, team);
      assignedIds.push(member.id);
    }

    if (assignedIds.length === 0) {
      await interaction.reply({
        content: "ไม่สามารถกำหนดทีมได้ เพราะสมาชิกที่เลือกยังไม่ได้ลงทะเบียนโปรไฟล์",
        ephemeral: true
      });
      return;
    }

    await syncRosterMessage(interaction.guild, targetRoster.messageId, targetRoster.title);

    const data = getRosterEntries(targetRoster.messageId);
    const embed = buildRosterEmbed(targetRoster.title, data.entries);

    let summary = `กำหนดทีม **${team === "attack" ? "Attack" : "Defense"}** ให้สมาชิก ${assignedIds.length} คนเรียบร้อย`;
    if (missingProfileIds.length > 0) {
      summary += `\nสมาชิกที่ข้าม (${missingProfileIds.length}): ${missingProfileIds
        .map((id) => `<@${id}>`)
        .join(", ")}`;
    }

    await interaction.reply({
      content: summary,
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
