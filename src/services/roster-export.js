const { PATH_OPTIONS } = require("../config/select-options");
const { dayChoiceLabel } = require("../utils/day-choice");

function csvEscape(value) {
  const raw = String(value ?? "");
  if (!/[",\n]/.test(raw)) {
    return raw;
  }
  return `"${raw.replace(/"/g, "\"\"")}"`;
}

function slugifyFilename(text) {
  const raw = String(text || "roster").trim();
  const safe = raw
    // Remove characters that are invalid in common filesystems.
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/\.+$/g, "")
    .trim();
  return safe || "roster";
}

function buildRosterCsvBuffer(rosterTitle, entries, options = {}) {
  const pathLabelByValue = Object.fromEntries(
    PATH_OPTIONS.map((option) => [option.value, option.label])
  );
  const displayNameByUserId = options.displayNameByUserId || {};

  const header = [
    "Discord name",
    "IGN",
    "Path/class",
    "วันที่เข้าร่วม"
  ];

  const rows = entries.map((entry) => {
    const profilePath = entry.profile?.path || entry.profile?.class || "-";
    const discordName =
      displayNameByUserId[entry.userId] ||
      entry.profile?.ign ||
      entry.userId;
    return [
      discordName,
      entry.profile?.ign || "-",
      pathLabelByValue[profilePath] || profilePath,
      dayChoiceLabel(entry.dayChoice)
    ];
  });

  const allRows = [header, ...rows];
  const csvBody = allRows
    .map((row) => row.map((value) => csvEscape(value)).join(","))
    .join("\n");

  // UTF-8 BOM helps Excel render Thai text correctly.
  const csvWithBom = `\uFEFF${csvBody}`;
  const fileBase = slugifyFilename(rosterTitle);

  return {
    buffer: Buffer.from(csvWithBom, "utf8"),
    fileName: `${fileBase}.csv`
  };
}

module.exports = { buildRosterCsvBuffer };
