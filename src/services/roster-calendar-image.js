const {
  buildRosterCalendarData,
  resolveRosterCalendarEventName
} = require("../utils/roster-calendar");

const CARD_WIDTH = 1200;
const MARGIN = 36;
const HEADER_HEIGHT = 104;
const MONTH_HEADER_HEIGHT = 44;
const WEEK_HEADER_HEIGHT = 34;
const CELL_WIDTH = 72;
const CELL_HEIGHT = 56;
const MONTH_GAP = 28;
const CALENDAR_TITLE = "ปฏิทินกิจกรรม LadpraoBros";

function escapeXml(text) {
  return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&apos;");
}

function getMonthGrid(metaMonthKey) {
  const [yearText, monthText] = String(metaMonthKey || "").split("-");
  const year = Number.parseInt(yearText, 10);
  const month = Number.parseInt(monthText, 10);
  if (!Number.isFinite(year) || !Number.isFinite(month)) return null;

  const firstDayDow = new Date(Date.UTC(year, month - 1, 1)).getUTCDay(); // 0=sun
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells = [];
  for (let i = 0; i < firstDayDow; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(day);
  while (cells.length % 7 !== 0) cells.push(null);
  return { year, month, cells };
}

function drawMonthSvg({ monthKey, highlightSet, x, y }) {
  const grid = getMonthGrid(monthKey);
  if (!grid) {
    return { svg: "", height: 0 };
  }

  const monthWidth = CELL_WIDTH * 7;
  const weeks = grid.cells.length / 7;
  const monthHeight =
    MONTH_HEADER_HEIGHT + WEEK_HEADER_HEIGHT + weeks * CELL_HEIGHT + 16;
  const dayLabels = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const pieces = [];

  pieces.push(
    `<rect x="${x}" y="${y}" width="${monthWidth}" height="${monthHeight}" rx="12" fill="#f8fafc" stroke="#d8dee9" />`
  );
  pieces.push(
    `<text x="${x + 18}" y="${y + 29}" fill="#0f172a" font-size="24" font-family="Arial, sans-serif" font-weight="700">${escapeXml(
      monthKey
    )}</text>`
  );

  const headerY = y + MONTH_HEADER_HEIGHT;
  pieces.push(
    `<rect x="${x}" y="${headerY}" width="${monthWidth}" height="${WEEK_HEADER_HEIGHT}" fill="#e2e8f0" />`
  );
  for (let col = 0; col < 7; col += 1) {
    const cellX = x + col * CELL_WIDTH;
    pieces.push(
      `<text x="${cellX + CELL_WIDTH / 2}" y="${headerY + 23}" fill="#334155" font-size="16" font-family="Arial, sans-serif" text-anchor="middle" font-weight="600">${dayLabels[col]}</text>`
    );
  }

  const bodyStartY = headerY + WEEK_HEADER_HEIGHT;
  for (let index = 0; index < grid.cells.length; index += 1) {
    const row = Math.floor(index / 7);
    const col = index % 7;
    const day = grid.cells[index];
    const cellX = x + col * CELL_WIDTH;
    const cellY = bodyStartY + row * CELL_HEIGHT;
    const ymd = day
      ? `${grid.year}-${String(grid.month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      : null;
    const isHighlighted = ymd ? highlightSet.has(ymd) : false;

    pieces.push(
      `<rect x="${cellX}" y="${cellY}" width="${CELL_WIDTH}" height="${CELL_HEIGHT}" fill="${isHighlighted ? "#ffedd5" : "#ffffff"}" stroke="#dbe2ea" />`
    );
    if (day) {
      pieces.push(
        `<text x="${cellX + 12}" y="${cellY + 31}" fill="${isHighlighted ? "#9a3412" : "#0f172a"}" font-size="20" font-family="Arial, sans-serif" font-weight="${isHighlighted ? "700" : "500"}">${day}</text>`
      );
    }
  }

  return {
    svg: pieces.join(""),
    height: monthHeight
  };
}

function buildCalendarSvg(roster, calendarData) {
  const monthBlocks = [];
  let currentY = MARGIN + HEADER_HEIGHT;
  const monthX = MARGIN;
  const highlightSet = new Set(calendarData.eventDates || []);
  const eventItems = (calendarData.eventItems || []).map((item) => ({
    ...item,
    eventName: String(item?.eventName || resolveRosterCalendarEventName(roster)).trim() || "Event"
  }));

  for (const month of calendarData.months) {
    const block = drawMonthSvg({
      monthKey: month.monthKey,
      highlightSet,
      x: monthX,
      y: currentY
    });
    monthBlocks.push(block.svg);
    currentY += block.height + MONTH_GAP;
  }

  const totalHeight = Math.max(currentY + MARGIN - MONTH_GAP, 540);
  const infoX = monthX + CELL_WIDTH * 7 + 34;
  const infoY = MARGIN + HEADER_HEIGHT;
  const infoWidth = CARD_WIDTH - infoX - MARGIN;
  const infoHeight = Math.max(230, 84 + eventItems.length * 72);
  const eventLines = eventItems
    .map((item, idx) => {
      const baseY = infoY + 78 + idx * 72;
      return [
        `<text x="${infoX + 20}" y="${baseY}" fill="#334155" font-size="20" font-family="Arial, sans-serif">${escapeXml(
          `${item.dayLabel}: ${item.date}`
        )}</text>`,
        `<text x="${infoX + 20}" y="${baseY + 30}" fill="#0f172a" font-size="22" font-family="Arial, sans-serif" font-weight="700">${escapeXml(
          item.eventName
        )}</text>`
      ].join("");
    })
    .join("");

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="${totalHeight}" viewBox="0 0 ${CARD_WIDTH} ${totalHeight}">`,
    `<rect width="${CARD_WIDTH}" height="${totalHeight}" fill="#f1f5f9" />`,
    `<rect x="${MARGIN}" y="${MARGIN}" width="${CARD_WIDTH - MARGIN * 2}" height="${HEADER_HEIGHT - 18}" rx="16" fill="#ffffff" stroke="#d8dee9" />`,
    `<text x="${MARGIN + 24}" y="${MARGIN + 39}" fill="#0f172a" font-size="34" font-family="Arial, sans-serif" font-weight="700">${escapeXml(
      CALENDAR_TITLE
    )}</text>`,
    `<text x="${MARGIN + 24}" y="${MARGIN + 70}" fill="#334155" font-size="20" font-family="Arial, sans-serif">${escapeXml(
      [
        calendarData.weekKey ? `Week ${calendarData.weekKey}` : null,
        calendarData.window
          ? `${calendarData.window.from} to ${calendarData.window.to}`
          : null,
        calendarData.timeZone ? `(${calendarData.timeZone})` : null
      ]
        .filter(Boolean)
        .join(" ")
    )}</text>`,
    monthBlocks.join(""),
    `<rect x="${infoX}" y="${infoY}" width="${infoWidth}" height="${infoHeight}" rx="14" fill="#ffffff" stroke="#d8dee9" />`,
    `<text x="${infoX + 20}" y="${infoY + 40}" fill="#0f172a" font-size="26" font-family="Arial, sans-serif" font-weight="700">วันที่มีกิจกรรม</text>`,
    eventLines,
    `<rect x="${infoX + 20}" y="${infoY + infoHeight - 46}" width="24" height="24" rx="5" fill="#ffedd5" stroke="#fb923c" />`,
    `<text x="${infoX + 56}" y="${infoY + infoHeight - 27}" fill="#334155" font-size="18" font-family="Arial, sans-serif">Highlighted event date</text>`,
    `</svg>`
  ].join("");
}

function getResvgClass() {
  try {
    return require("@resvg/resvg-js").Resvg;
  } catch {
    return null;
  }
}

function buildCalendarFileKey(calendarData) {
  if (calendarData.weekKey) return calendarData.weekKey;
  if (calendarData.window?.from && calendarData.window?.to) {
    return `${calendarData.window.from}_to_${calendarData.window.to}`;
  }
  return calendarData.eventItems?.[0]?.date || "event";
}

function buildRosterCalendarImage(roster, { calendarData = null } = {}) {
  const resolvedCalendarData = calendarData || buildRosterCalendarData(roster);
  if (!resolvedCalendarData) return null;

  const Resvg = getResvgClass();
  if (!Resvg) {
    return {
      calendarData: resolvedCalendarData,
      pngBuffer: null,
      fileName: null
    };
  }

  const svg = buildCalendarSvg(roster, resolvedCalendarData);
  const renderer = new Resvg(svg, {
    fitTo: { mode: "original" },
    background: "white",
    font: { loadSystemFonts: true }
  });
  const pngBuffer = renderer.render().asPng();
  const fileKey = buildCalendarFileKey(resolvedCalendarData);
  const fileName = `LadpraoBros-calendar-${fileKey}.png`;

  return {
    calendarData: resolvedCalendarData,
    pngBuffer,
    fileName
  };
}

module.exports = {
  buildRosterCalendarImage
};
