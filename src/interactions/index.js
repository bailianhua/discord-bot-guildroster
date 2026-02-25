const { MessageFlags } = require("discord.js");
const { handleButton } = require("./button");
const { handleChatInput } = require("./chat-input");
const { handleModalSubmit } = require("./modal-submit");
const { handleSelectMenu } = require("./select-menu");

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
      await interaction.reply({
        content: "เกิดข้อผิดพลาดในการประมวลผลคำสั่งนี้",
        flags: MessageFlags.Ephemeral
      });
    }
  }
}

module.exports = { handleInteractionCreate };
