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
      rosters: {},
      rosterListViews: {},
      autoRosterTargets: []
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
    memberDays: {},
    memberTeams: {},
    mirrorMessages: [],
    ...(meta && typeof meta === "object" ? { meta } : {})
  };
  writeStore(store);
  return store.rosters[messageId];
}

function addRosterMirrorMessage(rosterMessageId, channelId, messageId) {
  const store = readStore();
  const roster = store.rosters[rosterMessageId];
  if (!roster) return null;
  if (!channelId || !messageId) return roster;

  if (!Array.isArray(roster.mirrorMessages)) {
    roster.mirrorMessages = [];
  }

  const exists = roster.mirrorMessages.some((ref) => ref.messageId === messageId);
  if (!exists) {
    roster.mirrorMessages.push({
      channelId,
      messageId,
      createdAt: new Date().toISOString()
    });
    writeStore(store);
  }

  return roster;
}

function getRosterMirrorMessages(rosterMessageId) {
  const store = readStore();
  const roster = store.rosters[rosterMessageId];
  if (!roster) return [];
  if (!Array.isArray(roster.mirrorMessages)) return [];
  return roster.mirrorMessages;
}

function removeRosterMirrorMessage(rosterMessageId, messageId) {
  const store = readStore();
  const roster = store.rosters[rosterMessageId];
  if (!roster || !Array.isArray(roster.mirrorMessages)) return false;

  const before = roster.mirrorMessages.length;
  roster.mirrorMessages = roster.mirrorMessages.filter((ref) => ref.messageId !== messageId);
  const changed = roster.mirrorMessages.length !== before;
  if (changed) {
    writeStore(store);
  }
  return changed;
}

function setRosterListViewMessage(guildId, channelId, messageId) {
  const store = readStore();
  if (!store.rosterListViews || typeof store.rosterListViews !== "object") {
    store.rosterListViews = {};
  }

  store.rosterListViews[guildId] = {
    guildId,
    channelId,
    messageId,
    updatedAt: new Date().toISOString()
  };
  writeStore(store);
  return store.rosterListViews[guildId];
}

function getRosterListViewMessage(guildId) {
  const store = readStore();
  return store.rosterListViews?.[guildId] || null;
}

function clearRosterListViewMessage(guildId) {
  const store = readStore();
  if (!store.rosterListViews || !store.rosterListViews[guildId]) {
    return false;
  }
  delete store.rosterListViews[guildId];
  writeStore(store);
  return true;
}

function normalizeAutoRosterTargets(store) {
  const raw = store.autoRosterTargets;
  const values = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object"
      ? Object.values(raw)
      : [];

  const seen = new Set();
  const normalized = [];
  for (const item of values) {
    const guildId = String(item?.guildId || "").trim();
    const channelId = String(item?.channelId || "").trim();
    if (!guildId || !channelId) continue;

    const key = `${guildId}:${channelId}`;
    if (seen.has(key)) continue;
    seen.add(key);

    normalized.push({
      guildId,
      channelId,
      updatedAt: item?.updatedAt || new Date().toISOString()
    });
  }
  return normalized;
}

function setAutoRosterTarget(guildId, channelId) {
  const normalizedGuildId = String(guildId || "").trim();
  const normalizedChannelId = String(channelId || "").trim();
  if (!normalizedGuildId || !normalizedChannelId) return null;

  const store = readStore();
  const targets = normalizeAutoRosterTargets(store);
  const idx = targets.findIndex(
    (target) =>
      target.guildId === normalizedGuildId &&
      target.channelId === normalizedChannelId
  );

  const next = {
    guildId: normalizedGuildId,
    channelId: normalizedChannelId,
    updatedAt: new Date().toISOString()
  };

  if (idx >= 0) {
    targets[idx] = next;
  } else {
    targets.push(next);
  }

  store.autoRosterTargets = targets;
  writeStore(store);
  return next;
}

function getAutoRosterTargets() {
  const store = readStore();
  return normalizeAutoRosterTargets(store).sort(
    (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
  );
}

function getAutoRosterTarget(guildId) {
  if (!guildId) return null;
  const targets = getAutoRosterTargets().filter((target) => target.guildId === guildId);
  return targets[0] || null;
}

function getLatestAutoRosterTarget() {
  const targets = getAutoRosterTargets();
  return targets[0] || null;
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
      const inDays = Boolean(r.memberDays?.[userId]);
      const inTeams = Boolean(r.memberTeams?.[userId]);
      return r.guildId === guildId && (inMembers || inDays || inTeams);
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);
}

function addMemberToRoster(messageId, userId, dayChoice = null) {
  const store = readStore();
  const roster = store.rosters[messageId];
  if (!roster) return null;

  if (!roster.memberDays) {
    roster.memberDays = {};
  }

  if (!roster.memberTeams) {
    roster.memberTeams = {};
  }

  let changed = false;
  if (!roster.memberIds.includes(userId)) {
    roster.memberIds.push(userId);
    changed = true;
  }

  if (dayChoice && roster.memberDays[userId] !== dayChoice) {
    roster.memberDays[userId] = dayChoice;
    changed = true;
  }

  if (changed) {
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

  if (!roster.memberDays) {
    roster.memberDays = {};
  }

  const beforeCount = roster.memberIds.length;
  roster.memberIds = roster.memberIds.filter((id) => id !== userId);
  const removedFromMemberList = roster.memberIds.length !== beforeCount;

  const hadTeam = Object.prototype.hasOwnProperty.call(roster.memberTeams, userId);
  if (hadTeam) {
    delete roster.memberTeams[userId];
  }

  const hadDay = Object.prototype.hasOwnProperty.call(roster.memberDays, userId);
  if (hadDay) {
    delete roster.memberDays[userId];
  }

  const changed = removedFromMemberList || hadTeam || hadDay;
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

  if (!roster.memberDays) {
    roster.memberDays = {};
  }

  const membersByGuild = store.members[roster.guildId] || {};
  const entries = roster.memberIds.map((userId) => ({
    userId,
    profile: membersByGuild[userId] || null,
    dayChoice: roster.memberDays[userId] || null,
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
  addRosterMirrorMessage,
  clearRosterListViewMessage,
  createRoster,
  deleteRoster,
  getAutoRosterTarget,
  getAutoRosterTargets,
  getAllRostersInGuild,
  getLatestAutoRosterTarget,
  getLatestRosterInChannel,
  getRosterListViewMessage,
  getRosterMirrorMessages,
  getRecentRostersInGuild,
  getRecentRostersInChannel,
  getUserRostersInGuild,
  getMemberInfo,
  getRoster,
  getRosterEntries,
  removeRosterMirrorMessage,
  removeMemberFromRoster,
  setAutoRosterTarget,
  setRosterListViewMessage,
  setMemberTeamInRoster,
  setMemberInfo
};
