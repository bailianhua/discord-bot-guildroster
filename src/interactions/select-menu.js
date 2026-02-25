const { MessageFlags, PermissionFlagsBits } = require("discord.js");
const { getRoster, getRosterEntries } = require("../store");
const { buildRosterComponentsV2, buildSetTeamModal } = require("../ui/builders");
const { getMissingPostPerms } = require("../services/permissions");
const { deleteRosterWithMessage } = require("../services/roster-messages");

async function handleSelectMenu(interaction) {
  if (
    interaction.customId !== "delete_roster_pick" &&
    interaction.customId !== "show_roster_pick" &&
    interaction.customId !== "setteam_roster_pick" &&
    interaction.customId !== "announce_roster_pick"
  ) {
    return;
  }

  if (!interaction.guildId) {
    await interaction.reply({
      content: "เมนูนี้ใช้ได้เฉพาะในเซิร์ฟเวอร์เท่านั้น",
      flags: MessageFlags.Ephemeral
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

  if (interaction.customId === "setteam_roster_pick") {
    if (
      !interaction.memberPermissions ||
      !interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)
    ) {
      await interaction.reply({
        content: "เฉพาะผู้ดูแลระบบเท่านั้นที่ตั้งทีมได้",
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    await interaction.showModal(buildSetTeamModal(targetRoster));
    return;
  }

  if (interaction.customId === "announce_roster_pick") {
    if (
      !interaction.memberPermissions ||
      !interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)
    ) {
      await interaction.reply({
        content: "เฉพาะผู้ดูแลระบบเท่านั้นที่ประกาศกิจกรรมได้",
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const data = getRosterEntries(targetRoster.messageId);
    if (!data) {
      await interaction.update({
        content: "กิจกรรมนี้อาจถูกลบไปแล้ว",
        components: []
      });
      return;
    }

    const missingPerms = getMissingPostPerms(
      interaction.channel,
      interaction.client.user.id,
      { needsEmbed: false }
    );
    if (missingPerms.length > 0) {
      await interaction.update({
        content: `ไม่สามารถประกาศกิจกรรมได้เนื่องจากขาดสิทธิ์: ${missingPerms.join(
          ", "
        )}`,
        components: []
      });
      return;
    }

    await interaction.channel.send({
      components: buildRosterComponentsV2(targetRoster.title, data.entries),
      flags: MessageFlags.IsComponentsV2
    });

    await interaction.update({
      content: `ประกาศกิจกรรม \`${targetRoster.title}\` เรียบร้อย`,
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

    await interaction.update({
      content: null,
      embeds: [],
      components: buildRosterComponentsV2(
        targetRoster.title,
        data.entries,
        targetRoster.messageId
      ),
      flags: MessageFlags.IsComponentsV2
    });
    return;
  }

  if (
    !interaction.memberPermissions ||
    !interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)
  ) {
    await interaction.reply({
      content: "เฉพาะผู้ดูแลระบบเท่านั้นที่ลบกิจกรรมได้",
      flags: MessageFlags.Ephemeral
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
