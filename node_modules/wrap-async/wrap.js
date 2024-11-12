'use strict'

module.exports = function wrap(fn) {
  return function() {
    fn.apply(this, arguments)
  }
}
