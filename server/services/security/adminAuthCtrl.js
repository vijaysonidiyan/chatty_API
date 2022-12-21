let AdminAuthCtrl = {};
const AdminUserModel = new (require("./../../common/model/adminUserModel"))
const UserModel = new (require("./../../common/model/userModel"))
const VarificationCodeModel = new (require("./../../common/model/varificationCodeModel"))
const FavouriteModel = new (require("./../../common/model/favouriteModel"))
const HttpRespose = require("./../../common/httpResponse");
const AppCode = require("../../common/constant/appCods");
const Logger = require("../../common/logger");
const bcrypt = require("bcryptjs");
const ObjectID = require("mongodb").ObjectId;
const CONFIG = require("./../../config");
const nodemailer = require("nodemailer");
const _ = require("lodash");
const fs = require('fs');
const handlebars = require('handlebars');
const adminUserModel = require("./../../common/model/adminUserModel");

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
        status: 1
     
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
    console.log(req.auth)
    AdminUserModel.findOne({ _id: ObjectID(req.auth._id) }, { _id: 1, pwd: 1, status: 1 }, (err, masterUser) => {
        if (err) {
            console.log(".....err",err)
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
                            AdminUserModel.updateOne({ _id: ObjectID(req.auth._id) }, { $set: { pwd: req.body.newpwd } }, function (err, user) {
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


AdminAuthCtrl.forgotPassworForAdmin = (req, res) => {
    var response = new HttpRespose();
    if (!!req.body) {
      try {
        let query = {
          email: req.body.email.toLowerCase()
        };
        console.log(query);
        AdminUserModel.findOne(
          {
            email: req.body.email,
            // _id: 1,
            // pwd: 1,
            // status: 1
          },
          (err, user) => {
            if (err) {
              //TODO: Log the error here
              console.log(err);
              //AppCode.UserUpdateFailed.error = err.message;
              response.setError(AppCode.Fail);
              response.send(res);
            } else {
              if (user === null) {
                response.setError(AppCode.NoUserFound);
                response.send(res);
              } else {
                VarificationCodeModel.removeMany(
                  { userId: ObjectID(user._id), activity: 2 },
                  function (err, removecode) {
                    if (err) {
                      console.log("-------------", err);
                      // AppCode.Fail.error = err.message;
                      response.setError(AppCode.Fail);
                      response.send(res);
  
                      // });
                    } else {
                      var params = {
                        userId: ObjectID(user._id),
                        activity: 2,
                      };
                      VarificationCodeModel.create(
                        params,
                        function (err, newVarificationId) {
                          if (err) {
                            console.log(err);
                            response.setError(AppCode.Fail);
                            response.send(res);
                          }  else {
                            var transporter = nodemailer.createTransport({
                              service: "gmail",
                              auth: {
                                  user: CONFIG.MAIL.MAILID,
                                  pass: CONFIG.MAIL.PASSWORD
                              },
                            });

                            var readHTMLFile = function (path, callback) {
                              fs.readFile(
                                path,
                                { encoding: "utf-8" },
                                function (err, html) {
                                  if (err) {
                                    throw err;
                                    callback(err);
                                  } else {
                                    callback(null, html);
                                  }
                                }
                              );
                            };

                            readHTMLFile(
                              "../common/HtmlTemplate/ForgotPassword_.html",
                              function (err, html) {
                                var template = handlebars.compile(html);
                                var replacements = {
                                  FirstName: user.name,
                                  FromEmail: req.body.email,
                                  otp: newVarificationId.token,
                                };

                                var htmlToSend = template(replacements);
                                var mailOptions = {
                                  from: CONFIG.MAIL.MAILID,
                                  to: req.body.email,
                                  subject:
                                    "Reset your chattyAPI Password",
                                  html: htmlToSend,
                                // text: 'Your password Is ' + password
                                };

                                transporter.sendMail(
                                  mailOptions,
                                  function (error, info) {
                                    if (error) {
                                    } else {
                                      console.log(
                                        "Email sent: " + info.response
                                      );
                                    }
                                  }
                                );
                              }
                            );

                            // response.setData(AppCode.Success, paramsObj.userId);
                            // response.send(res);
                          }
                        }
                      );
                    }
                  }
                );
  
                response.setData(AppCode.ForgotPassword, user._id);
                response.send(res);
              }
            }
          }
        );
      } catch (exception) { }
    } else {
      AppCode.SendOTPError.error =
        "Oops! something went wrong, please try again later";
      response.setError(AppCode.SendOTPError);
      response.send(res);
    }
  };

AdminAuthCtrl.checkOtpVerificationForAdmin = (req, res) => {
    var response = new HttpRespose();
    var paramsObj = req.body;
    try {
        if (!!paramsObj.userId && !!paramsObj.OTP) {
            currentTime = new Date();
            VarificationCodeModel.findOne({
                userId
                    : ObjectID(paramsObj.userId), token: paramsObj.OTP, activity: 2, status: 1
            }, function (err, varificationCode) {
                if (err) {
                    //TODO: Log the error here
                    AppCode.Fail.error = err.message;
                    response.setError(AppCode.Fail);
                    response.send(res);
                } else {
                    if (varificationCode !== null) { 
                        let result = {
                            _id: req.body.userId
                        }
                        if (varificationCode.expiredAt > currentTime) {
                            response.setData(AppCode.Success, result);
                            response.send(res);
                        } else {
                            response.setError(AppCode.OTPExpired);
                            response.send(res);
                        }
                    } else {
                        response.setError(AppCode.OTPVerifyFail);
                        response.send(res);
                    }
                }
            });
        } else {
            AppCode.Fail.error = "Please submit required information";
            response.setError(AppCode.Fail);
            response.send(res);
        }
    } catch (exception) {
        response.setError(AppCode.InternalServerError);
        response.send(res);
    }
};

AdminAuthCtrl.resendOtpAdmin = (req, res) => {
    const response = new HttpRespose();
    console.log("zgfhsdhjgfhjgfjsdghsgdf")

    if (!!req.body.userId && !!req.body && !!req.body.activity) {
        try {
            let query = {
                _id: ObjectID(req.body.userId),

            };
            AdminUserModel.findOne(query, function (err, User) {
                if (err) {
                    console.log("@@@@@@@@@@@@@@@@@@", err)
                    //TODO: Log the error here
                    AppCode.Fail.error = err.message;
                    response.setError(AppCode.Fail);
                    response.send(res);
                } else {
                    console.log("@@@@@@@@@@@@@@@@@@", User)
                    if (User === null) {
                        response.setError(AppCode.NoUserFound);
                        response.send(res);
                    } else {
                        let activity = parseInt(req.body.activity);
                        console.log("------------------------------------", activity);
                        VarificationCodeModel.removeMany({
                            userId: ObjectID(req.body.userId), activity: activity
                        }, function (err, removecode) {
                            if (err) {
                                console.log("-------------", err)
                                AppCode.Fail.error = err.message;
                                response.setError(AppCode.Fail);
                                response.send(res);;

                                // });
                            } else {
                                // if (isEmail(User.email)) {
                                var params = {
                                    userId: ObjectID(User._id),
                                    activity: activity
                                };
                                VarificationCodeModel.create(params, function (err, newVarificationId) {
                                    if (err) {
                                        console.log(err)
                                        response.setError(AppCode.Fail);
                                        response.send(res);
                                    } else {

                                        // let userName = [User.firstName + " " + User.lastName]
                                        // console.log("---------------------", userName)
                                        var transporter = nodemailer.createTransport({
                                            service: CONFIG.MAIL.SERVICEPROVIDER,
                                            auth: {

                                                user: CONFIG.MAIL.MAILID,
                                                pass: CONFIG.MAIL.PASSWORD
                                            }
                                        });
                                        var readHTMLFile = function (path, callback) {
                                            fs.readFile(path, { encoding: 'utf-8' }, function (err, html) {
                                                if (err) {
                                                    throw err;
                                                    callback(err);
                                                }
                                                else {
                                                    callback(null, html);
                                                }
                                            });
                                        };
                                        readHTMLFile('../common/HtmlTemplate/OTP.html', function (err, html) {
                                            var template = handlebars.compile(html);
                                            var replacements = {
                                                // fullName: userName,
                                                OTP: newVarificationId.token,
                                                // email: user.otp,
                                                // // pwd: userData.password,
                                                // mobile: user.mobile,
                                            };
                                            // console.log("------", User.email,)

                                            var htmlToSend = template(replacements);
                                            var mailOptions = {
                                                from: CONFIG.MAIL.MAILID,
                                                to: User.email,
                                                subject: 'resend OTP for user',
                                                html: htmlToSend,
                                                // text: 'Your password Is ' + password
                                            };
                                            // console.log("+++++++++++", mailOptions)
                                            console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@!!!!!!!!!!!!!!!", User.email)

                                            transporter.sendMail(mailOptions, function (error, info) {
                                                if (error) {
                                                } else {
                                                    console.log('Email sent: ' + info.response);
                                                }

                                            });
                                        });

                                        response.setData(AppCode.Success, User._id);
                                        response.send(res);
                                    }
                                });
                            }

                        });
                    }
                }
            });
        }
        catch (exception) {

        }

    } else {
        response.setError(AppCode.enterdetails);
        response.send(res);
    }

};


/* Password Reset For admin */
AdminAuthCtrl.passwordResetForUser = (req, res) => {
    var response = new HttpRespose();
    var paramsObj = req.body;
    try {
        if (!!req.body && !!req.body.pwd && !!req.body.userId) {
            currentTime = new Date();
            bcrypt.hash(paramsObj.pwd, 10, function (encryptErr, hash) {
                if (encryptErr) {
                    response.setError(encryptErr);
                }
                paramsObj.pwd = hash;

                AdminUserModel.updateOne({ _id: ObjectID(paramsObj.userId) }, { $set: { pwd: paramsObj.pwd } }, function (err, user) {
                    if (err) {
                        AppCode.Fail.error = err.message;
                        response.setError(AppCode.Fail);
                    }
                    else {

                        response.setData(AppCode.Success);
                        response.send(res);

                    }
                });

            });
        } else {
            AppCode.Fail.error = "Please submit required information";
            response.setError(AppCode.Fail);
            response.send(res);
        }


    } catch (exception) {
        console.log(exception)
        response.setError(AppCode.InternalServerError);
        response.send(res);
    }
};


module.exports = AdminAuthCtrl;
