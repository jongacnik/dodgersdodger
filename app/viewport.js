var html = require('choo/html')

module.exports = function (state, emitter) {
  var styletag = html`<style></style>`
  document.head.appendChild(styletag)

  function addStyle () {
    styletag.innerHTML = `.vh100{height:${window.innerHeight}px}`
  }

  addStyle()
  window.addEventListener('resize', addStyle)
}