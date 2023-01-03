const ModelBase = require("./modelBase");
const CONFIG = require("../../config");
const AppCode = require("../constant/appCods");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
//const mongoose = require("mongoose");
const randToken = require('rand-token');
const saltRounds = 10;
//const Schema = mongoose.Schema;
const ObjectID = require("mongodb").ObjectID;
const validator = {
    email: /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i,
    mobile: /^\d+$/
};
const _ = require("lodash");

/*
*For store user registration varification code
*/
class varificationCodeModel extends ModelBase {
    constructor() {
        super(CONFIG.DB.MONGO.DB_NAME, "varificationCode", {
            userId: { type: Object, allowNullEmpty: true },
            token: { type: String, allowNullEmpty: true },
            mobileNo:{type: String, allowNullEmpty: true},
            activity: {
                type: Number,
                allowNullEmpty: true,
                enum: { 1: "register", 2: "forgotpassword", 3: "socialLogin" }
            },
           // userId: { type: Object, allowNullEmpty: true },
            createdFrom: { type: Number, allowNullEmpty: true },
            hashTag:{type: String, allowNullEmpty: true},
            createdAt: { type: Object },
            expiredAt: { type: Object },
            //expiredAt: { type: Object },
        });
    }

    create(data, cb) {
        if (!!data.user_id) {
            data.user_id = ObjectID(data.user_id);
        }
      //  data.token = randToken.generator({ chars: '0-9' }).generate(4);
        data.token = "1234"
        var err = this.validate(data);
        if (err) {
            return cb(err);
        }

        var self = this;
        data.status = 1;
        data.createdAt = new Date();

        var currentTime = new Date();
        // currentTime.setHours(currentTime.getHours() + 24);
        // data.expiredAt = currentTime;
        currentTime.setMinutes(currentTime.getMinutes() + 3);
        data.expiredAt = currentTime;
        self.insert(data, function (err, details) {
            if (err) {
                return cb(err);
            }
            cb(null, details.ops[0]);
            //cb(null, details);
        });
    }

}


module.exports = varificationCodeModel;
