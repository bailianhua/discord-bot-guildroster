const {
  clearRosterListViewMessage,
  deleteRoster,
  getRecentRostersInGuild,
  getRosterEntries,
  getRosterListViewMessage,
  getRosterMirrorMessages,
  removeRosterMirrorMessage
} = require("../store");
const {
  buildRosterComponentsV2,
  buildRosterEmbed,
  buildRosterListComponentsV2
} = require("../ui/builders");

async function fetchTextMessage(guild, channelId, messageId) {
  const channel = await guild.channels.fetch(channelId).catch(() => null);
  if (!channel || !channel.isTextBased()) return null;
  const message = await channel.messages.fetch(messageId).catch(() => null);
  return message || null;
}

async function syncRosterMirrorMessages(guild, roster, title, entries) {
  const mirrors = getRosterMirrorMessages(roster.messageId);
  if (!Array.isArray(mirrors) || mirrors.length === 0) return;

  const components = buildRosterComponentsV2(
    title || roster.title,
    entries,
    roster.messageId,
    { roster }
  );

  for (const ref of mirrors) {
    if (!ref?.messageId || ref.messageId === roster.messageId) continue;

    const message = await fetchTextMessage(guild, ref.channelId, ref.messageId);
    if (!message) {
      removeRosterMirrorMessage(roster.messageId, ref.messageId);
      continue;
    }

    await message
      .edit({
        content: null,
        embeds: [],
        components
      })
      .catch(() => null);
  }
}

async function syncRosterListViewMessage(guild) {
  const listView = getRosterListViewMessage(guild.id);
  if (!listView?.channelId || !listView?.messageId) return;

  const message = await fetchTextMessage(guild, listView.channelId, listView.messageId);
  if (!message) {
    clearRosterListViewMessage(guild.id);
    return;
  }

  const rosters = getRecentRostersInGuild(guild.id, 25);
  if (rosters.length === 0) {
    await message
      .edit({
        content: "ยังไม่มีกิจกรรมที่ถูกสร้างในเซิร์ฟเวอร์นี้",
        embeds: [],
        components: []
      })
      .catch(() => null);
    return;
  }

  await message
    .edit({
      content: null,
      embeds: [],
      components: buildRosterListComponentsV2(rosters)
    })
    .catch(() => null);
}

async function syncRosterMessage(guild, rosterMessageId, title) {
  if (!guild?.channels) return;

  const data = getRosterEntries(rosterMessageId);
  if (!data) return;

  const message = await fetchTextMessage(guild, data.roster.channelId, rosterMessageId);
  if (message) {
    const embed = buildRosterEmbed(title || data.roster.title, data.entries, {
      roster: data.roster
    });
    await message.edit({ embeds: [embed] }).catch(() => null);
  }

  await syncRosterMirrorMessages(guild, data.roster, title, data.entries);
  await syncRosterListViewMessage(guild);
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
  await syncRosterListViewMessage(guild);

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
