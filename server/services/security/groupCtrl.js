let groupCtrl = {};

// const RoleModel = new (require("./../../common/model/roleModel)),
const HttpRespose = require("../../common/httpResponse");
const Logger = require("../../common/logger");
const bcrypt = require("bcryptjs");
const blacklist = require('express-jwt-blacklist');
const UserModel = new (require("./../../common/model/userModel"))
const VarificationCodeModel = new (require("./../../common/model/varificationCodeModel"))
const FavouriteModel = new (require("./../../common/model/favouriteModel"))
const UserWiseVerifiedUserModel = new (require("./../../common/model/userWiseVerifiedUserModel"))
const ContactModel = new (require("./../../common/model/contactModel"))
const ChatModel = new (require("./../../common/model/chatModel"))
const GroupModel = new (require("./../../common/model/groupModel"))
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
const { result } = require("lodash");


/*group create */
groupCtrl.groupCreate = (req, res) => {
    var response = new HttpRespose();
    var data = req.body;
    console.log(data);
    let query = { group_name: req.body.group_name };
    GroupModel.findOne({}, function (err, groupdata) {
        if (err) {
            //TODO: Log the error here
            AppCode.Fail.error = err.message;
            response.setError(AppCode.Fail);
            response.send(res);
        } else  {
            console.log(".....................................", groupdata)

            let query = req.body;
            if (!!req.body.group_user) {
                query.group_user = req.body.group_user.split(",");
                query.group_user.map((obj, index) => {
                    query.group_user[index] = ObjectID(obj.trim());
                });
              }
            if (!!req.files.profile_image) {
                query.profile_image = req.files.profile_image[0].filename;
              }

              if (!!req.body.admin) {
                query.admin = ObjectID(req.body.admin);
              }
            GroupModel.create(query, (err, data) => {
                if (err) {
                    console.log(err);
                    response.setError(AppCode.Fail);
                    response.send(res);
                }
                else {
                    response.setData(AppCode.Success,data);
                    response.send(res);   
                }
            });
        }
       
    });
};

/* user details Update*/
groupCtrl.groupUpdate = (req, res) => {
    var response = new HttpRespose();
    var _id = ObjectID(req.body._id);
    let bodydata = req.body;
    if (!!req.body) {
        try {
            let query = {
                _id: ObjectID(req.body._id),
                admin: ObjectID(req.body.admin)
            };
            delete bodydata._id
            GroupModel.findOne(query, function (err, userdata) {
                if (err) {
                    response.setError(AppCode.Fail);
                    response.send(res);
                } else {
                    if (userdata === null) {
                        response.setError(AppCode.NotFound);
                        response.send(res);
                    } else {
                        if (!!req.body.group_name) {
                            bodydata.group_name = req.body.group_name
                        }
                        if (!!req.files.profile_image) {
                            bodydata.profile_image = req.files.profile_image[0].filename;
                        }
                        if (!!req.body.admin) {
                            bodydata.admin = ObjectID(req.body.admin);
                        }
                        if (!!req.body.group_user) {
                            bodydata.group_user = req.body.group_user.split(",");
                            bodydata.group_user.map((obj, index) => {
                                bodydata.group_user[index] = ObjectID(obj.trim());
                            });
                          }

                        GroupModel.update(query, bodydata, function (err, userdata) {
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

/* user details Update*/
groupCtrl.removeProfile = (req, res) => {
    var response = new HttpRespose();
    var _id = ObjectID(req.body._id);

    let bodydata = {}
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


                        bodydata.profile_image = "";


                        UserModel.update(query, bodydata, function (err, userdata) {
                            if (err) {
                                console.log(err)
                                response.setError(AppCode.Fail);
                                response.send(res);
                            } else if (userdata == undefined || (userdata.matchedCount === 0 && userdata.modifiedCount === 0)) {
                                response.setError(AppCode.NotFound);
                            } else {
                                response.setData(AppCode.Success);
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

/* user Details By Id*/
groupCtrl.userDetailsById = (req, res) => {
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

//userList_final_with_searchfield
groupCtrl.getUserList = (req, res) => {
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
            $sort: condition,
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
                                result.totaluser = countData;

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

//userList_final_with_searchfield
groupCtrl.getActiveUserList = (req, res) => {
    const response = new HttpRespose();

    let searchKey = "";
    let sortField = "";
    let sortDirection = "";
    searchKey = !!req.query.searchKey ? req.query.searchKey : "";

    var userId = ObjectID(req.auth._id)
    console.log("userIduserIduserIduserId", userId)

    let condition = {};


    let query = [
        {
            $match: {
                $and: [
                    {
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
                    {
                        status: { $eq: 1 }

                    },
                    {
                        isverified: { $eq: true }

                    },
                    {

                        _id: { $ne: ObjectID(req.auth._id) },


                    }
                ]


            },


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
                countryCode: 1,
                countryName: 1




            }
        }

    ];
    let countQuery = {
        $and: [
            {
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
            {
                status: { $eq: 1 }

            },
            {
                isverified: { $eq: true }

            },
            {

                _id: { $ne: ObjectID(req.auth._id) },


            }
        ]

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
                        } else {
                            console.log("....coundata", countData)
                            result.totaluser = countData;

                            cb(null);
                        }
                    });
                },
                function (cb) {
                    UserModel.aggregate(query, (err, followers) => {
                        if (err) {
                            throw err;
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



module.exports = groupCtrl;
