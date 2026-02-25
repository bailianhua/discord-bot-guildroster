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
  buildRosterExportRow,
  buildRosterEmbed,
  buildRosterListComponentsV2,
  buildRosterPickerMenu,
  buildSetTeamModal
} = require("../ui/builders");
const { getMissingPostPerms } = require("../services/permissions");
const {
  clearOldAutoRostersOnce,
  runWeeklyRosterBatchOnce
} = require("../services/weekly-roster-scheduler");

function isManageGuild(interaction) {
  return Boolean(
    interaction.memberPermissions &&
      interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)
  );
}

function eventLabel(eventKey) {
  if (eventKey === "sat") return "Saturday";
  if (eventKey === "sun") return "Sunday";
  return eventKey;
}

async function handleChatInput(interaction, { client }) {
  if (!interaction.guildId) {
    await interaction.reply({
      content: "กรุณาใช้คำสั่งนี้ในเซิร์ฟเวอร์เท่านั้น",
      flags: MessageFlags.Ephemeral
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
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const missingPerms = getMissingPostPerms(interaction.channel, client.user.id);
    if (missingPerms.length > 0) {
      await interaction.reply({
        content: `ไม่สามารถโพสต์แผงควบคุมได้เนื่องจากขาดสิทธิ์: ${missingPerms.join(
          ", "
        )}`,
        flags: MessageFlags.Ephemeral
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
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  if (interaction.commandName === "menu") {
    await interaction.reply({
      components: buildMenuComponentsV2(),
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
    });
    return;
  }

  if (interaction.commandName === "pinmenu") {
    if (!isManageGuild(interaction)) {
      await interaction.reply({
        content: "เฉพาะผู้ดูแลระบบเท่านั้นที่โพสต์เมนูถาวรได้",
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const missingPerms = getMissingPostPerms(interaction.channel, client.user.id, {
      needsEmbed: false
    });
    if (missingPerms.length > 0) {
      await interaction.reply({
        content: `ไม่สามารถโพสต์เมนูได้เนื่องจากขาดสิทธิ์: ${missingPerms.join(
          ", "
        )}`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const menuMessage = await interaction.channel.send({
      components: buildMenuComponentsV2(),
      flags: MessageFlags.IsComponentsV2
    });

    await interaction.reply({
      content: `โพสต์เมนูแบบสาธารณะเรียบร้อยแล้ว: ${menuMessage.url}`,
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  if (interaction.commandName === "triggerweeklybatch") {
    if (!isManageGuild(interaction)) {
      await interaction.reply({
        content: "เฉพาะผู้ดูแลระบบเท่านั้นที่สั่งสร้างโรสเตอร์อัตโนมัติได้",
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const targetGuildId = process.env.AUTO_ROSTER_GUILD_ID || interaction.guildId;
    const targetChannelId = process.env.AUTO_ROSTER_CHANNEL_ID || interaction.channelId;
    const targetTimeZone = process.env.AUTO_ROSTER_TIMEZONE || "Asia/Bangkok";

    const result = await runWeeklyRosterBatchOnce(client, {
      guildId: targetGuildId,
      channelId: targetChannelId,
      timeZone: targetTimeZone,
      eventKeys: ["sat", "sun"]
    });

    if (result.error === "GUILD_NOT_FOUND") {
      await interaction.reply({
        content: "ไม่พบเซิร์ฟเวอร์เป้าหมายสำหรับการสร้างโรสเตอร์อัตโนมัติ",
        flags: MessageFlags.Ephemeral
      });
      return;
    }
    if (result.error === "CHANNEL_NOT_FOUND") {
      await interaction.reply({
        content: "ไม่พบช่องเป้าหมายสำหรับการสร้างโรสเตอร์อัตโนมัติ",
        flags: MessageFlags.Ephemeral
      });
      return;
    }
    if (result.error === "MISSING_PERMS") {
      await interaction.reply({
        content: `บอทขาดสิทธิ์ในช่องเป้าหมาย: ${result.missingPerms.join(", ")}`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const createdText =
      result.created.length > 0
        ? result.created.map(eventLabel).join(", ")
        : "-";
    const existsText =
      result.exists.length > 0
        ? result.exists.map(eventLabel).join(", ")
        : "-";
    const skippedText =
      result.skipped.length > 0
        ? result.skipped.map(eventLabel).join(", ")
        : "-";

    await interaction.reply({
      content: [
        `สั่งรัน weekly batch เรียบร้อย (week: ${result.weekKey})`,
        `ช่องเป้าหมาย: <#${targetChannelId}>`,
        `สร้างใหม่: ${createdText}`,
        `มีอยู่แล้ว: ${existsText}`,
        `ข้าม: ${skippedText}`,
        `ลบโรสเตอร์เก่า: ${result.cleanupCount} รายการ`
      ].join("\n"),
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  if (interaction.commandName === "clearoldroster") {
    if (!isManageGuild(interaction)) {
      await interaction.reply({
        content: "เฉพาะผู้ดูแลระบบเท่านั้นที่ลบโรสเตอร์อัตโนมัติได้",
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const targetGuildId = process.env.AUTO_ROSTER_GUILD_ID || interaction.guildId;
    const targetChannelId = process.env.AUTO_ROSTER_CHANNEL_ID || interaction.channelId;
    const targetTimeZone = process.env.AUTO_ROSTER_TIMEZONE || "Asia/Bangkok";
    const result = await clearOldAutoRostersOnce(client, {
      guildId: targetGuildId,
      channelId: targetChannelId,
      timeZone: targetTimeZone
    });

    if (result.error === "GUILD_NOT_FOUND") {
      await interaction.reply({
        content: "ไม่พบเซิร์ฟเวอร์เป้าหมายสำหรับการลบโรสเตอร์อัตโนมัติ",
        flags: MessageFlags.Ephemeral
      });
      return;
    }
    if (result.error === "CHANNEL_NOT_FOUND") {
      await interaction.reply({
        content: "ไม่พบช่องเป้าหมายสำหรับการลบโรสเตอร์อัตโนมัติ",
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    await interaction.reply({
      content: [
        `ลบโรสเตอร์อัตโนมัติเรียบร้อย (รวมสัปดาห์ปัจจุบัน)`,
        `ช่องเป้าหมาย: <#${targetChannelId}>`,
        `week ปัจจุบัน: ${result.weekKey}`,
        `จำนวนที่ลบ: ${result.deletedCount} รายการ`
      ].join("\n"),
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  if (interaction.commandName === "startroster") {
    if (!isManageGuild(interaction)) {
      await interaction.reply({
        content: "เฉพาะผู้ดูแลระบบเท่านั้นที่เริ่มลงชื่อกิจกรรมได้",
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const missingPerms = getMissingPostPerms(interaction.channel, client.user.id);
    if (missingPerms.length > 0) {
      await interaction.reply({
        content: `ไม่สามารถสร้างกิจกรรมได้เนื่องจากขาดสิทธิ์: ${missingPerms.join(
          ", "
        )}`,
        flags: MessageFlags.Ephemeral
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
      flags: MessageFlags.Ephemeral
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
    const exportRow = buildRosterExportRow(rosterMessage.id);
    await rosterMessage.edit({ components: [liveRow, exportRow] });
    return;
  }

  if (interaction.commandName === "roster") {
    const rosters = getRecentRostersInGuild(interaction.guildId, 25);
    if (rosters.length === 0) {
      await interaction.reply({
        content: "ยังไม่มีกิจกรรมที่ถูกสร้างในเซิร์ฟเวอร์นี้",
        flags: MessageFlags.Ephemeral
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

  if (interaction.commandName === "announceroster") {
    if (!isManageGuild(interaction)) {
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
      content: "เลือกกิจกรรมที่ต้องการตั้งทีม",
      components: [
        new ActionRowBuilder().addComponents(
          buildRosterPickerMenu("setteam_roster_pick", "เลือกกิจกรรมที่ต้องการตั้งทีม", rosters)
        )
      ],
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  if (interaction.commandName === "deleteroster") {
    if (!isManageGuild(interaction)) {
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
  }
}

module.exports = { handleChatInput };
