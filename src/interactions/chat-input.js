const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  PermissionFlagsBits
} = require("discord.js");
const {
  createRoster,
  getMemberInfo,
  getRecentRostersInChannel,
  getRecentRostersInGuild,
  getUserRostersInGuild
} = require("../store");
const {
  buildMenuComponentsV2,
  buildMyRosterComponentsV2,
  buildRegisterButton,
  buildRegisterModal,
  buildRegistrationPanelEmbed,
  buildRosterActionRow,
  buildRosterEmbed,
  buildRosterListComponentsV2,
  buildRosterPickerMenu,
  buildSetTeamModal
} = require("../ui/builders");
const { getMissingPostPerms } = require("../services/permissions");

function isManageGuild(interaction) {
  return Boolean(
    interaction.memberPermissions &&
      interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)
  );
}

async function handleChatInput(interaction, { client }) {
  if (!interaction.guildId) {
    await interaction.reply({
      content: "กรุณาใช้คำสั่งนี้ในเซิร์ฟเวอร์เท่านั้น",
      ephemeral: true
    });
    return;
  }

  if (interaction.commandName === "register") {
    await interaction.showModal(buildRegisterModal());
    return;
  }

  if (interaction.commandName === "registerpanel") {
    if (!isManageGuild(interaction)) {
      await interaction.reply({
        content: "เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถใช้คำสั่งนี้ได้",
        ephemeral: true
      });
      return;
    }

    const missingPerms = getMissingPostPerms(interaction.channel, client.user.id);
    if (missingPerms.length > 0) {
      await interaction.reply({
        content: `ไม่สามารถโพสต์แผงควบคุมได้เนื่องจากขาดสิทธิ์: ${missingPerms.join(
          ", "
        )}`,
        ephemeral: true
      });
      return;
    }

    await interaction.channel.send({
      embeds: [buildRegistrationPanelEmbed()],
      components: [
        new ActionRowBuilder().addComponents(
          buildRegisterButton(ButtonStyle.Primary)
        )
      ]
    });

    await interaction.reply({
      content: "โพสต์แผงลงทะเบียนเรียบร้อยแล้ว",
      ephemeral: true
    });
    return;
  }

  if (interaction.commandName === "menu") {
    const missingPerms = getMissingPostPerms(interaction.channel, client.user.id, {
      needsEmbed: false
    });
    if (missingPerms.length > 0) {
      await interaction.reply({
        content: `ไม่สามารถโพสต์เมนูได้เนื่องจากขาดสิทธิ์: ${missingPerms.join(
          ", "
        )}`,
        ephemeral: true
      });
      return;
    }

    await interaction.reply({
      components: buildMenuComponentsV2(),
      flags: MessageFlags.IsComponentsV2
    });
    return;
  }

  if (interaction.commandName === "startroster") {
    if (!isManageGuild(interaction)) {
      await interaction.reply({
        content: "เฉพาะผู้ดูแลระบบเท่านั้นที่เริ่มลงชื่อกิจกรรมได้",
        ephemeral: true
      });
      return;
    }

    const missingPerms = getMissingPostPerms(interaction.channel, client.user.id);
    if (missingPerms.length > 0) {
      await interaction.reply({
        content: `ไม่สามารถสร้างกิจกรรมได้เนื่องจากขาดสิทธิ์: ${missingPerms.join(
          ", "
        )}`,
        ephemeral: true
      });
      return;
    }

    const title = interaction.options.getString("title") || "ลงชื่อสมาชิกกิลด์";
    const pendingEmbed = buildRosterEmbed(title, []);
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("pending")
        .setLabel("เข้าร่วมกิจกรรม")
        .setStyle(ButtonStyle.Success)
        .setDisabled(true),
      buildRegisterButton(ButtonStyle.Secondary)
    );

    await interaction.reply({
      content: "กำลังสร้างโพสต์ลงชื่อกิจกรรม...",
      ephemeral: true
    });

    const rosterMessage = await interaction.channel.send({
      embeds: [pendingEmbed],
      components: [row]
    });

    createRoster({
      messageId: rosterMessage.id,
      guildId: interaction.guildId,
      channelId: interaction.channelId,
      title,
      createdBy: interaction.user.id
    });

    const liveRow = buildRosterActionRow(rosterMessage.id);
    await rosterMessage.edit({ components: [liveRow] });
    return;
  }

  if (interaction.commandName === "roster") {
    const rosters = getRecentRostersInGuild(interaction.guildId, 25);
    if (rosters.length === 0) {
      await interaction.reply({
        content: "ยังไม่มีกิจกรรมที่ถูกสร้างในเซิร์ฟเวอร์นี้",
        ephemeral: true
      });
      return;
    }

    await interaction.reply({
      components: buildRosterListComponentsV2(rosters),
      flags: MessageFlags.IsComponentsV2
    });
    return;
  }

  if (interaction.commandName === "showroster") {
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

  if (interaction.commandName === "announceroster") {
    if (!isManageGuild(interaction)) {
      await interaction.reply({
        content: "เฉพาะผู้ดูแลระบบเท่านั้นที่ประกาศกิจกรรมได้",
        ephemeral: true
      });
      return;
    }

    const rosters = getRecentRostersInGuild(interaction.guildId, 25);
    if (rosters.length === 0) {
      await interaction.reply({
        content: "ยังไม่มีกิจกรรมที่ถูกสร้างในเซิร์ฟเวอร์นี้",
        ephemeral: true
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
      ephemeral: true
    });
    return;
  }

  if (interaction.commandName === "myroster") {
    const profile = getMemberInfo(interaction.guildId, interaction.user.id);
    const rosters = getUserRostersInGuild(
      interaction.guildId,
      interaction.user.id,
      25
    );

    await interaction.reply({
      components: buildMyRosterComponentsV2(interaction.user, profile, rosters),
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
    });
    return;
  }

  if (interaction.commandName === "setteam") {
    if (!isManageGuild(interaction)) {
      await interaction.reply({
        content: "เฉพาะผู้ดูแลระบบเท่านั้นที่ตั้งทีมได้",
        ephemeral: true
      });
      return;
    }

    const rosters = getRecentRostersInGuild(interaction.guildId, 25);
    if (rosters.length === 0) {
      await interaction.reply({
        content: "ยังไม่มีกิจกรรมที่ถูกสร้างในเซิร์ฟเวอร์นี้",
        ephemeral: true
      });
      return;
    }

    await interaction.reply({
      content: "เลือกกิจกรรมที่ต้องการตั้งทีม",
      components: [
        new ActionRowBuilder().addComponents(
          buildRosterPickerMenu("setteam_roster_pick", "เลือกกิจกรรมที่ต้องการตั้งทีม", rosters)
        )
      ],
      ephemeral: true
    });
    return;
  }

  if (interaction.commandName === "deleteroster") {
    if (!isManageGuild(interaction)) {
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
  }
}

module.exports = { handleChatInput };
