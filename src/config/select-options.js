const DEFAULT_PATH_OPTIONS = [
  {
    label: "Bellstrike (ระฆังพิฆาต)",
    value: "Bellstrike",
    description: "ดาเมจระยะประชิดแถวหน้า เน้นความคล่องตัวหรือดาเมจเลือดไหล"
  },
  {
    label: "Silkbind (Jade) (พันไหมหยก)",
    value: "Silkbind_Jade",
    description: "ดาเมจปราณระยะไกล เน้นการควบคุมศัตรูและคอมโบกลางอากาศ"
  },
  {
    label: "Bamboocut (ไผ่ปลิดชีพ)",
    value: "Bamboocut",
    description: "ดาเมจระเบิดพลังรวดเร็ว ความคล่องตัวสูง และเข้าประชิดไว"
  },
  {
    label: "Silkbind (Deluge) (พันไหมวารี)",
    value: "Silkbind_Deluge",
    description: "ฮีลเลอร์หลักและซัพพอร์ตทีม สามารถชุบชีวิตและฮีลหมู่"
  },
  {
    label: "Stonesplit (ศิลาแยก)",
    value: "Stonesplit",
    description: "สายแทงค์ผู้พิทักษ์ เชี่ยวชาญด้านโล่ การลดดาเมจ และยั่วยุศัตรู"
  }
];

const DEFAULT_WEAPON_OPTIONS = [
  {
    label: "Nameless Sword (กระบี่ไร้นาม)",
    value: "NamelessSword",
    description: "อาวุธระยะประชิดที่สมดุล เน้นดาเมจต่อเนื่องและเคลื่อนที่ไว"
  },
  {
    label: "Strategic Sword (กระบี่กลยุทธ์)",
    value: "StrategicSword",
    description: "อาวุธระยะประชิดที่สมดุล เน้นดาเมจต่อเนื่องและเคลื่อนที่ไว"
  },
  {
    label: "Mo Blade (ดาบยักษ์โม่)",
    value: "Mo_Blade",
    description: "ดาบสองมือขนาดใหญ่ ระยะกว้าง สำหรับสายแทงค์และป้องกัน"
  },
  {
    label: "Umbrella (ร่ม)",
    value: "Umbrella",
    description: "อาวุธระยะกลาง-ไกล สำหรับสร้างป้อมยิงหรือช่วยทีม"
  },
  {
    label: "Dual Blades (ดาบคู่)",
    value: "Dual_Blades",
    description: "โจมตีระยะประชิดรวดเร็วและต่อเนื่อง พร้อมดาเมจเบิร์สสูง"
  },
  {
    label: "Fan (พัด)",
    value: "Fan",
    description: "เครื่องขยายปราณระยะไกล สำหรับสายฮีลหรือคอมโบยกศัตรู"
  },
  {
    label: "Rope Dart (มีดบินปลายเชือก)",
    value: "Rope_Dart",
    description: "เน้นคุมระยะ จับตัวยาก และโจมตีจากมุมที่คาดไม่ถึง"
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
const WEAPON_OPTIONS = parseOptionsFromEnv("WEAPON_OPTIONS_JSON", DEFAULT_WEAPON_OPTIONS);
const TEAM_OPTIONS = parseOptionsFromEnv("TEAM_OPTIONS_JSON", DEFAULT_TEAM_OPTIONS);

module.exports = {
  PATH_OPTIONS,
  WEAPON_OPTIONS,
  TEAM_OPTIONS
};
