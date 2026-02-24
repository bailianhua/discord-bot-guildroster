const { PermissionFlagsBits } = require("discord.js");
const { getRoster, getRosterEntries } = require("../store");
const { buildRosterActionRow, buildRosterEmbed } = require("../ui/builders");
const { deleteRosterWithMessage } = require("../services/roster-messages");

async function handleSelectMenu(interaction) {
  if (
    interaction.customId !== "delete_roster_pick" &&
    interaction.customId !== "show_roster_pick"
  ) {
    return;
  }

  if (!interaction.guildId) {
    await interaction.reply({
      content: "เมนูนี้ใช้ได้เฉพาะในเซิร์ฟเวอร์เท่านั้น",
      ephemeral: true
    });
    return;
  }

  const targetId = interaction.values[0];
  const targetRoster = getRoster(targetId);
  if (!targetRoster) {
    await interaction.update({
      content: "กิจกรรมนี้อาจถูกลบไปแล้ว",
      components: []
    });
    return;
  }

  if (interaction.customId === "show_roster_pick") {
    const data = getRosterEntries(targetRoster.messageId);
    if (!data) {
      await interaction.update({
        content: "กิจกรรมนี้อาจถูกลบไปแล้ว",
        components: []
      });
      return;
    }

    const embed = buildRosterEmbed(targetRoster.title, data.entries);
    await interaction.update({
      content: `รายละเอียดกิจกรรม \`${targetRoster.title}\``,
      embeds: [embed],
      components: [buildRosterActionRow(targetRoster.messageId)]
    });
    return;
  }

  if (
    !interaction.memberPermissions ||
    !interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)
  ) {
    await interaction.reply({
      content: "เฉพาะผู้ดูแลระบบเท่านั้นที่ลบกิจกรรมได้",
      ephemeral: true
    });
    return;
  }

  const note = await deleteRosterWithMessage(interaction.guild, targetRoster);
  await interaction.update({
    content: `ลบกิจกรรม \`${targetRoster.title}\` เรียบร้อย${note}`,
    embeds: [],
    components: []
  });
}

module.exports = { handleSelectMenu };
