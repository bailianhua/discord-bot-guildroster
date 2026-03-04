const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags
} = require("discord.js");
const {
  createRoster,
  getAutoRosterTargets,
  getMemberInfo,
  getRecentRostersInChannel,
  getRecentRostersInGuild,
  setAutoRosterTarget,
  setRosterListViewMessage,
  getUserRostersInGuild
} = require("../store");
const {
  buildAdminMenuComponentsV2,
  buildMyRosterComponentsV2,
  buildUserMenuComponentsV2,
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
const { hasManageGuildAccess } = require("../utils/access");
const { replyEphemeral } = require("../utils/interaction-response");

function eventLabel(eventKey) {
  if (eventKey === "guildwar") return "Guild War";
  return eventKey;
}

async function handleChatInput(interaction, { client }) {
  if (!interaction.guildId) {
    await replyEphemeral(interaction, {
      content: "กรุณาใช้คำสั่งนี้ในเซิร์ฟเวอร์เท่านั้น",
    });
    return;
  }

  if (interaction.commandName === "register") {
    const profile = getMemberInfo(interaction.guildId, interaction.user.id);
    await interaction.showModal(buildRegisterModal(profile));
    return;
  }

  if (interaction.commandName === "registerpanel") {
    if (!hasManageGuildAccess(interaction)) {
      await replyEphemeral(interaction, {
        content: "เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถใช้คำสั่งนี้ได้",
      });
      return;
    }

    const missingPerms = getMissingPostPerms(interaction.channel, client.user.id);
    if (missingPerms.length > 0) {
      await replyEphemeral(interaction, {
        content: `ไม่สามารถโพสต์แผงควบคุมได้เนื่องจากขาดสิทธิ์: ${missingPerms.join(
          ", "
        )}`,
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

    await replyEphemeral(interaction, {
      content: "โพสต์แผงลงทะเบียนเรียบร้อยแล้ว",
    });
    return;
  }

  if (interaction.commandName === "menu") {
    await replyEphemeral(interaction, {
      components: buildUserMenuComponentsV2(),
      flags: MessageFlags.IsComponentsV2
    });
    return;
  }

  if (interaction.commandName === "adminmenu") {
    if (!hasManageGuildAccess(interaction)) {
      await replyEphemeral(interaction, {
        content: "เฉพาะผู้ดูแลระบบเท่านั้นที่เปิดเมนูแอดมินได้",
      });
      return;
    }

    await replyEphemeral(interaction, {
      components: buildAdminMenuComponentsV2(),
      flags: MessageFlags.IsComponentsV2
    });
    return;
  }

  if (interaction.commandName === "pinmenu") {
    if (!hasManageGuildAccess(interaction)) {
      await replyEphemeral(interaction, {
        content: "เฉพาะผู้ดูแลระบบเท่านั้นที่โพสต์เมนูถาวรได้",
      });
      return;
    }

    const missingPerms = getMissingPostPerms(interaction.channel, client.user.id, {
      needsEmbed: false
    });
    if (missingPerms.length > 0) {
      await replyEphemeral(interaction, {
        content: `ไม่สามารถโพสต์เมนูได้เนื่องจากขาดสิทธิ์: ${missingPerms.join(
          ", "
        )}`,
      });
      return;
    }

    const menuMessage = await interaction.channel.send({
      components: buildUserMenuComponentsV2(),
      flags: MessageFlags.IsComponentsV2
    });

    await replyEphemeral(interaction, {
      content: `โพสต์เมนูแบบสาธารณะเรียบร้อยแล้ว: ${menuMessage.url}`,
    });
    return;
  }

  if (interaction.commandName === "triggerweeklybatch") {
    if (!hasManageGuildAccess(interaction)) {
      await replyEphemeral(interaction, {
        content: "เฉพาะผู้ดูแลระบบเท่านั้นที่สั่งสร้างโรสเตอร์อัตโนมัติได้",
      });
      return;
    }

    const targetGuildId = interaction.guildId;
    const targetChannelId = interaction.channelId;
    const targetTimeZone = process.env.AUTO_ROSTER_TIMEZONE || "Asia/Bangkok";
    setAutoRosterTarget(targetGuildId, targetChannelId);
    const guildTargets = getAutoRosterTargets().filter(
      (target) => target.guildId === targetGuildId
    );
    const previewChannels = guildTargets
      .slice(0, 10)
      .map((target) => `<#${target.channelId}>`);
    const hiddenChannels = Math.max(0, guildTargets.length - previewChannels.length);
    const guildChannelsText =
      hiddenChannels > 0
        ? `${previewChannels.join(", ")} และอีก ${hiddenChannels} ช่อง`
        : previewChannels.join(", ");

    const result = await runWeeklyRosterBatchOnce(client, {
      guildId: targetGuildId,
      channelId: targetChannelId,
      timeZone: targetTimeZone,
      eventKeys: ["guildwar"]
    });

    if (result.error === "GUILD_NOT_FOUND") {
      await replyEphemeral(interaction, {
        content: "ไม่พบเซิร์ฟเวอร์เป้าหมายสำหรับการสร้างโรสเตอร์อัตโนมัติ",
      });
      return;
    }
    if (result.error === "CHANNEL_NOT_FOUND") {
      await replyEphemeral(interaction, {
        content: "ไม่พบช่องเป้าหมายสำหรับการสร้างโรสเตอร์อัตโนมัติ",
      });
      return;
    }
    if (result.error === "MISSING_PERMS") {
      await replyEphemeral(interaction, {
        content: `บอทขาดสิทธิ์ในช่องเป้าหมาย: ${result.missingPerms.join(", ")}`,
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

    await replyEphemeral(interaction, {
      content: [
        `สั่งรัน weekly batch เรียบร้อย (week: ${result.weekKey})`,
        `ช่องเป้าหมาย: <#${targetChannelId}>`,
        `บันทึกช่องนี้เข้า scheduler เรียบร้อย`,
        `เป้าหมายในเซิร์ฟเวอร์นี้: ${guildTargets.length} ช่อง`,
        guildChannelsText ? `รายการช่องในเซิร์ฟเวอร์นี้: ${guildChannelsText}` : null,
        `สร้างใหม่: ${createdText}`,
        `มีอยู่แล้ว: ${existsText}`,
        `ข้าม: ${skippedText}`,
        `ลบโรสเตอร์เก่า: ${result.cleanupCount} รายการ`
      ]
        .filter(Boolean)
        .join("\n"),
    });
    return;
  }

  if (interaction.commandName === "clearoldroster") {
    if (!hasManageGuildAccess(interaction)) {
      await replyEphemeral(interaction, {
        content: "เฉพาะผู้ดูแลระบบเท่านั้นที่ลบโรสเตอร์อัตโนมัติได้",
      });
      return;
    }

    const targetGuildId = interaction.guildId;
    const targetChannelId = interaction.channelId;
    const targetTimeZone = process.env.AUTO_ROSTER_TIMEZONE || "Asia/Bangkok";
    const result = await clearOldAutoRostersOnce(client, {
      guildId: targetGuildId,
      channelId: targetChannelId,
      timeZone: targetTimeZone
    });

    if (result.error === "GUILD_NOT_FOUND") {
      await replyEphemeral(interaction, {
        content: "ไม่พบเซิร์ฟเวอร์เป้าหมายสำหรับการลบโรสเตอร์อัตโนมัติ",
      });
      return;
    }
    if (result.error === "CHANNEL_NOT_FOUND") {
      await replyEphemeral(interaction, {
        content: "ไม่พบช่องเป้าหมายสำหรับการลบโรสเตอร์อัตโนมัติ",
      });
      return;
    }

    await replyEphemeral(interaction, {
      content: [
        `ลบโรสเตอร์อัตโนมัติเรียบร้อย (รวมสัปดาห์ปัจจุบัน)`,
        `ช่องเป้าหมาย: <#${targetChannelId}>`,
        `week ปัจจุบัน: ${result.weekKey}`,
        `จำนวนที่ลบ: ${result.deletedCount} รายการ`
      ].join("\n"),
    });
    return;
  }

  if (interaction.commandName === "startroster") {
    if (!hasManageGuildAccess(interaction)) {
      await replyEphemeral(interaction, {
        content: "เฉพาะผู้ดูแลระบบเท่านั้นที่เริ่มลงชื่อกิจกรรมได้",
      });
      return;
    }

    const missingPerms = getMissingPostPerms(interaction.channel, client.user.id);
    if (missingPerms.length > 0) {
      await replyEphemeral(interaction, {
        content: `ไม่สามารถสร้างกิจกรรมได้เนื่องจากขาดสิทธิ์: ${missingPerms.join(
          ", "
        )}`,
      });
      return;
    }

    const title = interaction.options.getString("title") || "ลงชื่อสมาชิกกิลด์";
    const pendingEmbed = buildRosterEmbed(title, []);
    const row = new ActionRowBuilder().addComponents(
      buildRegisterButton(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("pending")
        .setLabel("เข้าร่วมกิจกรรม")
        .setStyle(ButtonStyle.Success)
        .setDisabled(true)
    );

    await replyEphemeral(interaction, {
      content: "กำลังสร้างโพสต์ลงชื่อกิจกรรม...",
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
      await replyEphemeral(interaction, {
        content: "ยังไม่มีกิจกรรมที่ถูกสร้างในเซิร์ฟเวอร์นี้",
      });
      return;
    }

    await interaction.reply({
      components: buildRosterListComponentsV2(rosters),
      flags: MessageFlags.IsComponentsV2
    });

    const rosterListMessage = await interaction.fetchReply().catch(() => null);
    if (rosterListMessage) {
      setRosterListViewMessage(
        interaction.guildId,
        rosterListMessage.channelId,
        rosterListMessage.id
      );
    }
    return;
  }

  if (interaction.commandName === "showroster") {
    const rosters = getRecentRostersInGuild(interaction.guildId, 25);
    if (rosters.length === 0) {
      await replyEphemeral(interaction, {
        content: "ยังไม่มีกิจกรรมที่ถูกสร้างในเซิร์ฟเวอร์นี้",
      });
      return;
    }

    await replyEphemeral(interaction, {
      content: "เลือกชื่อกิจกรรมที่ต้องการดูรายละเอียด",
      components: [
        new ActionRowBuilder().addComponents(
          buildRosterPickerMenu("show_roster_pick", "เลือกกิจกรรมที่ต้องการแสดง", rosters)
        )
      ],
    });
    return;
  }

  if (interaction.commandName === "announceroster") {
    if (!hasManageGuildAccess(interaction)) {
      await replyEphemeral(interaction, {
        content: "เฉพาะผู้ดูแลระบบเท่านั้นที่ประกาศกิจกรรมได้",
      });
      return;
    }

    const rosters = getRecentRostersInGuild(interaction.guildId, 25);
    if (rosters.length === 0) {
      await replyEphemeral(interaction, {
        content: "ยังไม่มีกิจกรรมที่ถูกสร้างในเซิร์ฟเวอร์นี้",
      });
      return;
    }

    await replyEphemeral(interaction, {
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

    await replyEphemeral(interaction, {
      components: buildMyRosterComponentsV2(interaction.user, profile, rosters),
      flags: MessageFlags.IsComponentsV2
    });
    return;
  }

  if (interaction.commandName === "setteam") {
    if (!hasManageGuildAccess(interaction)) {
      await replyEphemeral(interaction, {
        content: "เฉพาะผู้ดูแลระบบเท่านั้นที่ตั้งทีมได้",
      });
      return;
    }

    const rosters = getRecentRostersInGuild(interaction.guildId, 25);
    if (rosters.length === 0) {
      await replyEphemeral(interaction, {
        content: "ยังไม่มีกิจกรรมที่ถูกสร้างในเซิร์ฟเวอร์นี้",
      });
      return;
    }

    await replyEphemeral(interaction, {
      content: "เลือกกิจกรรมที่ต้องการตั้งทีม",
      components: [
        new ActionRowBuilder().addComponents(
          buildRosterPickerMenu("setteam_roster_pick", "เลือกกิจกรรมที่ต้องการตั้งทีม", rosters)
        )
      ],
    });
    return;
  }

  if (interaction.commandName === "deleteroster") {
    if (!hasManageGuildAccess(interaction)) {
      await replyEphemeral(interaction, {
        content: "เฉพาะผู้ดูแลระบบเท่านั้นที่ลบกิจกรรมได้",
      });
      return;
    }

    const rosters = getRecentRostersInChannel(
      interaction.guildId,
      interaction.channelId,
      25
    );
    if (rosters.length === 0) {
      await replyEphemeral(interaction, {
        content: "ไม่พบกิจกรรมในช่องนี้",
      });
      return;
    }

    await replyEphemeral(interaction, {
      content: "เลือกกิจกรรมที่ต้องการลบ",
      components: [
        new ActionRowBuilder().addComponents(
          buildRosterPickerMenu("delete_roster_pick", "เลือกกิจกรรมที่ต้องการลบ", rosters)
        )
      ],
    });
    return;
  }

  await replyEphemeral(interaction, {
    content:
      "ไม่รองรับคำสั่งนี้แล้ว หรือคำสั่งนี้ยังไม่อัปเดตในเซิร์ฟเวอร์นี้ กรุณาลองใหม่ด้วย `/menu` หรือ `/adminmenu`",
  });
}

module.exports = { handleChatInput };
