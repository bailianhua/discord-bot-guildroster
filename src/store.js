const fs = require("node:fs");
const path = require("node:path");

const dataDir = path.join(process.cwd(), "data");
const dataFile = path.join(dataDir, "store.json");

function ensureStore() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(dataFile)) {
    const base = {
      members: {},
      rosters: {}
    };
    fs.writeFileSync(dataFile, JSON.stringify(base, null, 2), "utf8");
  }
}

function readStore() {
  ensureStore();
  const raw = fs.readFileSync(dataFile, "utf8");
  return JSON.parse(raw);
}

function writeStore(store) {
  ensureStore();
  fs.writeFileSync(dataFile, JSON.stringify(store, null, 2), "utf8");
}

function setMemberInfo(guildId, userId, profile) {
  const store = readStore();
  if (!store.members[guildId]) {
    store.members[guildId] = {};
  }

  store.members[guildId][userId] = {
    ...profile,
    updatedAt: new Date().toISOString()
  };
  writeStore(store);
  return store.members[guildId][userId];
}

function getMemberInfo(guildId, userId) {
  const store = readStore();
  return store.members[guildId]?.[userId] || null;
}

function createRoster({ messageId, guildId, channelId, title, createdBy, meta = null }) {
  const store = readStore();
  store.rosters[messageId] = {
    messageId,
    guildId,
    channelId,
    title,
    createdBy,
    createdAt: new Date().toISOString(),
    memberIds: [],
    memberTeams: {},
    ...(meta && typeof meta === "object" ? { meta } : {})
  };
  writeStore(store);
  return store.rosters[messageId];
}

function getRoster(messageId) {
  const store = readStore();
  return store.rosters[messageId] || null;
}

function getLatestRosterInChannel(guildId, channelId) {
  const store = readStore();
  const rosters = Object.values(store.rosters)
    .filter((r) => r.guildId === guildId && r.channelId === channelId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return rosters[0] || null;
}

function getRecentRostersInChannel(guildId, channelId, limit = 25) {
  const store = readStore();
  return Object.values(store.rosters)
    .filter((r) => r.guildId === guildId && r.channelId === channelId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);
}

function getRecentRostersInGuild(guildId, limit = 25) {
  const store = readStore();
  return Object.values(store.rosters)
    .filter((r) => r.guildId === guildId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);
}

function getAllRostersInGuild(guildId) {
  const store = readStore();
  return Object.values(store.rosters)
    .filter((r) => r.guildId === guildId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function getUserRostersInGuild(guildId, userId, limit = 25) {
  const store = readStore();
  return Object.values(store.rosters)
    .filter((r) => {
      const inMembers = Array.isArray(r.memberIds) && r.memberIds.includes(userId);
      const inTeams = Boolean(r.memberTeams?.[userId]);
      return r.guildId === guildId && (inMembers || inTeams);
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);
}

function addMemberToRoster(messageId, userId) {
  const store = readStore();
  const roster = store.rosters[messageId];
  if (!roster) return null;

  if (!roster.memberTeams) {
    roster.memberTeams = {};
  }

  if (!roster.memberIds.includes(userId)) {
    roster.memberIds.push(userId);
    writeStore(store);
  }
  return roster;
}

function removeMemberFromRoster(messageId, userId) {
  const store = readStore();
  const roster = store.rosters[messageId];
  if (!roster) return null;

  if (!Array.isArray(roster.memberIds)) {
    roster.memberIds = [];
  }

  if (!roster.memberTeams) {
    roster.memberTeams = {};
  }

  const beforeCount = roster.memberIds.length;
  roster.memberIds = roster.memberIds.filter((id) => id !== userId);
  const removedFromMemberList = roster.memberIds.length !== beforeCount;

  const hadTeam = Object.prototype.hasOwnProperty.call(roster.memberTeams, userId);
  if (hadTeam) {
    delete roster.memberTeams[userId];
  }

  const changed = removedFromMemberList || hadTeam;
  if (changed) {
    writeStore(store);
  }

  return {
    roster,
    removed: changed
  };
}

function setMemberTeamInRoster(messageId, userId, team) {
  const store = readStore();
  const roster = store.rosters[messageId];
  if (!roster) return null;

  if (!roster.memberTeams) {
    roster.memberTeams = {};
  }

  roster.memberTeams[userId] = team;
  writeStore(store);
  return roster;
}

function getRosterEntries(messageId) {
  const store = readStore();
  const roster = store.rosters[messageId];
  if (!roster) return null;

  if (!roster.memberTeams) {
    roster.memberTeams = {};
  }

  const membersByGuild = store.members[roster.guildId] || {};
  const entries = roster.memberIds.map((userId) => ({
    userId,
    profile: membersByGuild[userId] || null,
    team: roster.memberTeams[userId] || null
  }));

  return {
    roster,
    entries
  };
}

function deleteRoster(messageId) {
  const store = readStore();
  const roster = store.rosters[messageId];
  if (!roster) return null;

  delete store.rosters[messageId];
  writeStore(store);
  return roster;
}

module.exports = {
  addMemberToRoster,
  createRoster,
  deleteRoster,
  getAllRostersInGuild,
  getLatestRosterInChannel,
  getRecentRostersInGuild,
  getRecentRostersInChannel,
  getUserRostersInGuild,
  getMemberInfo,
  getRoster,
  getRosterEntries,
  removeMemberFromRoster,
  setMemberTeamInRoster,
  setMemberInfo
};
