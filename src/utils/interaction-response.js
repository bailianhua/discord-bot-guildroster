const { MessageFlags } = require("discord.js");

function normalizePayload(payloadOrContent) {
  if (typeof payloadOrContent === "string") {
    return { content: payloadOrContent };
  }
  return payloadOrContent || {};
}

function withEphemeralFlag(flags) {
  if (typeof flags !== "number") {
    return MessageFlags.Ephemeral;
  }
  return flags | MessageFlags.Ephemeral;
}

async function replyEphemeral(interaction, payloadOrContent) {
  const payload = normalizePayload(payloadOrContent);
  return interaction.reply({
    ...payload,
    flags: withEphemeralFlag(payload.flags)
  });
}

module.exports = {
  replyEphemeral
};
