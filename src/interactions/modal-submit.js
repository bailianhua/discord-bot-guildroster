const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");
const {
  addMemberToRoster,
  addReserveMemberToRoster,
  createRoster,
  getMemberInfo,
  getRoster,
  getRosterEntries,
  setMemberInfo,
  setMemberTeamInRoster
} = require("../store");
const {
  buildRegisterButton,
  buildRegistrationEmbed,
  buildRosterActionRow,
  buildRosterExportRow,
  buildRosterEmbed
} = require("../ui/builders");
const { getMissingPostPerms } = require("../services/permissions");
const { syncRosterMessage } = require("../services/roster-messages");
const { hasManageGuildAccess } = require("../utils/access");
const { dayChoiceLabel } = require("../utils/day-choice");
const { replyEphemeral } = require("../utils/interaction-response");

async function handleModalSubmit(interaction) {
  if (!interaction.guildId) {
    await replyEphemeral(interaction, {
      content: "กรุณาใช้ระบบนี้ในเซิร์ฟเวอร์",
    });
    return;
  }

  if (interaction.customId === "start_roster_modal") {
    if (!hasManageGuildAccess(interaction)) {
      await replyEphemeral(interaction, {
        content: "เฉพาะผู้ดูแลระบบเท่านั้นที่เริ่มลงชื่อกิจกรรมได้",
      });
      return;
    }

    const missingPerms = getMissingPostPerms(interaction.channel, interaction.client.user.id);
    if (missingPerms.length > 0) {
      await replyEphemeral(interaction, {
        content: `ไม่สามารถสร้างกิจกรรมได้เนื่องจากขาดสิทธิ์: ${missingPerms.join(
          ", "
        )}`,
      });
      return;
    }

    const titleInput = interaction.fields.getTextInputValue("start_roster_title").trim();
    const title = titleInput || "ลงชื่อสมาชิกกิลด์";
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

  const isJoinRosterModal = interaction.customId.startsWith("join_roster_modal:");
  const isReserveRosterModal = interaction.customId.startsWith("reserve_roster_modal:");
  if (isJoinRosterModal || isReserveRosterModal) {
    const rosterMessageId = interaction.customId.split(":")[1];
    const targetRoster = getRoster(rosterMessageId);
    if (!targetRoster) {
      await replyEphemeral(interaction, {
        content: "ไม่พบกิจกรรมนี้แล้ว",
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

    const dayChoiceSelectId = isReserveRosterModal
      ? "reserve_roster_day_choice"
      : "join_roster_day_choice";
    const dayChoice = interaction.fields.getStringSelectValues(dayChoiceSelectId)[0];
    if (isReserveRosterModal) {
      addReserveMemberToRoster(targetRoster.messageId, interaction.user.id, dayChoice);
    } else {
      addMemberToRoster(targetRoster.messageId, interaction.user.id, dayChoice);
    }
    await syncRosterMessage(interaction.guild, targetRoster.messageId, targetRoster.title);

    const displayName = profile?.ign || interaction.user.username;
    await replyEphemeral(interaction, {
      content: isReserveRosterModal
        ? `ลงชื่อสำรองในชื่อ **${displayName}** เรียบร้อย | วันที่: **${dayChoiceLabel(
          dayChoice
        )}**`
        : `ลงทะเบียนกิจกรรมในชื่อ **${displayName}** เรียบร้อย | วันที่: **${dayChoiceLabel(
          dayChoice
        )}**`,
    });
    return;
  }

  if (interaction.customId === "setteam_modal" || interaction.customId.startsWith("setteam_modal:")) {
    if (!hasManageGuildAccess(interaction)) {
      await replyEphemeral(interaction, {
        content: "เฉพาะผู้ดูแลระบบเท่านั้นที่ตั้งทีมได้",
      });
      return;
    }

    const selectedUsers = interaction.fields.getSelectedUsers(
      "setteam_member_value",
      true
    );
    const members = [...selectedUsers.values()];
    if (members.length === 0) {
      await replyEphemeral(interaction, {
        content: "ไม่พบสมาชิกที่เลือก กรุณาลองใหม่",
      });
      return;
    }

    const team = interaction.fields.getStringSelectValues("setteam_team_value")[0];
    const lockedRosterId = interaction.customId.startsWith("setteam_modal:")
      ? interaction.customId.split(":")[1]
      : null;
    const targetRosterId = lockedRosterId;
    if (!targetRosterId) {
      await replyEphemeral(interaction, {
        content: "ไม่พบกิจกรรมที่ต้องการตั้งทีม กรุณาเปิดผ่าน /setteam หรือปุ่มตั้งทีมในกิจกรรม",
      });
      return;
    }
    const targetRoster = getRoster(targetRosterId);

    if (!targetRoster) {
      await replyEphemeral(interaction, {
        content: "ไม่พบกิจกรรมที่เลือก อาจถูกลบไปแล้ว กรุณาลองใหม่",
      });
      return;
    }

    const selectedIds = members.map((member) => member.id);
    const missingProfileIds = [];
    const notInRosterIds = [];
    const validIds = [];
    const rosterMemberSet = new Set(targetRoster.memberIds || []);

    for (const memberId of selectedIds) {
      const profile = getMemberInfo(interaction.guildId, memberId);
      if (!profile) {
        missingProfileIds.push(memberId);
        continue;
      }

      if (!rosterMemberSet.has(memberId)) {
        notInRosterIds.push(memberId);
        continue;
      }

      validIds.push(memberId);
    }

    if (validIds.length === 0) {
      const lines = ["ไม่สามารถกำหนดทีมได้ เพราะไม่พบสมาชิกที่ผ่านเงื่อนไข"];
      if (missingProfileIds.length > 0) {
        lines.push(
          `ยังไม่มีโปรไฟล์ (${missingProfileIds.length}): ${missingProfileIds
            .map((id) => `<@${id}>`)
            .join(", ")}`
        );
      }
      if (notInRosterIds.length > 0) {
        lines.push(
          `ยังไม่ได้ลงชื่อในกิจกรรม (${notInRosterIds.length}): ${notInRosterIds
            .map((id) => `<@${id}>`)
            .join(", ")}`
        );
      }
      await replyEphemeral(interaction, {
        content: lines.join("\n"),
      });
      return;
    }

    const assignedIds = [];
    for (const memberId of validIds) {
      setMemberTeamInRoster(targetRoster.messageId, memberId, team);
      assignedIds.push(memberId);
    }

    await syncRosterMessage(interaction.guild, targetRoster.messageId, targetRoster.title);

    const data = getRosterEntries(targetRoster.messageId);
    const embed = buildRosterEmbed(targetRoster.title, data.entries);

    const summaryLines = [
      `กำหนดทีม **${team === "attack" ? "Attack" : "Defense"}** ให้สมาชิก ${assignedIds.length} คนเรียบร้อย`
    ];
    if (missingProfileIds.length > 0) {
      summaryLines.push(
        `ข้าม (ไม่มีโปรไฟล์) ${missingProfileIds.length}: ${missingProfileIds
          .map((id) => `<@${id}>`)
          .join(", ")}`
      );
    }
    if (notInRosterIds.length > 0) {
      summaryLines.push(
        `ข้าม (ยังไม่ได้ลงชื่อกิจกรรม) ${notInRosterIds.length}: ${notInRosterIds
          .map((id) => `<@${id}>`)
          .join(", ")}`
      );
    }

    await replyEphemeral(interaction, {
      content: summaryLines.join("\n"),
      embeds: [embed],
    });
    return;
  }

  if (interaction.customId !== "register_profile") {
    await replyEphemeral(interaction, {
      content: "ฟอร์มนี้เป็นเวอร์ชันเก่า กรุณาเปิดใหม่ด้วย `/menu` หรือ `/adminmenu`",
    });
    return;
  }

  const ign = interaction.fields.getTextInputValue("register_ign_value").trim();
  const playerPath = interaction.fields.getStringSelectValues("register_path_value")[0];

  setMemberInfo(interaction.guildId, interaction.user.id, {
    ign,
    class: playerPath,
    path: playerPath
  });

  await replyEphemeral(interaction, {
    embeds: [
      buildRegistrationEmbed({
        ign,
        playerPath
      }).setFooter({ text: "บันทึกการลงทะเบียนแล้ว พิมพ์ /register เพื่ออัปเดตข้อมูลได้ตลอดเวลา" })
    ],
  });
}

module.exports = { handleModalSubmit };
