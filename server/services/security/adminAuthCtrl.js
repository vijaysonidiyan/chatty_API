let AdminAuthCtrl = {};
const AdminUserModel = new (require("./../../common/model/adminUserModel"))
const HttpRespose = require("./../../common/httpResponse");
const AppCode = require("../../common/constant/appCods");
const Logger = require("../../common/logger");
const bcrypt = require("bcryptjs");
const ObjectID = require("mongodb").ObjectId;
const CONFIG = require("./../../config");
const nodemailer = require("nodemailer");
const _ = require("lodash");

/* Token Check */
AdminAuthCtrl.TokenCheck = (req, res) => {
    var response = new HttpRespose();
    if (!!req.payload && !!req.payload._id) {
        response.setData(AppCode.Success);
        response.send(res);
    }
    else {
        response.setError(AppCode.PleaseLoginAgain);
        response.send(res);
    }
};

/* Admin Create */
AdminAuthCtrl.adminCreate = (req, res) => {
    var response = new HttpRespose();
    var data = req.body;
    let password = req.body.pwd;
    console.log(data)
    AdminUserModel.create(data, (err, newId) => {
        if (err) {
            console.log(err)
            response.setError(AppCode.Fail);
            response.send(res);
        } else {
            var transporter = nodemailer.createTransport({
                service: CONFIG.MAIL.SERVICEPROVIDER,
                auth: {
                    user: CONFIG.MAIL.MAILID,
                    pass: CONFIG.MAIL.PASSWORD
                }
            });
            var mailOptions = {
                from: CONFIG.MAIL.MAILID,
                to: data.email,
                subject: "your password is : ",
                text: 'Your password Is ' + password
            };
            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                } else {
                    console.log('Email sent: ' + info.response);
                }
            });
            response.setData(AppCode.UserRegistrationSuccess, newId);
            response.send(res);
        }
    });
};

/* Admin Login */
AdminAuthCtrl.login = (req, res) => {
    const response = new HttpRespose();
    AdminUserModel.findOne({
        $or: [
            { email: req.body.email.toLowerCase() }
        ]
    }, {
        _id: 1,
        pwd: 1,
        status: 1,
        accountType: 1
    }, (err, adminUser) => {
        if (err) {
            response.setError(AppCode.Fail
            );
            response.send(res);
        } else {
            if (adminUser === null) {
                response.setError(AppCode.NoUserFound);
                response.send(res);
            } else {
                if (adminUser.status == 2) {
                    response.setError(AppCode.UserNotActivated);
                    response.send(res);
                } else {
                    bcrypt.compare(req.body.pwd, adminUser.pwd, function (err, pwdResult) {
                        console.log("---------------", pwdResult)
                        if (pwdResult) {
                            AdminUserModel.generateSessionToken({ _id: adminUser._id }, function (err, userResData) {
                                if (err) {
                                    response.setError(err);
                                    response.send(res);
                                } else {
                                    res.cookie('woven-token', userResData.myToken, {
                                        maxAge: CONFIG.JWTTIMEOUT,
                                        httpOnly: false
                                    });
                                    response.setData(AppCode.LoginSuccess, userResData);
                                    response.send(res);
                                }
                            });
                        } else {
                            response.setError(AppCode.InvalidCredential);
                            response.send(res);
                        }
                    });
                }
            }
        }
    });
};

/* Change Password For Admin */
AdminAuthCtrl.ChangePasswordForAdmin = (req, res) => {
    const response = new HttpRespose();
    console.log(req.payload)
    AdminUserModel.findOne({ _id: ObjectID(req.payload._id) }, { _id: 1, pwd: 1, status: 1 }, (err, masterUser) => {
        if (err) {
            Logger.error(AppCode.InternalServerError.message, err);
            response.setError(AppCode.InternalServerError);
            response.send(res);
        } else {
            if (masterUser === null) {
                response.setError(AppCode.NoUserFound);
                response.send(res);
            } else {
                bcrypt.compare(req.body.oldpwd, masterUser.pwd, function (err, pwdResult) {
                    if (pwdResult) {
                        bcrypt.hash(req.body.newpwd, 10, function (encryptErr, hash) {
                            if (encryptErr) {
                                response.setError(encryptErr);
                            }
                            req.body.newpwd = hash;
                            AdminUserModel.updateOne({ _id: ObjectID(req.payload._id) }, { $set: { pwd: req.body.newpwd } }, function (err, user) {
                                if (err) {
                                    console.log(err)
                                    AppCode.UserUpdateFailed.error = err.message;
                                    response.setError(AppCode.UserUpdateFailed);
                                }
                                else {
                                    response.setData(AppCode.PasswordChangeSucess);
                                    response.send(res);
                                }
                            });
                        });
                    } else {
                        response.setError(AppCode.InvalidOldPassword);
                        response.send(res);
                    }
                });
            }
        }
    });
};

module.exports = AdminAuthCtrl;
