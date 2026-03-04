const XLSX = require("xlsx");
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

function buildExportRows(entries, options = {}) {
  const pathLabelByValue = Object.fromEntries(
    PATH_OPTIONS.map((option) => [option.value, option.label])
  );
  const displayNameByUserId = options.displayNameByUserId || {};

  const header = [
    "Discord name",
    "IGN",
    "Path/class",
    "สถานะ",
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
      entry.isReserve ? "สำรอง" : "ลงชื่อ",
      dayChoiceLabel(entry.dayChoice)
    ];
  });

  return [header, ...rows];
}

function columnIndexToExcelLabel(index) {
  let value = index;
  let label = "";
  while (value > 0) {
    const remainder = (value - 1) % 26;
    label = String.fromCharCode(65 + remainder) + label;
    value = Math.floor((value - 1) / 26);
  }
  return label;
}

function sanitizeWorksheetName(text) {
  const safe = String(text || "Roster")
    .replace(/[\\/*?:[\]]/g, " ")
    .trim();
  const truncated = safe.slice(0, 31).trim();
  return truncated || "Roster";
}

function buildRosterCsvBuffer(rosterTitle, entries, options = {}) {
  const allRows = buildExportRows(entries, options);
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

function buildRosterExcelBuffer(rosterTitle, entries, options = {}) {
  const allRows = buildExportRows(entries, options);
  const worksheet = XLSX.utils.aoa_to_sheet(allRows);
  const totalColumns = allRows[0]?.length || 1;
  const totalRows = Math.max(allRows.length, 1);
  const lastCellRef = `${columnIndexToExcelLabel(totalColumns)}${totalRows}`;
  worksheet["!autofilter"] = { ref: `A1:${lastCellRef}` };
  worksheet["!cols"] = [
    { wch: 28 },
    { wch: 24 },
    { wch: 18 },
    { wch: 12 },
    { wch: 18 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    sanitizeWorksheetName(rosterTitle)
  );

  const fileBase = slugifyFilename(rosterTitle);
  const buffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
    compression: true
  });

  return {
    buffer,
    fileName: `${fileBase}.xlsx`
  };
}

module.exports = {
  buildRosterCsvBuffer,
  buildRosterExcelBuffer
};
