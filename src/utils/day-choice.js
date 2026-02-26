function dayChoiceLabel(dayChoice) {
  if (dayChoice === "saturday") return "วันเสาร์";
  if (dayChoice === "sunday") return "วันอาทิตย์";
  if (dayChoice === "both") return "วันเสาร์และวันอาทิตย์";
  return "ไม่ระบุ";
}

function dayChoiceKey(dayChoice) {
  if (dayChoice === "saturday") return "saturday";
  if (dayChoice === "sunday") return "sunday";
  if (dayChoice === "both") return "both";
  return "unspecified";
}

function createDayChoiceBuckets() {
  return {
    saturday: [],
    sunday: [],
    both: [],
    unspecified: []
  };
}

function countMemberDayChoices(memberIds, memberDays = {}) {
  const total = Array.isArray(memberIds) ? memberIds.length : 0;
  if (total === 0) {
    return {
      total,
      saturdayCount: 0,
      sundayCount: 0,
      bothCount: 0,
      unspecifiedCount: 0
    };
  }

  let saturdayCount = 0;
  let sundayCount = 0;
  let bothCount = 0;

  for (const userId of memberIds) {
    const key = dayChoiceKey(memberDays[userId]);
    if (key === "saturday") saturdayCount += 1;
    else if (key === "sunday") sundayCount += 1;
    else if (key === "both") bothCount += 1;
  }

  const unspecifiedCount = total - saturdayCount - sundayCount - bothCount;
  return {
    total,
    saturdayCount,
    sundayCount,
    bothCount,
    unspecifiedCount
  };
}

module.exports = {
  countMemberDayChoices,
  createDayChoiceBuckets,
  dayChoiceKey,
  dayChoiceLabel
};
