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
              userId: ObjectID(req.auth._id),
              blockedUserId: ObjectID(req.body.blockedUserId),
            },
            (err, blockedUser) => {
              if (err) {
                console.log(err);
                throw err;
              } else {

                //block array save in user table 
                // UserModel.findOne(
                //   {
                //     _id: ObjectID(req.auth._id),
                //   },
                //   (err, userfind) => {
                //     if (err) {
                //       console.log(err);
                //       throw err;
                //     } else {
                //       if (userfind == null) {
                //         AppCode.Fail.error = "No record found";
                //         response.setError(AppCode.Fail);
                //         response.send(res);
                //       } else {

                //         if (!!userfind.blockUser) {
                //           let updateDataQuery = {};
                //           console.log("................", userfind.blockUser)
                //           let aaa = []
                //           let bbb = []
                //           aaa = userfind.blockUser
                //           console.log(",,,,,,,,,,,,,,,,,,,,,,,", req.body.blockedUserId)
                //           bbb.push(ObjectID(req.body.blockedUserId))

                //           let abc = aaa.concat(bbb)
                //           console.log("......................................abcccccccc", abc)


                //           console.log(".........abc after", abc)


                //           updateDataQuery.blockUser = abc
                //           console.log(".......updateDataQuery.......", updateDataQuery)

                //           // delete req.body._id
                //           UserModel.update({ _id: ObjectID(req.auth._id) }, updateDataQuery, function (err, roleUpdate) {
                //             if (err) {
                //               console.log("...........", err);
                //               response.setError(AppCode.Fail);
                //             } else {

                //               console.log(")))))))))", updateDataQuery);
                //               response.setData(AppCode.Success);
                //               response.send(res);
                //             }
                //           });



                //         }
                //         else {
                //           let updateDataQuery = {};


                //           let a1 = []
                //           a1.push(ObjectID(req.body.blockedUserId))

                //           console.log("a111111111111111111", a1);
                //           updateDataQuery.blockUser = a1

                //           console.log("<MMMMMMMM", updateDataQuery);



                //           // delete req.body._id
                //           UserModel.update({ _id: ObjectID(req.auth._id) }, updateDataQuery, function (err, roleUpdate) {
                //             if (err) {
                //               console.log("...........", err);
                //               response.setError(AppCode.Fail);
                //             } else {

                //               console.log(")))))))))", updateDataQuery);
                //               response.setData(AppCode.Success);
                //               response.send(res);
                //             }
                //           });

                //         }

                //       }
                //     }
                //   }
                // );
                 response.setError(AppCode.Success, blockedUser);
                 response.send(res);

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
        userId: ObjectID(req.auth._id),
        blockedUserId: ObjectID(req.body.blockedUserId),
      },
      (err, blockedUserFind) => {
        if (err) {
          throw err;
        } else {
          BlockUserModel.remove(
            {
              userId: ObjectID(req.auth._id),
              blockedUserId: ObjectID(req.body.blockedUserId),
            },
            (err, newId) => {
              if (err) {
                throw err;
              } else {

                //block array remove
                // UserModel.findOne(
                //   {
                //     _id: ObjectID(req.body._id),
                //   },
                //   (err, userfind) => {
                //     if (err) {
                //       console.log(err);
                //       throw err;
                //     } else {
                //       if (userfind == null) {
                //         AppCode.Fail.error = "No record found";
                //         response.setError(AppCode.Fail);
                //         response.send(res);
                //       } else {
                //         // console.log("................",userfind)


                //         let updateDataQuery = {};
                //         //  console.log("................",userfind.blockUser)
                //         let users = []
                //         let Users = []
                //         users = userfind.blockUser
                //         Users = userfind.blockUser

                //         console.log("usersssssssss", users);

                //         for (let i = 0; i < Users.length; i++) {

                //           if ((req.body.blockedUserId).toString() == (Users[i]).toString()) {
                //             console.log("disconneceted user...................", Users[i])


                //             console.log(".....if......")

                //             users.splice(i, 1)


                //             updateDataQuery.blockUser = users

                //             // if ((Users.length - 1) == i) {
                //               UserModel.update({ _id: ObjectID(req.body._id) }, updateDataQuery, function (err, roleUpdate) {
                //                 if (err) {
                //                   console.log("...........", err);
                //                   response.setError(AppCode.Fail);
                //                 } else {

                //                   console.log(")))))))))", updateDataQuery);
                //                   response.setData(AppCode.Success);
                //                   response.send(res);
                //                 }
                //               });
                //             // }

                //           }
                //           else {
                //             console.log("...............else");
                //           }

                //         }




                //       //console.log("user disconnected", users);
                //       // console.log("user connected after disconnecting......", users);

                //       updateDataQuery.blockUser = users








                //     }
                //   }
                //   }
                // );

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
