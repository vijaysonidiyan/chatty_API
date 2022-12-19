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


const MasterUserModel = new (require("../../common/model/userModel"))();
const BlockUserModel = new (require("../../common/model/blockUserModel"))();
const NotificationModel =
  new (require("../../common/model/NotificationModel"))();
const UserModel =
  new (require("../../common/model/userModel"))();

blockUserCtrl.blockUser = (req, res) => {
  var response = new HttpRespose();
  // let data = {
  //     userId: ObjectID(req.payload.userId),
  //     blockedUserId: ObjectID(req.body.blockedUserId)
  // }
  try {
    BlockUserModel.findOne(
      {
        userId: ObjectID(req.auth._id),
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
              userId: ObjectID(req.payload.userId),
              blockedUserId: ObjectID(req.body.blockedUserId),
            },
            (err, blockedUser) => {
              if (err) {
                console.log(err);
                throw err;
              } else {
                response.setError(AppCode.Success,blockedUser);
                response.send(res);
               
              }
            }
          );
        } else {
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
  const limit = 1;
  const skip = limit * parseInt(pageNumber);
  options.skip = skip;
  options.limit = limit;
  getBlockedUserList(req.payload.userId).then((user) => {
    const buddyRequest = [];
    _.forEach(user.blockedUserData, (follower) => {
      console.log("-----------------------", follower);
      buddyRequest.push(ObjectID(follower.blockedUserId));
      console.log("-----------------------", buddyRequest);
    });

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
          ],

          $expr: {
            $in: ["$userId", buddyRequest],
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
          _id: 0,
          userId: 1,
          userName: 1,
          firstName: 1,
          lastName: 1,
          profileUrl: { $ifNull: ["$profileUrl", ""] },

          qualityRating: { $ifNull: ["$qualityRating", 0] },
          rolies: { $ifNull: ["$roliesRating", 0] },
          statusType: 1,
          quntities: { $ifNull: ["$quntitiesRating", 0] },
          Rating: {
            $ifNull: [
              {
                $divide: [
                  {
                    $sum: [
                      "$qualityRating",
                      "$roliesRating",
                      "$quntitiesRating",
                    ],
                  },
                  3,
                ],
              },
              0,
            ],
          },
          about: 1,
          isBuddy: "false",
          isBuddyRequested: "false",
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
        $in: ["$userId", buddyRequest],
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
                if (countData <= skip + limit) {
                } else {
                  result.nextPage = parseInt(pageNumber) + 1;
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
  });
};

blockUserCtrl.unblockUser = (req, res) => {
  var response = new HttpRespose();
  try {
    BlockUserModel.findOne(
      {
        userId: ObjectID(req.payload.userId),
        blockedUserId: ObjectID(req.body.blockedUserId),
      },
      (err, blockedUserFind) => {
        if (err) {
          throw err;
        } else {
          BlockUserModel.remove(
            {
              userId: ObjectID(req.payload.userId),
              blockedUserId: ObjectID(req.body.blockedUserId),
            },
            (err, newId) => {
              if (err) {
                throw err;
              } else {
                BlockUserModel.findOne(
                  {
                    blockedUserId: ObjectID(req.payload.userId),
                    userId: ObjectID(req.body.blockedUserId),
                  },
                  (err, blockedUserFind) => {
                    if (err) {
                      throw err;
                    } else {
                      BlockUserModel.remove(
                        {
                          blockedUserId: ObjectID(req.payload.userId),
                          userId: ObjectID(req.body.blockedUserId),
                        },
                        (err, newId) => {
                          if (err) {
                            throw err;
                          } else {
                          }
                        }
                      );
                    }
                  }
                ),
                  response.setData(AppCode.userunBlockSucess);
                response.send(res);
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
    MasterUserModel.advancedAggregate(query, {}, (err, user) => {
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
