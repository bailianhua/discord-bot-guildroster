const {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonStyle,
  MessageFlags
} = require("discord.js");
const { MENU_BUTTONS, REGISTER_BUTTON_ID } = require("../constants");
const {
  addMemberToRoster,
  getAutoRosterTargets,
  getMemberInfo,
  getRecentRostersInChannel,
  getRecentRostersInGuild,
  getRoster,
  getRosterEntries,
  getUserRostersInGuild,
  removeMemberFromRoster,
  setAutoRosterTarget
} = require("../store");
const {
  buildReserveDayChoiceModal,
  buildRosterDayChoiceModal,
  buildMyRosterComponentsV2,
  buildRegisterModal,
  buildRosterListEmbed,
  buildRosterPickerMenu,
  buildStartRosterModal,
  buildSetTeamModal
} = require("../ui/builders");
const {
  buildRosterCsvBuffer,
  buildRosterExcelBuffer
} = require("../services/roster-export");
const { syncRosterMessage } = require("../services/roster-messages");
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

function isEventRoster(roster) {
  if (!roster || typeof roster !== "object") return false;
  if (roster.meta?.autoWeeklyGuildWar === true) return false;
  const rosterKind = String(roster.meta?.rosterKind || "").trim().toLowerCase();
  if (rosterKind) {
    return rosterKind === "event";
  }
  return roster.meta?.manualEvent === true || !roster.meta;
}

async function handleButton(interaction) {
  if (!interaction.guildId) {
    await replyEphemeral(interaction, {
      content: "ปุ่มนี้ใช้งานได้เฉพาะในเซิร์ฟเวอร์เท่านั้น",
    });
    return;
  }

  if (interaction.customId === REGISTER_BUTTON_ID) {
    const profile = getMemberInfo(interaction.guildId, interaction.user.id);
    await interaction.showModal(buildRegisterModal(profile));
    return;
  }

  if (interaction.customId === MENU_BUTTONS.register) {
    const profile = getMemberInfo(interaction.guildId, interaction.user.id);
    await interaction.showModal(buildRegisterModal(profile));
    return;
  }

  if (interaction.customId === MENU_BUTTONS.myRoster) {
    const profile = getMemberInfo(interaction.guildId, interaction.user.id);
    const rosters = getUserRostersInGuild(interaction.guildId, interaction.user.id, 25);
    await replyEphemeral(interaction, {
      components: buildMyRosterComponentsV2(interaction.user, profile, rosters),
      flags: MessageFlags.IsComponentsV2
    });
    return;
  }

  if (interaction.customId === MENU_BUTTONS.rosterList) {
    const rosters = getRecentRostersInGuild(interaction.guildId, 25);
    if (rosters.length === 0) {
      await replyEphemeral(interaction, {
        content: "ยังไม่มีกิจกรรมที่ถูกสร้างในเซิร์ฟเวอร์นี้",
      });
      return;
    }

    await replyEphemeral(interaction, {
      embeds: [buildRosterListEmbed(rosters)],
    });
    return;
  }

  if (interaction.customId === MENU_BUTTONS.startRoster) {
    if (!hasManageGuildAccess(interaction)) {
      await replyEphemeral(interaction, {
        content: "เฉพาะผู้ดูแลระบบเท่านั้นที่เริ่มลงชื่อกิจกรรมได้",
      });
      return;
    }

    await interaction.showModal(buildStartRosterModal());
    return;
  }

  if (interaction.customId === MENU_BUTTONS.showRoster) {
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

  if (interaction.customId === MENU_BUTTONS.announceRoster) {
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

  if (interaction.customId === MENU_BUTTONS.deleteRoster) {
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

  if (interaction.customId === MENU_BUTTONS.triggerWeeklyBatch) {
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

    const result = await runWeeklyRosterBatchOnce(interaction.client, {
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

  if (interaction.customId === MENU_BUTTONS.clearOldRoster) {
    if (!hasManageGuildAccess(interaction)) {
      await replyEphemeral(interaction, {
        content: "เฉพาะผู้ดูแลระบบเท่านั้นที่ลบโรสเตอร์อัตโนมัติได้",
      });
      return;
    }

    const targetGuildId = interaction.guildId;
    const targetChannelId = interaction.channelId;
    const targetTimeZone = process.env.AUTO_ROSTER_TIMEZONE || "Asia/Bangkok";
    const result = await clearOldAutoRostersOnce(interaction.client, {
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

  const isLegacyCsvExport = interaction.customId.startsWith("download_roster_excel:");
  const isCsvExport =
    interaction.customId.startsWith("download_roster_csv:") || isLegacyCsvExport;
  const isExcelExport = interaction.customId.startsWith("download_roster_xlsx:");
  if (isCsvExport || isExcelExport) {
    const messageId = interaction.customId.split(":")[1];
    const targetRoster = getRoster(messageId);
    const data = getRosterEntries(messageId);
    if (!targetRoster || !data) {
      await replyEphemeral(interaction, {
        content: "ไม่พบกิจกรรมนี้แล้ว",
      });
      return;
    }

    const displayNameByUserId = {};
    await Promise.all(
      data.entries.map(async (entry) => {
        const userId = entry.userId;
        let displayName = null;

        const member = await interaction.guild.members.fetch(userId).catch(() => null);
        if (member?.displayName) {
          displayName = member.displayName;
        }

        if (!displayName) {
          const user = await interaction.client.users.fetch(userId).catch(() => null);
          displayName = user?.globalName || user?.username || null;
        }

        displayNameByUserId[userId] = displayName || entry.profile?.ign || userId;
      })
    );

    const exportBuilder = isExcelExport ? buildRosterExcelBuffer : buildRosterCsvBuffer;
    const { buffer, fileName } = exportBuilder(targetRoster.title, data.entries, {
      displayNameByUserId
    });
    const file = new AttachmentBuilder(buffer, { name: fileName });
    const fileTypeLabel = isExcelExport ? "Excel" : "CSV";

    await replyEphemeral(interaction, {
      content: `ดาวน์โหลดไฟล์กิจกรรม (${fileTypeLabel}) \`${targetRoster.title}\` ได้ที่ไฟล์แนบด้านล่าง`,
      files: [file],
    });
    return;
  }

  if (interaction.customId.startsWith("setteam_roster:")) {
    if (!hasManageGuildAccess(interaction)) {
      await replyEphemeral(interaction, {
        content: "เฉพาะผู้ดูแลระบบเท่านั้นที่ตั้งทีมได้",
      });
      return;
    }

    const messageId = interaction.customId.split(":")[1];
    const targetRoster = getRoster(messageId);
    if (!targetRoster) {
      await replyEphemeral(interaction, {
        content: "ไม่พบกิจกรรมนี้แล้ว",
      });
      return;
    }

    await interaction.showModal(buildSetTeamModal(targetRoster));
    return;
  }

  const isJoinRoster = interaction.customId.startsWith("join_roster:");
  const isReserveRoster = interaction.customId.startsWith("reserve_roster:");
  const isLeaveRoster = interaction.customId.startsWith("leave_roster:");
  if (!isJoinRoster && !isReserveRoster && !isLeaveRoster) {
    await replyEphemeral(interaction, {
      content: "เมนูนี้เป็นเวอร์ชันเก่า กรุณาเปิดเมนูใหม่ด้วย `/menu` หรือ `/adminmenu`",
    });
    return;
  }

  const messageId = interaction.customId.split(":")[1];
  const roster = getRoster(messageId);
  if (!roster) {
    await replyEphemeral(interaction, {
      content: "ไม่พบกิจกรรมนี้แล้ว",
    });
    return;
  }

  if (isLeaveRoster) {
    const leaveResult = removeMemberFromRoster(messageId, interaction.user.id);
    if (!leaveResult || !leaveResult.removed) {
      await replyEphemeral(interaction, {
        content: "คุณยังไม่ได้ลงชื่อหรือสำรองในกิจกรรมนี้",
      });
      return;
    }

    await syncRosterMessage(interaction.guild, messageId, roster.title);

    await replyEphemeral(interaction, {
      content: "ยกเลิกการลงชื่อ/สำรองกิจกรรมเรียบร้อยแล้ว",
    });
    return;
  }

  const profile = getMemberInfo(interaction.guildId, interaction.user.id);
  if (!profile) {
    await replyEphemeral(interaction, {
      content: "ต้องลงทะเบียนโปรไฟล์ก่อน จึงจะลงชื่อเข้าร่วมกิจกรรมได้",
    });
    return;
  }

  if (isEventRoster(roster)) {
    const alreadyJoined =
      Array.isArray(roster.memberIds) && roster.memberIds.includes(interaction.user.id);
    addMemberToRoster(messageId, interaction.user.id);
    await syncRosterMessage(interaction.guild, messageId, roster.title);

    const displayName = profile?.ign || interaction.user.username;
    await replyEphemeral(interaction, {
      content: alreadyJoined
        ? `คุณลงทะเบียนกิจกรรมในชื่อ **${displayName}** ไว้อยู่แล้ว`
        : `ลงทะเบียนกิจกรรมในชื่อ **${displayName}** เรียบร้อย`,
    });
    return;
  }

  if (isReserveRoster) {
    await interaction.showModal(buildReserveDayChoiceModal(roster));
    return;
  }

  await interaction.showModal(buildRosterDayChoiceModal(roster));
}

module.exports = { handleButton };
