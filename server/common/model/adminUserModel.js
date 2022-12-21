const ModelBase = require("./modelBase");
const CONFIG = require("../../config");
const bcrypt = require("bcryptjs");
const _ = require("lodash");
const mongoose = require("mongoose");
const randToken = require('rand-token');
const saltRounds = 10;
const AppCode = require("../constant/appCods");
const Schema = mongoose.Schema;
const ObjectID = require("mongodb").ObjectID;
const jwt = require("jsonwebtoken");
const validator = {
    email: /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i,
    mobile: /^\d+$/
};



class adminUserModel extends ModelBase {


    constructor() {
        super(CONFIG.DB.MONGO.DB_NAME, "adminUser", {
            pwd: { type: String, allowNullEmpty: false },
            name: { type: String, allowNullEmpty: false },
            email: {
                type: String,
                allowNullEmpty: false,
                regex: /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i
            },
            //mobile: { type: Number, allowNullEmpty: true },
            //roleId: { type: Object, allowNullEmpty: false },
            status: {
                type: Number,
                allowNullEmpty: false,
                enum: { 1: "active", 2: "inactive" }
            },
            createdAt: { type: Object, allowNullEmpty: false },
            updatedAt: { type: Object, allowNullEmpty: true },
            deviceTokens: { type: Array, allowNullEmpty: true }, //[{deviceId : id of device, deviceType :  1 => "android" and 2 => "ios" and 3 => "web", tokenId : jwt token, jti : jwt token id }]
        });
    }


    /**
     * @description create Always return an unique id after inserting new user
     * @param {*} data
     * @param {*} cb
     */
    create(data, cb) {
        var err = this.validate(data);

        if (err) {
            return cb(err);
        }
        var self = this;

        data.createdAt = new Date();
       // data.startDate = data.createdAt;


        if (data.status === undefined) {
            data.status = 1;
        }
        bcrypt.hash(data.pwd, saltRounds, function (encryptErr, hash) {
            if (encryptErr) {
                return cb(encryptErr);
            }

            data.pwd = hash;

            self.insert(data, function (err, user) {
                if (err) {
                    return cb(err);
                }
                delete user.ops[0].pwd;

                cb(null, user.ops[0]);
            });
        });
    }

    advancedAggregate(query, options, cb) {
        // do a validation with this.schema
        this.getModel(function (err, model) {
            if (err) {
                return cb(err);
            }
            const limit = (!_.isEmpty(options) && options.limit) ? options.limit : 20;
            const skip = options.skip ? options.skip : 0;
            const sort = options.sort ? options.sort : { _id: -1 };
            model.aggregate(query).skip(skip).limit(limit).sort(sort).toArray(cb);
        });
    }

    updateUser(params, cb) {
        var err = this.validate(data);
        if (err) {
            return cb(err);
        }
        var updateSetObj = {};
        updateSetObj = params;
        updateSetObj.updatedAt = new Date();
        var self = this;
        self.updateOne({ _id: ObjectID(params._id) }, { $set: updateSetObj }, function (err, updatedInfo) {
            if (err) {
                return cb(err);
            }
            cb(null, updateSetObj);
        });
    }

    removeDeviceToken(params, cb) {
        var self = this;
        self.updateOne({ _id: ObjectID(params.masterUserId) }, { $pull: { "deviceTokens": { jti: params.jti } } }, function (err, UpdatedMasterUser) {
            if (err) {
                console.log("err at logout : ", err);
                cb(err);
            } else {
                cb(null);
            }
        });
    }

    /*
        *Generate \ Regenerate new session token for Admin
        *Params : {
        * paramsObj._id : user id of master user collections       
        * callback : callback function
        *}
        */
   
        generateSessionToken(paramsObj, callback) {
            var self = this;
            const query = [
                {
                    $match: { _id: paramsObj._id }
                },
                {
                    $lookup: {
                        from: "Role_master",
                        as: "roleData",
                        let: { "roleId": "$roleId" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $eq: ["$_id", "$$roleId"]
                                    },
                                },
                            },
                            {
                                $project: {
                                    "_id": 1,
                                    "roleName": 1
                                }
                            }
                        ]
                    },
    
    
                },
                {
                    $unwind: {
                        "path": "$roleData",
                        "preserveNullAndEmptyArrays": true
    
                    }
    
                },
                {
                    $project: {
                        _id: 1,
                        status: 1,
                        name: 1,
                        email: 1,
                        roleId: 1,
                        roleName: "$roleData.roleName",
                        assignPartyPlot: 1,
                    }
                }
            ];
            if (!!paramsObj && paramsObj._id) {
                self.advancedAggregate(query, { limit: 1, skip: 0 }, function (err, user) {
                    if (err) {
                        callback(AppCode.InternalServerError);
                    } else {
                        if (user === null || user[0] === undefined) {
                            callback(AppCode.NoUserFound);
                        } else {
                            user = user[0];
                            user.jti = user._id + "_" + randToken.generator({ chars: '0-9' }).generate(6);
                            user.myToken = jwt.sign(user, CONFIG.JWTTOKENKEY, {
                                expiresIn: '30d' //365 days
                            });
    
                            let deviceTokenInfo = {};
    
                            deviceTokenInfo.tokenId = user.myToken;
                            deviceTokenInfo.jti = user.jti;
                          //  deviceTokenInfo.isverified = true;
    
                            if (!!deviceTokenInfo) {
                                self.updateOne({ _id: paramsObj._id }, { $push: { deviceTokens: deviceTokenInfo } }, function (err, UpdatedMasterUser) {
                                    if (err) {
                                        console.log(err)
                                        callback(AppCode.SomethingWrong);
                                    } else {
                                        callback(null, user);
                                    }
                                });
                            } else {
                                callback(AppCode.MissingDeviceTokenParameter);
                            }
                        }
                    }
                });
            } else {
                callback(AppCode.SomethingWrong);
            }
        }
    isEmail(email) {
        return validator.email.test(email);
    }
    isMobile(mobile) {
        return validator.mobile.test(mobile);
    }
}



module.exports = adminUserModel;
