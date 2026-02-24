require("dotenv").config();

const { Client, GatewayIntentBits } = require("discord.js");
const { deployCommands } = require("./services/deploy-commands");
const { handleInteractionCreate } = require("./interactions");

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DISCORD_GUILD_ID;

if (!token || !clientId) {
  console.error("Missing DISCORD_TOKEN or DISCORD_CLIENT_ID in environment.");
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
  allowedMentions: {
    parse: [],
    repliedUser: false
  }
});

client.once("clientReady", () => {
  console.log(`Bot ready as ${client.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
  await handleInteractionCreate(interaction, { client });
});

(async () => {
  await deployCommands({ token, clientId, guildId });
  await client.login(token);
})();
