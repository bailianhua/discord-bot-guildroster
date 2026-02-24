const { PermissionFlagsBits } = require("discord.js");

function getMissingPostPerms(channel, botUserId, { needsEmbed = true } = {}) {
  const requiredBotPerms = [
    { bit: PermissionFlagsBits.ViewChannel, name: "ดูช่องข้อความ (View Channel)" }
  ];

  if (needsEmbed) {
    requiredBotPerms.push({
      bit: PermissionFlagsBits.EmbedLinks,
      name: "แนบลิงก์/เอ็มเบด (Embed Links)"
    });
  }

  if (channel?.isThread?.()) {
    requiredBotPerms.push({
      bit: PermissionFlagsBits.SendMessagesInThreads,
      name: "ส่งข้อความในเธรด (Send Messages in Threads)"
    });
  } else {
    requiredBotPerms.push({
      bit: PermissionFlagsBits.SendMessages,
      name: "ส่งข้อความ (Send Messages)"
    });
  }

  const botPerms = channel?.permissionsFor(botUserId);
  return requiredBotPerms
    .filter((perm) => !botPerms?.has(perm.bit))
    .map((perm) => perm.name);
}

module.exports = { getMissingPostPerms };
