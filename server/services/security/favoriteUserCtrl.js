let favoriteUserCtrl = {};
const HttpRespose = require("../../common/httpResponse");
const Logger = require("../../common/logger");
const bcrypt = require("bcryptjs");
const blacklist = require("express-jwt-blacklist");
const ObjectID = require("mongodb").ObjectID;
const CONFIG = require("../../config");
const _ = require("lodash");
const async = require("async");
const AppCode = require("../../common/constant/appCods");
const userModel = require("../../common/model/userModel");

const MasterUserModel = new (require("../../common/model/userModel"))();
const BlockUserModel = new (require("../../common/model/blockUserModel"))();
const FavouriteModel = new (require("../../common/model/favouriteModel"))();
const NotificationModel =
  new (require("../../common/model/NotificationModel"))();
const UserModel =
  new (require("../../common/model/userModel"))();

// favoriteUserCtrl.favoriteUser = (req, res) => {
//   var response = new HttpRespose();
 
//   try {
//     FavouriteModel.findOne(
//       {
//         userId: ObjectID(req.auth._id),
//         favId: ObjectID(req.body.favId),
//         status: 1,
//       },
//       (err, favoriteUserFind) => {
//         if (err) {
//           console.log(err);
//           throw err;
//         } else if (_.isEmpty(favoriteUserFind)) {
//           FavouriteModel.create(
//             {
//               userId: ObjectID(req.auth._id),
//               favId: ObjectID(req.body.favId),
//             },
//             (err, favoriteUser) => {
//               if (err) {
//                 console.log(err);
//                 throw err;
//               } else {
//                 response.setError(AppCode.Success, favoriteUser);
//                 response.send(res);

//               }
//             }
//           );
//         } else {
//           response.setError(AppCode.allReadyadded);
//           response.send(res);
//         }
//       }
//     );
//   } catch (exception) {
//     response.setError(AppCode.InternalServerError);
//     response.send(res);
//   }
// };

favoriteUserCtrl.favoriteUser = (req, res) => {
  var response = new HttpRespose();

  try {
    FavouriteModel.findOne(
      {
        userId: ObjectID(req.auth._id),
        favId: ObjectID(req.body.favId),
        status: 1,
      },
      (err, favoriteUserFind) => {
        if (err) {
          console.log(err);
          throw err;
        } else if (_.isEmpty(favoriteUserFind)) {
          FavouriteModel.create(
            {
              userId: ObjectID(req.auth._id),
              favId: ObjectID(req.body.favId),
            },
            (err, favoriteUser) => {
              if (err) {
                console.log(err);
                throw err;
              } else {
                let isfavorite = {
                  isfavorite: true

                }
                response.setData(AppCode.Success, isfavorite);
                response.send(res);

              }
            }
          );
        } else {
          FavouriteModel.remove(
            {
              userId: ObjectID(req.auth._id),
              favId: ObjectID(req.body.favId),
            },
            (err, favorite) => {
              if (err) {
                throw err;
              } else {
                let isfavorite = {
                  isfavorite: false

                }

                response.setData(AppCode.Success, isfavorite);
                response.send(res);
              }
            }
          );

          // response.setError(AppCode.allReadyadded);
          // response.send(res);
        }
      }
    );
  } catch (exception) {
    response.setError(AppCode.InternalServerError);
    response.send(res);
  }
};

favoriteUserCtrl.getFavoriteUserList = (req, res) => {
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
  getFavoriteUserList(req.auth._id).then((user) =>  {
    console.log(",,,,,,,,,,",user)
    const favUser = [];
    _.forEach(user.favouriteData, (follower) => {
      console.log("------follower-----------------", follower);
      favUser.push(ObjectID(follower.favId));
      console.log("---------favoriteuser--------------", favUser);
    });

    let query = [
      {
        $match: {
          $or: [
            {
             // userName: new RegExp('^' + searchKey.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i'),
              // userName: new RegExp('^' + searchKey.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i'),
              userName: new RegExp(
                ".*" + searchKey.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&") + ".*",
                "i"
              ),
            },
           
          ],

          $expr: {
            $in: ["$_id", favUser],
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
          mobileNo:1,
          userName: 1,
          countryName:1,
          profile_image: { $ifNull: ["$profile_image", ""] },

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
        $in: ["$_id", favUser],
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
                console.log("....coundata",countData)
                if (countData <= skip + limit) {
                  result.totalfavoriteuser = countData;

                } else {
                  result.nextPage = parseInt(pageNumber) + 1;
                  result.totalfavoriteuser = countData;
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
            console.log("...................else if 1")
            response.setData(AppCode.NotFound, result);
            response.send(res);
          } else if (options.skip > 0 && _.isEmpty(result.result)) {
            console.log("...................else if 2")
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


favoriteUserCtrl.unFavoriteUser = (req, res) => {
  var response = new HttpRespose();
  try {
    FavouriteModel.findOne(
      {
        userId: ObjectID(req.auth._id),
        favId: ObjectID(req.body.favId),
      },
      (err, favoriteuserFind) => {
        if (err) {
          throw err;
        } else {
          FavouriteModel.remove(
            {
              userId: ObjectID(req.auth._id),
              favId: ObjectID(req.body.favId),
            },
            (err, newId) => {
              if (err) {
                throw err;
              } else {

                response.setData(AppCode.Success);
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

const getFavoriteUserList = (userId) => {
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
          from: "favourite",
          as: "favouriteData",
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
                favId: 1,
              },
            },
          ],
        },
      },
      {
        $project: {
          _id: 0,
          favouriteData: 1,
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

module.exports = favoriteUserCtrl;
