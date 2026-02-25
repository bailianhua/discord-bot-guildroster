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

async function handleModalSubmit(interaction) {
  if (!interaction.guildId) {
    await interaction.reply({
      content: "กรุณาใช้ระบบนี้ในเซิร์ฟเวอร์",
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  if (interaction.customId === "start_roster_modal") {
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

    const missingPerms = getMissingPostPerms(interaction.channel, interaction.client.user.id);
    if (missingPerms.length > 0) {
      await interaction.reply({
        content: `ไม่สามารถสร้างกิจกรรมได้เนื่องจากขาดสิทธิ์: ${missingPerms.join(
          ", "
        )}`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const titleInput = interaction.fields.getTextInputValue("start_roster_title").trim();
    const title = titleInput || "ลงชื่อสมาชิกกิลด์";
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

  if (interaction.customId === "setteam_modal" || interaction.customId.startsWith("setteam_modal:")) {
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

    const selectedUsers = interaction.fields.getSelectedUsers(
      "setteam_member_value",
      true
    );
    const members = [...selectedUsers.values()];
    if (members.length === 0) {
      await interaction.reply({
        content: "ไม่พบสมาชิกที่เลือก กรุณาลองใหม่",
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    const team = interaction.fields.getStringSelectValues("setteam_team_value")[0];
    const lockedRosterId = interaction.customId.startsWith("setteam_modal:")
      ? interaction.customId.split(":")[1]
      : null;
    const targetRosterId = lockedRosterId;
    if (!targetRosterId) {
      await interaction.reply({
        content: "ไม่พบกิจกรรมที่ต้องการตั้งทีม กรุณาเปิดผ่าน /setteam หรือปุ่มตั้งทีมในกิจกรรม",
        flags: MessageFlags.Ephemeral
      });
      return;
    }
    const targetRoster = getRoster(targetRosterId);

    if (!targetRoster) {
      await interaction.reply({
        content: "ไม่พบกิจกรรมที่เลือก อาจถูกลบไปแล้ว กรุณาลองใหม่",
        flags: MessageFlags.Ephemeral
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
      await interaction.reply({
        content: lines.join("\n"),
        flags: MessageFlags.Ephemeral
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

    await interaction.reply({
      content: summaryLines.join("\n"),
      embeds: [embed],
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  if (interaction.customId !== "register_profile") return;

  const ign = interaction.fields.getTextInputValue("register_ign_value").trim();
  const playerPath = interaction.fields.getStringSelectValues("register_path_value")[0];
  const weapon = interaction.fields.getStringSelectValues("register_weapon_value")[0];

  setMemberInfo(interaction.guildId, interaction.user.id, {
    ign,
    class: playerPath,
    path: playerPath,
    weapon
  });

  await interaction.reply({
    embeds: [
      buildRegistrationEmbed({
        ign,
        playerPath,
        weapon
      }).setFooter({ text: "บันทึกการลงทะเบียนแล้ว พิมพ์ /register เพื่ออัปเดตข้อมูลได้ตลอดเวลา" })
    ],
    flags: MessageFlags.Ephemeral
  });
}

module.exports = { handleModalSubmit };
