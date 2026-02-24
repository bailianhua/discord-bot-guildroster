const { REST, Routes } = require("discord.js");
const { commands } = require("../commands");

async function deployCommands({ token, clientId, guildId }) {
  const rest = new REST({ version: "10" }).setToken(token);

  if (guildId) {
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
      body: commands
    });
    console.log(`Registered commands in guild ${guildId}.`);
    return;
  }

  await rest.put(Routes.applicationCommands(clientId), { body: commands });
  console.log("Registered global commands.");
}

module.exports = { deployCommands };
