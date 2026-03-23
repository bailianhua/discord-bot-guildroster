const { MessageFlags } = require("discord.js");
const { addRosterMirrorMessage, getRoster, getRosterEntries } = require("../store");
const { buildRosterComponentsV2, buildSetTeamModal } = require("../ui/builders");
const { getMissingPostPerms } = require("../services/permissions");
const { deleteRosterWithMessage } = require("../services/roster-messages");
const { hasManageGuildAccess } = require("../utils/access");
const { replyEphemeral } = require("../utils/interaction-response");

async function handleSelectMenu(interaction) {
  if (
    interaction.customId !== "delete_roster_pick" &&
    interaction.customId !== "show_roster_pick" &&
    interaction.customId !== "setteam_roster_pick" &&
    interaction.customId !== "announce_roster_pick"
  ) {
    await replyEphemeral(interaction, {
      content: "เมนูนี้เป็นเวอร์ชันเก่า กรุณาเปิดใหม่ด้วย `/menu` หรือ `/adminmenu`",
    });
    return;
  }

  if (!interaction.guildId) {
    await replyEphemeral(interaction, {
      content: "เมนูนี้ใช้ได้เฉพาะในเซิร์ฟเวอร์เท่านั้น",
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
    if (!hasManageGuildAccess(interaction)) {
      await replyEphemeral(interaction, {
        content: "เฉพาะผู้ดูแลระบบเท่านั้นที่ตั้งทีมได้",
      });
      return;
    }

    await interaction.showModal(buildSetTeamModal(targetRoster));
    return;
  }

  if (interaction.customId === "announce_roster_pick") {
    if (!hasManageGuildAccess(interaction)) {
      await replyEphemeral(interaction, {
        content: "เฉพาะผู้ดูแลระบบเท่านั้นที่ประกาศกิจกรรมได้",
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

    const announcedMessage = await interaction.channel.send({
      components: buildRosterComponentsV2(
        targetRoster.title,
        data.entries,
        targetRoster.messageId,
        { roster: targetRoster }
      ),
      flags: MessageFlags.IsComponentsV2
    });
    addRosterMirrorMessage(
      targetRoster.messageId,
      announcedMessage.channelId,
      announcedMessage.id
    );

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
        targetRoster.messageId,
        { roster: targetRoster }
      ),
      flags: MessageFlags.IsComponentsV2
    });
    return;
  }

  if (!hasManageGuildAccess(interaction)) {
    await replyEphemeral(interaction, {
      content: "เฉพาะผู้ดูแลระบบเท่านั้นที่ลบกิจกรรมได้",
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
