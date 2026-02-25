const {
  ActionRowBuilder,
  AttachmentBuilder,
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
  getRosterEntries,
  getUserRostersInGuild,
  removeMemberFromRoster
} = require("../store");
const {
  buildMyRosterComponentsV2,
  buildRegisterButton,
  buildRegisterModal,
  buildRosterListEmbed,
  buildRosterPickerMenu,
  buildStartRosterModal,
  buildSetTeamModal
} = require("../ui/builders");
const { buildRosterCsvBuffer } = require("../services/roster-export");
const { syncRosterMessage } = require("../services/roster-messages");

async function handleButton(interaction) {
  if (!interaction.guildId) {
    await interaction.reply({
      content: "ปุ่มนี้ใช้งานได้เฉพาะในเซิร์ฟเวอร์เท่านั้น",
      flags: MessageFlags.Ephemeral
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
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    await interaction.reply({
      embeds: [buildRosterListEmbed(rosters)],
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  if (interaction.customId === MENU_BUTTONS.startRoster) {
    if (
      !interaction.memberPermissions ||
      !interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)
    ) {
      await interaction.reply({
        content: "เฉพาะผู้ดูแลระบบเท่านั้นที่เริ่มลงชื่อกิจกรรมได้",
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    await interaction.showModal(buildStartRosterModal());
    return;
  }

  if (interaction.customId === MENU_BUTTONS.showRoster) {
    const rosters = getRecentRostersInGuild(interaction.guildId, 25);
    if (rosters.length === 0) {
      await interaction.reply({
        content: "ยังไม่มีกิจกรรมที่ถูกสร้างในเซิร์ฟเวอร์นี้",
        flags: MessageFlags.Ephemeral
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
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  if (interaction.customId === MENU_BUTTONS.announceRoster) {
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

    const rosters = getRecentRostersInGuild(interaction.guildId, 25);
    if (rosters.length === 0) {
      await interaction.reply({
        content: "ยังไม่มีกิจกรรมที่ถูกสร้างในเซิร์ฟเวอร์นี้",
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    await interaction.reply({
      content: "เลือกกิจกรรมที่ต้องการประกาศในช่องนี้",
      components: [
        new ActionRowBuilder().addComponents(
          buildRosterPickerMenu(
            "announce_roster_pick",
            "เลือกกิจกรรมที่ต้องการประกาศ",
            rosters
          )
        )
      ],
      flags: MessageFlags.Ephemeral
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
        flags: MessageFlags.Ephemeral
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
        flags: MessageFlags.Ephemeral
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
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  if (interaction.customId.startsWith("download_roster_excel:")) {
    const messageId = interaction.customId.split(":")[1];
    const targetRoster = getRoster(messageId);
    const data = getRosterEntries(messageId);
    if (!targetRoster || !data) {
      await interaction.reply({
        content: "ไม่พบกิจกรรมนี้แล้ว",
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const { buffer, fileName } = buildRosterCsvBuffer(targetRoster.title, data.entries);
    const file = new AttachmentBuilder(buffer, { name: fileName });

    await interaction.reply({
      content: `ดาวน์โหลดไฟล์กิจกรรม \`${targetRoster.title}\` ได้ที่ไฟล์แนบด้านล่าง`,
      files: [file],
      flags: MessageFlags.Ephemeral
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
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const messageId = interaction.customId.split(":")[1];
    const targetRoster = getRoster(messageId);
    if (!targetRoster) {
      await interaction.reply({
        content: "ไม่พบกิจกรรมนี้แล้ว",
        flags: MessageFlags.Ephemeral
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
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  if (isLeaveRoster) {
    const leaveResult = removeMemberFromRoster(messageId, interaction.user.id);
    if (!leaveResult || !leaveResult.removed) {
      await interaction.reply({
        content: "คุณยังไม่ได้ลงชื่อในกิจกรรมนี้",
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    await syncRosterMessage(interaction.guild, messageId, roster.title);

    await interaction.reply({
      content: "ยกเลิกการลงชื่อกิจกรรมเรียบร้อยแล้ว",
      flags: MessageFlags.Ephemeral
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
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  addMemberToRoster(messageId, interaction.user.id);
  await syncRosterMessage(interaction.guild, messageId, roster.title);

  await interaction.reply({
    content: `เข้าร่วมกิจกรรมในชื่อ **${profile.ign}** เรียบร้อย!`,
    flags: MessageFlags.Ephemeral
  });
}

module.exports = { handleButton };
