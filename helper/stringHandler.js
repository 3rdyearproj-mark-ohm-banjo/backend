const escapeRegex = (str) => {
  return str.replace(/[-[\]{}()*+?.,\\/^$|#\s]/g, '\\$&')
}

module.exports = {
  escapeRegex,
}
