const { PATH_OPTIONS, WEAPON_OPTIONS } = require("../config/select-options");

function csvEscape(value) {
  const raw = String(value ?? "");
  if (!/[",\n]/.test(raw)) {
    return raw;
  }
  return `"${raw.replace(/"/g, "\"\"")}"`;
}

function slugifyFilename(text) {
  const normalized = String(text || "roster")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
  const safe = normalized
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  return safe || "roster";
}

function teamLabel(team) {
  if (team === "attack") return "Attack";
  if (team === "defense") return "Defense";
  return "Unassigned";
}

function buildRosterCsvBuffer(rosterTitle, entries) {
  const pathLabelByValue = Object.fromEntries(
    PATH_OPTIONS.map((option) => [option.value, option.label])
  );
  const weaponLabelByValue = Object.fromEntries(
    WEAPON_OPTIONS.map((option) => [option.value, option.label])
  );

  const header = [
    "No",
    "User ID",
    "Mention",
    "IGN",
    "Path",
    "Weapon",
    "Team"
  ];

  const rows = entries.map((entry, idx) => {
    const profilePath = entry.profile?.path || entry.profile?.class || "-";
    const profileWeapon = entry.profile?.weapon || "-";
    return [
      idx + 1,
      entry.userId,
      `<@${entry.userId}>`,
      entry.profile?.ign || "-",
      pathLabelByValue[profilePath] || profilePath,
      weaponLabelByValue[profileWeapon] || profileWeapon,
      teamLabel(entry.team)
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
