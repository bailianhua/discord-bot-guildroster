const {
  ActionRowBuilder,
  ButtonStyle,
  MessageFlags,
  PermissionFlagsBits
} = require("discord.js");
const { MENU_BUTTONS, REGISTER_BUTTON_ID } = require("../constants");
const {
  addMemberToRoster,
  getMemberInfo,
  getRecentRostersInChannel,
  getRecentRostersInGuild,
  getRoster,
  getUserRostersInGuild,
  removeMemberFromRoster
} = require("../store");
const {
  buildMyRosterComponentsV2,
  buildRegisterButton,
  buildRegisterModal,
  buildRosterListEmbed,
  buildRosterPickerMenu,
  buildSetTeamModal
} = require("../ui/builders");
const { syncRosterMessage } = require("../services/roster-messages");

async function handleButton(interaction) {
  if (!interaction.guildId) {
    await interaction.reply({
      content: "ปุ่มนี้ใช้งานได้เฉพาะในเซิร์ฟเวอร์เท่านั้น",
      ephemeral: true
    });
    return;
  }

  if (interaction.customId === REGISTER_BUTTON_ID) {
    await interaction.showModal(buildRegisterModal());
    return;
  }

  if (interaction.customId === MENU_BUTTONS.register) {
    await interaction.showModal(buildRegisterModal());
    return;
  }

  if (interaction.customId === MENU_BUTTONS.myRoster) {
    const profile = getMemberInfo(interaction.guildId, interaction.user.id);
    const rosters = getUserRostersInGuild(interaction.guildId, interaction.user.id, 25);
    await interaction.reply({
      components: buildMyRosterComponentsV2(interaction.user, profile, rosters),
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
    });
    return;
  }

  if (interaction.customId === MENU_BUTTONS.rosterList) {
    const rosters = getRecentRostersInGuild(interaction.guildId, 25);
    if (rosters.length === 0) {
      await interaction.reply({
        content: "ยังไม่มีกิจกรรมที่ถูกสร้างในเซิร์ฟเวอร์นี้",
        ephemeral: true
      });
      return;
    }

    await interaction.reply({
      embeds: [buildRosterListEmbed(rosters)],
      ephemeral: true
    });
    return;
  }

  if (interaction.customId === MENU_BUTTONS.showRoster) {
    const rosters = getRecentRostersInGuild(interaction.guildId, 25);
    if (rosters.length === 0) {
      await interaction.reply({
        content: "ยังไม่มีกิจกรรมที่ถูกสร้างในเซิร์ฟเวอร์นี้",
        ephemeral: true
      });
      return;
    }

    await interaction.reply({
      content: "เลือกชื่อกิจกรรมที่ต้องการดูรายละเอียด",
      components: [
        new ActionRowBuilder().addComponents(
          buildRosterPickerMenu("show_roster_pick", "เลือกกิจกรรมที่ต้องการแสดง", rosters)
        )
      ],
      ephemeral: true
    });
    return;
  }

  if (interaction.customId === MENU_BUTTONS.deleteRoster) {
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

    const rosters = getRecentRostersInChannel(
      interaction.guildId,
      interaction.channelId,
      25
    );
    if (rosters.length === 0) {
      await interaction.reply({
        content: "ไม่พบกิจกรรมในช่องนี้",
        ephemeral: true
      });
      return;
    }

    await interaction.reply({
      content: "เลือกกิจกรรมที่ต้องการลบ",
      components: [
        new ActionRowBuilder().addComponents(
          buildRosterPickerMenu("delete_roster_pick", "เลือกกิจกรรมที่ต้องการลบ", rosters)
        )
      ],
      ephemeral: true
    });
    return;
  }

  if (interaction.customId.startsWith("setteam_roster:")) {
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

    const messageId = interaction.customId.split(":")[1];
    const targetRoster = getRoster(messageId);
    if (!targetRoster) {
      await interaction.reply({
        content: "ไม่พบกิจกรรมนี้แล้ว",
        ephemeral: true
      });
      return;
    }

    await interaction.showModal(buildSetTeamModal(targetRoster));
    return;
  }

  const isJoinRoster = interaction.customId.startsWith("join_roster:");
  const isLeaveRoster = interaction.customId.startsWith("leave_roster:");
  if (!isJoinRoster && !isLeaveRoster) return;

  const messageId = interaction.customId.split(":")[1];
  const roster = getRoster(messageId);
  if (!roster) {
    await interaction.reply({
      content: "ไม่พบกิจกรรมนี้แล้ว",
      ephemeral: true
    });
    return;
  }

  if (isLeaveRoster) {
    const leaveResult = removeMemberFromRoster(messageId, interaction.user.id);
    if (!leaveResult || !leaveResult.removed) {
      await interaction.reply({
        content: "คุณยังไม่ได้ลงชื่อในกิจกรรมนี้",
        ephemeral: true
      });
      return;
    }

    await syncRosterMessage(interaction.guild, messageId, roster.title);

    await interaction.reply({
      content: "ยกเลิกการลงชื่อกิจกรรมเรียบร้อยแล้ว",
      ephemeral: true
    });
    return;
  }

  const profile = getMemberInfo(interaction.guildId, interaction.user.id);
  if (!profile) {
    await interaction.reply({
      content: "ไม่พบโปรไฟล์ของคุณ กรุณากดปุ่มด้านล่างเพื่อลงทะเบียนก่อนเข้าร่วม",
      components: [
        new ActionRowBuilder().addComponents(
          buildRegisterButton(ButtonStyle.Primary)
        )
      ],
      ephemeral: true
    });
    return;
  }

  addMemberToRoster(messageId, interaction.user.id);
  await syncRosterMessage(interaction.guild, messageId, roster.title);

  await interaction.reply({
    content: `เข้าร่วมกิจกรรมในชื่อ **${profile.ign}** เรียบร้อย!`,
    ephemeral: true
  });
}

module.exports = { handleButton };
