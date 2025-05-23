let NotificationCtrl = {};

const UserModel =
  new (require("../../common/model/userModel"))();
const chatModel = new (require("./../../common/model/chatModel"))();
const ChatScreenManagementModel = new (require("./../../common/model/ChatScreenManagementModel"))();
const NotificationModel = new (require("./../../common/model/NotificationModel"))();

const HttpRespose = require("./../../common/httpResponse");
const AppCode = require("../../common/constant/appCods");
const async = require("async");
const Logger = require("../../common/logger");
const _ = require("lodash");
const ObjectID = require("mongodb").ObjectID;
const CONFIG = require("../../config");
const userModel = require("../../common/model/userModel");


//notification create -not use
NotificationCtrl.notificationData = (req, res) => {
  const response = new HttpRespose();
  if (!!req.auth) {
    console.log(",,,,,,",req.auth)
    let data = {};
    let options = {};
    searchKey = !!req.query.searchKey ? req.query.searchKey : "";
    let pageNumber = !!req.query.pageNumber ? req.query.pageNumber : 0;
    let loginUserId = ObjectID(req.auth._id);
    const limit = 20;
    const skip = limit * parseInt(pageNumber);
    options.skip = skip;
    options.limit = limit;
    let query = [
      {
        $match: {
          reciverId: ObjectID(req.auth._id),
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: "user",
          as: "senderData",
          let: { userId: "$senderId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$_id", "$$userId"],
                },
                status: { $ne: 2 },
                isdeleted: { $ne: true },
              },
            },
            {
              $project: {
                _id: 1,
                userName: 1,
               // firstName: 1,
               // lastName: 1,
               profile_image: { $ifNull: ["$profileUrl", ""] },
                status: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: "$senderData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          senderId: "$senderData._id",
          senderUserName: "$senderData.userName",
         // senderFirstName: "$senderData.firstName",
         // senderLastName: "$senderData.lastName",
          senderImage: "$senderData.profile_image",
          statusType: "$senderData.status",
          isView: 1,
          isRead: 1,
          message: 1,
          type: 1,
          //SehshionId: 1,
         // postId: 1,
          createdAt: 1,
        },
      },
    ];
    async.parallel(
      [
        function (callback) {
          NotificationModel.aggregate(query, (err, notifications) => {
            if (err) {
              callback(err);
            } else {
              data.notifications = notifications;
              callback(null);
            }
          });
        },
        function (callback) {
          NotificationModel.count(
            { reciverId: ObjectID(req.auth._id) },
            function (err, totalrecords) {
              if (err) {
                throw err;
              } else {
                if (totalrecords <= skip + limit) {
                } else {
                  data.nextPage = parseInt(pageNumber) + 1;
                }
                data.recordsTotal = totalrecords;
                callback(null);
              }
            }
          );
        },
      ],
      function (err) {
        if (err) {
          AppCode.Fail.error = err.message;
          response.setError(AppCode.Fail);
          response.send(res);
        } else {
          //console.log("datadatadatadatadata;",JSON.stringify(data,null,4));
          response.setData(AppCode.Success, data);
          response.send(res);
        }
      }
    );
  } else {
    response.setData(AppCode.LoginAgain, {});
    response.send(res);
  }
};

//unreadnotification count -not use
NotificationCtrl.unReadNotificationCount = (req, res) => {
  const response = new HttpRespose();
  let result = {};
  if (!!req.auth) {
    NotificationModel.count(
      { reciverId: ObjectID(req.auth._id), isView: false },
      function (err, totalrecords) {
        if (err) {
          AppCode.Fail.error = err.message;
          response.setError(AppCode.Fail);
          response.send(res);
        } else {
          result.NotificationCount = totalrecords;
          let query = [
            {
              $match: {
                $and: [
                  {
                    $expr: {
                      $eq: ["$reciver_id", ObjectID(req.auth._id)],
                    },
                    isRead: { $ne: true },
                  },
                ],
              },
            },
            {
              $group: {
                _id: "$sender_id",
              },
            },
          ];
          chatModel.advancedAggregate(query, {}, (err, countData) => {
            if (err) {
              console.log(err);
              response.setError(AppCode.InternalServerError);
              response.send(res);
            } else {
              console.log("...................",countData)
              result.ChatCount = countData.length;
              response.setData(AppCode.Success, result);
              response.send(res);
            }
          });
        }
      }
    );
  } else {
    response.setData(AppCode.LoginAgain, {});
    response.send(res);
  }
};


//whene notification is viewd -not use
NotificationCtrl.viewNotifications = (req, res) => {
  const response = new HttpRespose();
  if (!!req.auth) {
    let result = {};
    NotificationModel.viewupdate(
      { reciverId: ObjectID(req.auth._id) },
      { isView: true },
      (err, updated) => {
        if (err) {
          response.setData(AppCode.InternalServerError);
          response.send(res);
        } else {
          let query = [
            {
              $match: {
                $and: [
                  {
                    $expr: {
                      $eq: ["$reciver_id", ObjectID(req.auth._id)],
                    },
                    isRead: { $ne: true },
                  },
                ],
              },
            },
            {
              $group: {
                _id: "$sender_id",
              },
            },
          ];

          chatModel.advancedAggregate(query, {}, (err, countData) => {
            if (err) {
              console.log(err);
              response.setError(AppCode.InternalServerError);
              response.send(res);
            } else {
              result.NotificationCount = 0;
              result.ChatCount = countData.length;
              response.setData(AppCode.Success, result);
              response.send(res);
            }
          });
        }
      }
    );
  } else {
    response.setData(AppCode.LoginAgain, {});
    response.send(res);
  }
};

//notification  read - not use
NotificationCtrl.readNotification = (req, res) => {
  const response = new HttpRespose();
  if (!!req.auth) {
    NotificationModel.readupdate(
      { _id: ObjectID(req.body._id) },
      { isRead: true },
      (err, updated) => {
        if (err) {
          throw err;
        } else {
          response.setData(AppCode.Success);
          response.send(res);
        }
      }
    );
  } else {
    response.setData(AppCode.LoginAgain, {});
    response.send(res);
  }
};

//delete notification -not use
NotificationCtrl.deleteNotification = (req, res) => {
  const response = new HttpRespose();
  if (!!req.auth) {
    var id = ObjectID(req.body._id);
    console.log(id);
    NotificationModel.remove({ _id: id }, (err, updated) => {
      if (err) {
        throw err;
      } else {
        console.log(updated); 
        response.setData(AppCode.Success);
        response.send(res);
      }
    });
  } else {
    response.setData(AppCode.LoginAgain, {});
    response.send(res);
  }
};

module.exports = NotificationCtrl;
