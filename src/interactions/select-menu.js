const { MessageFlags } = require("discord.js");
const { PROFILE_OPTION_ACTIONS } = require("../constants");
const {
  addRosterMirrorMessage,
  getGuildProfileSelectOptions,
  getRoster,
  getRosterEntries,
  setGuildProfileSelectOptions
} = require("../store");
const {
  buildManageProfileOptionsPayload,
  buildRosterComponentsV2,
  buildSetTeamModal
} = require("../ui/builders");
const { getMissingPostPerms } = require("../services/permissions");
const { deleteRosterWithMessage } = require("../services/roster-messages");
const { hasManageGuildAccess } = require("../utils/access");
const { replyEphemeral } = require("../utils/interaction-response");

async function handleSelectMenu(interaction) {
  const isDeleteRoleOptionSelect = interaction.customId === PROFILE_OPTION_ACTIONS.deleteRoleSelect;
  const isDeleteWeaponOptionSelect =
    interaction.customId === PROFILE_OPTION_ACTIONS.deleteWeaponSelect;

  if (!interaction.guildId) {
    await replyEphemeral(interaction, {
      content: "เมนูนี้ใช้ได้เฉพาะในเซิร์ฟเวอร์เท่านั้น",
    });
    return;
  }

  if (isDeleteRoleOptionSelect || isDeleteWeaponOptionSelect) {
    if (!hasManageGuildAccess(interaction)) {
      await replyEphemeral(interaction, {
        content: "เฉพาะผู้ดูแลระบบเท่านั้นที่ตั้งค่า role/weapon ได้",
      });
      return;
    }

    const selectedValue = interaction.values[0];
    const current = getGuildProfileSelectOptions(interaction.guildId);
    const isRole = isDeleteRoleOptionSelect;
    const currentList = isRole ? current.roleOptions : current.weaponOptions;
    const kindLabel = isRole ? "Role" : "Weapon";

    if (currentList.length <= 1) {
      const managerPayload = buildManageProfileOptionsPayload(current);
      await interaction.update({
        content: `ไม่สามารถลบ ${kindLabel} ได้ เพราะต้องมีอย่างน้อย 1 รายการ\n\n${managerPayload.content}`,
        components: managerPayload.components
      });
      return;
    }

    const nextList = currentList.filter((option) => option.value !== selectedValue);
    if (nextList.length === currentList.length) {
      const managerPayload = buildManageProfileOptionsPayload(current);
      await interaction.update({
        content: `ไม่พบ ${kindLabel} value "${selectedValue}" (อาจถูกแก้ไขไปก่อนหน้า)\n\n${managerPayload.content}`,
        components: managerPayload.components
      });
      return;
    }

    const saved = setGuildProfileSelectOptions(interaction.guildId, {
      roleOptions: isRole ? nextList : current.roleOptions,
      weaponOptions: isRole ? current.weaponOptions : nextList
    });
    const managerPayload = buildManageProfileOptionsPayload(saved);

    await interaction.update({
      content: `ลบ ${kindLabel} option เรียบร้อย: \`${selectedValue}\`\n\n${managerPayload.content}`,
      components: managerPayload.components
    });
    return;
  }

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

    const profileSelectOptions = getGuildProfileSelectOptions(interaction.guildId);
    const announcedMessage = await interaction.channel.send({
      components: buildRosterComponentsV2(
        targetRoster.title,
        data.entries,
        targetRoster.messageId,
        { roster: targetRoster, roleOptions: profileSelectOptions.roleOptions }
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

    const profileSelectOptions = getGuildProfileSelectOptions(interaction.guildId);
    await interaction.update({
      content: null,
      embeds: [],
      components: buildRosterComponentsV2(
        targetRoster.title,
        data.entries,
        targetRoster.messageId,
        { roster: targetRoster, roleOptions: profileSelectOptions.roleOptions }
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
