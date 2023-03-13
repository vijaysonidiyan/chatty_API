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

// blocl-unblock
blockUserCtrl.blockUnblockUser = (req, res) => {
  var response = new HttpRespose();

  try {
    BlockUserModel.findOne(
      {
        userId: ObjectID(req.auth._id),
        blockedUserId: ObjectID(req.body.blockedUserId),
        //   isBlock:req.body.isBlock,
      },
      (err, blockedUserFind) => {
        if (err) {
          console.log(err);
          throw err;
        }
        else if (blockedUserFind !== null) {
          console.log("else ifffffffffffffffffffff")
          BlockUserModel.remove(
            {
              userId: ObjectID(req.auth._id),
              blockedUserId: ObjectID(req.body.blockedUserId),
            },
            (err, newId) => {
              if (err) {
                throw err;
              } else {
                response.setData(AppCode.Success, req.body);
                response.send(res);
              }
            }
          );
          // response.setError(AppCode.AllreadyExist);
          // response.send(res);
        }
        else {
          console.log("else ")
          //  if (req.body.isBlock == true) {

          BlockUserModel.create(
            {
              userId: ObjectID(req.auth._id),
              blockedUserId: ObjectID(req.body.blockedUserId),
              isBlock: req.body.isBlock
            },
            (err, blockedUser) => {
              if (err) {
                console.log(err);
                throw err;
              } else {

                response.setData(AppCode.Success, req.body);
                response.send(res);

              }
            }
          );


          //  } 
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
  //let searchKey = "";
  //let options = {};
  //searchKey = !!req.query.searchKey ? req.query.searchKey : "";
  //let pageNumber = !!req.query.pageNumber ? req.query.pageNumber : 0;
        // let loginUserId = ObjectID(req.payload.userId);
 // const limit = 10;
 // const skip = limit * parseInt(pageNumber);
 // options.skip = skip;
//  options.limit = limit;
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
          // $or: [
          //   {
          //     //userName: new RegExp('^' + searchKey.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i'),
          //     userName: new RegExp(
          //       ".*" + searchKey.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&") + ".*",
          //       "i"
          //     ),
          //   },

          // ],

          $expr: {
            $in: ["$_id", blockuser],
          },
          // status: { $ne: 2 },
          // isdeleted: { $ne: true },
        },
      },
    //  { $sort: { userName: 1 } },
     // { $skip: skip },
    //  { $limit: limit },
      {
        $project: {
          _id: 1,
          userId: 1,
          userName: 1,  
          profile_image: { $ifNull: ["$profile_image", ""] },

        
        },
      },
    ];
    let countQuery = {
      // $or: [
      //   {
      //     userName: new RegExp(
      //       ".*" + searchKey.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&") + ".*",
      //       "i"
      //     ),
      //   },
      // ],

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
              } 
            else {
                console.log("....coundata", countData)
                result.totalblockuser = countData;
                cb(null);
              }
            });
          },
          function (cb) {
            UserModel.aggregate(query, (err, followers) => {
              if (err) {
                throw err;
              } 
             else {
                result.result = followers;
                cb(null);
              }
            });
          },
        ],
        function (err) {
          if (err) {
            throw err;
          }
         else {
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
