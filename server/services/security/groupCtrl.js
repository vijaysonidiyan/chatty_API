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
const { update } = require("./postCtrl");


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

              if (!!req.body.group_admin) {
                query.group_admin = req.body.group_admin.split(",");
                query.group_admin.map((obj, index) => {
                    query.group_admin[index] = ObjectID(obj.trim());
                });
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


// - not use
/* user details Update*/
groupCtrl.groupUpdateold = (req, res) => {
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
                        if (!!req.body.group_admin) {
                            bodydata.group_admin = req.body.group_admin.split(",");
                            bodydata.group_admin.map((obj, index) => {
                                bodydata.group_admin[index] = ObjectID(obj.trim());
                            });
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
/* user Details By Id*/
groupCtrl.groupUpdate = (req, res) => {
    const response = new HttpRespose();

    let user=[]
    user.push(ObjectID(req.body.group_admin))

    console.log("group_admingroup_admin",user);
    try {
        let query = [
            {
                $match: {
                    $and:[
                        {
                            group_admin: {
                                $in: [
                                    ObjectID(req.body.group_admin)
                                ]
                            },

                        },
                        {
                            _id:ObjectID(req.body._id)

                        }
                    ]
                  
                
                }

            },
           
        ];
        GroupModel.advancedAggregate(query, {}, (err, group) => {
            if (err) {
                throw err;
            } else if (_.isEmpty(group)) {
                console.log("groupgroupgroup");
                response.setError(AppCode.NotFound);
                response.send(res);
            } else {
                console.log("groupgroupgroup",group[0]);
                let updatedataQuery={}
              
               
                if (!!req.body.addUser && req.body.deleteuser== null) {
                    
          
                  console.log("only add user passed");
                 

                  let final =[]
                  let adduser =[]
                  adduser = req.body.addUser.split(",");
                  adduser.map((obj, index) => {
                      adduser[index] = ObjectID(obj.trim());
                  });
                //  console.log("adduseradduseradduseradduser",adduser);
                 // console.log("previousssssssssssssss",group[0].group_user)
                  final = adduser.concat(group[0].group_user)
                //  console.log("group[0].group_usergroup[0].group_usergroup[0].group_user",final)
                  updatedataQuery.group_user=final

              
                }
             
                if (!!req.body.addUser && !!req.body.deleteuser) {

                    console.log("adduserrrrrrrrr and deleteuser");

                    let adduser = []
                    let array=[]
                    adduser = req.body.addUser.split(",");
                    adduser.map((obj, index) => {
                        adduser[index] = ObjectID(obj.trim());
                    });
                   // console.log("adduseradduseradduseradduser", adduser);

                    let deleteuser = []
                    deleteuser = req.body.deleteuser.split(",");
                    deleteuser.map((obj, index) => {
                        deleteuser[index] = ObjectID(obj.trim());
                    });
                   // console.log("deleteddddddddddd", deleteuser);
                   // console.log("previousssssssssssssss",group[0].group_user)

                   // console.log("only document passed");
                 

                    let final =[]
                
                    adduser = req.body.addUser.split(",");
                    adduser.map((obj, index) => {
                        adduser[index] = ObjectID(obj.trim());
                    });
                  //  console.log("adduseradduseradduseradduser",adduser);
                   // console.log("previousssssssssssssss",group[0].group_user)
                    final = adduser.concat(group[0].group_user)
                  //  console.log("adduserrrrrrrrrrrrrrrrrrrrfinalllllllll",final)
                   

                    for (let i = 0; i < deleteuser.length; i++) {

                        for (let a = 0; a < final.length; a++) {

                          //  console.log("deleteuser", deleteuser[i]);
                          //  console.log("finalll", final[a]);

                            if (deleteuser[i].toString() == final[a].toString()) {
                              //  console.log("spliceeeeeeeeeeeeeeeeee");

                                final.splice(a, 1)

                            }
                            if ((deleteuser.length - 1) == i) {

                             //   console.log("finallllllllllllllllllllllllllllllllllllllllllll",final);

                                updatedataQuery.group_user = final
                               // console.log("updatedataQueryupdatedataQuery",updatedataQuery.group_user);


                            }
                        }

                    }

                } 

                if(!!req.body.deleteuser && req.body.addUser == null)
                {

                    console.log("deleteuser onlyyyyyyyyyy");
                    
                    let deleteuser = []
                    deleteuser = req.body.deleteuser.split(",");
                    deleteuser.map((obj, index) => {
                        deleteuser[index] = ObjectID(obj.trim());
                    });
                   // console.log("deleteddddddddddd", deleteuser);
                    //console.log("previousssssssssssssss",group[0].group_user)

                    let final =[]

                    final =group[0].group_user

                    for (let i = 0; i < deleteuser.length; i++) {

                        for (let a = 0; a < final.length; a++) {

                          //  console.log("deleteuser", deleteuser[i]);
                           // console.log("finalll", final[a]);

                            if (deleteuser[i].toString() == final[a].toString()) {
                             //   console.log("spliceeeeeeeeeeeeeeeeee");

                                final.splice(a, 1)

                            }
                            if ((deleteuser.length - 1) == i) {

                                console.log("finallllllllllllllllllllllllllllllllllllllllllll",final);

                                updatedataQuery.group_user = final
                              //  console.log("updatedataQueryupdatedataQuery",updatedataQuery.group_user);


                            }
                        }

                    }


                }
          
               
          
                if (!!req.body.group_name) {
                    updatedataQuery.group_name = req.body.group_name

                }
                if (!!req.files.profile_image) {
                    updatedataQuery.profile_image = req.files.profile_image[0].filename;
                }
                if (!!req.body.status) {
                    updatedataQuery.status =parseInt(req.body.status)
                }


              let q ={
                _id:ObjectID(req.body._id)
              }
              delete req.body._id;

                GroupModel.update(q, updatedataQuery, function (err, groupdata) {
                  if (err) {
                    console.log("err",err);
                    response.setError(AppCode.Fail);
                    response.send(res);
                  } else if (
                    groupdata == undefined ||
                    (groupdata.matchedCount === 0 &&
                      groupdata.modifiedCount === 0)
                  ) {
                    response.setError(AppCode.NotFound);
                  } else {
                    response.setData(AppCode.Success);
                    response.send(res);
                  }
                });

              //  response.setData(AppCode.Success, userData[0]);
              //  response.send(res);
            }
        });
    } catch (exception) {
        response.setError(AppCode.InternalServerError);
        response.send(res);
    }
}


/* user Details By Id*/
groupCtrl.groupDetailsById = (req, res) => {
    const response = new HttpRespose();
    try {
        let query = [
            {
                $match: {
                    _id: ObjectID(req.query._id)
                }

            },
           
        ];
        GroupModel.advancedAggregate(query, {}, (err, userData) => {
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

/* user Details By Id*/
groupCtrl.allGroupDetails = (req, res) => {
    const response = new HttpRespose();
    try {
        let query = [
           
           
        ];
        GroupModel.advancedAggregate(query, {}, (err, userData) => {
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
