"use strict";

const MongoClient = require("mongodb").MongoClient;
const _ = require("lodash");
const CONFIG = require("../../../config");

let MongoDb = {};

MongoDb.init = function () {
    return new Promise((resolve, reject) => {

        const url = CONFIG.DB.MONGO.SERVER_URL

        MongoClient.connect(url, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        })
            .then(db => {
                global.mongoCon = db;
                console.log("database connected.");
                resolve(db);
            }).catch(err => {
                console.log(err);
                reject(err);
            });
    });
};
MongoDb.getConn = function () {
    return global.mongoCon;
}
module.exports = MongoDb;