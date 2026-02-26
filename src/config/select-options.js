const DEFAULT_PATH_OPTIONS = [
  {
    label: "Tank",
    value: "Tank (Stonesplit - Might)",
    description: "รวบกลุ่มศัตรู, CC"
  },
  {
    label: "Healer",
    value: "Healer (Silkbind - Deluge)",
    description: "เติมเลือด , mythic skill เกราะ"
  },
  {
    label: "Nameless",
    value: "DPS - Nameless (Bellstrike - Splendor)",
    description: "ดาเมจกลุ่ม , ultimate เกราะ"
  },
  {
    label: "Strategic sword",
    value: "DPS - Strategic sword (Bellstrike - Umbra)",
    description: "burst damage"
  },
  {
    label: "ร่ม DPS",
    value: "DPS - ร่ม (Silkbind - Jade)",
    description: "กางโล่ลม"
  },
  {
    label: "ดาบคู่",
    value: "DPS - ดาบคู่ (Bamboocut - Wind)",
    description: "เล็งแนวหลัง / healer ฝั่งตรงข้าม"
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

const PATH_OPTIONS = parseOptionsFromEnv("PATH_OPTIONS_JSON", DEFAULT_PATH_OPTIONS);
const TEAM_OPTIONS = parseOptionsFromEnv("TEAM_OPTIONS_JSON", DEFAULT_TEAM_OPTIONS);

module.exports = {
  PATH_OPTIONS,
  TEAM_OPTIONS
};
