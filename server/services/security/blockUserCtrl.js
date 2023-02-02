let blockUserCtrl = {};
const HttpRespose = require("../../common/httpResponse");
const Logger = require("../../common/logger");
const bcrypt = require("bcryptjs");
const blacklist = require("express-jwt-blacklist");
const ObjectID = require("mongodb").ObjectID;
const CONFIG = require("../../config");
const _ = require("lodash");
const async = require("async");
const AppCode = require("../../common/constant/appCods");
const { remove } = require("lodash");
//const userModel = require("../../common/model/userModel");
//const userModel = require("../../common/model/userModel");

//const MasterUserModel = new (require("../../common/model/userModel"))();
const BlockUserModel = new (require("../../common/model/blockUserModel"))();
const NotificationModel =
  new (require("../../common/model/NotificationModel"))();
const UserModel =
  new (require("../../common/model/userModel"))();

blockUserCtrl.blockUser = (req, res) => {
  var response = new HttpRespose();
 
  try {
    BlockUserModel.findOne(
      {
        userId: ObjectID(req.body._id),
        blockedUserId: ObjectID(req.body.blockedUserId),
        status: 1,
      },
      (err, blockedUserFind) => {
        if (err) {
          console.log(err);
          throw err;
        } else if (_.isEmpty(blockedUserFind)) {

          BlockUserModel.create(
            {
              userId: ObjectID(req.body._id),
              blockedUserId: ObjectID(req.body.blockedUserId),
            },
            (err, blockedUser) => {
              if (err) {
                console.log(err);
                throw err;
              } else {

                //block array save in user table 
                UserModel.findOne(
                  {
                    _id: ObjectID(req.body._id),
                  },
                  (err, userfind) => {
                    if (err) {
                      console.log(err);
                      throw err;
                    } else {
                      if (userfind == null) {
                        AppCode.Fail.error = "No record found";
                        response.setError(AppCode.Fail);
                        response.send(res);
                      } else {

                        if (!!userfind.blockUser) {
                          let updateDataQuery = {};
                          console.log("................", userfind.blockUser)
                          let aaa = []
                          let bbb = []
                          aaa = userfind.blockUser
                          console.log(",,,,,,,,,,,,,,,,,,,,,,,", req.body.blockedUserId)
                          bbb.push(ObjectID(req.body.blockedUserId))

                          let abc = aaa.concat(bbb)
                          console.log("......................................abcccccccc", abc)


                          console.log(".........abc after", abc)


                          updateDataQuery.blockUser = abc
                          console.log(".......updateDataQuery.......", updateDataQuery)

                          // delete req.body._id
                          UserModel.update({ _id: ObjectID(req.body._id) }, updateDataQuery, function (err, roleUpdate) {
                            if (err) {
                              console.log("...........", err);
                              response.setError(AppCode.Fail);
                            } else {

                              console.log(")))))))))", updateDataQuery);
                              response.setData(AppCode.Success);
                              response.send(res);
                            }
                          });



                        }
                        else {
                          let updateDataQuery = {};


                          let a1 = []
                          a1.push(ObjectID(req.body.blockedUserId))

                          console.log("a111111111111111111", a1);
                          updateDataQuery.blockUser = a1

                          console.log("<MMMMMMMM", updateDataQuery);



                          // delete req.body._id
                          UserModel.update({ _id: ObjectID(req.body._id) }, updateDataQuery, function (err, roleUpdate) {
                            if (err) {
                              console.log("...........", err);
                              response.setError(AppCode.Fail);
                            } else {

                              console.log(")))))))))", updateDataQuery);
                              response.setData(AppCode.Success);
                              response.send(res);
                            }
                          });

                        }

                      }
                    }
                  }
                );
                // response.setError(AppCode.Success, blockedUser);
                // response.send(res);

              }
            }
          );
        } else {

          console.log("blockedUserFindblockedUserFindblockedUserFind",blockedUserFind)
          response.setError(AppCode.AlreadyBlock);
          response.send(res);
        }
      }
    );
  } catch (exception) {
    response.setError(AppCode.InternalServerError);
    response.send(res);
  }
};

blockUserCtrl.getBlockUserList = (req, res) => {
  const response = new HttpRespose();
  let data = req.body;
  let searchKey = "";
  let options = {};
  searchKey = !!req.query.searchKey ? req.query.searchKey : "";
  let pageNumber = !!req.query.pageNumber ? req.query.pageNumber : 0;
  // let loginUserId = ObjectID(req.payload.userId);
  const limit = 10;
  const skip = limit * parseInt(pageNumber);
  options.skip = skip;
  options.limit = limit;
  getBlockedUserList(req.auth._id).then((user) => {
    console.log(",,,,,,,,,,", user)
    const blockuser = [];
    _.forEach(user.blockedUserData, (follower) => {
      console.log("------follower-----------------", follower);
      blockuser.push(ObjectID(follower.blockedUserId));
      console.log("---------buddyRequest--------------", blockuser);
    });

    let query = [
      {
        $match: {
          $or: [
            {
              //userName: new RegExp('^' + searchKey.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i'),
              userName: new RegExp(
                ".*" + searchKey.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&") + ".*",
                "i"
              ),
            },

          ],

          $expr: {
            $in: ["$_id", blockuser],
          },
          // status: { $ne: 2 },
          // isdeleted: { $ne: true },
        },
      },
      { $sort: { userName: 1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          userId: 1,
          userName: 1,
         
          profile_image: { $ifNull: ["$profile_image", ""] },

          // qualityRating: { $ifNull: ["$qualityRating", 0] },
          // rolies: { $ifNull: ["$roliesRating", 0] },
          // statusType: 1,
          // quntities: { $ifNull: ["$quntitiesRating", 0] },
          // Rating: {
          //   $ifNull: [
          //     {
          //       $divide: [
          //         {
          //           $sum: [
          //             "$qualityRating",
          //             "$roliesRating",
          //             "$quntitiesRating",
          //           ],
          //         },
          //         3,
          //       ],
          //     },
          //     0,
          //   ],
          // },
          //  about: 1,
          // isBuddy: "false",
          //  isBuddyRequested: "false",
        },
      },
    ];
    let countQuery = {
      $or: [
        {
          userName: new RegExp(
            ".*" + searchKey.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&") + ".*",
            "i"
          ),
        },
      ],

      $expr: {
        $in: ["$_id", blockuser],
      },
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
                  result.totalblockuser = countData;
                } else {
                  result.nextPage = parseInt(pageNumber) + 1;
                  result.totalblockuser = countData;
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
            response.setData(AppCode.NotFound, result);
            response.send(res);
          } else if (options.skip > 0 && _.isEmpty(result.result)) {
            response.setData(AppCode.NotFound, result);
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
  });
};


//-- party-plot List 
blockUserCtrl.blockUserList = (req, res) => {
  const response = new HttpRespose();
  try {
    let query = [
      {
        $match: {
          _id: ObjectID(req.query._id)
        },
      },
      {
        $lookup: {
          from: "user",
          let: { blockUser: "$blockUser" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: [
                    "$_id",
                    {
                      $cond: {
                        if: { $isArray: "$$blockUser" },
                        then: "$$blockUser",
                        else: [],
                      },
                    },
                  ],
                },
              },
            },
            {
              $project: {
                _id: 1,
                userName: 1
              },
            },
          ],
          as: "blockuserList",
        },
      },
      {
        $project: {
          _id: 1,
          //  address: 1,
          userName: 1,
          //  status: 1,
          //  createdby: 1,
          //  updatedBy: 1,
          // createdAt: 1,
          // updatedAt: 1,
          blockuserList: 1
        },
      },
    ];
    UserModel.advancedAggregate(query, {}, (err, partyplot) => {
      if (err) {
        throw err;
      } else if (_.isEmpty(partyplot)) {
        response.setError(AppCode.NotFound);
        response.send(res);
      } else {
        response.setData(AppCode.Success, partyplot);
        response.send(res);
      }
    });
  } catch (exception) {
    response.setError(AppCode.InternalServerError);
    response.send(res);
  }
}



blockUserCtrl.unblockUser = (req, res) => {
  var response = new HttpRespose();
  try {
    BlockUserModel.findOne(
      {
        userId: ObjectID(req.body._id),
        blockedUserId: ObjectID(req.body.blockedUserId),
      },
      (err, blockedUserFind) => {
        if (err) {
          throw err;
        } else {
          BlockUserModel.remove(
            {
              userId: ObjectID(req.body._id),
              blockedUserId: ObjectID(req.body.blockedUserId),
            },
            (err, newId) => {
              if (err) {
                throw err;
              } else {

                //block array save in user table 
                UserModel.findOne(
                  {
                    _id: ObjectID(req.body._id),
                  },
                  (err, userfind) => {
                    if (err) {
                      console.log(err);
                      throw err;
                    } else {
                      if (userfind == null) {
                        AppCode.Fail.error = "No record found";
                        response.setError(AppCode.Fail);
                        response.send(res);
                      } else {
                        // console.log("................",userfind)


                        let updateDataQuery = {};
                        //  console.log("................",userfind.blockUser)
                        let users = []
                        let Users = []
                        users = userfind.blockUser
                        Users = userfind.blockUser

                        console.log("usersssssssss", users);

                        for (let i = 0; i < Users.length; i++) {

                          if ((req.body.blockedUserId).toString() == (Users[i]).toString()) {
                            console.log("disconneceted user...................", Users[i])


                            console.log(".....if......")

                            users.splice(i, 1)


                            updateDataQuery.blockUser = users

                            // if ((Users.length - 1) == i) {
                              UserModel.update({ _id: ObjectID(req.body._id) }, updateDataQuery, function (err, roleUpdate) {
                                if (err) {
                                  console.log("...........", err);
                                  response.setError(AppCode.Fail);
                                } else {

                                  console.log(")))))))))", updateDataQuery);
                                  response.setData(AppCode.Success);
                                  response.send(res);
                                }
                              });
                            // }

                          }
                          else {
                            console.log("...............else");
                          }

                        }


                      

                      //console.log("user disconnected", users);
                      // console.log("user connected after disconnecting......", users);

                      updateDataQuery.blockUser = users








                    }
                  }
                  }
                );





          //response.setData(AppCode.Success);
          // response.send(res);
        }
      }
    );
  }
      }
    );
  } catch (exception) {
  console.log(exception);
  response.setError(AppCode.InternalServerError);
  response.send(res);
}
};

const getBlockedUserList = (userId) => {
  console.log(userId);
  const promise = new Promise((resolve, reject) => {
    let query = [
      {
        $match: {
          _id: ObjectID(userId),
        },
      },
      {
        $lookup: {
          from: "blockedUser",
          as: "blockedUserData",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: ["$userId", ObjectID(userId)],
                    },

                    {
                      $eq: ["$status", 1],
                    },
                  ],
                },
              },
            },
            {
              $project: {
                userId: 1,
                blockedUserId: 1,
              },
            },
          ],
        },
      },
      {
        $project: {
          _id: 0,
          blockedUserData: 1,
        },
      },
    ];
    UserModel.advancedAggregate(query, {}, (err, user) => {
      if (err) {
        return reject(err);
      }
      console.log("***********", user);
      return resolve(user[0]);
    });
  });

  return promise;
};

module.exports = blockUserCtrl;
