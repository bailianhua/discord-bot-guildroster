require("dotenv").config();

const { Client, GatewayIntentBits } = require("discord.js");
const { deployCommands } = require("./services/deploy-commands");
const { handleInteractionCreate } = require("./interactions");
const { startWeeklyRosterScheduler } = require("./services/weekly-roster-scheduler");

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DISCORD_GUILD_ID;

if (!token || !clientId) {
  console.error("Missing DISCORD_TOKEN or DISCORD_CLIENT_ID in environment.");
  process.exit(1);
}

function logError(scope, error) {
  console.error(`[${scope}]`, error);
}

function safeRun(scope, work) {
  try {
    const result = work();
    if (result && typeof result.then === "function") {
      result.catch((error) => logError(scope, error));
    }
  } catch (error) {
    logError(scope, error);
  }
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
  allowedMentions: {
    parse: [],
    repliedUser: false
  }
});

client.once("clientReady", () => {
  safeRun("clientReady", () => {
    console.log(`Bot ready as ${client.user.tag}`);
    startWeeklyRosterScheduler(client);
  });
});

client.on("interactionCreate", (interaction) => {
  safeRun("interaction", () => handleInteractionCreate(interaction, { client }));
});

client.on("error", (error) => {
  logError("discord-client", error);
});

client.on("shardError", (error) => {
  logError("discord-shard", error);
});

client.on("warn", (warning) => {
  console.warn(`[discord-warn] ${warning}`);
});

async function startBot() {
  try {
    await deployCommands({ token, clientId, guildId });
  } catch (error) {
    logError("startup:deploy-commands", error);
    console.log("[startup] continuing with existing deployed commands");
  }

  try {
    await client.login(token);
  } catch (error) {
    logError("startup:login", error);
    console.log("[startup] login failed; retrying in 30 seconds");
    setTimeout(() => {
      safeRun("startup:retry", startBot);
    }, 30_000);
  }
}

safeRun("startup", startBot);

process.on("unhandledRejection", (reason) => {
  logError("process:unhandledRejection", reason);
});

process.on("uncaughtException", (error) => {
  logError("process:uncaughtException", error);
});

process.on("multipleResolves", (type, promise, value) => {
  console.warn(`[process:multipleResolves] type=${type}`);
  if (promise) {
    console.warn("[process:multipleResolves] promise:", promise);
  }
  if (value !== undefined) {
    console.warn("[process:multipleResolves] value:", value);
  }
});

process.on("warning", (warning) => {
  console.warn("[process:warning]", warning);
});

client.on("invalidated", () => {
  console.error("[discord-client] session invalidated");
  setTimeout(() => {
    safeRun("startup:invalidated-retry", async () => {
      if (!client.isReady()) {
        await client.login(token);
      }
    });
  }, 5_000);
});

process.on("SIGINT", () => {
  safeRun("shutdown:SIGINT", async () => {
    await client.destroy();
    process.exit(0);
  });
});

process.on("SIGTERM", () => {
  safeRun("shutdown:SIGTERM", async () => {
    await client.destroy();
    process.exit(0);
  });
});
