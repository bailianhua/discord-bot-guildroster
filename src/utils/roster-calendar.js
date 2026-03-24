function pad2(value) {
  return String(value).padStart(2, "0");
}

function parseYmd(raw) {
  const text = String(raw || "").trim();
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const year = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  const day = Number.parseInt(match[3], 10);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() + 1 !== month ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

function getTodayYmdParts(timeZone = "Asia/Bangkok") {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
    const partMap = formatter
      .formatToParts(new Date())
      .reduce((acc, part) => ({ ...acc, [part.type]: part.value }), {});
    return {
      year: Number.parseInt(partMap.year, 10),
      month: Number.parseInt(partMap.month, 10),
      day: Number.parseInt(partMap.day, 10)
    };
  } catch (_) {
    const now = new Date();
    return {
      year: now.getUTCFullYear(),
      month: now.getUTCMonth() + 1,
      day: now.getUTCDate()
    };
  }
}

function parseYmdParts({ year, month, day }, { defaults = null } = {}) {
  const fallback = defaults || {};
  const yearText = String(year || fallback.year || "").trim();
  const monthText = String(month || fallback.month || "").trim();
  const dayText = String(day || fallback.day || "").trim();
  if (!/^\d{4}$/.test(yearText)) return null;
  if (!/^\d{1,2}$/.test(monthText)) return null;
  if (!/^\d{1,2}$/.test(dayText)) return null;

  const yearValue = Number.parseInt(yearText, 10);
  const monthValue = Number.parseInt(monthText, 10);
  const dayValue = Number.parseInt(dayText, 10);
  if (!Number.isFinite(yearValue) || !Number.isFinite(monthValue) || !Number.isFinite(dayValue)) {
    return null;
  }
  if (monthValue < 1 || monthValue > 12) return null;
  if (dayValue < 1 || dayValue > 31) return null;

  return parseYmd(`${yearValue}-${pad2(monthValue)}-${pad2(dayValue)}`);
}

function addDaysToYmd(year, month, day, delta) {
  const ms = Date.UTC(year, month - 1, day) + delta * 24 * 60 * 60 * 1000;
  const d = new Date(ms);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate()
  };
}

function formatYmd({ year, month, day }) {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function dayLabelFromYmd(ymd, locale = "th-TH") {
  const parsed = parseYmd(ymd);
  if (!parsed) return "วันกิจกรรม";
  const date = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day));
  return date.toLocaleDateString(locale, {
    weekday: "long",
    timeZone: "UTC"
  });
}

function getGuildWarWeekendFromWeekKey(weekKey) {
  const parsed = parseYmd(weekKey);
  if (!parsed) return null;

  const saturday = addDaysToYmd(parsed.year, parsed.month, parsed.day, 5);
  const sunday = addDaysToYmd(parsed.year, parsed.month, parsed.day, 6);
  return {
    saturday: formatYmd(saturday),
    sunday: formatYmd(sunday)
  };
}

function buildMonthCalendarText(year, month, highlightedYmdSet) {
  const firstDayDow = new Date(Date.UTC(year, month - 1, 1)).getUTCDay(); // 0=sun
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const cells = [];
  for (let i = 0; i < firstDayDow; i += 1) {
    cells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(day);
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const weekLines = [];
  for (let i = 0; i < cells.length; i += 7) {
    const week = cells.slice(i, i + 7);
    weekLines.push(
      week
        .map((day) => {
          if (!day) return "    ";
          const ymd = `${year}-${pad2(month)}-${pad2(day)}`;
          return highlightedYmdSet.has(ymd) ? `[${pad2(day)}]` : ` ${pad2(day)} `;
        })
        .join("")
    );
  }

  return [`${year}-${pad2(month)}`, "Su  Mo  Tu  We  Th  Fr  Sa", ...weekLines].join(
    "\n"
  );
}

function buildGuildWarCalendarData(roster) {
  const meta = roster?.meta || {};
  const eventKey = String(meta.eventKey || "guildwar").trim().toLowerCase();
  const looksLikeGuildWarBatch = meta.autoWeeklyGuildWar === true || Boolean(meta.weekKey);
  if (!looksLikeGuildWarBatch) return null;
  if (eventKey !== "guildwar") return null;
  if (!meta.weekKey) return null;

  const weekend = getGuildWarWeekendFromWeekKey(meta.weekKey);
  if (!weekend) return null;

  const dates = [weekend.saturday, weekend.sunday];
  const dateSet = new Set(dates);
  const monthKeys = [...new Set(dates.map((ymd) => ymd.slice(0, 7)))].sort();

  const months = monthKeys
    .map((monthKey) => {
      const parsed = parseYmd(`${monthKey}-01`);
      if (!parsed) return null;
      return {
        monthKey,
        text: buildMonthCalendarText(parsed.year, parsed.month, dateSet)
      };
    })
    .filter(Boolean);

  const eventItems = [
    { dayLabel: "วันเสาร์", date: weekend.saturday },
    { dayLabel: "วันอาทิตย์", date: weekend.sunday }
  ];

  return {
    source: "auto",
    weekKey: meta.weekKey,
    timeZone: meta.timeZone || "Asia/Bangkok",
    eventItems,
    eventDates: eventItems.map((item) => item.date),
    months
  };
}

function buildManualEventCalendarData(roster) {
  const meta = roster?.meta || {};
  const eventDate = String(meta.eventDate || "").trim();
  const parsed = parseYmd(eventDate);
  if (!parsed) return null;

  const eventYmd = formatYmd(parsed);
  const monthKey = eventYmd.slice(0, 7);
  const eventItems = [{ dayLabel: dayLabelFromYmd(eventYmd), date: eventYmd }];

  return {
    source: "manual",
    weekKey: null,
    timeZone: meta.timeZone || "Asia/Bangkok",
    eventItems,
    eventDates: [eventYmd],
    months: [
      {
        monthKey,
        text: buildMonthCalendarText(parsed.year, parsed.month, new Set([eventYmd]))
      }
    ]
  };
}

function buildRosterCalendarData(roster) {
  return buildGuildWarCalendarData(roster) || buildManualEventCalendarData(roster);
}

function resolveRosterCalendarEventName(roster) {
  const eventKey = String(roster?.meta?.eventKey || "").trim().toLowerCase();
  if (eventKey === "guildwar") {
    return "Guild War";
  }

  const rawTitle = String(roster?.title || "").trim();
  if (!rawTitle) return "Event";
  const cleaned = rawTitle.replace(/\s*\(.*\)\s*$/, "").trim();
  return cleaned || rawTitle;
}

function buildUpcomingCalendarDataFromRosters(
  rosters,
  { timeZone = "Asia/Bangkok", daysAhead = 90 } = {}
) {
  if (!Array.isArray(rosters) || rosters.length === 0) return null;

  const today = formatYmd(getTodayYmdParts(timeZone));
  const parsedToday = parseYmd(today);
  if (!parsedToday) return null;
  const end = formatYmd(
    addDaysToYmd(parsedToday.year, parsedToday.month, parsedToday.day, daysAhead)
  );

  const eventItems = [];
  const seen = new Set();

  for (const roster of rosters) {
    const calendarData = buildRosterCalendarData(roster);
    if (!calendarData) continue;

    const eventName = resolveRosterCalendarEventName(roster);
    const items = Array.isArray(calendarData.eventItems) ? calendarData.eventItems : [];

    for (const item of items) {
      const ymd = String(item?.date || "").trim();
      if (!parseYmd(ymd)) continue;
      if (ymd < today || ymd > end) continue;

      const dedupeKey = `${ymd}|${eventName}|${roster?.messageId || ""}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);

      eventItems.push({
        dayLabel: item?.dayLabel || dayLabelFromYmd(ymd),
        date: ymd,
        eventName,
        rosterMessageId: roster?.messageId || null
      });
    }
  }

  if (eventItems.length === 0) return null;

  eventItems.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    if (a.eventName !== b.eventName) return a.eventName.localeCompare(b.eventName);
    return String(a.rosterMessageId || "").localeCompare(String(b.rosterMessageId || ""));
  });

  const eventDates = [...new Set(eventItems.map((item) => item.date))];
  const dateSet = new Set(eventDates);
  const monthKeys = [...new Set(eventDates.map((ymd) => ymd.slice(0, 7)))].sort();
  const months = monthKeys
    .map((monthKey) => {
      const parsedMonth = parseYmd(`${monthKey}-01`);
      if (!parsedMonth) return null;
      return {
        monthKey,
        text: buildMonthCalendarText(parsedMonth.year, parsedMonth.month, dateSet)
      };
    })
    .filter(Boolean);

  return {
    source: "upcoming",
    weekKey: null,
    timeZone,
    eventItems,
    eventDates,
    months,
    window: {
      from: today,
      to: end,
      daysAhead
    }
  };
}

module.exports = {
  buildUpcomingCalendarDataFromRosters,
  buildGuildWarCalendarData,
  buildRosterCalendarData,
  resolveRosterCalendarEventName,
  parseYmd,
  parseYmdParts,
  getTodayYmdParts
};
