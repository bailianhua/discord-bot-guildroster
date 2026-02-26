const { PermissionFlagsBits } = require("discord.js");

function hasManageGuildAccess(interaction) {
  return Boolean(
    interaction?.memberPermissions &&
      interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)
  );
}

module.exports = {
  hasManageGuildAccess
};
