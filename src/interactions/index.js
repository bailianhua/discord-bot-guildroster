const { handleButton } = require("./button");
const { handleChatInput } = require("./chat-input");
const { handleModalSubmit } = require("./modal-submit");
const { handleSelectMenu } = require("./select-menu");
const { replyEphemeral } = require("../utils/interaction-response");

async function handleInteractionCreate(interaction, context) {
  try {
    if (interaction.isChatInputCommand()) {
      await handleChatInput(interaction, context);
      return;
    }

    if (interaction.isStringSelectMenu()) {
      await handleSelectMenu(interaction, context);
      return;
    }

    if (interaction.isModalSubmit()) {
      await handleModalSubmit(interaction, context);
      return;
    }

    if (interaction.isButton()) {
      await handleButton(interaction, context);
    }
  } catch (error) {
    console.error(error);
    if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
      await replyEphemeral(interaction, "เกิดข้อผิดพลาดในการประมวลผลคำสั่งนี้");
    }
  }
}

module.exports = { handleInteractionCreate };
