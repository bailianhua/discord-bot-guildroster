function formatThaiDateTime(dateLike) {
  return new Date(dateLike).toLocaleString("th-TH");
}

module.exports = {
  formatThaiDateTime
};
