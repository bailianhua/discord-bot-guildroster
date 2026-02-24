const { deleteRoster, getRosterEntries } = require("../store");
const { buildRosterEmbed } = require("../ui/builders");

async function syncRosterMessage(guild, rosterMessageId, title) {
  if (!guild?.channels) return;

  const data = getRosterEntries(rosterMessageId);
  if (!data) return;

  const channel = await guild.channels.fetch(data.roster.channelId).catch(() => null);
  if (!channel || !channel.isTextBased()) return;

  const message = await channel.messages.fetch(rosterMessageId).catch(() => null);
  if (!message) return;

  const embed = buildRosterEmbed(title || data.roster.title, data.entries);
  await message.edit({ embeds: [embed] }).catch(() => null);
}

async function deleteRosterWithMessage(guild, targetRoster) {
  let deletedMessage = false;
  let deleteMessageError = false;
  const channel = await guild.channels.fetch(targetRoster.channelId).catch(() => null);
  if (channel && channel.isTextBased()) {
    const message = await channel.messages.fetch(targetRoster.messageId).catch(() => null);
    if (message) {
      try {
        await message.delete();
        deletedMessage = true;
      } catch {
        deleteMessageError = true;
      }
    }
  }

  deleteRoster(targetRoster.messageId);

  if (deletedMessage) {
    return "\nลบโพสต์กิจกรรมในแชนแนลแล้ว";
  }
  if (deleteMessageError) {
    return "\nลบข้อมูลกิจกรรมในระบบแล้ว แต่ลบโพสต์ไม่สำเร็จ (อาจไม่มีสิทธิ์)";
  }
  return "\nลบข้อมูลกิจกรรมในระบบแล้ว (ไม่พบโพสต์เดิมในแชนแนล)";
}

module.exports = {
  deleteRosterWithMessage,
  syncRosterMessage
};
