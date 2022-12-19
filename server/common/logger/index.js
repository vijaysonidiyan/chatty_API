(function () {

  if (global.logger) {
    module.exports = global.logger;
    return;
  }

  var fs = require('fs');
  var util = require('util');
  const CONFIG = require("./../../config");

  var Logger = function () {
  };

  Logger.prototype.write = function (path, data2Write, cb) {
    data2Write += '\n';

    fs.appendFile(path, data2Write, { flag: 'a+' }, function (err) {
      if (err) {
        console.log(err);
      }

      if (cb) cb.apply(null, [err]);
    });
  };

  Logger.prototype.log = function (path, args) {
    var data2Write = '';

    for (let idx = 0; idx < args.length; idx++) {
      if (typeof args[idx] == "object") {
        data2Write += ' ' + util.inspect(args[idx]);
      } else {
        data2Write += ' ' + args[idx];
      }
    }

    this.write(path, data2Write);
    if (CONFIG.LOGGER.LEVEL === 0) {
      console.log(data2Write);
    }
  }

  Logger.prototype.data = function () {
    var args = Array.prototype.slice.call(arguments);
    args.unshift('level: DATA');
    this.log(CONFIG.LOGGER.DATA_PATH, args);
  }

  Logger.prototype.info = function () {
    var args = Array.prototype.slice.call(arguments);
    args.unshift('level: INFO');
    this.log(CONFIG.LOGGER.INFO_PATH, args);
  }

  Logger.prototype.error = function () {
    var args = Array.prototype.slice.call(arguments);
    args.unshift('level: ERROR');
    this.log(CONFIG.LOGGER.ERROR_PATH, args);
  }

  Logger.prototype.critical = function () {
    var args = Array.prototype.slice.call(arguments);
    args.unshift('level: CRITICAL');
    this.log(CONFIG.LOGGER.CRITICAL_PATH, args);
  }

  global.logger = new Logger();
  module.exports = global.logger;
})();