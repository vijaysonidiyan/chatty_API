let userCtrl = {};

// const RoleModel = new (require("./../../common/model/roleModel)),
const HttpRespose = require("../../common/httpResponse");
const Logger = require("../../common/logger");
const bcrypt = require("bcryptjs");
const blacklist = require('express-jwt-blacklist');
const UserModel = new (require("./../../common/model/userModel"))
const VarificationCodeModel = new (require("./../../common/model/varificationCodeModel"))
const FavouriteModel = new (require("./../../common/model/favouriteModel"))

const ChatModel = new (require("./../../common/model/chatModel"))
const ObjectID = require("mongodb").ObjectID;
const CONFIG = require("../../config");
// const _ = require("lodash");
const async = require("async");
const AppCode = require("../../common/constant/appCods");
const { ObjectId } = require("mongodb");
const { query } = require("express");
const _ = require("lodash");

const fs = require("fs");
const nodemailer = require("nodemailer");
const { Console } = require("console");
const handlebars = require('handlebars');
const userModel = require("./../../common/model/userModel");

// import { Country, State, City } from 'country-state-city';
//import { ICountry, IState, ICity } from 'country-state-city';
/**
 * @description registraction action
 */


/* State Data List */
userCtrl.stateList = (req, res) => {
    const response = new HttpRespose();
    //let query = {status :  1}
    let Country = require('country-state-city').Country;
    let State = require('country-state-city').State;
    let stateData = State.getStatesOfCountry('IN')

    let stateList = []

    stateData.forEach(function (stateData) {
        // console.log(stateData);
        var customObj = {
            'isoCode': stateData.isoCode,
            'name': stateData.name,
        }
        stateList.push(customObj)
    });
    response.setData(AppCode.Success, stateList);
    response.send(res);
};

/* Country Data List */
userCtrl.countryList = (req, res) => {
    const response = new HttpRespose();
    let Country = require('country-state-city').Country;
    let countryData = Country.getAllCountries()

    let countryList = []

    countryData.forEach(function (countryData) {
        console.log(countryData);
        var customObj = {
            'isoCode': countryData.isoCode,
            'name': countryData.name,
            'countryCode': "+" + countryData.phonecode,
        }
        countryList.push(customObj)
    });
    response.setData(AppCode.Success, countryList);
    response.send(res);
};

/*user Registration */
// userCtrl.userCreate = (req, res) => {
//     var response = new HttpRespose();
//     var data = req.body;
//     // let password = req.body.pwd;
//     console.log(data);
//     let query = { mobileNo: req.body.mobileNo };
//     UserModel.findOne(query, function (err, UserData) {
//         if (err) {
//             //TODO: Log the error here
//             AppCode.Fail.error = err.message;
//             response.setError(AppCode.Fail);
//             response.send(res);
//         } else if (UserData !== null) {
//             console.log(".....................................", UserData)
//             let activity = parseInt(req.body.activity);
//             console.log("------------------------------------", activity);
//             VarificationCodeModel.removeMany({
//                 userId: ObjectID(UserData._id), activity: 1
//             }, function (err, removecode) {
//                 if (err) {
//                     console.log("-------------", err)
//                     AppCode.Fail.error = err.message;
//                     response.setError(AppCode.Fail);
//                     response.send(res);;

//                     // });
//                 } else {

//                     let activity = 1;
//                     var params = {
//                         userId: ObjectID(UserData._id),
//                         activity: activity
//                     };
//                     VarificationCodeModel.create(params, function (err, newVarificationId) {
//                         if (err) {
//                             console.log("verificationerr_elseif", err)
//                             response.setError(AppCode.Fail);
//                             response.send(res);
//                         } else {
//                             console.log("................", newVarificationId)
//                             response.setData(AppCode.Success);
//                             response.send(res);

//                         }
//                     });
//                 }
//             });

//         } else {
//             UserModel.create(data, (err, userData) => {
//                 if (err) {
//                     console.log(err);
//                     response.setError(AppCode.Fail);
//                     response.send(res);
//                 }
//                 else {
//                     let activity = 1;
//                     var params = {
//                         userId: ObjectID(userData._id),
//                         activity: activity
//                     };
//                     VarificationCodeModel.create(params, function (err, newVarificationId) {
//                         if (err) {
//                             console.log("verificationerr", err)
//                             response.setError(AppCode.Fail);
//                             response.send(res);
//                         } else {
//                             // var transporter = nodemailer.createTransport({
//                             //     service: CONFIG.MAIL.SERVICEPROVIDER,
//                             //     auth: {

//                             //         user: CONFIG.MAIL.MAILID,
//                             //         pass: CONFIG.MAIL.PASSWORD
//                             //     }
//                             // });
//                             // var readHTMLFile = function (path, callback) {
//                             //     fs.readFile(path, { encoding: 'utf-8' }, function (err, html) {
//                             //         if (err) {
//                             //             throw err;
//                             //             callback(err);
//                             //         }
//                             //         else {
//                             //             callback(null, html);
//                             //         }
//                             //     });
//                             // };
//                             // readHTMLFile('../common/HtmlTemplate/OTP.html', function (err, html) {
//                             //     var template = handlebars.compile(html);
//                             //     var replacements = {

//                             //         otp: newVarificationId.token,
//                             //     };
//                             //     var htmlToSend = template(replacements);

//                             //     var mailOptions = {
//                             //         from: CONFIG.MAIL.MAILID,
//                             //         to: staff.email,
//                             //         subject: 'resend OTP for user',
//                             //         html: htmlToSend,
//                             //         text: 'Your OTP Is ' + newVarificationId.token
//                             //     };

//                             //     transporter.sendMail(mailOptions, function (error, info) {
//                             //         if (error) {
//                             //         } else {
//                             //             console.log('Email sent: ' + info.response);
//                             //         }

//                             //     });
//                             // });
//                             // response.setData(AppCode.Success, staff._id);
//                             // response.send(res);
//                             console.log("........", newVarificationId)
//                         }
//                     });


//                     let result = {
//                         _id: userData._id,
//                     };

//                     response.setData(AppCode.Success, result);
//                     response.send(res);
//                 }
//             });

//         }
//     });
// };

/*user Registration */
userCtrl.userLoginForWeb= (req, res) => {
    var response = new HttpRespose();
    var data = req.body;
    // let password = req.body.pwd;
    console.log(data);
    let query = { mobileNo: req.body.mobileNo ,countryCode:req.body.countryCode
    };
    UserModel.findOne(query, function (err, UserData) {
        if (err) {
            //TODO: Log the error here
            AppCode.Fail.error = err.message;
            response.setError(AppCode.Fail);
            response.send(res);
        } else if (UserData !== null) {
            console.log(".....................................", UserData)
            let activity = parseInt(req.body.activity);
            console.log("------------------------------------", activity);
            VarificationCodeModel.removeMany({
                userId: ObjectID(UserData._id), activity: 1
            }, function (err, removecode) {
                if (err) {
                    console.log("-------------", err)
                    AppCode.Fail.error = err.message;
                    response.setError(AppCode.Fail);
                    response.send(res);;

                    // });
                } else {

                    let activity = 1;
                    var params = {
                        mobileNo: req.body.mobileNo,
                        userId: ObjectID(UserData._id),
                        activity: activity
                    };
                    VarificationCodeModel.create(params, function (err, newVarificationId) {
                        if (err) {
                            console.log("verificationerr_elseif", err)
                            response.setError(AppCode.Fail);
                            response.send(res);
                        } else {
                            let bodyData = {
                                isverified: false
                            }
                            UserModel.update(query, bodyData, function (err, userdata) {
                                if (err) {
                                    console.log(err)
                                    response.setError(AppCode.Fail);
                                    response.send(res);
                                } else if (userdata == undefined || (userdata.matchedCount === 0 && userdata.modifiedCount === 0)) {
                                    response.setError(AppCode.NotFound);
                                } else {
                                    // response.setData(AppCode.Success, req.body);
                                    // response.send(res);
                                }
                            });
                            console.log("................", newVarificationId)
                            response.setData(AppCode.Success);
                            response.send(res);

                        }
                    });
                }
            });

        } else {
            console.log(".....else part exicuted")
            data.isverified = false
            UserModel.create(data, (err, userData) => {
                if (err) {
                    console.log(err);
                    response.setError(AppCode.Fail);
                    response.send(res);
                }
                else {
                    let activity = 1;
                    var params = {
                        mobileNo: req.body.mobileNo,
                        userId: ObjectID(userData._id),
                        activity: activity
                    };
                    VarificationCodeModel.create(params, function (err, newVarificationId) {
                        if (err) {
                            console.log("verificationerr", err)
                            response.setError(AppCode.Fail);
                            response.send(res);
                        } else {
                            // var transporter = nodemailer.createTransport({
                            //     service: CONFIG.MAIL.SERVICEPROVIDER,
                            //     auth: {

                            //         user: CONFIG.MAIL.MAILID,
                            //         pass: CONFIG.MAIL.PASSWORD
                            //     }
                            // });
                            // var readHTMLFile = function (path, callback) {
                            //     fs.readFile(path, { encoding: 'utf-8' }, function (err, html) {
                            //         if (err) {
                            //             throw err;
                            //             callback(err);
                            //         }
                            //         else {
                            //             callback(null, html);
                            //         }
                            //     });
                            // };
                            // readHTMLFile('../common/HtmlTemplate/OTP.html', function (err, html) {
                            //     var template = handlebars.compile(html);
                            //     var replacements = {

                            //         otp: newVarificationId.token,
                            //     };
                            //     var htmlToSend = template(replacements);

                            //     var mailOptions = {
                            //         from: CONFIG.MAIL.MAILID,
                            //         to: staff.email,
                            //         subject: 'resend OTP for user',
                            //         html: htmlToSend,
                            //         text: 'Your OTP Is ' + newVarificationId.token
                            //     };

                            //     transporter.sendMail(mailOptions, function (error, info) {
                            //         if (error) {
                            //         } else {
                            //             console.log('Email sent: ' + info.response);
                            //         }

                            //     });
                            // });
                            // response.setData(AppCode.Success, staff._id);
                            // response.send(res);
                            console.log("........", newVarificationId)
                        }
                    });


                    let result = {
                        _id: userData._id,
                    };

                    response.setData(AppCode.Success, result);
                    response.send(res);
                }
            });

        }
    });
};

/*user Registration */
userCtrl.userCreate = (req, res) => {
    var response = new HttpRespose();
    var data = req.body;
    // let password = req.body.pwd;
    console.log(data);
    let query = { mobileNo: req.body.mobileNo };
    UserModel.findOne(query, function (err, UserData) {
        if (err) {
            //TODO: Log the error here
            AppCode.Fail.error = err.message;
            response.setError(AppCode.Fail);
            response.send(res);
        } else if (UserData !== null) {
            console.log(".....................................", UserData)
            let activity = parseInt(req.body.activity);
            console.log("------------------------------------", activity);
            VarificationCodeModel.removeMany({
                userId: ObjectID(UserData._id), activity: 1
            }, function (err, removecode) {
                if (err) {
                    console.log("-------------", err)
                    AppCode.Fail.error = err.message;
                    response.setError(AppCode.Fail);
                    response.send(res);;

                    // });
                } else {

                    let activity = 1;
                    var params = {
                        mobileNo: req.body.mobileNo,
                        userId: ObjectID(UserData._id),
                        activity: activity
                    };
                    VarificationCodeModel.create(params, function (err, newVarificationId) {
                        if (err) {
                            console.log("verificationerr_elseif", err)
                            response.setError(AppCode.Fail);
                            response.send(res);
                        } else {
                            let bodyData = {
                                isverified: false
                            }
                            UserModel.update(query, bodyData, function (err, userdata) {
                                if (err) {
                                    console.log(err)
                                    response.setError(AppCode.Fail);
                                    response.send(res);
                                } else if (userdata == undefined || (userdata.matchedCount === 0 && userdata.modifiedCount === 0)) {
                                    response.setError(AppCode.NotFound);
                                } else {
                                    // response.setData(AppCode.Success, req.body);
                                    // response.send(res);
                                }
                            });
                            console.log("................", newVarificationId)
                            response.setData(AppCode.Success);
                            response.send(res);

                        }
                    });
                }
            });

        } else {
            console.log(".....else part exicuted")
            data.isverified = false
            UserModel.create(data, (err, userData) => {
                if (err) {
                    console.log(err);
                    response.setError(AppCode.Fail);
                    response.send(res);
                }
                else {
                    let activity = 1;
                    var params = {
                        mobileNo: req.body.mobileNo,
                        userId: ObjectID(userData._id),
                        activity: activity
                    };
                    VarificationCodeModel.create(params, function (err, newVarificationId) {
                        if (err) {
                            console.log("verificationerr", err)
                            response.setError(AppCode.Fail);
                            response.send(res);
                        } else {
                            // var transporter = nodemailer.createTransport({
                            //     service: CONFIG.MAIL.SERVICEPROVIDER,
                            //     auth: {

                            //         user: CONFIG.MAIL.MAILID,
                            //         pass: CONFIG.MAIL.PASSWORD
                            //     }
                            // });
                            // var readHTMLFile = function (path, callback) {
                            //     fs.readFile(path, { encoding: 'utf-8' }, function (err, html) {
                            //         if (err) {
                            //             throw err;
                            //             callback(err);
                            //         }
                            //         else {
                            //             callback(null, html);
                            //         }
                            //     });
                            // };
                            // readHTMLFile('../common/HtmlTemplate/OTP.html', function (err, html) {
                            //     var template = handlebars.compile(html);
                            //     var replacements = {

                            //         otp: newVarificationId.token,
                            //     };
                            //     var htmlToSend = template(replacements);

                            //     var mailOptions = {
                            //         from: CONFIG.MAIL.MAILID,
                            //         to: staff.email,
                            //         subject: 'resend OTP for user',
                            //         html: htmlToSend,
                            //         text: 'Your OTP Is ' + newVarificationId.token
                            //     };

                            //     transporter.sendMail(mailOptions, function (error, info) {
                            //         if (error) {
                            //         } else {
                            //             console.log('Email sent: ' + info.response);
                            //         }

                            //     });
                            // });
                            // response.setData(AppCode.Success, staff._id);
                            // response.send(res);
                            console.log("........", newVarificationId)
                        }
                    });


                    let result = {
                        _id: userData._id,
                    };

                    response.setData(AppCode.Success, result);
                    response.send(res);
                }
            });

        }
    });
};

/* user details Update*/
userCtrl.userUpdate = (req, res) => {
    var response = new HttpRespose();
    var _id = ObjectID(req.body._id);
    let bodydata = req.body;
    if (!!req.body) {
        try {
            let query = { _id: _id };
            delete bodydata._id
            UserModel.findOne(query, function (err, userdata) {
                if (err) {
                    response.setError(AppCode.Fail);
                    response.send(res);
                } else {
                    if (userdata === null) {
                        response.setError(AppCode.NotFound);
                        response.send(res);
                    } else {
                        if (!!req.body.userName) {
                            bodydata.userName = req.body.userName
                        }
                        if (!!req.files.profile_image) {
                            bodydata.profile_image = req.files.profile_image[0].filename;
                        }

                        UserModel.update(query, bodydata, function (err, userdata) {
                            if (err) {
                                console.log(err)
                                response.setError(AppCode.Fail);
                                response.send(res);
                            } else if (userdata == undefined || (userdata.matchedCount === 0 && userdata.modifiedCount === 0)) {
                                response.setError(AppCode.NotFound);
                            } else {
                                response.setData(AppCode.Success, req.body);
                                response.send(res);
                            }
                        });
                    }
                }
            });
        } catch (exception) {
            response.setError(AppCode.Fail);
            response.send(res);
        }
    }
    else {
        AppCode.Fail.error = "Oops! something went wrong, please try again later";
        response.setError(AppCode.Fail);
        response.send(res);
    }
};

// Otp Verification For userregistration
userCtrl.checkOtpVerificationForUser = (req, res) => {
    var response = new HttpRespose();
    var paramsObj = req.body;
    try {
        if (!!paramsObj.mobileNo && !!paramsObj.OTP) {
            currentTime = new Date();
            VarificationCodeModel.findOne(
                {
                    mobileNo: paramsObj.mobileNo,
                    token: paramsObj.OTP,
                    activity: 1,
                    status: 1,
                },
                function (err, varificationCode) {
                    if (err) {
                        //TODO: Log the error here
                        AppCode.Fail.error = err.message;
                        response.setError(AppCode.Fail);
                        response.send(res);
                    } else {
                        if (varificationCode !== null) {
                            let result = {
                                _id: req.body.userId,
                            };
                            console.log("......userId", varificationCode.userId)
                            let query = { _id: ObjectID(varificationCode.userId) }
                            if (varificationCode.expiredAt > currentTime) {

                                //generate session here (if match otp token generate)
                                UserModel.findOne(query, {}, (err, data) => {
                                    if (err) {
                                        console.log(err)
                                        response.setError(AppCode.Fail);
                                        response.send(res);
                                    } else {

                                        let bodydata = {

                                            isverified: true
                                        }

                                        UserModel.update(query, bodydata, function (err, userdata) {
                                            if (err) {
                                                console.log(err)
                                                response.setError(AppCode.Fail);
                                                response.send(res);
                                            } else if (userdata == undefined || (userdata.matchedCount === 0 && userdata.modifiedCount === 0)) {
                                                response.setError(AppCode.NotFound);
                                            } else {
                                                UserModel.generateSessionToken({ _id: data._id }, function (err, userResData) {
                                                    if (err) {
                                                        response.setError(err);
                                                        response.send(res);
                                                    } else {
                                                        

                                                        let query = [
                                                            {
                                                                $match: {
                                                                    _id: ObjectID(varificationCode.userId)
                                                                }
                                                            },
                                                            {
                                                                $project:{
                                                                    _id:1,
                                                                    mobileNo:1,
                                                                    countryName:1,
                                                                    countryCode:1,
                                                                    isverified:1,
                                                                    status:1,
                                                                    createdAt:1,
                                                                    updatedAt:1,
                                                                    profile_image:1,
                                                                    userName:1,


                                                                }
                                                            }
                                                        ];
                                                        UserModel.advancedAggregate(query, {}, (err, user) => {
                                                            if (err) {
                                                                throw err;
                                                            } else if (_.isEmpty(user)) {
                                                                response.setError(AppCode.NotFound);
                                                                response.send(res);
                                                            } else {
                                                                response.setData(AppCode.Success, user[0]);
                                                                response.send(res);
                                                            }
                                                        });

                                                        


                                                        console.log("generate session")
                                                      //  response.setData(AppCode.Success, data);
                                                      //  response.send(res);
                                                    }
                                                });

                                                console.log(" update verification true");

                                            }
                                        });

                                    }
                                })



                            } else {
                                response.setError(AppCode.OTPExpired);
                                response.send(res);
                            }
                        } else {
                            response.setError(AppCode.OTPVerifyFail);
                            response.send(res);
                        }
                    }
                }
            );
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
/* resend otp for user*/
userCtrl.resendOtpUser = (req, res) => {
    const response = new HttpRespose();
    console.log("zgfhsdhjgfhjgfjsdghsgdf")

    if (!!req.body.mobileNo && !!req.body) {
        try {
            let query = {
                mobileNo: req.body.mobileNo,

            };
            UserModel.findOne(query, function (err, User) {
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
                        // let activity = parseInt(req.body.activity);
                        // console.log("------------------------------------", activity);
                        VarificationCodeModel.removeMany({
                            mobileNo: req.body.mobileNo
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
                                    mobileNo: req.body.mobileNo,
                                    userId: ObjectID(User._id),
                                    activity: 1
                                };
                                VarificationCodeModel.create(params, function (err, newVarificationId) {
                                    if (err) {
                                        console.log(err)
                                        response.setError(AppCode.Fail);
                                        response.send(res);
                                    } else {

                                        // let userName = [User.firstName + " " + User.lastName]
                                        // console.log("---------------------", userName)
                                        // var transporter = nodemailer.createTransport({
                                        //     service: CONFIG.MAIL.SERVICEPROVIDER,
                                        //     auth: {

                                        //         user: CONFIG.MAIL.MAILID,
                                        //         pass: CONFIG.MAIL.PASSWORD
                                        //     }
                                        // });
                                        // var readHTMLFile = function (path, callback) {
                                        //     fs.readFile(path, { encoding: 'utf-8' }, function (err, html) {
                                        //         if (err) {
                                        //             throw err;
                                        //             callback(err);
                                        //         }
                                        //         else {
                                        //             callback(null, html);
                                        //         }
                                        //     });
                                        // };
                                        // readHTMLFile('../common/HtmlTemplate/ForgotPassword.html', function (err, html) {
                                        //     var template = handlebars.compile(html);
                                        //     var replacements = {
                                        //         // fullName: userName,
                                        //         OTP: newVarificationId.token,
                                        //         // email: user.otp,
                                        //         // // pwd: userData.password,
                                        //         // mobile: user.mobile,
                                        //     };
                                        //     // console.log("------", User.email,)

                                        //     var htmlToSend = template(replacements);
                                        //     var mailOptions = {
                                        //         from: CONFIG.MAIL.MAILID,
                                        //         to: User.c_Email,
                                        //         subject: 'resend OTP for user',
                                        //         html: htmlToSend,
                                        //         // text: 'Your password Is ' + password
                                        //     };
                                        //     // console.log("+++++++++++", mailOptions)
                                        //     console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@!!!!!!!!!!!!!!!", User.emailId)

                                        //     transporter.sendMail(mailOptions, function (error, info) {
                                        //         if (error) {
                                        //         } else {
                                        //             console.log('Email sent: ' + info.response);
                                        //         }

                                        //     });
                                        // });

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

/* user Active-Deactive */
userCtrl.userDataActiveDeActive = (req, res) => {
    const response = new HttpRespose();
    let query = { _id: ObjectID(req.body._id) };
    UserModel.updateOne(
        query,
        { $set: { status: req.body.status } },
        function (err, userActiveDeactive) {
            if (err) {
                console.log(err);
                AppCode.Fail.error = err.message;
                response.setError(AppCode.Fail);
                response.send(res);
            } else {
                response.setData(AppCode.Success);
                response.send(res);
            }
        }
    );
};

/* user Details By Id*/
userCtrl.userDetailsById = (req, res) => {
    const response = new HttpRespose();
    try {
        let query = [
            {
                $match: {
                    _id: ObjectID(req.body._id)
                }

            },
            {
                $project: {
                    _id: 1,
                    mobileNo: 1,
                    isverified: 1,
                    status: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    profile_image: 1,
                    userName: 1,





                }
            }
        ];
        UserModel.advancedAggregate(query, {}, (err, userData) => {
            if (err) {
                throw err;
            } else if (_.isEmpty(userData)) {
                response.setError(AppCode.NotFound);
                response.send(res);
            } else {
                response.setData(AppCode.Success, userData[0]);
                response.send(res);
            }
        });
    } catch (exception) {
        response.setError(AppCode.InternalServerError);
        response.send(res);
    }
}

userCtrl.getUserList = (req, res) => {
    const response = new HttpRespose();

    let searchKey = "";
    let sortField = "";
    let sortDirection = "";
    searchKey = !!req.query.searchKey ? req.query.searchKey : "";
    sortField = !!req.query.sortField ? req.query.sortField.toString() : "";
    sortDirection = !!req.query.sortDirection ? parseInt(req.query.sortDirection) : "";


    let options = {};
    let pageNumber = !!req.query.pageNumber ? (parseInt(req.query.pageNumber) - 1) : 0;

    const limit = parseInt(req.query.pageSize);
    const skip = limit * parseInt(pageNumber);
    // skip = limit * parseInt(pageNumber);
    options.skip = parseInt(skip);
    options.limit = limit;
    let condition = {};

    if (req.query.sortField == "userName") {
        condition = {
            userName: sortDirection
        }
    }

    if (req.query.sortField == "mobileNo") {
        condition = {
            mobileNo: sortDirection
        }
    }

    let query = [
        {
            $match: {

                $or: [
                    {
                        userName: new RegExp(
                            ".*" + searchKey.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&") + ".*",
                            "i"
                        ),
                    },
                    {
                        mobileNo: new RegExp(
                            ".*" + searchKey.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&") + ".*",
                            "i"
                        ),
                    },
                ],
            },


        },
        {
            $sort: { createdAt: -1 },
        },
        { $skip: skip },
        { $limit: limit },
        {
            $project: {
                _id: 1,
                mobileNo: 1,
                isverified: 1,
                status: 1,
                createdAt: 1,
                updatedAt: 1,
                profile_image: 1,
                userName: 1



            }
        }

    ];
    let countQuery = {
        $or: [
            {
                userName: new RegExp(
                    ".*" + searchKey.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&") + ".*",
                    "i"
                ),
            },
            {
                mobileNo: new RegExp(
                    ".*" + searchKey.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&") + ".*",
                    "i"
                ),
            },
        ],

    }
    try {
        let result = {};
        async.parallel(
            [
                function (cb) {
                    //UserModel.advancedAggregate(query, {}, (err, countData) => {
                    UserModel.count(countQuery, (err, countData) => {
                        if (err) {
                            throw err;
                        } else if (options.skip === 0 && countData === 0) {
                            cb(null);
                        } else if (options.skip > 0 && countData === 0) {
                            cb(null);
                        } else {
                            console.log("....coundata", countData)
                            if (countData <= skip + limit) {
                            } else {
                                result.nextPage = parseInt(pageNumber) + 1;
                                result.totaluser = countData;
                            }
                            cb(null);
                        }
                    });
                },
                function (cb) {
                    UserModel.aggregate(query, (err, followers) => {
                        if (err) {
                            throw err;
                        } else if (options.skip === 0 && _.isEmpty(followers)) {
                            cb(null);
                        } else if (options.skip > 0 && _.isEmpty(followers)) {
                            cb(null);
                        } else {
                            result.result = followers;
                            cb(null);
                        }
                    });
                },
            ],
            function (err) {
                if (err) {
                    throw err;
                } else if (options.skip === 0 && _.isEmpty(result.result)) {
                    response.setData(AppCode.NoUserFound, result);
                    response.send(res);
                } else if (options.skip > 0 && _.isEmpty(result.result)) {
                    response.setData(AppCode.NoMoreBlockUserFound, result);
                    response.send(res);
                } else {
                    response.setData(AppCode.Success, result);
                    response.send(res);
                }
            }
        );
    } catch (exception) {
        response.setError(AppCode.InternalServerError);
        response.send(res);
    }

};

// favorite added Like 
userCtrl.favoriteCreate = (req, res) => {
    var response = new HttpRespose()
    try {
        let query = [
            {
                $match: {
                    $expr: {
                        $and: [
                            {
                                $eq: ["$userId", ObjectID(req.body.userId)]
                            },
                            {
                                $eq: ["$favId", ObjectID(req.body.favId)]
                            },
                        ]
                    },
                },
            },
        ];
        FavouriteModel.advancedAggregate(query, {}, (err, favadd) => {
            if (err) {
                throw err;
            } else if (_.isEmpty(favadd)) {
                FavouriteModel.create({ userId: ObjectID(req.body.userId), favId: ObjectID(req.body.favId) }, (err, favadd) => {
                    if (err) {
                        console.log("111111111111111", err);
                        response.setError(AppCode.Fail);
                        response.send(res);
                    } else {
                        // console.log("req.auth", req.auth);
                        response.setData(AppCode.Success, favadd);
                        response.send(res);
                    }
                });
            } else {
                response.setError(AppCode.allReadyadded);
                response.send(res);
            }
        });
    } catch (exception) {
        response.setError(AppCode.InternalServerError);
        response.send(res);
    }
};

// favourite Job List User Wise
userCtrl.favouriteUserList2 = (req, res) => {
    const response = new HttpRespose();
    //   console.log("@@@@@@@@@@@@@@@@", req.auth._id)
    //  let abc=ObjectID(req.auth._id)
    //console.log(",,,,,abc.....",abc)

    let query = []

    let SearchKey = '';

    SearchKey = !!req.body.searchKey ? req.body.searchKey : "";

    try {
        if (!!req.body.searchKey && req.body.searchKey !== "" && req.body.userId) {
            console.log("222222222222222222222222222searchkey")
            query = [
                {
                    $match: {
                        $expr: {
                            $eq: ["$userId", ObjectID(req.body.userId)]
                        },
                    },
                },

                {
                    $lookup: {
                        from: "user",
                        as: "userData",
                        let: { userId: "$userId" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            {
                                                $eq: ["$_id", "$$userId"],
                                            },
                                        ],
                                    },
                                    // $or: [
                                    //     {
                                    //         userName: new RegExp(
                                    //             ".*" +
                                    //             SearchKey.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&") +
                                    //             ".*",
                                    //             "i"
                                    //         ),
                                    //     },

                                    // ],

                                },
                            },

                            {
                                $project: {
                                    _id: 1,
                                    userName: 1,


                                },
                            },
                        ],
                    },
                },
                {
                    $unwind: {
                        path: "$userData",
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $lookup: {
                        from: "user",
                        as: "userDataa",
                        let: { favId: "$favId" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            {
                                                $eq: ["$_id", "$$favId"],
                                            },
                                        ],
                                    },
                                    $or: [
                                        {
                                            userName: new RegExp(
                                                ".*" +
                                                SearchKey.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&") +
                                                ".*",
                                                "i"
                                            ),
                                        },

                                    ],

                                },
                            },

                            {
                                $project: {
                                    _id: 1,
                                    userName: 1,


                                },
                            },
                        ],
                    },
                },
                {
                    $unwind: {
                        path: "$userDataa",
                        preserveNullAndEmptyArrays: true,
                    },
                },

                {
                    $project: {
                        _id: 1,
                        userId: 1,
                        favId: 1,
                        "favname": "$userDataa.userName"
                        // userName:"$userDataa.userName"



                    },
                },
            ];
        }
        else {
            console.log("11111111111111111111111111111111111111111111111111111")
            query = [
                {
                    $match: {
                        $expr: {
                            $eq: ["$userId", ObjectID(req.body.userId)]
                        },
                    },
                },

                {
                    $lookup: {
                        from: "user",
                        as: "userData",
                        let: { userId: "$userId" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            {
                                                $eq: ["$_id", "$$userId"],
                                            },
                                        ],
                                    },
                                    // $or: [
                                    //     {
                                    //         userName: new RegExp(
                                    //             ".*" +
                                    //             SearchKey.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&") +
                                    //             ".*",
                                    //             "i"
                                    //         ),
                                    //     },

                                    // ],

                                },
                            },

                            {
                                $project: {
                                    _id: 1,
                                    userName: 1,


                                },
                            },
                        ],
                    },
                },
                {
                    $unwind: {
                        path: "$userData",
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $project: {
                        _id: 1,
                        userId: 1,
                        favId: 1,

                        userName: "$userData.userName"



                    },
                },
            ];
        }

        console.log(query);
        FavouriteModel.advancedAggregate(query, {}, (err, favouriteJobList) => {
            if (err) {
                throw err;
            } else if (_.isEmpty(favouriteJobList)) {
                response.setError(AppCode.NotFound);
                response.send(res);
            } else {

                response.setData(AppCode.Success, favouriteJobList);
                response.send(res);
            }
        });
    } catch (exception) {
        console.log("*&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&", exception)
        response.setError(AppCode.InternalServerError);
        response.send(res);
    }
}

// favourite Job List User Wise
userCtrl.favouriteUserList = (req, res) => {
    const response = new HttpRespose();
    //   console.log("@@@@@@@@@@@@@@@@", req.auth._id)
    //  let abc=ObjectID(req.auth._id)
    //console.log(",,,,,abc.....",abc)

    let query = []

    let SearchKey = '';

    SearchKey = !!req.body.searchKey ? req.body.searchKey : "";

    try {
        if (!!req.body.searchKey && req.body.searchKey !== "") {
            console.log("11111111111111111111111111111111111111111111111111111")
            query = [
                {
                    $match: {
                        $expr: {
                            $eq: ["$userId", ObjectID(req.body.userId)]
                        },
                    },
                },

                {
                    $lookup: {
                        from: "user",
                        as: "userData",
                        let: { userId: "$userId" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            {
                                                $eq: ["$_id", "$$userId"],
                                            },
                                        ],
                                    },
                                    // $or: [
                                    //     {
                                    //         userName: new RegExp(
                                    //             ".*" +
                                    //             SearchKey.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&") +
                                    //             ".*",
                                    //             "i"
                                    //         ),
                                    //     },

                                    // ],

                                },
                            },

                            {
                                $project: {
                                    _id: 1,
                                    userName: 1,


                                },
                            },
                        ],
                    },
                },
                {
                    $unwind: {
                        path: "$userData",
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $lookup: {
                        from: "user",
                        as: "userDataa",
                        let: { favId: "$favId" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            {
                                                $eq: ["$_id", "$$favId"],
                                            },




                                        ],
                                    },
                                    $or: [
                                        {
                                            userName: new RegExp(
                                                ".*" +
                                                SearchKey.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&") +
                                                ".*",
                                                "i"
                                            ),
                                        },

                                    ]

                                },
                            },

                            {
                                $project: {
                                    _id: 1,
                                    userName: 1,


                                },
                            },
                        ],
                    },
                },
                {
                    $unwind: {
                        path: "$userDataa",
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $project: {
                        _id: 1,
                        userId: 1,
                        favId: 1,
                        "favoritename": "$userDataa.userName",
                        // userDataa:1,
                        // userName: "$userData.userName"
                    },
                },
            ];




            console.log(query);
            FavouriteModel.advancedAggregate(query, {}, (err, favouriteJobList) => {
                if (err) {
                    throw err;
                } else if (_.isEmpty(favouriteJobList)) {
                    response.setError(AppCode.NotFound);
                    response.send(res);
                } else {
                    console.log(",,,,,,,,,", favouriteJobList)
                    let jobMasterData = []
                    for (let i = 0; i < favouriteJobList.length; i++) {

                        if (!!favouriteJobList[i].favoritename) {
                            let data = {
                                _id: favouriteJobList[i]._id,
                                userId: favouriteJobList[i].userId,
                                favId: favouriteJobList[i].favId,
                                favoritename: favouriteJobList[i].favoritename


                            }
                            jobMasterData.push(data);
                        }
                        else {
                            console.log(",,,,,else")

                        }



                    }

                    response.setData(AppCode.Success, jobMasterData);
                    response.send(res);
                }
            });
        }
        else {
            console.log("11111111111111111111111111111111111111111111111111111")
            query = [
                {
                    $match: {
                        $expr: {
                            $eq: ["$userId", ObjectID(req.body.userId)]
                        },
                    },
                },

                {
                    $lookup: {
                        from: "user",
                        as: "userData",
                        let: { userId: "$userId" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            {
                                                $eq: ["$_id", "$$userId"],
                                            },
                                        ],
                                    },


                                },
                            },


                            {
                                $project: {
                                    _id: 1,
                                    userName: 1,


                                },
                            },
                        ],
                    },
                },
                {
                    $unwind: {
                        path: "$userData",
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $lookup: {
                        from: "user",
                        as: "userDataa",
                        let: { favId: "$favId" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            {
                                                $eq: ["$_id", "$$favId"],
                                            },

                                            {
                                                userName: new RegExp(
                                                    ".*" +
                                                    SearchKey.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&") +
                                                    ".*",
                                                    "i"
                                                ),
                                            },


                                        ],
                                    },

                                },
                            },

                            {
                                $project: {
                                    _id: 1,
                                    userName: 1,


                                },
                            },
                        ],
                    },
                },
                {
                    $unwind: {
                        path: "$userDataa",
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $project: {
                        _id: 1,
                        userId: 1,
                        favId: 1,
                        "favoritename": "$userDataa.userName",

                        userName: "$userData.userName"



                    },
                },

            ];


            console.log(query);
            FavouriteModel.advancedAggregate(query, {}, (err, favouriteJobList) => {
                if (err) {
                    throw err;
                } else if (_.isEmpty(favouriteJobList)) {
                    response.setError(AppCode.NotFound);
                    response.send(res);
                } else {

                    response.setData(AppCode.Success, favouriteJobList);
                    response.send(res);
                }
            });
        }
    } catch (exception) {
        console.log("*&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&", exception)
        response.setError(AppCode.InternalServerError);
        response.send(res);
    }
}

// favourite Job List User Wise
userCtrl.favouriteUserList1 = (req, res) => {
    const response = new HttpRespose();
    //   console.log("@@@@@@@@@@@@@@@@", req.auth._id)
    //  let abc=ObjectID(req.auth._id)
    //console.log(",,,,,abc.....",abc)

    let query = []

    let SearchKey = '';

    SearchKey = !!req.body.searchKey ? req.body.searchKey : "";

    try {

        console.log("222222222222222222222222222searchkey")
        query = [
            {
                $match: {
                    $expr: {
                        $and: [
                            {
                                $eq: ["$_id", ObjectID(req.body.userId)],
                            },
                        ],
                    },
                    $or: [
                        {
                            userName: new RegExp(
                                ".*" +
                                SearchKey.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&") +
                                ".*",
                                "i"
                            ),
                        },

                    ],



                },
            },

            {
                $lookup: {
                    from: "favourite",
                    as: "favouriteData",
                    let: { favId: "$favId" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        {
                                            $eq: ["$_id", "$$favId"],
                                        },
                                    ],
                                },


                            },
                        },

                        {
                            $project: {
                                _id: 1,
                                userName: 1,


                            },
                        },
                    ],
                },
            },
            {
                $unwind: {
                    path: "$favouriteData",
                    preserveNullAndEmptyArrays: true,
                },
            },


            {
                $project: {
                    _id: 0,
                    favouriteData: 1



                },
            },
        ];



        console.log(query);
        UserModel.advancedAggregate(query, {}, (err, favouriteJobList) => {
            if (err) {
                throw err;
            } else if (_.isEmpty(favouriteJobList)) {
                response.setError(AppCode.NotFound);
                response.send(res);
            } else {

                response.setData(AppCode.Success, favouriteJobList);
                response.send(res);
            }
        });
    } catch (exception) {
        console.log("*&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&", exception)
        response.setError(AppCode.InternalServerError);
        response.send(res);
    }
}


/* State List For Admin */
userCtrl.stateListForAdmin = (req, res) => {
    const response = new HttpRespose();
    //let query = {status :  1}
    let Country = require('country-state-city').Country;
    let State = require('country-state-city').State;
    let stateData = State.getStatesOfCountry('IN')

    let stateList = []

    stateData.forEach(function (stateData) {
        // console.log(stateData);
        var customObj = {
            'isoCode': stateData.isoCode,
            'name': stateData.name,
        }
        stateList.push(customObj)
    });
    response.setData(AppCode.Success, stateList);
    response.send(res);
};




module.exports = userCtrl;
