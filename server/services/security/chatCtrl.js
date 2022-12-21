let ChatCtrl = {};

const UserModel =
  new (require("../../common/model/userModel"))();
const chatModel = new (require("./../../common/model/chatModel"))();
const ChatScreenManagementModel = new (require("./../../common/model/ChatScreenManagementModel"))();

const HttpRespose = require("./../../common/httpResponse");
const AppCode = require("../../common/constant/appCods");
const async = require("async");
const Logger = require("../../common/logger");
const _ = require("lodash");
const ObjectID = require("mongodb").ObjectID;
const CONFIG = require("../../config");
const userModel = require("../../common/model/userModel");

ChatCtrl.getMessages = (req, res) => {
  const response = new HttpRespose();
  let data = req.body;
  let options = {};
  let pageNumber = !!req.body.pageNumber ? req.body.pageNumber : 0;
  let timezoneData = "America/Los_Angeles";
  if (!!req.body.timezone) {
    timezoneData = req.body.timezone;
  }
  const limit = 5000000000;
  const skip = limit * parseInt(pageNumber);
  options.skip = skip;
  options.limit = limit;
  options.sort = { Date: 1 };
  
    let query = [
      {
        $match: {
          $or: [
            {
              sender_id: ObjectID(req.auth._id),
              reciver_id: ObjectID(data.user_id),
            },
            {
              reciver_id: ObjectID(req.auth._id),
              sender_id: ObjectID(data.user_id),
            },
          ],
        },
      },
      {
        $lookup: {
          from: "post",
          as: "postData",
          let: { postId: "$postId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: ["$_id", "$$postId"],
                    },
                    {
                      $ne: ["$isDeleted", true],
                    },
                  ],
                },
              },
            },
            {
              $lookup: {
                from: "userDetails",
                localField: "user_id",
                foreignField: "userId",
                as: "user_id",
              },
            },
            {
              $unwind: {
                path: "$user_id",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: "photo",
                as: "media",
                let: {
                  photoId: "$media.photos.files",
                  videoId: "$media.videos.files",
                },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $or: [
                          {
                            $in: ["$_id", { $ifNull: ["$$photoId", []] }],
                          },
                          {
                            $in: ["$_id", { $ifNull: ["$$videoId", []] }],
                          },
                        ],
                      },
                    },
                  },
                  {
                    $project: {
                      _id: 1,
                      path: "$photo_name",
                      thumbnail: 1,
                      video_screenshot: 1,
                      type: {
                        $cond: {
                          if: { $eq: ["$type", "video"] },
                          then: "video",
                          else: "photo",
                        },
                      },
                    },
                  },
                ],
              },
            },
            {
              $project: {
                //"_id": 0,
                content: 1,
                postId: 1,
                userId: "$user_id.userId",
                userName: "$user_id.userName",
                userImage: { $ifNull: ["$user_id.profileUrl", ""] },
                postImage: {
                  $cond: {
                    if: { $eq: [{ $first: "$media.type" }, "video"] },
                    then: { $first: "$media.video_screenshot" },
                    else: { $first: "$media.path" },
                  },
                },
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: "$postData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          message: 1,
          sender_id: 1,
          reciver_id: 1,
          type: 1,
          isRead: 1,
          postId: 1,
          createdAt: 1,
          postId: 1,
          content: "$postData.content",
          userId: "$postData.userId",
          userName: "$postData.userName",
          userImage: "$postData.userImage",
          postImage: "$postData.postImage",
          yearMonthDay: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
              timezone: timezoneData,
            },
          },
        },
      },
      { $sort: { createdAt: 1 } },
      {
        $group: {
          _id: "$yearMonthDay",
          Date: {
            $first: { $toDate: "$yearMonthDay" },
          },
          chat: { $push: "$$ROOT" },
        },
      },
      { $sort: { Date: 1 } },
    ];

    try {
      let result = {};
      async.parallel(
        [
          function (cb) {
            const countQuery = {
              $or: [
                {
                  sender_id: ObjectID(req.auth._id),
                  reciver_id: ObjectID(data.user_id),
                },
                {
                  reciver_id: ObjectID(req.auth._id),
                  sender_id: ObjectID(data.user_id),
                },
              ],
            };
            chatModel.count(countQuery, function (err, totalMessages) {
              if (err) {
                cb(err);
              } else {
                result.recordsTotal = totalMessages;
                cb(null);
              }
            });
          },
          function (cb) {
            chatModel.updateIsRead(
              {
                reciver_id: ObjectID(req.auth._id),
                sender_id: ObjectID(data.user_id),
              },
              { $set: { isRead: true } },
              (err, messages) => {
                if (err) {
                  throw err;
                } else {
                  cb(null);
                }
              }
            );
          },
          function (cb) {
            chatModel.advancedAggregate(query, options, (err, messages) => {
              if (err) {
                throw err;
              } else if (options.skip === 0 && _.isEmpty(messages)) {
                cb(null);
              } else if (options.skip > 0 && _.isEmpty(messages)) {
                cb(null);
              } else {
                if (result.recordsTotal <= skip + limit) {
                } else {
                  result.nextPage = parseInt(pageNumber) + 1;
                }
                result.messages = messages;
                cb(null);
              }
            });
          },
        ],
        function (err) {
          if (err) {
            throw err;
          } else if (options.skip === 0 && _.isEmpty(result.messages)) {
            response.setData(AppCode.NoMoreDataFound);
            response.send(res);
          } else if (options.skip > 0 && _.isEmpty(result.messages)) {
            response.setData(AppCode.NoMoreDataFound);
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

ChatCtrl.getMessageswithPagination = (req, res) => {
  const response = new HttpRespose();
  let data = req.body;
  let options = {};
  let pageNumber = !!req.body.pageNumber ? req.body.pageNumber : 0;
  let timezoneData = "America/Los_Angeles";
  if (!!req.body.timezone) {
    timezoneData = req.body.timezone;
  }
  const limit = 15;
  let skip = limit * parseInt(pageNumber);
  
  options.sort = { Date: 1 };
  if (!!req.auth && !!req.auth._id) {
    let query = [
      {
        $match: {
          $or: [
            {
              sender_id: ObjectID(req.auth._id),
              reciver_id: ObjectID(data.user_id),
            },
            {
              reciver_id: ObjectID(req.auth._id),
              sender_id: ObjectID(data.user_id),
            },
          ],
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      
      {
        $lookup: {
          from: "post",
          as: "postData",
          let: { postId: "$postId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: ["$_id", "$$postId"],
                    },
                    {
                      $ne: ["$isDeleted", true],
                    },
                  ],
                },
              },
            },
            {
              $lookup: {
                from: "userDetails",
                localField: "user_id",
                foreignField: "userId",
                as: "user_id",
              },
            },
            {
              $unwind: {
                path: "$user_id",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: "photo",
                as: "media",
                let: {
                  photoId: "$media.photos.files",
                  videoId: "$media.videos.files",
                },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $or: [
                          {
                            $in: ["$_id", { $ifNull: ["$$photoId", []] }],
                          },
                          {
                            $in: ["$_id", { $ifNull: ["$$videoId", []] }],
                          },
                        ],
                      },
                    },
                  },
                  {
                    $project: {
                      _id: 1,
                      path: "$photo_name",
                      thumbnail: 1,
                      video_screenshot: 1,
                      type: {
                        $cond: {
                          if: { $eq: ["$type", "video"] },
                          then: "video",
                          else: "photo",
                        },
                      },
                    },
                  },
                ],
              },
            },
            {
              $project: {
                //"_id": 0,
                content: 1,
                postId: 1,
                userId: "$user_id.userId",
                userName: "$user_id.userName",
                userImage: { $ifNull: ["$user_id.profileUrl", ""] },
                postImage: {
                  $cond: {
                    if: { $eq: [{ $first: "$media.type" }, "video"] },
                    then: { $first: "$media.video_screenshot" },
                    else: { $first: "$media.path" },
                  },
                },
              },
            },
          ],
        },
      },
      
      {
        $unwind: {
          path: "$postData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          message: 1,
          sender_id: 1,
          reciver_id: 1,
          type: 1,
          isRead: 1,
          postId: 1,
          createdAt: 1,
          postId: 1,
          content: "$postData.content",
          userId: "$postData.userId",
          userName: "$postData.userName",
          userImage: "$postData.userImage",
          postImage: "$postData.postImage",
          yearMonthDay: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
              timezone: timezoneData,
            },
          },
        },
      },
     
      // {
      //   $group: {
      //     _id: "$yearMonthDay",
      //     Date: {
      //       $first: { $toDate: "$yearMonthDay" },
      //     },
      //     chat: { $push: "$$ROOT" },
      //   },
      // },
      // { $sort: { Date: 1 } },
      // { $sort: { createdAt: 1 } },
    ];

    try {
      let result = {};
      async.parallel(
        [
          function (cb) {
            const countQuery = {
              $or: [
                {
                  sender_id: ObjectID(req.auth._id),
                  reciver_id: ObjectID(data.user_id),
                },
                {
                  reciver_id: ObjectID(req.auth._id),
                  sender_id: ObjectID(data.user_id),
                },
              ],
            };
            chatModel.count(countQuery, function (err, totalMessages) {
              if (err) {
                cb(err);
              } else {
                result.recordsTotal = totalMessages;
                cb(null);
              }
            });
          },
          function (cb) {
            chatModel.updateIsRead(
              {
                reciver_id: ObjectID(req.auth._id),
                sender_id: ObjectID(data.user_id),
              },
              { $set: { isRead: true } },
              (err, messages) => {
                if (err) {
                  throw err;
                } else {
                  cb(null);
                }
              }
            );
          },
          function (cb) {
            chatModel.aggregate(query, (err, messages) => {
              if (err) {
                throw err;
              } else if (skip === 0 && _.isEmpty(messages)) {
                cb(null);
              } else if (skip > 0 && _.isEmpty(messages)) {
                cb(null);
              } else {
                if (result.recordsTotal <= skip + limit) {
                } else {
                  result.nextPage = parseInt(pageNumber) + 1;
                }
                result.messages = messages;
                cb(null);
              }
            });
          },
        ],
        function (err) {
          if (err) {
            throw err;
          } else if (skip === 0 && _.isEmpty(result.messages)) {
            response.setData(AppCode.NoMoreDataFound);
            response.send(res);
          } else if (skip > 0 && _.isEmpty(result.messages)) {
            response.setData(AppCode.NoMoreDataFound);
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
  } else {
    response.setData(AppCode.LoginAgain, {});
    response.send(res);
  }
};


ChatCtrl.getMessagesAll = (req, res) => {
  const response = new HttpRespose();
  let data = req.body;
  let options = {};
  let pageNumber = !!req.body.pageNumber ? req.body.pageNumber : 0;
  const limit = 5000000000;
  const skip = limit * parseInt(pageNumber);
  options.skip = skip;
  options.limit = limit;
  options.sort = { createdAt: 1 };
  if (!!req.auth && !!req.auth._id) {
    let query = [
      {
        $match: {
          $or: [
            {
              sender_id: ObjectID(req.auth._id),
              reciver_id: ObjectID(data.user_id),
            },
            {
              reciver_id: ObjectID(req.auth._id),
              sender_id: ObjectID(data.user_id),
            },
          ],
        },
      },
      {
        $lookup: {
          from: "post",
          as: "postData",
          let: { postId: "$postId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: ["$_id", "$$postId"],
                    },
                    {
                      $ne: ["$isDeleted", true],
                    },
                  ],
                },
              },
            },
            {
              $lookup: {
                from: "userDetails",
                localField: "user_id",
                foreignField: "userId",
                as: "user_id",
              },
            },
            {
              $unwind: {
                path: "$user_id",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: "photo",
                as: "media",
                let: {
                  photoId: "$media.photos.files",
                  videoId: "$media.videos.files",
                },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $or: [
                          {
                            $in: ["$_id", { $ifNull: ["$$photoId", []] }],
                          },
                          {
                            $in: ["$_id", { $ifNull: ["$$videoId", []] }],
                          },
                        ],
                      },
                    },
                  },
                  {
                    $project: {
                      _id: 1,
                      path: "$photo_name",
                      thumbnail: 1,
                      video_screenshot: 1,
                      type: {
                        $cond: {
                          if: { $eq: ["$type", "video"] },
                          then: "video",
                          else: "photo",
                        },
                      },
                    },
                  },
                ],
              },
            },
            {
              $project: {
                //"_id": 0,
                content: 1,
                postId: 1,
                userId: "$user_id.userId",
                userName: "$user_id.userName",
                userImage: { $ifNull: ["$user_id.profileUrl", ""] },
                postImage: {
                  $cond: {
                    if: { $eq: [{ $first: "$media.type" }, "video"] },
                    then: { $first: "$media.video_screenshot" },
                    else: { $first: "$media.path" },
                  },
                },
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: "$postData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          message: 1,
          sender_id: 1,
          reciver_id: 1,
          type: 1,
          postId: 1,
          createdAt: 1,
          postId: 1,
          content: "$postData.content",
          userId: "$postData.userId",
          userName: "$postData.userName",
          userImage: "$postData.userImage",
          postImage: "$postData.postImage",
          yearMonthDay: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          Date: {
            $toDate: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
          },
        },
      },
      // { "$sort": { "createdAt": 1 } },
      // {
      //     $group: {
      //         _id: "$yearMonthDay",
      //         "Date": {
      //             "$first": { $toDate: "$yearMonthDay" }
      //         },
      //         "chat": { "$push": "$$ROOT" }
      //     },
      // },
      // { "$sort": { "Date": 1 } },
    ];

    try {
      let result = {};
      async.parallel(
        [
          function (cb) {
            const countQuery = {
              $or: [
                {
                  sender_id: ObjectID(req.auth._id),
                  reciver_id: ObjectID(data.user_id),
                },
                {
                  reciver_id: ObjectID(req.auth._id),
                  sender_id: ObjectID(data.user_id),
                },
              ],
            };
            chatModel.count(countQuery, function (err, totalMessages) {
              if (err) {
                cb(err);
              } else {
                result.recordsTotal = totalMessages;
                cb(null);
              }
            });
          },
          function (cb) {
            chatModel.updateIsRead(
              {
                reciver_id: ObjectID(req.auth._id),
                sender_id: ObjectID(data.user_id),
              },
              { $set: { isRead: true } },
              (err, messages) => {
                if (err) {
                  throw err;
                } else {
                  cb(null);
                }
              }
            );
          },
          function (cb) {
            chatModel.advancedAggregate(query, options, (err, messages) => {
              if (err) {
                throw err;
              } else if (options.skip === 0 && _.isEmpty(messages)) {
                cb(null);
              } else if (options.skip > 0 && _.isEmpty(messages)) {
                cb(null);
              } else {
                if (result.recordsTotal <= skip + limit) {
                } else {
                  result.nextPage = parseInt(pageNumber) + 1;
                }
                result.messages = messages;
                cb(null);
              }
            });
          },
        ],
        function (err) {
          if (err) {
            throw err;
          } else if (options.skip === 0 && _.isEmpty(result.messages)) {
            response.setData(AppCode.NoMoreDataFound);
            response.send(res);
          } else if (options.skip > 0 && _.isEmpty(result.messages)) {
            response.setData(AppCode.NoMoreDataFound);
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
  } else {
    response.setData(AppCode.LoginAgain, {});
    response.send(res);
  }
};
ChatCtrl.getChatUsersList1 = (req, res) => {
  const response = new HttpRespose();
  let data = req.body;
  let searchKey = "";
  let options = {};
  let condition = {};
  searchKey = !!req.query.searchKey ? req.query.searchKey : "";
  let pageNumber = !!req.query.pageNumber ? req.query.pageNumber : 0;
  let limit = !!req.query.limit ? parseInt(req.query.limit) : 100000000;
  let loginUserId = ObjectID(req.auth._id);
  // const limit = 100000;
  const skip = limit * parseInt(pageNumber);
  options.skip = skip;
  options.limit = limit;
  options.sort = { messageAt: -1 };
 // getBuddiesList(req.payload.userId).then((user) => {
    // const buddyRequest = [];
    // _.forEach(user.BuddiesFriends, (follower) => {
    //   console.log(follower);
    //   buddyRequest.push(ObjectID(follower.buddiesId));
    // });

    // if (searchKey == "") {
    //   condition = {
    //     $expr: {
    //       $in: ["$userId", buddyRequest],
    //     },
    //   };
    // } else {
    //   condition = {
    //     userName: new RegExp(
    //       ".*" + searchKey.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&") + ".*",
    //       "i"
    //     ),
    //     $expr: {
    //       $in: ["$userId", buddyRequest],
    //     },
    //   };
    // }

    let query = [
      {
        $match: {
          _id:ObjectID(req.auth._id)

        },
      },
      // {
      //   $lookup: {
      //     from: "user",
      //     as: "isDeleted",
      //     let: { userId : "$userId" },
      //     pipeline: [
      //       {
      //         $match: {
      //           $expr: {
      //             $and: [
      //               {
      //                 $eq: ["$_id", "$$userId"],
      //               },
      //               {
      //                 $eq: ["$isdeleted", true],
      //               },
      //             ],
      //           },
      //         },
      //       },
      //     ],
      //   },
      // },
      {
        $lookup: {
          from: "chat",
          as: "chat",
          let: { userId: "$userId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    {
                      $and: [
                        { $eq: ["$sender_id", ObjectID(req.auth._id)] },
                        { $eq: ["$reciver_id", "$$userId"] },
                      ],
                    },
                    {
                      $and: [
                        { $eq: ["$reciver_id", ObjectID(req.auth._id)] },
                        { $eq: ["$sender_id", "$$userId"] },
                      ],
                    },
                  ],
                },
              },
            },
            {
              $group: {
                _id: null,
                message: { $last: "$message" },
                type: { $last: "$type" },
                messageAt: { $last: "$createdAt" },
                senderId: { $last: "$sender_id" },
                receiverId: { $last: "$reciver_id" },
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: "$chat",
          preserveNullAndEmptyArrays: true,
        },
      },
      { $sort: { "chat.messageAt": -1, userName: 1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: "chat",
          as: "unreadCount",
          let: { userId: "$userId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$reciver_id", ObjectID(req.auth._id)] },
                    { $eq: ["$sender_id", "$$userId"] },
                    { $ne: ["$isRead", true] },
                  ],
                },
              },
            },
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: "$unreadCount",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          userId: 1,
          userName: 1,
          firstName: 1,
          lastName: 1,
          profileUrl: { $ifNull: ["$profileUrl", ""] },
          statusType: 1,
          // "chat": "$chat.message",
          chat: {
            $cond: {
              if: { $eq: ["$chat.type", "post"] },
              then: "Shared a post",
              else: "$chat.message",
            },
          },
          isDeleted: {
            $cond: {
              if: { $isArray: "$isDeleted" },
              then: { $size: "$isDeleted" },
              else: 0,
            },
          },
          messageAt: "$chat.messageAt",
          senderId: "$chat.senderId",
          receiverId: "$chat.receiverId",
          unreadCount: { $ifNull: ["$unreadCount.count", 0] },
        },
      },
    ];

    try {
      let result = {};
      async.parallel(
        [
          function (cb) {
            // UserModel.advancedAggregate(query, {}, (err, countData) => {
            UserModel.count(condition, (err, countData) => {
              if (err) {
                throw err;
              } else if (options.skip === 0 && countData == 0) {
                cb(null);
              } else if (options.skip > 0 && countData == 0) {
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
            response.setData(AppCode.NoBuddiesFound, result);
            response.send(res);
          } else if (options.skip > 0 && _.isEmpty(result.result)) {
            response.setData(AppCode.NoMoreBuddiesFound, result);
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
    //buddilist breket
  //});
};

// shweta
ChatCtrl.getChatUsersList2 = (req, res) => {
  const response = new HttpRespose();
  let data = req.body;
  let searchKey = "";
  let options = {};
  let condition = {};
  searchKey = !!req.query.searchKey ? req.query.searchKey : "";
  let pageNumber = !!req.query.pageNumber ? req.query.pageNumber : 0;
  let limit = !!req.query.limit ? parseInt(req.query.limit) : 100000000;
  let loginUserId = ObjectID(req.auth._id);
  // const limit = 100000;
  const skip = limit * parseInt(pageNumber);
  options.skip = skip;
  options.limit = limit;
  options.sort = { messageAt: -1 };
 // getBuddiesList(req.payload.userId).then((user) => {
    // const buddyRequest = [];
    // _.forEach(user.BuddiesFriends, (follower) => {
    //   console.log(follower);
    //   buddyRequest.push(ObjectID(follower.buddiesId));
    // });

    // if (searchKey == "") {
    //   condition = {
    //     $expr: {
    //       $in: ["$userId", buddyRequest],
    //     },
    //   };
    // } else {
    //   condition = {
    //     userName: new RegExp(
    //       ".*" + searchKey.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&") + ".*",
    //       "i"
    //     ),
    //     $expr: {
    //       $in: ["$userId", buddyRequest],
    //     },
    //   };
    // }

    let query = [
      {
        $match: {
          _id:ObjectID(req.auth._id)

        },
      },
      // {
      //   $lookup: {
      //     from: "user",
      //     as: "isDeleted",
      //     let: { userId : "$userId" },
      //     pipeline: [
      //       {
      //         $match: {
      //           $expr: {
      //             $and: [
      //               {
      //                 $eq: ["$_id", "$$userId"],
      //               },
      //               {
      //                 $eq: ["$isdeleted", true],
      //               },
      //             ],
      //           },
      //         },
      //       },
      //     ],
      //   },
      // },
      {
        $lookup: {
          from: "chat",
          as: "chat",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    {
                      $and: [
                        { $eq: ["$sender_id", ObjectID(req.auth._id)] },
                        { $eq: ["$reciver_id", "$$userId"] },
                      ],
                    },
                    {
                      $and: [
                        { $eq: ["$reciver_id", ObjectID(req.auth._id)] },
                        { $eq: ["$sender_id", "$$userId"] },
                      ],
                    },
                  ],
                },
              },
            },
            {
              $group: {
                _id: null,
                message: { $last: "$message" },
                type: { $last: "$type" },
                messageAt: { $last: "$createdAt" },
                senderId: { $last: "$sender_id" },
                receiverId: { $last: "$reciver_id" },
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: "$chat",
          preserveNullAndEmptyArrays: true,
        },
      },
      { $sort: { "chat.messageAt": -1, userName: 1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: "chat",
          as: "unreadCount",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$reciver_id", ObjectID(req.auth._id)] },
                    { $eq: ["$sender_id", "$$userId"] },
                    { $ne: ["$isRead", true] },
                  ],
                },
              },
            },
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: "$unreadCount",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          userId: 1,
          userName: 1,
          firstName: 1,
          lastName: 1,
          profileUrl: { $ifNull: ["$profileUrl", ""] },
          statusType: 1,
          // "chat": "$chat.message",
          chat: {
            $cond: {
              if: { $eq: ["$chat.type", "post"] },
              then: "Shared a post",
              else: "$chat.message",
            },
          },
          isDeleted: {
            $cond: {
              if: { $isArray: "$isDeleted" },
              then: { $size: "$isDeleted" },
              else: 0,
            },
          },
          messageAt: "$chat.messageAt",
          senderId: "$chat.senderId",
          receiverId: "$chat.receiverId",
          unreadCount: { $ifNull: ["$unreadCount.count", 0] },
        },
      },
    ];

    try {
      let result = {};
      async.parallel(
        [
          function (cb) {
            // UserModel.advancedAggregate(query, {}, (err, countData) => {
            UserModel.count(condition, (err, countData) => {
              if (err) {
                throw err;
              } else if (options.skip === 0 && countData == 0) {
                cb(null);
              } else if (options.skip > 0 && countData == 0) {
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
            response.setData(AppCode.NoBuddiesFound, result);
            response.send(res);
          } else if (options.skip > 0 && _.isEmpty(result.result)) {
            response.setData(AppCode.NoMoreBuddiesFound, result);
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
    //buddilist breket
  //});
};
ChatCtrl.getChatUsersList = (req, res) => {
  const response = new HttpRespose();
  let data = req.body;
  let searchKey = "";
  let options = {};
  let condition = {};
  searchKey = !!req.query.searchKey ? req.query.searchKey : "";
  let pageNumber = !!req.query.pageNumber ? req.query.pageNumber : 0;
  let limit = !!req.query.limit ? parseInt(req.query.limit) : 100000000;
  let loginUserId = ObjectID(req.payload.userId);
  // const limit = 100000;
  const skip = limit * parseInt(pageNumber);
  options.skip = skip;
  options.limit = limit;
  options.sort = { messageAt: -1 };
 

    if (searchKey == "") {
      condition = {
        $expr: {
          $in: ["$userId", buddyRequest],
        },
      };
    } else {
      condition = {
        userName: new RegExp(
          ".*" + searchKey.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&") + ".*",
          "i"
        ),
        $expr: {
          $in: ["$userId", buddyRequest],
        },
      };
    }

    let query = [
      {
        $match: condition,
      },
      {
        $lookup: {
          from: "user",
          as: "isDeleted",
          let: { userId : "$userId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: ["$_id", "$$userId"],
                    },
                    {
                      $eq: ["$isdeleted", true],
                    },
                  ],
                },
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "chat",
          as: "chat",
          let: { userId: "$userId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    {
                      $and: [
                        { $eq: ["$sender_id", ObjectID(req.payload.userId)] },
                        { $eq: ["$reciver_id", "$$userId"] },
                      ],
                    },
                    {
                      $and: [
                        { $eq: ["$reciver_id", ObjectID(req.payload.userId)] },
                        { $eq: ["$sender_id", "$$userId"] },
                      ],
                    },
                  ],
                },
              },
            },
            {
              $group: {
                _id: null,
                message: { $last: "$message" },
                type: { $last: "$type" },
                messageAt: { $last: "$createdAt" },
                senderId: { $last: "$sender_id" },
                receiverId: { $last: "$reciver_id" },
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: "$chat",
          preserveNullAndEmptyArrays: true,
        },
      },
      { $sort: { "chat.messageAt": -1, userName: 1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: "chat",
          as: "unreadCount",
          let: { userId: "$userId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$reciver_id", ObjectID(req.payload.userId)] },
                    { $eq: ["$sender_id", "$$userId"] },
                    { $ne: ["$isRead", true] },
                  ],
                },
              },
            },
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: "$unreadCount",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          userId: 1,
          userName: 1,
          firstName: 1,
          lastName: 1,
          profileUrl: { $ifNull: ["$profileUrl", ""] },
          statusType: 1,
          // "chat": "$chat.message",
          chat: {
            $cond: {
              if: { $eq: ["$chat.type", "post"] },
              then: "Shared a post",
              else: "$chat.message",
            },
          },
          isDeleted: {
            $cond: {
              if: { $isArray: "$isDeleted" },
              then: { $size: "$isDeleted" },
              else: 0,
            },
          },
          messageAt: "$chat.messageAt",
          senderId: "$chat.senderId",
          receiverId: "$chat.receiverId",
          unreadCount: { $ifNull: ["$unreadCount.count", 0] },
        },
      },
    ];

    try {
      let result = {};
      async.parallel(
        [
          function (cb) {
            // UserModel.advancedAggregate(query, {}, (err, countData) => {
            UserModel.count(condition, (err, countData) => {
              if (err) {
                throw err;
              } else if (options.skip === 0 && countData == 0) {
                cb(null);
              } else if (options.skip > 0 && countData == 0) {
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
            response.setData(AppCode.NoBuddiesFound, result);
            response.send(res);
          } else if (options.skip > 0 && _.isEmpty(result.result)) {
            response.setData(AppCode.NoMoreBuddiesFound, result);
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
// ChatCtrl.getChatUsersList = (req, res) => {
//     const response = new HttpRespose();
//     let data = req.body;
//     if (!!req.payload && !!req.payload._id) {
//         let sort = -1;
//         if (data.sortBy === "oldest") {
//             sort = 1;
//         }
//         let query =
//             [
//                 {
//                     $match: {
//                         $or: [
//                             {
//                                 "sender_id": ObjectID(req.payload._id)
//                             },
//                             {
//                                 "reciver_id": ObjectID(req.payload._id)
//                             }
//                         ]
//                     }
//                 },
//                 {
//                     $lookup: {
//                         from: "user",
//                         localField: "sender_id",
//                         foreignField: "masterUserId",
//                         as: "senderData"
//                     }
//                 },
//                 {
//                     "$unwind": {
//                         "path": "$senderData",
//                         "preserveNullAndEmptyArrays": true
//                     }
//                 },
//                 {
//                     $lookup: {
//                         from: "photo",
//                         localField: "senderData.profileImageId",
//                         foreignField: "_id",
//                         as: "senderData.profileImageId"
//                     }
//                 },
//                 {
//                     "$unwind": {
//                         "path": "$senderData.profileImageId",
//                         "preserveNullAndEmptyArrays": true
//                     }
//                 },
//                 {
//                     $lookup: {
//                         from: "user",
//                         localField: "reciver_id",
//                         foreignField: "masterUserId",
//                         as: "receiverData"
//                     }
//                 },
//                 {
//                     "$unwind": {
//                         "path": "$receiverData",
//                         "preserveNullAndEmptyArrays": true
//                     }
//                 },
//                 {
//                     $lookup: {
//                         from: "photo",
//                         localField: "receiverData.profileImageId",
//                         foreignField: "_id",
//                         as: "receiverData.profileImageId"
//                     }
//                 },
//                 {
//                     "$unwind": {
//                         "path": "$receiverData.profileImageId",
//                         "preserveNullAndEmptyArrays": true
//                     }
//                 },
//                 {
//                     "$project": {
//                         "userData": {
//                             $cond: {
//                                 if: { $ne: ["$sender_id", ObjectID(req.payload._id)] }, then: "sender",
//                                 else: {
//                                     $cond: { if: { $ne: ["$reciver_id", ObjectID(req.payload._id)] }, then: "receiver", else: "" }
//                                 }
//                             }
//                         },
//                         "senderData": {
//                             _id: "$senderData.masterUserId", profileHeader: 1, name: 1, profileImage: { $ifNull: ["$senderData.profileImageId.photo_name", CONFIG.DEFAULT_PROFILE_PHOTO] }
//                         },
//                         "receiverData": {
//                             _id: "$receiverData.masterUserId", profileHeader: 1, name: 1, profileImage: { $ifNull: ["$receiverData.profileImageId.photo_name", CONFIG.DEFAULT_PROFILE_PHOTO] }
//                         },
//                         reciver_id: 1,
//                         sender_id: 1,
//                         message: 1,
//                         createdAt: 1,
//                         fromToUser: [
//                             "$sender_id",
//                             "$reciver_id"
//                         ]
//                     }
//                 },
//                 {
//                     $unwind: "$fromToUser"
//                 },
//                 {
//                     $sort: {
//                         "fromToUser": 1
//                     }
//                 },
//                 {
//                     $group: {
//                         _id: "$_id",
//                         "fromToUser": {
//                             $push: "$fromToUser"
//                         },
//                         "sender_id": {
//                             "$first": "$sender_id"
//                         },
//                         "reciver_id": {
//                             "$first": "$reciver_id"
//                         },
//                         "message": {
//                             "$first": "$message"
//                         },
//                         "createdAt": {
//                             "$first": "$createdAt"
//                         },
//                         "senderData": {
//                             "$first": "$senderData"
//                         },
//                         "receiverData": {
//                             "$first": "$receiverData"
//                         },
//                         "userData": {
//                             "$first": "$userData"
//                         }
//                     }
//                 },
//                 {
//                     "$sort": {
//                         "createdAt": -1
//                     }
//                 },
//                 {
//                     "$group": {
//                         "_id": "$fromToUser",
//                         "sender_id": {
//                             "$first": "$sender_id"
//                         },
//                         "reciver_id": {
//                             "$first": "$reciver_id"
//                         },
//                         "message": {
//                             "$first": "$message"
//                         },
//                         "createdAt": {
//                             "$first": "$createdAt"
//                         },
//                         "senderData": {
//                             "$first": "$senderData"
//                         },
//                         "receiverData": {
//                             "$first": "$receiverData"
//                         },
//                         "userData": {
//                             "$first": "$userData"
//                         }
//                     }
//                 }
//             ]
//         const options = {}
//         if (!data.searchKey) {
//             options.limit = !!data.recordsPerPage ? parseInt(data.recordsPerPage) : 10;
//             options.skip = !!data.recordsOffset ? parseInt(data.recordsOffset) : 0;
//             options.sort = { createdAt: sort }
//         }
//         else {
//             options.limit = 1000;
//             options.skip = 0;
//             options.sort = { createdAt: sort }
//         }
//         try {
//             let result = {};
//             async.parallel([
//                 function (cb) {
//                     chatModel.advancedAggregate(query, {}, (err, messages) => {
//                         if (err) {
//                             throw err;
//                         } else {
//                             if (!data.searchKey) {
//                                 result.recordsTotal = messages.length;
//                             }
//                             cb(null);
//                         }
//                     });
//                 },
//                 function (cb) {
//                     chatModel.advancedAggregate(query, options, (err, messages) => {
//                         if (err) {
//                             throw err;
//                         } else if (options.skip === 0 && _.isEmpty(messages)) {
//                             cb(null)
//                         } else if (options.skip > 0 && _.isEmpty(messages)) {
//                             cb(null);
//                         } else {
//                             let msg = [];
//                             if (!!data.searchKey) {
//                                 _.forEach(messages, (chatData) => {
//                                     var re = new RegExp('^' + data.searchKey.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
//                                     if (ObjectID(chatData.sender_id) !== ObjectID(req.payload._id)) {
//                                         if (re.test(chatData.receiverData.name)) {
//                                             msg.push(chatData);
//                                         }
//                                     }
//                                     else {
//                                         if (re.test(chatData.senderData.name)) {
//                                             msg.push(chatData);
//                                         }
//                                     }
//                                 });
//                                 result.messages = msg;
//                                 result.recordsTotal = msg.length;
//                             }
//                             else {
//                                 result.messages = messages;
//                             }
//                             cb(null);
//                         }
//                     });
//                 }
//             ], function (err) {
//                 if (err) {
//                     throw err;
//                 } else if (options.skip === 0 && _.isEmpty(result.messages)) {
//                     response.setData(AppCode.Success, {});
//                     response.send(res);
//                 } else if (options.skip > 0 && _.isEmpty(result.messages)) {
//                     response.setData(AppCode.Success, {});
//                     response.send(res);
//                 } else {
//                     response.setData(AppCode.Success, result);
//                     response.send(res);
//                 }
//             });
//         } catch (exception) {
//             Logger.error(AppCode.InternalServerError.message, exception);
//             response.setError(AppCode.InternalServerError);
//             response.send(res);
//         }
//     }
//     else {
//         response.setData(AppCode.LoginAgain, {});
//         response.send(res);
//     }
// }

ChatCtrl.getChatUsersListFilter = (req, res) => {
  const response = new HttpRespose();
  let data = req.body;
  let searchKey = "";
  searchKey = !!req.body.searchKey ? req.body.searchKey : "";
  let loginUserId = req.payload._id;
  getCHatUserDetails(loginUserId).then((chat) => {
    const userChat = [];
    _.forEach(chat, (chatData) => {
      console.log(chatData);
      if (ObjectID(chatData.sender_id) !== ObjectID(req.payload._id)) {
        userChat.push(ObjectID(chatData.reciver_id));
      } else {
        userChat.push(ObjectID(chatData.sender_id));
      }
      console.log(userChat);
    });
    let query = [
      {
        $match: {
          $or: [
            {
              userName: new RegExp(
                ".*" +
                  searchKey.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&") +
                  ".*",
                "i"
              ),
            },
            {
              locationName: new RegExp(
                "^" + searchKey.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"),
                "i"
              ),
            },
          ],
          // status: 1,
          $expr: {
            $in: ["$masterUserId", userChat],
          },
          // masterUserId: ObjectID(data.user_id)
        },
      },
      {
        $lookup: {
          from: "photo",
          as: "profileImage",
          let: { profileImageId: "$profileImageId" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$profileImageId"] },
              },
            },
            {
              $project: {
                _id: 0,
                photo_name: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: "$profileImage",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "chat",
          as: "chatData",
          let: { userId: "$masterUserId" },
          pipeline: [
            {
              $match: {
                $or: [
                  {
                    $expr: {
                      $and: [
                        {
                          $eq: ["$sender_id", ObjectID(req.payload._id)],
                        },
                        {
                          $eq: ["$reciver_id", "$$userId"],
                        },
                      ],
                    },
                    $expr: {
                      $and: [
                        {
                          $eq: ["$reciver_id", ObjectID(req.payload._id)],
                        },
                        {
                          $eq: ["$sender_id", "$$userId"],
                        },
                      ],
                    },
                  },
                ],
              },
            },
            {
              $project: {
                reciver_id: 1,
                sender_id: 1,
                message: 1,
                createdAt: 1,
                fromToUser: ["$sender_id", "$reciver_id"],
              },
            },
            {
              $unwind: "$fromToUser",
            },
            {
              $sort: {
                fromToUser: 1,
              },
            },
            {
              $group: {
                _id: "$_id",
                fromToUser: {
                  $push: "$fromToUser",
                },
                sender_id: {
                  $first: "$sender_id",
                },
                reciver_id: {
                  $first: "$reciver_id",
                },
                message: {
                  $first: "$message",
                },
                createdAt: {
                  $first: "$createdAt",
                },
              },
            },
            {
              $sort: {
                createdAt: -1,
              },
            },
            {
              $group: {
                _id: "$fromToUser",
                sender_id: {
                  $first: "$sender_id",
                },
                reciver_id: {
                  $first: "$reciver_id",
                },
                message: {
                  $first: "$message",
                },
                createdAt: {
                  $first: "$createdAt",
                },
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: "$chatData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          profileImage: {
            $ifNull: ["$profileImage.photo_name", CONFIG.DEFAULT_PROFILE_PHOTO],
          },
          name: 1,
          profileHeader: 1,
          chatData: 1,
        },
      },
    ];
    const options = {};
    options.limit = !!req.body.recordsPerPage
      ? parseInt(req.body.recordsPerPage)
      : 10;
    options.skip = !!req.body.recordsOffset
      ? parseInt(req.body.recordsOffset)
      : 0;
    try {
      let result = {};
      async.parallel(
        [
          function (cb) {
            const countQuery = [
              {
                $match: {
                  $or: [
                    {
                      name: new RegExp(
                        "^" +
                          searchKey.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"),
                        "i"
                      ),
                    },
                    {
                      locationName: new RegExp(
                        "^" +
                          searchKey.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"),
                        "i"
                      ),
                    },
                  ],
                  // status: 1,
                  $expr: {
                    $in: ["$masterUserId", userChat],
                  },
                  // masterUserId: ObjectID(data.user_id)
                },
              },
              {
                $lookup: {
                  from: "user",
                  localField: "followerId",
                  foreignField: "_id",
                  as: "details",
                },
              },
              {
                $unwind: {
                  path: "$details",
                  preserveNullAndEmptyArrays: true,
                },
              },
              {
                $count: "followersCount",
              },
            ];
            UserModel.advancedAggregate(countQuery, {}, (err, followers) => {
              if (err) {
                throw err;
              } else if (_.isEmpty(followers)) {
                cb(null);
              } else {
                Logger.info(AppCode.Success.message);
                result.followersCount = followers[0].followersCount;
                cb(null);
              }
            });
          },
          function (cb) {
            UserModel.advancedAggregate(query, options, (err, followers) => {
              if (err) {
                throw err;
              } else if (options.skip === 0 && _.isEmpty(followers)) {
                cb(null);
              } else if (options.skip > 0 && _.isEmpty(followers)) {
                cb(null);
              } else {
                result.followers = followers;
                cb(null);
              }
            });
          },
        ],
        function (err) {
          if (err) {
            throw err;
          } else if (options.skip === 0 && _.isEmpty(result.followers)) {
            response.setData(AppCode.Success, {});
            response.send(res);
          } else if (options.skip > 0 && _.isEmpty(result.followers)) {
            response.setData(AppCode.Success, {});
            response.send(res);
          } else {
            response.setData(AppCode.Success, result);
            response.send(res);
          }
        }
      );
    } catch (exception) {
      Logger.error(AppCode.InternalServerError.message, exception);
      response.setError(AppCode.InternalServerError);
      response.send(res);
    }
  });
};
ChatCtrl.manageChatScreenData = (req, res) => {
  console.log(req.body);
  var response = new HttpRespose();
  if (!!req.body && !!req.body.status) {
    try {
      //let icon = '';
      let query = { userId: ObjectID(req.auth._id) };
      let bodyData = req.body;
      bodyData.userId = ObjectID(req.auth._id);
      if (!!bodyData.chatWith) {
        bodyData.chatWith = ObjectID(bodyData.chatWith);
      }
      ChatScreenManagementModel.findOne(query, function (err, data) {
        if (err) {
          //TODO: Log the error here
          response.setError(AppCode.Fail);
          response.send(res);
        } else {
          if (data === null) {
            ChatScreenManagementModel.create(bodyData, function (err, newData) {
              if (err) {
                console.log(err);
                response.setError(AppCode.Fail);
              } else {
                response.setData(AppCode.Success, newData);
                response.send(res);
              }
            });
          } else {
            ChatScreenManagementModel.update(
              query,
              bodyData,
              function (err, updatedData) {
                if (err) {
                  console.log(err);
                  response.setError(AppCode.Fail);
                } else {
                  response.setData(AppCode.Success, updatedData);
                  response.send(res);
                }
              }
            );
          }
        }
      });
    } catch (exception) {}
  } else {
    response.setError(AppCode.Fail);
    response.send(res);
  }
};
ChatCtrl.updateMessageReadStatus = (req, res) => {
  console.log(req.body);
  var response = new HttpRespose();
  if (!!req.body && !!req.body.senderId) {
    try {
      //let icon = '';
      let result = {};
      let query = {
        sender_id: ObjectID(req.body.senderId),
        reciver_id: ObjectID(req.payload.userId),
      };

      chatModel.findOne(query, function (err, data) {
        if (err) {
          console.log(err);
          //TODO: Log the error here
          response.setError(AppCode.Fail);
          response.send(res);
        } else {
          chatModel.updateIsRead(
            query,
            { $set: { isRead: true } },
            function (err, updatedData) {
              if (err) {
                console.log(err);
                response.setError(AppCode.Fail);
              } else {
                NotificationModel.count(
                  { reciverId: ObjectID(req.payload.userId), isView: false },
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
                                  $eq: [
                                    "$reciver_id",
                                    ObjectID(req.payload.userId),
                                  ],
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
                      chatModel.advancedAggregate(
                        query,
                        {},
                        (err, countData) => {
                          if (err) {
                            console.log(err);
                            response.setError(AppCode.InternalServerError);
                            response.send(res);
                          } else {
                            result.ChatCount = countData.length;
                            response.setData(AppCode.Success, result);
                            response.send(res);
                          }
                        }
                      );
                    }
                  }
                );
              }
            }
          );
        }
      });
    } catch (exception) {}
  } else {
    response.setError(AppCode.Fail);
    response.send(res);
  }
};

ChatCtrl.unreadChatCount = (req, res) => {
  var response = new HttpRespose();
  if (!!req.auth && !!req.auth._id) {
    console.log(req.auth._id);
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
    try {
      chatModel.advancedAggregate(query, {}, (err, countData) => {
        if (err) {
          console.log(err);
          response.setError(AppCode.InternalServerError);
          response.send(res);
        } else {
          console.log(
            "countDatacountDatacountDatacountDatacountDatacountData",
            countData
          );
          response.setData(AppCode.Success, countData.length);
          response.send(res);
        }
      });
    } catch (exception) {
      console.log(exception);
      response.setError(AppCode.InternalServerError);
      response.send(res);
    }
  } else {
    response.setError(AppCode.Fail);
    response.send(res);
  }
};

ChatCtrl.onChatScreen = (req, res) => {
  var response = new HttpRespose();
  if (!!req.auth && !!req.auth._id) {
    try {
      ChatScreenManagementModel.findOne(
        {
          chatWith: ObjectID(req.auth._id),
          userId: ObjectID(req.query.userId),
          status: 2,
        },
        { _id: 1 },
        (err, onChat) => {
          if (err) {
            console.log(err);
            response.setError(AppCode.InternalServerError);
            response.send(res);
          } else {
            console.log(onChat);
            if (!!onChat) {
              response.setData(AppCode.Success, "OnChat");
              response.send(res);
            } else {
              response.setData(AppCode.Success, "OffChat");
              response.send(res);
            }
          }
        }
      );
    } catch (exception) {
      console.log(exception);
      response.setError(AppCode.InternalServerError);
      response.send(res);
    }
  } else {
    response.setError(AppCode.Fail);
    response.send(res);
  }
};

const getCHatUserDetails = (userId) => {
  const promise = new Promise((resolve, reject) => {
    let query = [
      {
        $match: {
          $or: [
            {
              sender_id: ObjectID(userId),
            },
            {
              reciver_id: ObjectID(userId),
            },
          ],
        },
      },
      {
        $lookup: {
          from: "user",
          localField: "sender_id",
          foreignField: "masterUserId",
          as: "senderData",
        },
      },
      {
        $unwind: {
          path: "$senderData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "photo",
          localField: "senderData.profileImageId",
          foreignField: "_id",
          as: "senderData.profileImageId",
        },
      },
      {
        $unwind: {
          path: "$senderData.profileImageId",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "user",
          localField: "reciver_id",
          foreignField: "masterUserId",
          as: "receiverData",
        },
      },
      {
        $unwind: {
          path: "$receiverData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "photo",
          localField: "receiverData.profileImageId",
          foreignField: "_id",
          as: "receiverData.profileImageId",
        },
      },
      {
        $unwind: {
          path: "$receiverData.profileImageId",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          userData: {
            $cond: {
              if: { $ne: ["$sender_id", ObjectID(userId)] },
              then: "sender",
              else: {
                $cond: {
                  if: { $ne: ["$reciver_id", ObjectID(userId)] },
                  then: "receiver",
                  else: "",
                },
              },
            },
          },
          senderData: {
            _id: "$senderData.masterUserId",
            profileHeader: 1,
            name: 1,
            profileImage: {
              $ifNull: [
                "$senderData.profileImageId.photo_name",
                CONFIG.DEFAULT_PROFILE_PHOTO,
              ],
            },
          },
          receiverData: {
            _id: "$receiverData.masterUserId",
            profileHeader: 1,
            name: 1,
            profileImage: {
              $ifNull: [
                "$receiverData.profileImageId.photo_name",
                CONFIG.DEFAULT_PROFILE_PHOTO,
              ],
            },
          },
          reciver_id: 1,
          sender_id: 1,
          message: 1,
          createdAt: 1,
          fromToUser: ["$sender_id", "$reciver_id"],
        },
      },
      {
        $unwind: "$fromToUser",
      },
      {
        $sort: {
          fromToUser: 1,
        },
      },
      {
        $group: {
          _id: "$_id",
          fromToUser: {
            $push: "$fromToUser",
          },
          sender_id: {
            $first: "$sender_id",
          },
          reciver_id: {
            $first: "$reciver_id",
          },
          message: {
            $first: "$message",
          },
          createdAt: {
            $first: "$createdAt",
          },
          senderData: {
            $first: "$senderData",
          },
          receiverData: {
            $first: "$receiverData",
          },
          userData: {
            $first: "$userData",
          },
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $group: {
          _id: "$fromToUser",
          sender_id: {
            $first: "$sender_id",
          },
          reciver_id: {
            $first: "$reciver_id",
          },
          message: {
            $first: "$message",
          },
          createdAt: {
            $first: "$createdAt",
          },
          senderData: {
            $first: "$senderData",
          },
          receiverData: {
            $first: "$receiverData",
          },
          userData: {
            $first: "$userData",
          },
        },
      },
    ];

    chatModel.advancedAggregate(query, {}, (err, chats) => {
      if (err) {
        return reject(err);
      }
      return resolve(chats);
    });
  });

  return promise;
};
const getBuddiesList = (userId) => {
  console.log(userId);
  const promise = new Promise((resolve, reject) => {
    let query = [
      {
        $match: {
          _id: ObjectID(userId),

          // "privacyStatus": { $ne: true }
        },
      },
      {
        $lookup: {
          from: "buddies",
          as: "BuddiesFriends",
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
                buddiesId: 1,
              },
            },
          ],
        },
      },
      {
        $project: {
          _id: 0,
          BuddiesFriends: 1,
        },
      },
    ];
    UserModel.advancedAggregate(query, {}, (err, user) => {
      if (err) {
        return reject(err);
      }
      return resolve(user[0]);
    });
  });

  return promise;
};

module.exports = ChatCtrl;
