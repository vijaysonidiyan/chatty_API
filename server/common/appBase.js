
'use strict';
let MongoDb = require('./nosql/mongoDb');

class AppBase {
  constructor() {

  }

  _init() {
    let self = this;

    process.on("SIGINT", () => {
      self.onKill('SIGINT');
    }).on("SIGTERM", () => {
      self.onKill('SIGTERM');
    }).on("unhandledRejection", err => {
      console.log("Unhandled reject throws: ");
      console.log(err);
    }).on("uncaughtException", err => {
      console.log("Uncaught exception throws: ");
      console.log(err);
      process.exit(1);
    });

    MongoDb.init().then(() => {
      self.init();
    });
  }

  /**
   * @override
   */
  onKill(cb) { cb(); }

  /**
   * @override
   */
  init(cb) { cb(); }
}

module.exports = AppBase;
