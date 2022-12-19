let UniqueCtrl = {};
const AdminUserModel = new (require("../../common/model/userModel"))
const HttpRespose = require("./../../common/httpResponse");
const AppCode = require("../../common/constant/appCods");
const Logger = require("../../common/logger");
const ObjectID = require("mongodb").ObjectID;
const _ = require("lodash");

/* Unique Authentication For User */
UniqueCtrl.uniqueAuthentication = (req, res, next) => {
    console.log("check auth", req.body.mobile);
    var response = new HttpRespose();
    var query;
    if (req.body.mobile !== "" && req.body.mobile !== undefined) {
        query = {
            mobile: req.body.mobile.toLowerCase(),
            countryCodeforMobile: req.body.countryCodeforMobile
        };
    }
    if (query !== undefined) {
        MasterUserModel.findOne(query, function (err, user) {
            if (err) {
                response.setError(AppCode.UserUpdateFailed);
                response.send(res);
            } else {
                if (user == null) {
                    next();
                } else {
                    response.setData(AppCode.ExistUser);
                    response.send(res);
                }
            }
        });
    } else {
        next();
    }
};

/* Unique SlugName */
UniqueCtrl.uniqueSlugName = (req, res, next) => {
    console.log("check auth", req.body.seoSlug);
    var response = new HttpRespose();
    var query;
    if (req.body.seoSlug !== "" && req.body.seoSlug !== undefined) {
        query = {
            seoSlug: req.body.seoSlug
        };
    }
    if (query !== undefined) {
        ProductModel.findOne(query, function (err, user) {
            if (err) {
                response.setError(AppCode.Fail);
                response.send(res);
            } else {
                if (user == null) {
                    next();
                } else {
                    response.setData(AppCode.ExistSlugName);
                    response.send(res);
                }
            }
        });
    } else {
        next();
    }
};

/* Unique Admin EmailId */
UniqueCtrl.uniqueAdminEmail = (req, res, next) => {
    console.log("check auth", req.body.email);
    var response = new HttpRespose();
    var query;
    if (req.body.email !== "" && req.body.email !== undefined) {
        query = {
            email: req.body.email
        };
    }
    if (query !== undefined) {
        AdminUserModel.findOne(query, function (err, admin) {
            if (err) {
                response.setError(AppCode.UserUpdateFailed);
                response.send(res);
            } else {
                if (admin == null) {
                    next();
                } else {
                    response.setData(AppCode.ExistEmail);
                    response.send(res);
                }
            }
        });
    } else {
        next();
    }
};

/* Unique Admin EmailId */
UniqueCtrl.uniqueEmail = (req, res, next) => {
    console.log("check auth", req.body.email);
    var response = new HttpRespose();
    var query;
    if (req.body.email !== "" && req.body.email !== undefined) {
        query = {
            email: req.body.email
        };
    }
    if (query !== undefined) {
        ContactModel.findOne(query, function (err, admin) {
            if (err) {
                response.setError(AppCode.UserUpdateFailed);
                response.send(res);
            } else {
                if (admin == null) {
                    next();
                } else {
                    response.setData(AppCode.ExistEmail);
                    response.send(res);
                }
            }
        });
    } else {
        next();
    }
};

/* Unique User EmailId */
UniqueCtrl.uniqueUserEmail = (req, res, next) => {
    console.log("check auth", req.body.email);
    var response = new HttpRespose();
    var query;
    if (req.body.email !== "" && req.body.email !== undefined) {
        query = {
            email: req.body.email
        };
    }
    if (query !== undefined) {
        MasterUserModel.findOne(query, function (err, user) {
            if (err) {
                response.setError(AppCode.UserUpdateFailed);
                response.send(res);
            } else {
                if (user == null) {
                    next();
                } else {
                    response.setData(AppCode.ExistEmail);
                    response.send(res);
                }
            }
        });
    } else {
        next();
    }
};

/* Unique User Mobile Number */
UniqueCtrl.uniqueUserMobile = (req, res, next) => {
    console.log("check auth", req.body.email);
    var response = new HttpRespose();
    var query;
    if (req.body.mobile !== "" && req.body.mobile !== undefined) {
        query = {
            mobile: req.body.mobile
        };
    }
    if (query !== undefined) {
        MasterUserModel.findOne(query, function (err, user) {
            if (err) {
                response.setError(AppCode.UserUpdateFailed);
                response.send(res);
            } else {
                if (user == null) {
                    next();
                } else {
                    response.setData(AppCode.ExistMobile);
                    response.send(res);
                }
            }
        });
    } else {
        next();
    }
};

/* Check IF Subscription Plan Exist */
UniqueCtrl.checkIfSubscriptionPlanExist = (req, res, next) => {
    const response = new HttpRespose();
    try {
        SubscriptionPlanModel.findOne({ name: req.body.name.toUpperCase(), status: 1 }, (err, SubscriptionPlan) => {
            if (err) {
                throw err;
            } else if (_.isEmpty(SubscriptionPlan)) {
                next();
            } else {
                Logger.info(AppCode.SubsciptionPlanExist.message + " " + req.body.name);
                response.setData(AppCode.SubsciptionPlanExist);
                response.send(res);
            }
        });
    } catch (exception) {
        Logger.error(AppCode.InternalServerError.message, exception);
        response.setError(AppCode.InternalServerError);
        response.send(res);
    }
}

/* Unique Device Token */
UniqueCtrl.addDeviceToken = (req, res, next) => {
    const response = new HttpRespose();
    if (!!req.body.deviceToken && !!req.payload.userId) {
        try {
            DeviceTokenModel.findOne({ user_id: ObjectID(req.payload.userId) }, function (err, deviceTokens) {
                if (err) {
                    throw err;
                } else {
                    if (deviceTokens === null) {
                        DeviceTokenModel.create({ deviceToken: req.body.deviceToken, user_id: ObjectID(req.payload.userId) }, function (err, deviceTokens) {
                            if (err) {
                                throw err;
                            } else {
                                next();
                            }
                        });
                    }
                    else {
                        DeviceTokenModel.updateOne({ user_id: ObjectID(req.payload.userId) }, { $set: { deviceToken: req.body.deviceToken, updatedAt: new Date() } }, function (err, deviceTokens) {
                            if (err) {
                                throw err;
                            } else {
                                next();
                            }
                        });
                    }
                }
            });
        } catch (exception) {
            response.setError(AppCode.InternalServerError);
            response.send(res);
        }
    }
    else {
        next();
    }
}

module.exports = UniqueCtrl;
