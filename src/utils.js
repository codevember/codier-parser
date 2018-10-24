module.exports.getDay = function getPenDay (title) {
  const today = new Date()
  let day = title.replace(today.getFullYear(), '').replace(/\D/gi, '')
  if (day !== '') {
    day = parseInt(day, 10)
  } else {
    day = today.getDate()
  }

  return day
}
