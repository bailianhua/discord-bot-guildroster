const DEFAULT_ROLE_OPTIONS = [
  {
    label: "Tank",
    value: "tank",
    description: "แนวหน้า"
  },
  {
    label: "Healer",
    value: "healer",
    description: "ฟื้นฟูและซัพพอร์ต"
  },
  {
    label: "DPS",
    value: "dps",
    description: "ทำดาเมจหลัก"
  }
];

const DEFAULT_WEAPON_OPTIONS = [
  {
    label: "Stonesplit - Might",
    value: "Stonesplit - Might",
    description: "สาย Tank"
  },
  {
    label: "Silkbind - Deluge",
    value: "Silkbind - Deluge",
    description: "สาย Healer"
  },
  {
    label: "Bellstrike - Splendor",
    value: "Bellstrike - Splendor",
    description: "สาย DPS (Nameless)"
  },
  {
    label: "Bellstrike - Umbra",
    value: "Bellstrike - Umbra",
    description: "สาย DPS (Strategic sword)"
  },
  {
    label: "Silkbind - Jade",
    value: "Silkbind - Jade",
    description: "สาย DPS (ร่ม)"
  },
  {
    label: "Bamboocut - Wind",
    value: "Bamboocut - Wind",
    description: "สาย DPS (ดาบคู่)"
  }
];

const DEFAULT_TEAM_OPTIONS = [
  {
    label: "Attack Team",
    value: "attack",
    description: "กำหนดเป็นทีมโจมตี"
  },
  {
    label: "Defense Team",
    value: "defense",
    description: "กำหนดเป็นทีมป้องกัน"
  }
];

function sanitizeOption(raw, idx, envName) {
  const label = String(raw?.label || "").trim();
  const value = String(raw?.value || "").trim();
  const description = String(raw?.description || "").trim();

  if (!label || !value) {
    throw new Error(
      `${envName}[${idx}] must contain non-empty string fields: label, value`
    );
  }

  return {
    label: label.slice(0, 100),
    value: value.slice(0, 100),
    ...(description ? { description: description.slice(0, 100) } : {})
  };
}

function parseOptionsFromEnv(envName, fallback) {
  const raw = process.env[envName];
  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error("must be a non-empty JSON array");
    }

    const options = parsed.map((option, idx) => sanitizeOption(option, idx, envName));
    if (options.length > 25) {
      console.warn(`[config] ${envName} has more than 25 items; using first 25.`);
      return options.slice(0, 25);
    }
    return options;
  } catch (error) {
    console.warn(`[config] Failed to parse ${envName}; using defaults. ${error.message}`);
    return fallback;
  }
}

const ROLE_OPTIONS = parseOptionsFromEnv("ROLE_OPTIONS_JSON", DEFAULT_ROLE_OPTIONS);
const WEAPON_OPTIONS = parseOptionsFromEnv(
  "WEAPON_OPTIONS_JSON",
  parseOptionsFromEnv("PATH_OPTIONS_JSON", DEFAULT_WEAPON_OPTIONS)
);
const TEAM_OPTIONS = parseOptionsFromEnv("TEAM_OPTIONS_JSON", DEFAULT_TEAM_OPTIONS);

module.exports = {
  ROLE_OPTIONS,
  WEAPON_OPTIONS,
  PATH_OPTIONS: WEAPON_OPTIONS,
  TEAM_OPTIONS
};
