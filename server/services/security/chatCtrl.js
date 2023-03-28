let ChatCtrl = {};

const UserModel =
  new (require("../../common/model/userModel"))();
const chatModel = new (require("./../../common/model/chatModel"))();
const ChatScreenManagementModel = new (require("./../../common/model/ChatScreenManagementModel"))();
const NotificationModel = new (require("./../../common/model/NotificationModel"))();
const ImageModel = new (require("./../../common/model/imageModel"))();

const HttpRespose = require("./../../common/httpResponse");
const AppCode = require("../../common/constant/appCods");
const async = require("async");
const Logger = require("../../common/logger");
const _ = require("lodash");
const ObjectID = require("mongodb").ObjectID;
const CONFIG = require("../../config");
const userModel = require("../../common/model/userModel");
const { eq } = require("lodash");


// -not use
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
        file_name: 1,
        video_screenshort: 1,
        size: 1,
        thumbnail: 1,
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
          response.setData(AppCode.NotFound);
          response.send(res);
        } else if (options.skip > 0 && _.isEmpty(result.messages)) {
          response.setData(AppCode.NotFound);
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

// use this API when message seen
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

  const List = []
  List.push(ObjectID(req.auth._id))


  if (!!data.isGroup == true) {

    console.log("iffffffffffffffffff");


    let query = [
      {
        $match: {
          $or: [

            {
              groupId: ObjectID(req.body.user_id)
            }

          ],
          // $expr:
          //   {
          //       $nin: ["$isDeletedBy", List],   
          //   }

          isDeletedBy: { $nin: List }



        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },

      {
        $lookup: {
          from: "user",
          localField: "sender_id",
          foreignField: "_id",
          as: "senderData",
        },
      },
      {
        $unwind: {
          path: "$senderData",
          preserveNullAndEmptyArrays: true,
        },
      },
      // {
      //   $lookup: {
      //     from: "user",
      //     localField: "reciver_id",
      //     foreignField: "_id",
      //     as: "receiverData",
      //   },
      // },
      // {
      //   $unwind: {
      //     path: "$receiverData",
      //     preserveNullAndEmptyArrays: true,
      //   },
      // },

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
          profile_image: {
            $ifNull: [
              "$senderData.profile_image",
              CONFIG.DEFAULT_PROFILE_PHOTO,
            ],
          },
          userName: "$senderData.userName",
          file_name: 1,
          video_screenshort: 1,
          size: 1,
          thumbnail: 1,
          isDeleted: 1,
          isDeletedBy: 1,
          file_original_name: 1,
          // senderData: {
          //   _id: "$senderData._id",
          //   profileHeader: 1,
          //   userName: 1,
          //   profile_image: {
          //     $ifNull: [
          //       "$senderData.profile_image",
          //       CONFIG.DEFAULT_PROFILE_PHOTO,
          //     ],
          //   },
          // },
          // receiverData: {
          //   _id: "$receiverData._id",
          //   profileHeader: 1,
          //   userName: 1,
          //   profile_image: {
          //     $ifNull: [
          //       "$receiverData.profile_image",
          //       CONFIG.DEFAULT_PROFILE_PHOTO,
          //     ],
          //   },
          // },
          yearMonthDay: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
              timezone: timezoneData,
            },
          },
        },
      },
      // { $sort: { createdAt: 1 } },

      // {
      //   $group: {
      //     _id: "$yearMonthDay",
      //     Date: {
      //       $first: { $toDate: "$yearMonthDay" },
      //     },
      //     chat: { $push: "$$ROOT" },
      //   },
      // },
      // { $sort: { Date: -1 } },
      //{ $sort: { createdAt: 1 } },
    ];

    try {
      let result = {};
      async.parallel(
        [
          function (cb) {
            const countQuery = {
              $or: [
                {
                  groupId: ObjectID(req.body.user_id),


                },

              ],
              isDeletedBy: { $nin: List }

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
            let q = [
              {
                $match: {
                  $or: [

                    {
                      groupId: ObjectID(req.body.user_id)
                    }

                  ],
                 
                  isDeletedBy: { $nin: List }
              
                },
              },

            ]
            chatModel.aggregate(q, (err, groupppp) => {
              if (err) {
                throw err;
              } else {
                  console.log("groupppppppppppppp",groupppp);
               //   console.log("_idddddddddddddddddddd",groupppp._id)

               let condition = {};
            
               condition.groupId = ObjectID(req.body.user_id);

               let update;
               update = { $pull: {unreadArray :ObjectID(req.auth._id) } };
               console.log("updateeeeeeeeeeeeeeeeeeeeeeeee",update);
               console.log("condition",condition);
               chatModel.updateMany(
                condition,
                update,
                (err, group) => {
                  if (err) {
                    throw err;
                  } else {
                    console.log("updatesuccesfully");
                    cb(null)
                  
                   //  response.setData(AppCode.Success);
                   // response.send(res);
                  }
                }
              );
              }
            });
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
            response.setData(AppCode.NotFound);
            response.send(res);
          } else if (skip > 0 && _.isEmpty(result.messages)) {
            response.setData(AppCode.NotFound);
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
    console.log("elseeeeeeeeeeeeeeeeeeeeee");
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
          // $expr:
          //   {
          //       $nin: ["$isDeletedBy", List],   
          //   }

          isDeletedBy: { $nin: List }



        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },

      {
        $lookup: {
          from: "user",
          localField: "sender_id",
          foreignField: "_id",
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
          from: "user",
          localField: "reciver_id",
          foreignField: "_id",
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
        $project: {
          _id: 1,
          message: 1,
          sender_id: 1,
          reciver_id: 1,
          type: 1,
          isRead: 1,
          postId: 1,
          createdAt: 1,
          profile_image: {
            $ifNull: [
              "$senderData.profile_image",
              CONFIG.DEFAULT_PROFILE_PHOTO,
            ],
          },
          userName: "$senderData.userName",
          file_name: 1,
          video_screenshort: 1,
          size: 1,
          thumbnail: 1,
          isDeleted: 1,
          isDeletedBy: 1,
          file_original_name: 1,
          // senderData: {
          //   _id: "$senderData._id",
          //   profileHeader: 1,
          //   userName: 1,
          //   profile_image: {
          //     $ifNull: [
          //       "$senderData.profile_image",
          //       CONFIG.DEFAULT_PROFILE_PHOTO,
          //     ],
          //   },
          // },
          // receiverData: {
          //   _id: "$receiverData._id",
          //   profileHeader: 1,
          //   userName: 1,
          //   profile_image: {
          //     $ifNull: [
          //       "$receiverData.profile_image",
          //       CONFIG.DEFAULT_PROFILE_PHOTO,
          //     ],
          //   },
          // },
          yearMonthDay: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
              timezone: timezoneData,
            },
          },
        },
      },
      // { $sort: { createdAt: 1 } },

      // {
      //   $group: {
      //     _id: "$yearMonthDay",
      //     Date: {
      //       $first: { $toDate: "$yearMonthDay" },
      //     },
      //     chat: { $push: "$$ROOT" },
      //   },
      // },
      // { $sort: { Date: -1 } },
      //{ $sort: { createdAt: 1 } },
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
              isDeletedBy: { $nin: List }

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
            response.setData(AppCode.NotFound);
            response.send(res);
          } else if (skip > 0 && _.isEmpty(result.messages)) {
            response.setData(AppCode.NotFound);
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

  }
};


//-not use
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
            response.setData(AppCode.NotFound);
            response.send(res);
          } else if (options.skip > 0 && _.isEmpty(result.messages)) {
            response.setData(AppCode.NotFound);
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


//-not use
// recent chat user List without group old
ChatCtrl.getChatWithUsersList = (req, res) => {
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
  const List = []
  List.push(ObjectID(req.auth._id))
  console.log("List...........", List)

  getCHatUserDetails(loginUserId).then((chat) => {
    const userChat = [];
    const groupId = [];

    _.forEach(chat, (chatData) => {
      //  console.log(",,,,,,,,,,,,,", chatData);

      if (chatData.sender_id == req.auth._id) {
        userChat.push(ObjectID(chatData.reciver_id));
      }
      else {
        userChat.push(ObjectID(chatData.sender_id));
      }

      // if(chatData.groupId)
      // {
      //   groupId.push(ObjectID(chatData.groupId))

      // }
      // console.log("...............................................",userChat);
    });

    // console.log("...............................................", groupId);
    console.log("...............................................", userChat);

    if (searchKey == "") {
      condition = {
        $expr: {
          $in: ["$_id", userChat],
        },
      };
    } else {
      condition = {
        userName: new RegExp(
          ".*" + searchKey.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&") + ".*",
          "i"
        ),
        $expr: {
          $in: ["$_id", userChat],
        },
      };
    }

    let query = [
      {
        $match: condition

      },
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
                isDeletedBy: { $nin: List }

              },


            },
            {
              $group: {
                _id: null,
                message: { $last: "$message" },
                type: { $last: "$type" },
                file_name: { $last: "$file_name" },
                video_screenshort: { $last: "$video_screenshort" },
                size: { $last: "$size" },
                thumbnail: { $last: "$thumbnail" },
                messageAt: { $last: "$createdAt" },
                senderId: { $last: "$sender_id" },
                receiverId: { $last: "$reciver_id" },
                groupId: { $last: "$groupId" },
                count: { $sum: 1 },

              },
            },
            //   {
            //     $lookup: {
            //         from: "favourite",
            //         as: "favouritedata",
            //         let: { "favId": "$favId" },
            //         pipeline: [
            //           {
            //             $match: {
            //                 $expr: {
            //                     $and: [
            //                         {
            //                             $eq: ["$userId", ObjectID(req.auth.userId)]
            //                         },
            //                         {
            //                             $eq: ["$favId", $$favId],
            //                         },
            //                     ]
            //                 }
            //             }
            //         },
            //             {
            //                 $project: {
            //                     _id: 1,
            //                 }
            //             }
            //         ]
            //     },
            // },
            // {
            //     $unwind: {
            //         "path": "$favouritedata",
            //         "preserveNullAndEmptyArrays": true
            //     },
            // },

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
                isDeletedBy: { $nin: List }

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
        $lookup: {
          from: "favourite",
          as: "favouritedata",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: ["$userId", ObjectID(req.auth._id)],
                    },
                    {
                      $eq: ["$favId", "$$userId"],
                    },

                  ],
                },
              },
            },
          ],
        },
      },

      {
        $project: {
          _id: 1,
          favouritedata: {
            $cond: {
              if: { $eq: ["$favouritedata", []] },
              then: false,
              else: true,
            }
          },
          userId: 1,
          mobileNo: 1,
          countryName: 1,
          countryCode: 1,
          isverified: 1,
          status: 1,
          chat: 1,
          groupId: "$chat.groupId",
          userName: 1,
          firstName: 1,
          lastName: 1,
          profile_image: { $ifNull: ["$profile_image", "-"] },
          statusType: 1,
          "chatId": "$chat._id",
          "chat": "$chat.message",
          // chat: {
          //   $cond: {
          //     if: { $eq: ["$chat.type", "post"] },
          //     then: "Shared a post",
          //     else: "$chat.message",
          //   },
          // },
          // "userData": {
          //   $cond: {
          //     if: { $eq: ["$chat.senderId",  ObjectID(req.auth._id)] },
          //     then: "reciver",
          //     else: "sender",
          //   },
          // },

          isDeleted: {
            $cond: {
              if: { $isArray: "$isDeleted" },
              then: { $size: "$isDeleted" },
              else: 0,
            },
          },
          // chat:1,
          "file_name": "$chat.file_name",
          "video_screenshort": "$chat.video_screenshort",
          "size": "$chat.size",
          "thumbnail": "$chat.thumbnail",
          messageAt: "$chat.messageAt",
          senderId: "$chat.senderId",
          receiverId: "$chat.receiverId",
          //user:true,
          userData: {
            $cond: {
              if: { $eq: ["$chat.sender_id", (req.auth._id)] }, then: "sender",
              else: "reciever"
            }
          },

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
                console.log("followersfollowersfollowersfollowers", followers);

                let abc = []

                followers.filter((x) => {

                  let temp = {
                    _id: x._id,
                    mobileNo: x.mobileNo,
                    countryName: x.countryName,
                    countryCode: x.countryCode,
                    isverified: x.isverified,
                    status: x.status,
                    userName: x.userName,
                    profile_image: x.profile_image,
                    chat: x.chat,
                    file_name: x.file_name,
                    size: x.size,
                    video_screenshort: x.video_screenshort,
                    thumbnail: x.thumbnail,
                    userData: x.userData,
                    isDeleted: x.isDeleted,
                    messageAt: x.messageAt,
                    senderId: x.senderId,
                    receiverId: x.receiverId,
                    unreadCount: x.unreadCount,
                    chat_status: false,
                    isFavourite: x.favouritedata,



                  }
                  abc.push(temp)

                })

                result.result = abc;
                //  console.log("##########$$$$$$$$$$%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%", abc)
                cb(null);
              }
            });
          },
        ],
        function (err) {
          if (err) {
            throw err;
          } else if (options.skip === 0 && _.isEmpty(result.result)) {
            console.log(",,,,,,,,else 1")
            response.setData(AppCode.NotFound, result);
            response.send(res);
          } else if (options.skip > 0 && _.isEmpty(result.result)) {
            console.log(",,,,,,,,else if")
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


//-not use
//ajay sir - done.
// ChatCtrl.getChatUsersListold = (req, res) => {
//   const response = new HttpRespose();
//   let data = req.body;

//   if (!!req.auth && !!req.auth._id) {
//     let sort = -1;
//     if (data.sortBy === "oldest") {
//       sort = 1;
//     }
//     let query =
//       [
//         {
//           $match: {
//             $or: [
//               {
//                 "sender_id": ObjectID(req.auth._id)
//               },
//               {
//                 "reciver_id": ObjectID(req.auth._id)
//               }
//             ]
//           }
//         },

//         {
//           $lookup: {
//             from: "user",
//             localField: "sender_id",
//             foreignField: "_id",
//             as: "senderData"
//           }
//         },
//         {
//           "$unwind": {
//             "path": "$senderData",
//             "preserveNullAndEmptyArrays": true
//           }
//         },
//         {
//           $lookup: {
//             from: "photo",
//             localField: "senderData.profileImageId",
//             foreignField: "_id",
//             as: "senderData.profileImageId"
//           }
//         },
//         {
//           "$unwind": {
//             "path": "$senderData.profileImageId",
//             "preserveNullAndEmptyArrays": true
//           }
//         },
//         {
//           $lookup: {
//             from: "user",
//             localField: "reciver_id",
//             foreignField: "_id",
//             as: "receiverData"
//           }
//         },
//         {
//           "$unwind": {
//             "path": "$receiverData",
//             "preserveNullAndEmptyArrays": true
//           }
//         },
//         {
//           $lookup: {
//             from: "photo",
//             localField: "receiverData.profileImageId",
//             foreignField: "_id",
//             as: "receiverData.profileImageId"
//           }
//         },
//         {
//           "$unwind": {
//             "path": "$receiverData.profileImageId",
//             "preserveNullAndEmptyArrays": true
//           }
//         },
//         {
//           $lookup: {
//             from: "chat",
//             as: "unreadCount",
//             let: { userId: "$_id" },
//             pipeline: [
//               {
//                 $match: {
//                   $expr: {
//                     $and: [
//                       { $eq: ["$reciver_id", ObjectID(req.auth._id)] },
//                       { $eq: ["$sender_id", "$$userId"] },
//                       { $ne: ["$isRead", true] },
//                     ],
//                   },
//                   isDeletedBy: { $nin: List }

//                 },
//               },

//               {
//                 $group: {
//                   _id: null,
//                   count: { $sum: 1 },
//                 },
//               },
//             ],
//           },
//         },

//         {
//           $unwind: {
//             path: "$unreadCount",
//             preserveNullAndEmptyArrays: true,
//           },
//         },
//         {
//           "$project": {
//             "userData": {
//               $cond: {
//                 if: { $ne: ["$sender_id", ObjectID(req.auth._id)] }, then: "sender",
//                 else: {
//                   $cond: { if: { $ne: ["$reciver_id", ObjectID(req.auth._id)] }, then: "receiver", else: "" }
//                 }
//               }
//             },
//             "senderData": {
//               _id: "$senderData._id", profileHeader: 1, userName: 1, profileImage: { $ifNull: ["$senderData.profile_image", CONFIG.DEFAULT_PROFILE_PHOTO] }
//             },
//             "receiverData": {
//               _id: "$receiverData._id", profileHeader: 1, userName: 1, profileImage: { $ifNull: ["$receiverData.profile_image", CONFIG.DEFAULT_PROFILE_PHOTO] }
//             },
//             reciver_id: 1,
//             sender_id: 1,
//             message: 1,
//             createdAt: 1,
//             isRead: 1,
//             count: { $ifNull: ["$isRead", 0] },
//             senderName: "$senderData.userName",
//             fromToUser: [
//               "$sender_id",
//               "$reciver_id"
//             ]
//           }
//         },
//         {
//           $unwind: "$fromToUser"
//         },
//         {
//           $sort: {
//             "fromToUser": 1
//           }
//         },
//         {
//           $group: {
//             _id: "$_id",
//             "fromToUser": {
//               $push: "$fromToUser"
//             },
//             "sender_id": {
//               "$first": "$sender_id"
//             },
//             "reciver_id": {
//               "$first": "$reciver_id"
//             },
//             "message": {
//               "$first": "$message"
//             },
//             "createdAt": {
//               "$first": "$createdAt"
//             },
//             "senderData": {
//               "$first": "$senderData"
//             },
//             "receiverData": {
//               "$first": "$receiverData"
//             },
//             "userData": {
//               "$first": "$userData"
//             },
//             "count": {
//               "$first": "$count"
//             },


//           }
//         },
//         {
//           "$sort": {
//             "createdAt": -1
//           }
//         },
//         {
//           "$group": {
//             "_id": "$fromToUser",
//             "sender_id": {
//               "$first": "$sender_id"
//             },
//             "reciver_id": {
//               "$first": "$reciver_id"
//             },
//             "message": {
//               "$first": "$message"
//             },
//             "createdAt": {
//               "$first": "$createdAt"
//             },
//             "senderData": {
//               "$first": "$senderData"
//             },
//             "receiverData": {
//               "$first": "$receiverData"
//             },
//             "userData": {
//               "$first": "$userData"
//             },
//             "count": {
//               "$first": "$count"
//             },
//           }
//         }
//       ]
//     const options = {}
//     if (!!data.searchKey) {
//       console.log("....searchKeysearchKeysearchKeysearchKey....", data.searchkey)
//       options.limit = !!data.recordsPerPage ? parseInt(data.recordsPerPage) : 10;
//       options.skip = !!data.recordsOffset ? parseInt(data.recordsOffset) : 0;
//       options.sort = { createdAt: sort }
//     }
//     else {
//       console.log(",,,,,,,without,,,,,,,")
//       options.limit = 1000;
//       options.skip = 0;
//       options.sort = { createdAt: sort }
//     }
//     try {
//       let result = {};
//       async.parallel([
//         function (cb) {
//           chatModel.advancedAggregate(query, {}, (err, messages) => {
//             if (err) {
//               throw err;
//             } else {
//               if (!data.searchKey) {
//                 result.recordsTotal = messages.length;
//               }
//               cb(null);
//             }
//           });
//         },
//         function (cb) {
//           chatModel.advancedAggregate(query, options, (err, messages) => {
//             if (err) {
//               throw err;
//             } else if (options.skip === 0 && _.isEmpty(messages)) {
//               cb(null)
//             } else if (options.skip > 0 && _.isEmpty(messages)) {
//               cb(null);
//             } else {
//               console.log("..........", messages)
//               let msg = [];
//               if (!!data.searchKey) {
//                 _.forEach(messages, (chatData) => {
//                   var re = new RegExp('^' + data.searchKey.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
//                   if (ObjectID(chatData.sender_id) !== ObjectID(req.auth._id)) {
//                     if (re.test(chatData.receiverData.userName)) {
//                       msg.push(chatData);
//                     }
//                   }
//                   else {
//                     if (re.test(chatData.senderData.userName)) {
//                       msg.push(chatData);
//                     }
//                   }
//                 });
//                 result.messages = msg;
//                 result.recordsTotal = msg.length;
//               }
//               else {
//                 result.messages = messages;
//               }
//               cb(null);
//             }
//           });
//         }
//       ], function (err) {
//         if (err) {
//           throw err;
//         } else if (options.skip === 0 && _.isEmpty(result.messages)) {
//           response.setData(AppCode.Success, {});
//           response.send(res);
//         } else if (options.skip > 0 && _.isEmpty(result.messages)) {
//           response.setData(AppCode.Success, {});
//           response.send(res);
//         } else {
//           response.setData(AppCode.Success, result);
//           response.send(res);
//         }
//       });
//     } catch (exception) {
//       Logger.error(AppCode.InternalServerError.message, exception);
//       response.setError(AppCode.InternalServerError);
//       response.send(res);
//     }
//   }
//   else {
//     response.setData(AppCode.LoginAgain, {});
//     response.send(res);
//   }
// }

//ajay sir - done.
ChatCtrl.getChatUsersList2 = (req, res) => {
  const response = new HttpRespose();
  let data = req.body;
  const List = []
  List.push(ObjectID(req.auth._id))
  console.log("List...........", List)

  if (!!req.auth && !!req.auth._id) {
    let sort = -1;
    if (data.sortBy === "oldest") {
      sort = 1;
    }
    let query =
      [
        {
          $match: {
            $or: [
              {
                "sender_id": ObjectID(req.auth._id)
              },
              {
                "reciver_id": ObjectID(req.auth._id)
              },
              {
                group_user: { $in: List }
              }

            ],
            isDeletedBy: { $nin: List },
            //group_user:{$in:List}
            //  unreadArray:{$in:List}

          }
        },

        {
          $lookup: {
            from: "user",
            localField: "sender_id",
            foreignField: "_id",
            as: "senderData"
          }
        },
        {
          "$unwind": {
            "path": "$senderData",
            "preserveNullAndEmptyArrays": true
          }
        },

        {
          $lookup: {
            from: "user",
            localField: "reciver_id",
            foreignField: "_id",
            as: "receiverData"
          }
        },
        {
          "$unwind": {
            "path": "$receiverData",
            "preserveNullAndEmptyArrays": true
          }
        },
        {
          $lookup: {
            from: "favourite",
            as: "favouritedata",
            // let: { userId: "$_id" },
            let: { senderId: "$sender_id", reciverId: "$reciver_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      {
                        $eq: ["$userId", ObjectID(req.auth._id)],
                      },
                      {
                        // $eq: ["$favId", "$$userId"],
                        $or: [
                          {
                            $eq: ["$favId", "$$senderId"],

                          },
                          {
                            $eq: ["$favId", "$$reciverId"],
                          }

                        ]
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
            from: "group",
            localField: "groupId",
            foreignField: "_id",
            as: "groupdata"
          }
        },
        {
          "$unwind": {
            "path": "$groupdata",
            "preserveNullAndEmptyArrays": true
          }
        },
        {
          $lookup: {
            from: "chat",
            as: "unreadCount",
            let: { reciver_id: "$reciver_id", sender_id: "$sender_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$reciver_id", ObjectID(req.auth._id)] },
                      { $eq: ["$sender_id", "$$sender_id"] },
                      { $ne: ["$isRead", true] },
                    ],
                  },
                  isDeletedBy: { $nin: List }

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
          $lookup: {
            from: "chat",
            as: "groupunread",
            let: { groupId: "$groupId", senderId: "$sender_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$sender_id", "$$senderId"] },
                      { $eq: ["$groupId", "$$groupId"] },
                      { $in: ["$group_user", List] },
                    ],
                  },
                  isDeletedBy: { $nin: List },
                  unreadArray: { $in: List }

                },
              },

            ],
          },
        },

        // {
        //   $unwind: {
        //     path: "$groupunread",
        //     preserveNullAndEmptyArrays: true,
        //   },
        // },



        {
          "$project": {
            _id: 1,

            groupName: "$groupdata.group_name",
            "userData": {
              $cond: {
                if: { $ne: ["$sender_id", ObjectID(req.auth._id)] }, then: "sender",
                else: {
                  $cond: { if: { $ne: ["$reciver_id", ObjectID(req.auth._id)] }, then: "receiver", else: "" }
                }
              }
            },
            // "senderData": {
            //   _id: "$senderData._id", countryCode: 1,countryName:1,mobileNo:1,isverified:1, userName: 1, profileImage: { $ifNull: ["$senderData.profile_image", CONFIG.DEFAULT_PROFILE_PHOTO] }
            // },
            // "receiverData": {
            //   _id: "$receiverData._id",  countryCode: 1,countryName:1,mobileNo:1,isverified:1, userName: 1, profileImage: { $ifNull: ["$receiverData.profile_image", CONFIG.DEFAULT_PROFILE_PHOTO] }
            // },
            userName: {
              $cond: {
                if: { $ne: ["$sender_id", ObjectID(req.auth._id)] },
                then: "$senderData.userName",
                else: "$receiverData.userName"
              }
            },
            status: {
              $cond: {
                if: { $ne: ["$sender_id", ObjectID(req.auth._id)] },
                then: "$senderData.status",
                else: "$receiverData.status"
              }
            },
            countryCode: {
              $cond: {
                if: { $ne: ["$sender_id", ObjectID(req.auth._id)] },
                then: "$senderData.countryCode",
                else: "$receiverData.countryCode"
              }
            },
            countryName: {
              $cond: {
                if: { $ne: ["$sender_id", ObjectID(req.auth._id)] },
                then: "$senderData.countryName",
                else: "$receiverData.countryName"
              }
            },
            mobileNo: {
              $cond: {
                if: { $ne: ["$sender_id", ObjectID(req.auth._id)] },
                then: "$senderData.mobileNo",
                else: "$receiverData.mobileNo"
              }
            },
            userId: {
              $cond: {
                if: { $ne: ["$sender_id", ObjectID(req.auth._id)] },
                then: "$senderData._id",
                else: "$receiverData._id"
              }
            },
            profile_image: {
              $cond: {
                if: { $ne: ["$sender_id", ObjectID(req.auth._id)] },
                then: "$senderData.profile_image",
                else: "$receiverData.profile_image"
              }
            },
            isverified: {
              $cond: {
                if: { $ne: ["$sender_id", ObjectID(req.auth._id)] },
                then: "$senderData.isverified",
                else: "$receiverData.isverified"
              }
            },
            reciverId: "$reciver_id",
            senderId: "$sender_id",
            //  sender_id: 1,
            // reciver_id: 1,
            senderName: "$senderData.userName",
            reciverName: "$receiverData.userName",

            // message: 1,
            chat: "$message",
            createdAt: 1,
            messageAt: "$createdAt",
            isRead: 1,
            groupId: 1,
            isGroup: 1,
            countttttt: { $size: "$groupunread" },
            unreadCount: { $ifNull: ["$unreadCount.count", 0] },
            finalcount: {
              $cond: {
                if: { $eq: ["$isGroup", true] },
                then: { $size: "$groupunread" },
                else: { $ifNull: ["$unreadCount.count", 0] },
              }
            },
            count: { $ifNull: ["$isRead", 0] },
            // fromToUser1 :{$ifNull :["$reciver_id",["null","$sender_id"]},
            fromToUser: [
              "$sender_id",
              "$reciver_id"
            ],
            // fromToUser:{$cond: {
            //   if: { $eq: ["$isGroup",true] }, 
            //   then: [null ,"$sender_id"],
            //   else: "$fromToUser2"
            // }},
            isFavourite: {
              $cond: {
                if: { $eq: ["$favouritedata", []] },
                then: false,
                else: true,
              }
            },

            file_name: 1,
            size: 1,
            thumbnail: 1,
            video_screenshort: 1,
          }
        },
        {
          $unwind: "$fromToUser"
        },
        {
          $sort: {
            "fromToUser": 1
          }
        },
        {
          $group: {
            _id: "$_id",

            "fromToUser": {
              $push: "$fromToUser"
            },
            "countttttt": {
              "$first": "$countttttt"
            },
            "finalcount": {
              "$first": "$finalcount"
            },

            "unreadCount": {
              "$first": "$unreadCount"
            },
            "file_name": {
              "$first": "$file_name"
            },
            "size": {
              "$first": "$size"
            },
            "thumbnail": {
              "$first": "$thumbnail"
            },
            "video_screenshort": {
              "$first": "$video_screenshort"
            },
            "senderId": {
              "$first": "$senderId"
            },
            "reciverId": {
              "$first": "$reciverId"
            },
            "chat": {
              "$first": "$chat"
            },
            "createdAt": {
              "$first": "$createdAt"
            },
            "senderData": {
              "$first": "$senderData"
            },
            "receiverData": {
              "$first": "$receiverData"
            },
            "userData": {
              "$first": "$userData"
            },
            "userData": {
              "$first": "$userData"
            },
            "senderName": {
              "$first": "$senderName"
            },
            "reciverName": {
              "$first": "$reciverName"
            },
            "groupId": {
              "$first": "$groupId"
            },
            "isGroup": {
              "$first": "$isGroup"
            },
            "count": {
              "$first": "$count"
            },
            "isFavourite": {
              "$first": "$isFavourite"
            },
            "userName": {
              "$first": "$userName"
            },
            "countryCode": {
              "$first": "$countryCode"
            },
            "countryName": {
              "$first": "$countryName"
            },
            "mobileNo": {
              "$first": "$mobileNo"
            },
            "userId": {
              "$first": "$userId"
            },
            "profile_image": {
              "$first": "$profile_image"
            },
            "messageAt": {
              "$first": "$messageAt"
            },
            "isverified": {
              "$first": "$isverified"
            },
            "groupName": {
              "$first": "$groupName"
            },
            "status": {
              "$first": "$status"
            },



          }
        },
        {
          "$sort": {
            "createdAt": -1
          }
        },
        {
          "$group": {
            "_id": "$fromToUser",
            "unreadCount": {
              "$first": "$unreadCount"
            },
            "finalcount": {
              "$first": "$finalcount"
            },
            "countttttt": {
              "$first": "$countttttt"
            },
            "file_name": {
              "$first": "$file_name"
            },
            "size": {
              "$first": "$size"
            },
            "thumbnail": {
              "$first": "$thumbnail"
            },
            "video_screenshort": {
              "$first": "$video_screenshort"
            },
            "senderId": {
              "$first": "$senderId"
            },
            "reciverId": {
              "$first": "$reciverId"
            },
            "chat": {
              "$first": "$chat"
            },
            "createdAt": {
              "$first": "$createdAt"
            },

            "userData": {
              "$first": "$userData"
            },
            "senderName": {
              "$first": "$senderName"
            },
            "reciverName": {
              "$first": "$reciverName"
            },
            "groupId": {
              "$first": "$groupId"
            },
            "isGroup": {
              "$first": "$isGroup"
            },
            "count": {
              "$first": "$count"
            },
            "isFavourite": {
              "$first": "$isFavourite"
            },
            "userName": {
              "$first": "$userName"
            },
            "countryCode": {
              "$first": "$countryCode"
            },
            "countryName": {
              "$first": "$countryName"
            },
            "mobileNo": {
              "$first": "$mobileNo"
            },
            "userId": {
              "$first": "$userId"
            },
            "profile_image": {
              "$first": "$profile_image"
            },
            "messageAt": {
              "$first": "$messageAt"
            },
            "isverified": {
              "$first": "$isverified"
            },
            "groupName": {
              "$first": "$groupName"
            },
            "status": {
              "$first": "$status"
            },

          }
        }
      ]
    const options = {}
    if (!!data.searchKey) {
      console.log("....searchKeysearchKeysearchKeysearchKey....", data.searchkey)
      options.limit = !!data.recordsPerPage ? parseInt(data.recordsPerPage) : 10;
      options.skip = !!data.recordsOffset ? parseInt(data.recordsOffset) : 0;
      options.sort = { createdAt: sort }
    }
    else {
      //console.log(",,,,,,,without,,,,,,,")
      options.limit = 1000;
      options.skip = 0;
      options.sort = { createdAt: sort }
    }
    try {
      let result = {};
      async.parallel([
        function (cb) {
          chatModel.advancedAggregate(query, {}, (err, messages) => {
            if (err) {
              throw err;
            } else {
              if (!data.searchKey) {
                result.recordsTotal = messages.length;
              }
              cb(null);
            }
          });
        },
        function (cb) {
          chatModel.advancedAggregate(query, options, (err, messages) => {
            if (err) {
              throw err;
            } else if (options.skip === 0 && _.isEmpty(messages)) {
              cb(null)
            } else if (options.skip > 0 && _.isEmpty(messages)) {
              cb(null);
            } else {

              let msg = [];
              if (!!data.searchKey) {
                _.forEach(messages, (chatData) => {
                  var re = new RegExp('^' + data.searchKey.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
                  if (ObjectID(chatData.sender_id) !== ObjectID(req.auth._id)) {
                    if (re.test(chatData.userName)) {
                      msg.push(chatData);
                    }
                  }
                  else {
                    if (re.test(chatData.senderData.userName)) {
                      msg.push(chatData);
                    }
                  }
                });
                result.messages = msg;
                result.recordsTotal = msg.length;
              }
              else {
                result.messages = messages;
              }
              cb(null);
            }
          });
        }
      ], function (err) {
        if (err) {
          throw err;
        } else if (options.skip === 0 && _.isEmpty(result.messages)) {
          response.setData(AppCode.Success, {});
          response.send(res);
        } else if (options.skip > 0 && _.isEmpty(result.messages)) {
          response.setData(AppCode.Success, {});
          response.send(res);
        } else {
          //  console.log("resuklttttttttttttttttttttttttttt",result);

          response.setData(AppCode.Success, result);
          response.send(res);
        }
      });
    } catch (exception) {
      Logger.error(AppCode.InternalServerError.message, exception);
      response.setError(AppCode.InternalServerError);
      response.send(res);
    }
  }
  else {
    response.setData(AppCode.LoginAgain, {});
    response.send(res);
  }
}


//-not use
//ajay sir - done.
ChatCtrl.getChatUsersList1 = (req, res) => {
  const response = new HttpRespose();
  let data = req.body;
  const List = []
  List.push(ObjectID(req.auth._id))
  console.log("List...........", List)

  if (!!req.auth && !!req.auth._id) {
    let sort = -1;
    if (data.sortBy === "oldest") {
      sort = 1;
    }
    let query =
      [
        {
          $match: {
            $or: [
              {
                "sender_id": ObjectID(req.auth._id)
              },
              {
                "reciver_id": ObjectID(req.auth._id)
              },
              {
                "group_user": { $in: List }

              }

            ],

            isDeletedBy: { $nin: List },

            //  unreadArray:{$in:List}

          }
        },

        {
          $lookup: {
            from: "user",
            localField: "sender_id",
            foreignField: "_id",
            as: "senderData"
          }
        },
        {
          "$unwind": {
            "path": "$senderData",
            "preserveNullAndEmptyArrays": true
          }
        },

        {
          $lookup: {
            from: "user",
            localField: "reciver_id",
            foreignField: "_id",
            as: "receiverData"
          }
        },
        {
          "$unwind": {
            "path": "$receiverData",
            "preserveNullAndEmptyArrays": true
          }
        },
        {
          $lookup: {
            from: "favourite",
            as: "favouritedata",
            // let: { userId: "$_id" },
            let: { senderId: "$sender_id", reciverId: "$reciver_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      {
                        $eq: ["$userId", ObjectID(req.auth._id)],
                      },
                      {
                        // $eq: ["$favId", "$$userId"],
                        $or: [
                          {
                            $eq: ["$favId", "$$senderId"],

                          },
                          {
                            $eq: ["$favId", "$$reciverId"],
                          }

                        ]
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
            as: "unreadCount",
            let: { reciver_id: "$reciver_id", sender_id: "$sender_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$reciver_id", ObjectID(req.auth._id)] },
                      { $eq: ["$sender_id", "$$sender_id"] },
                      { $ne: ["$isRead", true] },
                    ],
                  },
                  isDeletedBy: { $nin: List }

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

        // {
        //   $unwind: {
        //     path: "$groupunread",
        //     preserveNullAndEmptyArrays: true,
        //   },
        // },



        {
          "$project": {
            _id: 1,


            "userData": {
              $cond: {
                if: { $ne: ["$sender_id", ObjectID(req.auth._id)] }, then: "sender",
                else: {
                  $cond: { if: { $ne: ["$reciver_id", ObjectID(req.auth._id)] }, then: "receiver", else: "" }
                }
              }
            },
            // "senderData": {
            //   _id: "$senderData._id", countryCode: 1,countryName:1,mobileNo:1,isverified:1, userName: 1, profileImage: { $ifNull: ["$senderData.profile_image", CONFIG.DEFAULT_PROFILE_PHOTO] }
            // },
            // "receiverData": {
            //   _id: "$receiverData._id",  countryCode: 1,countryName:1,mobileNo:1,isverified:1, userName: 1, profileImage: { $ifNull: ["$receiverData.profile_image", CONFIG.DEFAULT_PROFILE_PHOTO] }
            // },
            userName: {
              $cond: {
                if: { $ne: ["$sender_id", ObjectID(req.auth._id)] },
                then: "$senderData.userName",
                else: "$receiverData.userName"
              }
            },
            status: {
              $cond: {
                if: { $ne: ["$sender_id", ObjectID(req.auth._id)] },
                then: "$senderData.status",
                else: "$receiverData.status"
              }
            },
            countryCode: {
              $cond: {
                if: { $ne: ["$sender_id", ObjectID(req.auth._id)] },
                then: "$senderData.countryCode",
                else: "$receiverData.countryCode"
              }
            },
            countryName: {
              $cond: {
                if: { $ne: ["$sender_id", ObjectID(req.auth._id)] },
                then: "$senderData.countryName",
                else: "$receiverData.countryName"
              }
            },
            mobileNo: {
              $cond: {
                if: { $ne: ["$sender_id", ObjectID(req.auth._id)] },
                then: "$senderData.mobileNo",
                else: "$receiverData.mobileNo"
              }
            },
            userId: {
              $cond: {
                if: { $ne: ["$sender_id", ObjectID(req.auth._id)] },
                then: "$senderData._id",
                else: "$receiverData._id"
              }
            },
            profile_image: {
              $cond: {
                if: { $ne: ["$sender_id", ObjectID(req.auth._id)] },
                then: "$senderData.profile_image",
                else: "$receiverData.profile_image"
              }
            },
            isverified: {
              $cond: {
                if: { $ne: ["$sender_id", ObjectID(req.auth._id)] },
                then: "$senderData.isverified",
                else: "$receiverData.isverified"
              }
            },
            reciverId: "$reciver_id",
            senderId: "$sender_id",
            //  sender_id: 1,
            // reciver_id: 1,
            senderName: "$senderData.userName",
            reciverName: "$receiverData.userName",

            // message: 1,
            chat: "$message",
            createdAt: 1,
            messageAt: "$createdAt",
            isRead: 1,
            groupId: 1,
            isGroup: 1,

            unreadCount: { $ifNull: ["$unreadCount.count", 0] },

            count: { $ifNull: ["$isRead", 0] },
            // fromToUser1 :{$ifNull :["$reciver_id",["null","$sender_id"]},
            fromToUser: [
              "$sender_id",
              "$reciver_id"
            ],

            isFavourite: {
              $cond: {
                if: { $eq: ["$favouritedata", []] },
                then: false,
                else: true,
              }
            },

            file_name: 1,
            size: 1,
            thumbnail: 1,
            video_screenshort: 1,
          }
        },
        {
          $unwind: "$fromToUser"
        },

        {
          $sort: {
            "fromToUser": 1
          }
        },
        {
          $group: {
            _id: "$_id",

            "fromToUser": {
              $push: "$fromToUser"
            },
            "countttttt": {
              "$first": "$countttttt"
            },
            "finalcount": {
              "$first": "$finalcount"
            },

            "unreadCount": {
              "$first": "$unreadCount"
            },
            "file_name": {
              "$first": "$file_name"
            },
            "size": {
              "$first": "$size"
            },
            "thumbnail": {
              "$first": "$thumbnail"
            },
            "video_screenshort": {
              "$first": "$video_screenshort"
            },
            "senderId": {
              "$first": "$senderId"
            },
            "reciverId": {
              "$first": "$reciverId"
            },
            "chat": {
              "$first": "$chat"
            },
            "createdAt": {
              "$first": "$createdAt"
            },
            "senderData": {
              "$first": "$senderData"
            },
            "receiverData": {
              "$first": "$receiverData"
            },
            "userData": {
              "$first": "$userData"
            },
            "userData": {
              "$first": "$userData"
            },
            "senderName": {
              "$first": "$senderName"
            },
            "reciverName": {
              "$first": "$reciverName"
            },
            "groupId": {
              "$first": "$groupId"
            },
            "isGroup": {
              "$first": "$isGroup"
            },
            "count": {
              "$first": "$count"
            },
            "isFavourite": {
              "$first": "$isFavourite"
            },
            "userName": {
              "$first": "$userName"
            },
            "countryCode": {
              "$first": "$countryCode"
            },
            "countryName": {
              "$first": "$countryName"
            },
            "mobileNo": {
              "$first": "$mobileNo"
            },
            "userId": {
              "$first": "$userId"
            },
            "profile_image": {
              "$first": "$profile_image"
            },
            "messageAt": {
              "$first": "$messageAt"
            },
            "isverified": {
              "$first": "$isverified"
            },
            "groupName": {
              "$first": "$groupName"
            },
            "status": {
              "$first": "$status"
            },



          }
        },
        {
          "$sort": {
            "createdAt": -1
          }
        },
        {
          "$group": {
            "_id": "$fromToUser",
            "unreadCount": {
              "$first": "$unreadCount"
            },
            "finalcount": {
              "$first": "$finalcount"
            },
            "countttttt": {
              "$first": "$countttttt"
            },
            "file_name": {
              "$first": "$file_name"
            },
            "size": {
              "$first": "$size"
            },
            "thumbnail": {
              "$first": "$thumbnail"
            },
            "video_screenshort": {
              "$first": "$video_screenshort"
            },
            "senderId": {
              "$first": "$senderId"
            },
            "reciverId": {
              "$first": "$reciverId"
            },
            "chat": {
              "$first": "$chat"
            },
            "createdAt": {
              "$first": "$createdAt"
            },

            "userData": {
              "$first": "$userData"
            },
            "senderName": {
              "$first": "$senderName"
            },
            "reciverName": {
              "$first": "$reciverName"
            },
            "groupId": {
              "$first": "$groupId"
            },
            "isGroup": {
              "$first": "$isGroup"
            },
            "count": {
              "$first": "$count"
            },
            "isFavourite": {
              "$first": "$isFavourite"
            },
            "userName": {
              "$first": "$userName"
            },
            "countryCode": {
              "$first": "$countryCode"
            },
            "countryName": {
              "$first": "$countryName"
            },
            "mobileNo": {
              "$first": "$mobileNo"
            },
            "userId": {
              "$first": "$userId"
            },
            "profile_image": {
              "$first": "$profile_image"
            },
            "messageAt": {
              "$first": "$messageAt"
            },
            "isverified": {
              "$first": "$isverified"
            },
            "groupName": {
              "$first": "$groupName"
            },
            "status": {
              "$first": "$status"
            },

          }
        }
      ]
    const options = {}
    if (!!data.searchKey) {
      console.log("....searchKeysearchKeysearchKeysearchKey....", data.searchkey)
      options.limit = !!data.recordsPerPage ? parseInt(data.recordsPerPage) : 10;
      options.skip = !!data.recordsOffset ? parseInt(data.recordsOffset) : 0;
      options.sort = { createdAt: sort }
    }
    else {
      //console.log(",,,,,,,without,,,,,,,")
      options.limit = 1000;
      options.skip = 0;
      options.sort = { createdAt: sort }
    }
    try {
      let result = {};
      async.parallel([
        function (cb) {
          chatModel.advancedAggregate(query, {}, (err, messages) => {
            if (err) {
              throw err;
            } else {
              if (!data.searchKey) {
                result.recordsTotal = messages.length;
              }
              cb(null);
            }
          });
        },
        function (cb) {
          chatModel.advancedAggregate(query, options, (err, messages) => {
            if (err) {
              throw err;
            } else if (options.skip === 0 && _.isEmpty(messages)) {
              cb(null)
            } else if (options.skip > 0 && _.isEmpty(messages)) {
              cb(null);
            } else {

              let msg = [];
              if (!!data.searchKey) {
                _.forEach(messages, (chatData) => {
                  var re = new RegExp('^' + data.searchKey.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
                  if (ObjectID(chatData.sender_id) !== ObjectID(req.auth._id)) {
                    if (re.test(chatData.userName)) {
                      msg.push(chatData);
                    }
                  }
                  else {
                    if (re.test(chatData.senderData.userName)) {
                      msg.push(chatData);
                    }
                  }
                });
                result.messages = msg;
                result.recordsTotal = msg.length;
              }
              else {
                result.messages = messages;
              }
              cb(null);
            }
          });
        }
      ], function (err) {
        if (err) {
          throw err;
        } else if (options.skip === 0 && _.isEmpty(result.messages)) {
          response.setData(AppCode.Success, {});
          response.send(res);
        } else if (options.skip > 0 && _.isEmpty(result.messages)) {
          response.setData(AppCode.Success, {});
          response.send(res);
        } else {
          //  console.log("resuklttttttttttttttttttttttttttt",result);

          response.setData(AppCode.Success, result);
          response.send(res);
        }
      });
    } catch (exception) {
      Logger.error(AppCode.InternalServerError.message, exception);
      response.setError(AppCode.InternalServerError);
      response.send(res);
    }
  }
  else {
    response.setData(AppCode.LoginAgain, {});
    response.send(res);
  }
}



//-not use
//ajay sir - done.
ChatCtrl.getChatUsersListseconfinal = (req, res) => {
  const response = new HttpRespose();
  let data = req.body;
  const List = []
  List.push(ObjectID(req.auth._id))
  console.log("List...........", List)

  if (!!req.auth && !!req.auth._id) {
    let sort = -1;
    if (data.sortBy === "oldest") {
      sort = 1;
    }
    let query =
      [
        {
          $match: {
            $or: [
              {
                "sender_id": ObjectID(req.auth._id)
              },
              {
                "reciver_id": ObjectID(req.auth._id)
              },
              // {
              //   group_user:{$in:List}
              // }

            ],
            isDeletedBy: { $nin: List },
            groupId: { $exists: false },
            //group_user:{$in:List}
            //  unreadArray:{$in:List}

          }
        },

        {
          $lookup: {
            from: "user",
            localField: "sender_id",
            foreignField: "_id",
            as: "senderData"
          }
        },
        {
          "$unwind": {
            "path": "$senderData",
            "preserveNullAndEmptyArrays": true
          }
        },

        {
          $lookup: {
            from: "user",
            localField: "reciver_id",
            foreignField: "_id",
            as: "receiverData"
          }
        },
        {
          "$unwind": {
            "path": "$receiverData",
            "preserveNullAndEmptyArrays": true
          }
        },
        {
          $lookup: {
            from: "favourite",
            as: "favouritedata",
            // let: { userId: "$_id" },
            let: { senderId: "$sender_id", reciverId: "$reciver_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      {
                        $eq: ["$userId", ObjectID(req.auth._id)],
                      },
                      {
                        // $eq: ["$favId", "$$userId"],
                        $or: [
                          {
                            $eq: ["$favId", "$$senderId"],

                          },
                          {
                            $eq: ["$favId", "$$reciverId"],
                          }

                        ]
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
            from: "group",
            localField: "groupId",
            foreignField: "_id",
            as: "groupdata"
          }
        },
        {
          "$unwind": {
            "path": "$groupdata",
            "preserveNullAndEmptyArrays": true
          }
        },
        {
          $lookup: {
            from: "chat",
            as: "unreadCount",
            let: { reciver_id: "$reciver_id", sender_id: "$sender_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$reciver_id", ObjectID(req.auth._id)] },
                      { $eq: ["$sender_id", "$$sender_id"] },
                      { $ne: ["$isRead", true] },
                    ],
                  },
                  isDeletedBy: { $nin: List }

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
          $lookup: {
            from: "chat",
            as: "groupunread",
            let: { groupId: "$groupId", senderId: "$sender_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$sender_id", "$$senderId"] },
                      { $eq: ["$groupId", "$$groupId"] },
                      { $in: ["$group_user", List] },
                    ],
                  },
                  isDeletedBy: { $nin: List },
                  unreadArray: { $in: List }

                },
              },

            ],
          },
        },

        // {
        //   $unwind: {
        //     path: "$groupunread",
        //     preserveNullAndEmptyArrays: true,
        //   },
        // },



        {
          "$project": {
            _id: 1,

            groupName: "$groupdata.group_name",
            "userData": {
              $cond: {
                if: { $ne: ["$sender_id", ObjectID(req.auth._id)] }, then: "sender",
                else: {
                  $cond: { if: { $ne: ["$reciver_id", ObjectID(req.auth._id)] }, then: "receiver", else: "" }
                }
              }
            },
            // "senderData": {
            //   _id: "$senderData._id", countryCode: 1,countryName:1,mobileNo:1,isverified:1, userName: 1, profileImage: { $ifNull: ["$senderData.profile_image", CONFIG.DEFAULT_PROFILE_PHOTO] }
            // },
            // "receiverData": {
            //   _id: "$receiverData._id",  countryCode: 1,countryName:1,mobileNo:1,isverified:1, userName: 1, profileImage: { $ifNull: ["$receiverData.profile_image", CONFIG.DEFAULT_PROFILE_PHOTO] }
            // },
            userName: {
              $cond: {
                if: { $ne: ["$sender_id", ObjectID(req.auth._id)] },
                then: "$senderData.userName",
                else: "$receiverData.userName"
              }
            },
            status: {
              $cond: {
                if: { $ne: ["$sender_id", ObjectID(req.auth._id)] },
                then: "$senderData.status",
                else: "$receiverData.status"
              }
            },
            countryCode: {
              $cond: {
                if: { $ne: ["$sender_id", ObjectID(req.auth._id)] },
                then: "$senderData.countryCode",
                else: "$receiverData.countryCode"
              }
            },
            countryName: {
              $cond: {
                if: { $ne: ["$sender_id", ObjectID(req.auth._id)] },
                then: "$senderData.countryName",
                else: "$receiverData.countryName"
              }
            },
            mobileNo: {
              $cond: {
                if: { $ne: ["$sender_id", ObjectID(req.auth._id)] },
                then: "$senderData.mobileNo",
                else: "$receiverData.mobileNo"
              }
            },
            userId: {
              $cond: {
                if: { $ne: ["$sender_id", ObjectID(req.auth._id)] },
                then: "$senderData._id",
                else: "$receiverData._id"
              }
            },
            profile_image: {
              $cond: {
                if: { $ne: ["$sender_id", ObjectID(req.auth._id)] },
                then: "$senderData.profile_image",
                else: "$receiverData.profile_image"
              }
            },
            isverified: {
              $cond: {
                if: { $ne: ["$sender_id", ObjectID(req.auth._id)] },
                then: "$senderData.isverified",
                else: "$receiverData.isverified"
              }
            },
            reciverId: "$reciver_id",
            senderId: "$sender_id",
            //  sender_id: 1,
            // reciver_id: 1,
            senderName: "$senderData.userName",
            reciverName: "$receiverData.userName",

            // message: 1,
            chat: "$message",
            createdAt: 1,
            messageAt: "$createdAt",
            isRead: 1,
            groupId: 1,
            isGroup: 1,
            countttttt: { $size: "$groupunread" },
            unreadCount: { $ifNull: ["$unreadCount.count", 0] },
            finalcount: {
              $cond: {
                if: { $eq: ["$isGroup", true] },
                then: { $size: "$groupunread" },
                else: { $ifNull: ["$unreadCount.count", 0] },
              }
            },
            count: { $ifNull: ["$isRead", 0] },
            // fromToUser1 :{$ifNull :["$reciver_id",["null","$sender_id"]},
            fromToUser: [
              "$sender_id",
              "$reciver_id"
            ],
            // fromToUser:{$cond: {
            //   if: { $eq: ["$isGroup",true] }, 
            //   then: [null ,"$sender_id"],
            //   else: "$fromToUser2"
            // }},
            isFavourite: {
              $cond: {
                if: { $eq: ["$favouritedata", []] },
                then: false,
                else: true,
              }
            },

            file_name: 1,
            size: 1,
            thumbnail: 1,
            video_screenshort: 1,
          }
        },
        {
          $unwind: "$fromToUser"
        },
        // {
        //   $unwind: "$groupId"
        // },
        {
          $sort: {
            "fromToUser": 1
          }
        },
        {
          $group: {
            _id: "$_id",

            "fromToUser": {
              $push: "$fromToUser"
            },
            "countttttt": {
              "$first": "$countttttt"
            },
            "finalcount": {
              "$first": "$finalcount"
            },

            "unreadCount": {
              "$first": "$unreadCount"
            },
            "file_name": {
              "$first": "$file_name"
            },
            "size": {
              "$first": "$size"
            },
            "thumbnail": {
              "$first": "$thumbnail"
            },
            "video_screenshort": {
              "$first": "$video_screenshort"
            },
            "senderId": {
              "$first": "$senderId"
            },
            "reciverId": {
              "$first": "$reciverId"
            },
            "chat": {
              "$first": "$chat"
            },
            "createdAt": {
              "$first": "$createdAt"
            },
            "senderData": {
              "$first": "$senderData"
            },
            "receiverData": {
              "$first": "$receiverData"
            },
            "userData": {
              "$first": "$userData"
            },
            "userData": {
              "$first": "$userData"
            },
            "senderName": {
              "$first": "$senderName"
            },
            "reciverName": {
              "$first": "$reciverName"
            },
            "groupId": {
              "$first": "$groupId"
            },
            "isGroup": {
              "$first": "$isGroup"
            },
            "count": {
              "$first": "$count"
            },
            "isFavourite": {
              "$first": "$isFavourite"
            },
            "userName": {
              "$first": "$userName"
            },
            "countryCode": {
              "$first": "$countryCode"
            },
            "countryName": {
              "$first": "$countryName"
            },
            "mobileNo": {
              "$first": "$mobileNo"
            },
            "userId": {
              "$first": "$userId"
            },
            "profile_image": {
              "$first": "$profile_image"
            },
            "messageAt": {
              "$first": "$messageAt"
            },
            "isverified": {
              "$first": "$isverified"
            },
            "groupName": {
              "$first": "$groupName"
            },
            "status": {
              "$first": "$status"
            },



          }
        },
        {
          "$sort": {
            "createdAt": -1
          }
        },
        {
          "$group": {
            "_id": "$fromToUser",
            "unreadCount": {
              "$first": "$unreadCount"
            },
            "finalcount": {
              "$first": "$finalcount"
            },
            "countttttt": {
              "$first": "$countttttt"
            },
            "file_name": {
              "$first": "$file_name"
            },
            "size": {
              "$first": "$size"
            },
            "thumbnail": {
              "$first": "$thumbnail"
            },
            "video_screenshort": {
              "$first": "$video_screenshort"
            },
            "senderId": {
              "$first": "$senderId"
            },
            "reciverId": {
              "$first": "$reciverId"
            },
            "chat": {
              "$first": "$chat"
            },
            "createdAt": {
              "$first": "$createdAt"
            },

            "userData": {
              "$first": "$userData"
            },
            "senderName": {
              "$first": "$senderName"
            },
            "reciverName": {
              "$first": "$reciverName"
            },
            "groupId": {
              "$first": "$groupId"
            },
            "isGroup": {
              "$first": "$isGroup"
            },
            "count": {
              "$first": "$count"
            },
            "isFavourite": {
              "$first": "$isFavourite"
            },
            "userName": {
              "$first": "$userName"
            },
            "countryCode": {
              "$first": "$countryCode"
            },
            "countryName": {
              "$first": "$countryName"
            },
            "mobileNo": {
              "$first": "$mobileNo"
            },
            "userId": {
              "$first": "$userId"
            },
            "profile_image": {
              "$first": "$profile_image"
            },
            "messageAt": {
              "$first": "$messageAt"
            },
            "isverified": {
              "$first": "$isverified"
            },
            "groupName": {
              "$first": "$groupName"
            },
            "status": {
              "$first": "$status"
            },

          }
        }
      ]
    let groupquery =
      [
        {
          $match: {
            $or: [

              {
                group_user: { $in: List }
              }

            ],
            isDeletedBy: { $nin: List },

          }
        },

        {
          $lookup: {
            from: "user",
            localField: "sender_id",
            foreignField: "_id",
            as: "senderData"
          }
        },
        {
          "$unwind": {
            "path": "$senderData",
            "preserveNullAndEmptyArrays": true
          }
        },

        {
          $lookup: {
            from: "user",
            localField: "reciver_id",
            foreignField: "_id",
            as: "receiverData"
          }
        },
        {
          "$unwind": {
            "path": "$receiverData",
            "preserveNullAndEmptyArrays": true
          }
        },
        {
          $lookup: {
            from: "favourite",
            as: "favouritedata",
            // let: { userId: "$_id" },
            let: { senderId: "$sender_id", reciverId: "$reciver_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      {
                        $eq: ["$userId", ObjectID(req.auth._id)],
                      },
                      {
                        // $eq: ["$favId", "$$userId"],
                        $or: [
                          {
                            $eq: ["$favId", "$$senderId"],

                          },
                          {
                            $eq: ["$favId", "$$reciverId"],
                          }

                        ]
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
            from: "group",
            localField: "groupId",
            foreignField: "_id",
            as: "groupdata"
          }
        },
        {
          "$unwind": {
            "path": "$groupdata",
            "preserveNullAndEmptyArrays": true
          }
        },
        {
          $lookup: {
            from: "chat",
            as: "unreadCount",
            let: { reciver_id: "$reciver_id", sender_id: "$sender_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$reciver_id", ObjectID(req.auth._id)] },
                      { $eq: ["$sender_id", "$$sender_id"] },
                      { $ne: ["$isRead", true] },
                    ],
                  },
                  isDeletedBy: { $nin: List }

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
          $lookup: {
            from: "chat",
            as: "groupunread",
            let: { groupId: "$groupId", senderId: "$sender_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$sender_id", "$$senderId"] },
                      { $eq: ["$groupId", "$$groupId"] },
                      { $in: ["$group_user", List] },
                    ],
                  },
                  isDeletedBy: { $nin: List },
                  unreadArray: { $in: List }

                },
              },

            ],
          },
        },

      



        {
          "$project": {
            _id: 1,

            groupName: "$groupdata.group_name",
            group_image:"$groupdata.profile_image",
            "userData": {
              $cond: {
                if: { $ne: ["$sender_id", ObjectID(req.auth._id)] }, then: "sender",
                else: {
                  $cond: { if: { $ne: ["$reciver_id", ObjectID(req.auth._id)] }, then: "receiver", else: "" }
                }
              }
            },
            userName: {
              $cond: {
                if: { $ne: ["$sender_id", ObjectID(req.auth._id)] },
                then: "$senderData.userName",
                else: "$receiverData.userName"
              }
            },
            status: {
              $cond: {
                if: { $ne: ["$sender_id", ObjectID(req.auth._id)] },
                then: "$senderData.status",
                else: "$receiverData.status"
              }
            },
            countryCode: {
              $cond: {
                if: { $ne: ["$sender_id", ObjectID(req.auth._id)] },
                then: "$senderData.countryCode",
                else: "$receiverData.countryCode"
              }
            },
            countryName: {
              $cond: {
                if: { $ne: ["$sender_id", ObjectID(req.auth._id)] },
                then: "$senderData.countryName",
                else: "$receiverData.countryName"
              }
            },
            mobileNo: {
              $cond: {
                if: { $ne: ["$sender_id", ObjectID(req.auth._id)] },
                then: "$senderData.mobileNo",
                else: "$receiverData.mobileNo"
              }
            },
            userId: {
              $cond: {
                if: { $ne: ["$sender_id", ObjectID(req.auth._id)] },
                then: "$senderData._id",
                else: "$receiverData._id"
              }
            },
            profile_image: {
              $cond: {
                if: { $ne: ["$sender_id", ObjectID(req.auth._id)] },
                then: "$senderData.profile_image",
                else: "$receiverData.profile_image"
              }
            },
            isverified: {
              $cond: {
                if: { $ne: ["$sender_id", ObjectID(req.auth._id)] },
                then: "$senderData.isverified",
                else: "$receiverData.isverified"
              }
            },
            reciverId: "$reciver_id",
            senderId: "$sender_id",
            //  sender_id: 1,
            // reciver_id: 1,
            senderName: "$senderData.userName",
            reciverName: "$receiverData.userName",

            // message: 1,
            chat: "$message",
            createdAt: 1,
            messageAt: "$createdAt",
            isRead: 1,
            groupId: 1,
            isGroup: 1,
            countttttt: { $size: "$groupunread" },
            unreadCount: { $ifNull: ["$unreadCount.count", 0] },
            finalcount: {
              $cond: {
                if: { $eq: ["$isGroup", true] },
                then: { $size: "$groupunread" },
                else: { $ifNull: ["$unreadCount.count", 0] },
              }
            },
            count: { $ifNull: ["$isRead", 0] },
            // fromToUser1 :{$ifNull :["$reciver_id",["null","$sender_id"]},
            fromToUser: [
              "$groupId",

            ],
            // fromToUser:{$cond: {
            //   if: { $eq: ["$isGroup",true] }, 
            //   then: [null ,"$sender_id"],
            //   else: "$fromToUser2"
            // }},
            isFavourite: {
              $cond: {
                if: { $eq: ["$favouritedata", []] },
                then: false,
                else: true,
              }
            },

            file_name: 1,
            size: 1,
            thumbnail: 1,
            video_screenshort: 1,
          }
        },
        {
          $unwind: "$fromToUser"
        },
        // {
        //   $unwind: "$groupId"
        // },
        {
          $sort: {
            "fromToUser": 1
          }
        },
        {
          $group: {
            _id: "$_id",
            "group_image": {
              "$first": "$group_image"
            },
            "fromToUser": {
              $push: "$fromToUser"
            },
            "countttttt": {
              "$first": "$countttttt"
            },
            "finalcount": {
              "$first": "$finalcount"
            },

            "unreadCount": {
              "$first": "$unreadCount"
            },
            "file_name": {
              "$first": "$file_name"
            },
            "size": {
              "$first": "$size"
            },
            "thumbnail": {
              "$first": "$thumbnail"
            },
            "video_screenshort": {
              "$first": "$video_screenshort"
            },
            "senderId": {
              "$first": "$senderId"
            },
            "reciverId": {
              "$first": "$reciverId"
            },
            "chat": {
              "$first": "$chat"
            },
            "createdAt": {
              "$first": "$createdAt"
            },
            "senderData": {
              "$first": "$senderData"
            },
            "receiverData": {
              "$first": "$receiverData"
            },
            "userData": {
              "$first": "$userData"
            },
            "userData": {
              "$first": "$userData"
            },
            "senderName": {
              "$first": "$senderName"
            },
            "reciverName": {
              "$first": "$reciverName"
            },
            "groupId": {
              "$first": "$groupId"
            },
            "isGroup": {
              "$first": "$isGroup"
            },
            "count": {
              "$first": "$count"
            },
            "isFavourite": {
              "$first": "$isFavourite"
            },
            "userName": {
              "$first": "$userName"
            },
            "countryCode": {
              "$first": "$countryCode"
            },
            "countryName": {
              "$first": "$countryName"
            },
            "mobileNo": {
              "$first": "$mobileNo"
            },
            "userId": {
              "$first": "$userId"
            },
            "profile_image": {
              "$first": "$profile_image"
            },
            "messageAt": {
              "$first": "$messageAt"
            },
            "isverified": {
              "$first": "$isverified"
            },
            "groupName": {
              "$first": "$groupName"
            },
            "status": {
              "$first": "$status"
            },



          }
        },
        {
          "$sort": {
            "createdAt": -1
          }
        },
        {
          "$group": {
            "_id": "$fromToUser",
            "group_image": {
              "$first": "$group_image"
            },
            "unreadCount": {
              "$first": "$unreadCount"
            },
            "finalcount": {
              "$first": "$finalcount"
            },
            "countttttt": {
              "$first": "$countttttt"
            },
            "file_name": {
              "$first": "$file_name"
            },
            "size": {
              "$first": "$size"
            },
            "thumbnail": {
              "$first": "$thumbnail"
            },
            "video_screenshort": {
              "$first": "$video_screenshort"
            },
            "senderId": {
              "$first": "$senderId"
            },
            "reciverId": {
              "$first": "$reciverId"
            },
            "chat": {
              "$first": "$chat"
            },
            "createdAt": {
              "$first": "$createdAt"
            },

            "userData": {
              "$first": "$userData"
            },
            "senderName": {
              "$first": "$senderName"
            },
            "reciverName": {
              "$first": "$reciverName"
            },
            "groupId": {
              "$first": "$groupId"
            },
            "isGroup": {
              "$first": "$isGroup"
            },
            "count": {
              "$first": "$count"
            },
            "isFavourite": {
              "$first": "$isFavourite"
            },
            "userName": {
              "$first": "$userName"
            },
            "countryCode": {
              "$first": "$countryCode"
            },
            "countryName": {
              "$first": "$countryName"
            },
            "mobileNo": {
              "$first": "$mobileNo"
            },
            "userId": {
              "$first": "$userId"
            },
            "profile_image": {
              "$first": "$profile_image"
            },
            "messageAt": {
              "$first": "$messageAt"
            },
            "isverified": {
              "$first": "$isverified"
            },
            "groupName": {
              "$first": "$groupName"
            },
            "status": {
              "$first": "$status"
            },

          }
        }
      ]

    const options = {}
    if (!!data.searchKey) {
      console.log("....searchKeysearchKeysearchKeysearchKey....", data.searchkey)
      options.limit = !!data.recordsPerPage ? parseInt(data.recordsPerPage) : 10;
      options.skip = !!data.recordsOffset ? parseInt(data.recordsOffset) : 0;
      options.sort = { createdAt: sort }
    }
    else {
      //console.log(",,,,,,,without,,,,,,,")
      options.limit = 1000;
      options.skip = 0;
      options.sort = { createdAt: sort }
    }
    try {
      let result = {};
      let array = []
      let array2 = []
      async.waterfall([
        function (cb) {
          chatModel.advancedAggregate(query, {}, (err, messages) => {
            if (err) {
              throw err;
            } else {
              console.log("messagesmessagesmessagesmessages", messages);
              if (!data.searchKey) {
                result.recordsTotal = messages.length;
              }
              cb(null);
            }
          });
        },
        function (cb) {
          chatModel.advancedAggregate(query, options, (err, messages) => {
            if (err) {
              throw err;
            }
            else if (options.skip === 0 && _.isEmpty(messages)) {
              cb(null)
            } else if (options.skip > 0 && _.isEmpty(messages)) {
              cb(null);
            } else {
              array = messages
              console.log("arrayyyyyyyyyyy", array);

              let msg = [];
              if (!!data.searchKey) {
                _.forEach(messages, (chatData) => {
                  var re = new RegExp('^' + data.searchKey.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
                  if (ObjectID(chatData.sender_id) !== ObjectID(req.auth._id)) {
                    if (re.test(chatData.userName)) {
                      msg.push(chatData);
                    }
                  }
                  else {
                    if (re.test(chatData.senderData.userName)) {
                      msg.push(chatData);
                    }
                  }
                });
                result.messages = msg;
                result.recordsTotal = msg.length;
              }
              else {
                result.messages = messages;
              }
              cb(null);
            }
          });
        },
        function (cb) {
          chatModel.advancedAggregate(groupquery, {}, (err, groupmessage) => {
            if (err) {
              throw err;
            } else {
              //    console.log("groupmessagegroupmessagegroupmessagegroupmessage",groupmessage);
              if (!data.searchKey) {
                result.recordsTotal = groupmessage.length;
              }
              cb(null);
            }
          });
        },
        function (cb) {
          chatModel.advancedAggregate(groupquery, options, (err, groupmessage) => {
            if (err) {
              throw err;
            } else if (options.skip === 0 && _.isEmpty(groupmessage)) {
              cb(null)
            } else if (options.skip > 0 && _.isEmpty(groupmessage)) {
              cb(null);
            } else {
              console.log("groupmessagegroupmessagegroupmessagegroupmessage", groupmessage);

              let msg = [];
              // if (!!data.searchKey) {
              //   _.forEach(groupmessage, (chatData) => {
              //     var re = new RegExp('^' + data.searchKey.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
              //     if (ObjectID(chatData.sender_id) !== ObjectID(req.auth._id)) {
              //       if (re.test(chatData.userName)) {
              //         msg.push(chatData);
              //       }
              //     }
              //     else {
              //       if (re.test(chatData.senderData.userName)) {
              //         msg.push(chatData);
              //       }
              //     }
              //   });
              //   result.groupmessage = msg;
              //   result.recordsTotal = msg.length;
              // }
              // else {
              //   console.log("result",message);
              console.log("result", groupmessage);
              array2 = groupmessage

              result.groupmessage = array.concat(array2);
              //  }
              cb(null);
            }
          });
        }
      ], function (err) {
        if (err) {
          throw err;
        }
        else if (options.skip === 0 && _.isEmpty(result)) {

          response.setData(AppCode.Success, {});
          response.send(res);
        } else if (options.skip > 0 && _.isEmpty(result)) {
          response.setData(AppCode.Success, {});
          response.send(res);
        }
        else {


          console.log("arrayarrayarrayarrayarrayarrayarrayarrayarrayarrayarrayarray", array);
          console.log("array2array2array2array2array2array2array2array2array2", array2);
          let FinalData = result.groupmessage.sort(function (a, b) { var c = new Date(a.messageAt); var d = new Date(b.messageAt); return d - c; });
          response.setData(AppCode.Success, FinalData);
          response.send(res);
        }
      });
    } catch (exception) {
      Logger.error(AppCode.InternalServerError.message, exception);
      response.setError(AppCode.InternalServerError);
      response.send(res);
    }
  }
  else {
    response.setData(AppCode.LoginAgain, {});
    response.send(res);
  }
}


//-not use
//current used API for recent user chat
ChatCtrl.getChatUsersList = (req, res) => {
  const response = new HttpRespose();
  let data = req.body;
  const List = []
  List.push(ObjectID(req.auth._id))
  console.log("List...........", List)
 
  if (!!req.auth && !!req.auth._id) { 
    let sort = -1;
    if (data.sortBy === "oldest") {
      sort = 1;
    }
    let query =
    [
      {
        $match: {
          $or: [
            {
              "sender_id": ObjectID(req.auth._id)
            },
            {
              "reciver_id": ObjectID(req.auth._id)
            },
            // {
            //   group_user:{$in:List}
            // }

          ],
          isDeletedBy: { $nin: List },
          groupId: { $exists: false },
          //group_user:{$in:List}
          //  unreadArray:{$in:List}

        }
      },
      {
        $lookup: {
          from: "chat",
          as: "unreadCount",
          let: {sender_id: "$sender_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$reciver_id", ObjectID(req.auth._id)] },
                   { $eq: ["$sender_id", "$$sender_id"] },
                    { $ne: ["$isRead", true] },
                  ],
                },
                isDeletedBy: { $nin: List }

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
        $lookup: {
          from: "user",
          localField: "sender_id",
          foreignField: "_id",
          as: "senderData"
        }
      },
      {
        "$unwind": {
          "path": "$senderData",
          "preserveNullAndEmptyArrays": true
        }
      },

      {
        $lookup: {
          from: "user",
          localField: "reciver_id",
          foreignField: "_id",
          as: "receiverData"
        }
      },
      {
        "$unwind": {
          "path": "$receiverData",
          "preserveNullAndEmptyArrays": true
        }
      },
      {
        $lookup: {
          from: "favourite",
          as: "favouritedata",
          // let: { userId: "$_id" },
          let: { senderId: "$sender_id", reciverId: "$reciver_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: ["$userId", ObjectID(req.auth._id)],
                    },
                    {
                      // $eq: ["$favId", "$$userId"],
                      $or: [
                        {
                          $eq: ["$favId", "$$senderId"],

                        },
                        {
                          $eq: ["$favId", "$$reciverId"],
                        }

                      ]
                    },

                  ],
                },
              },
            },
          ],
        },
      },


     

      {
        "$project": {
          _id: 1,

         
          "userData": {
            $cond: {
              if: { $ne: ["$sender_id", ObjectID(req.auth._id)] }, then: "sender",
              else: {
                $cond: { if: { $ne: ["$reciver_id", ObjectID(req.auth._id)] }, then: "receiver", else: "" }
              }
            }
          },
          // unreadCount: {
          //   $cond: {
          //     if: { $isArray: "$chatcount" },
          //     then: { $size: "$chatcount" },
          //     else: 0
          //   },
          // }
        unreadCount: { $ifNull: ["$unreadCount.count", 0] },



          // "senderData": {
          //   _id: "$senderData._id", countryCode: 1,countryName:1,mobileNo:1,isverified:1, userName: 1, profileImage: { $ifNull: ["$senderData.profile_image", CONFIG.DEFAULT_PROFILE_PHOTO] }
          // },
          // "receiverData": {
          //   _id: "$receiverData._id",  countryCode: 1,countryName:1,mobileNo:1,isverified:1, userName: 1, profileImage: { $ifNull: ["$receiverData.profile_image", CONFIG.DEFAULT_PROFILE_PHOTO] }
          // },
          userName: {
            $cond: {
              if: { $ne: ["$sender_id", ObjectID(req.auth._id)] },
              then: "$senderData.userName",
              else: "$receiverData.userName"
            }
          },
          status: {
            $cond: {
              if: { $ne: ["$sender_id", ObjectID(req.auth._id)] },
              then: "$senderData.status",
              else: "$receiverData.status"
            }
          },
          countryCode: {
            $cond: {
              if: { $ne: ["$sender_id", ObjectID(req.auth._id)] },
              then: "$senderData.countryCode",
              else: "$receiverData.countryCode"
            }
          },
          countryName: {
            $cond: {
              if: { $ne: ["$sender_id", ObjectID(req.auth._id)] },
              then: "$senderData.countryName",
              else: "$receiverData.countryName"
            }
          },
          mobileNo: {
            $cond: {
              if: { $ne: ["$sender_id", ObjectID(req.auth._id)] },
              then: "$senderData.mobileNo",
              else: "$receiverData.mobileNo"
            }
          },
          userId: {
            $cond: {
              if: { $ne: ["$sender_id", ObjectID(req.auth._id)] },
              then: "$senderData._id",
              else: "$receiverData._id"
            }
          },
          profile_image: {
            $cond: {
              if: { $ne: ["$sender_id", ObjectID(req.auth._id)] },
              then: "$senderData.profile_image",
              else: "$receiverData.profile_image"
            }
          },
          isverified: {
            $cond: {
              if: { $ne: ["$sender_id", ObjectID(req.auth._id)] },
              then: "$senderData.isverified",
              else: "$receiverData.isverified"
            }
          },
          reciverId: "$reciver_id",
          senderId: "$sender_id",

        
          senderName: "$senderData.userName",
          reciverName: "$receiverData.userName",

          // message: 1,
          chat: "$message",
          createdAt: 1,
          messageAt: "$createdAt",
          isRead: 1,
         
          // unreadCount:"$unreadCount.count",


          //   count: { $ifNull: ["$isRead", 0] },


          // fromToUser1 :{$ifNull :["$reciver_id",["null","$sender_id"]},
          fromToUser: [
            "$sender_id",
            "$reciver_id"
          ],
          // fromToUser:{$cond: {
          //   if: { $eq: ["$isGroup",true] }, 
          //   then: [null ,"$sender_id"],
          //   else: "$fromToUser2"
          // }},
          isFavourite: {
            $cond: {
              if: { $eq: ["$favouritedata", []] },
              then: false,
              else: true,
            }
          },

          file_name: 1,
          size: 1,
          thumbnail: 1,
          video_screenshort: 1,
        }
      },
      {
        $unwind: "$fromToUser"
      },
      // // {
      // //   $unwind: "$groupId"
      // // },
      {
        $sort: {
          "fromToUser": 1
        }
      },
      {
        $group: {
          _id: "$_id",
          "fromToUser": {
            $push: "$fromToUser"
          },
        
         
          "unreadCount": {
            "$first": "$unreadCount"
          },
          "file_name": {
            "$first": "$file_name"
          },
          "size": {
            "$first": "$size"
          },
          "thumbnail": {
            "$first": "$thumbnail"
          },
          "video_screenshort": {
            "$first": "$video_screenshort"
          },
          "senderId": {
            "$first": "$senderId"
          },
          "reciverId": {
            "$first": "$reciverId"
          },
         
          "chat": {
            "$first": "$chat"
          },
          "createdAt": {
            "$first": "$createdAt"
          },
          "senderData": {
            "$first": "$senderData"
          },
          "receiverData": {
            "$first": "$receiverData"
          },
          "userData": {
            "$first": "$userData"
          },
          "userData": {
            "$first": "$userData"
          },
          "senderName": {
            "$first": "$senderName"
          },
          "reciverName": {
            "$first": "$reciverName"
          },
         
          "isFavourite": {
            "$first": "$isFavourite"
          },
          "userName": {
            "$first": "$userName"
          },
          "countryCode": {
            "$first": "$countryCode"
          },
          "countryName": {
            "$first": "$countryName"
          },
          "mobileNo": {
            "$first": "$mobileNo"
          },
          "userId": {
            "$first": "$userId"
          },
          "profile_image": {
            "$first": "$profile_image"
          },
          "messageAt": {
            "$first": "$messageAt"
          },
          "isverified": {
            "$first": "$isverified"
          },
          "groupName": {
            "$first": "$groupName"
          },
          "status": {
            "$first": "$status"
          },



        }
      },
      {
        "$sort": {
          "createdAt": -1
        }
      },
      {
        "$group": {
          "_id": "$fromToUser",
          "unreadCount": {
            "$first": "$unreadCount"
          },
        
          "file_name": {
            "$first": "$file_name"
          },
          "size": {
            "$first": "$size"
          },
          "thumbnail": {
            "$first": "$thumbnail"
          },
          "video_screenshort": {
            "$first": "$video_screenshort"
          },
          "senderId": {
            "$first": "$senderId"
          },
          "reciverId": {
            "$first": "$reciverId"
          },
        
          "chat": {
            "$first": "$chat"
          },
          "createdAt": {
            "$first": "$createdAt"
          },

          "userData": {
            "$first": "$userData"
          },
          "senderName": {
            "$first": "$senderName"
          },
          "reciverName": {
            "$first": "$reciverName"
          },
         
          "count": {
            "$first": "$count"
          },
          "isFavourite": {
            "$first": "$isFavourite"
          },
          "userName": {
            "$first": "$userName"
          },
          "countryCode": {
            "$first": "$countryCode"
          },
          "countryName": {
            "$first": "$countryName"
          },
          "mobileNo": {
            "$first": "$mobileNo"
          },
          "userId": {
            "$first": "$userId"
          },
          "profile_image": {
            "$first": "$profile_image"
          },
          "messageAt": {
            "$first": "$messageAt"
          },
          "isverified": {
            "$first": "$isverified"
          },
        
          "status": {
            "$first": "$status"
          },

        }
      }
    ]
   
    let groupquery =
      [
        {
          $match: {
            $or: [

              {
                group_user: { $in: List }
              }

            ],
            isDeletedBy: { $nin: List },
            //groupId: { $exists: false },
            //group_user:{$in:List}
            //unreadArray:{$in:List}

          }
        },

        {
          $lookup: {
            from: "user",
            localField: "sender_id",
            foreignField: "_id",
            as: "senderData"
          }
        },
        {
          "$unwind": {
            "path": "$senderData",
            "preserveNullAndEmptyArrays": true
          }
        },

        {
          $lookup: {
            from: "user",
            localField: "reciver_id",
            foreignField: "_id",
            as: "receiverData"
          }
        },
        {
          "$unwind": {
            "path": "$receiverData",
            "preserveNullAndEmptyArrays": true
          }
        },
        // {
        //   $lookup: {
        //     from: "favourite",
        //     as: "favouritedata",
        //     // let: { userId: "$_id" },
        //     let: { senderId: "$sender_id", reciverId: "$reciver_id" },
        //     pipeline: [
        //       {
        //         $match: {
        //           $expr: {
        //             $and: [
        //               {
        //                 $eq: ["$userId", ObjectID(req.auth._id)],
        //               },
        //               {
        //                 // $eq: ["$favId", "$$userId"],
        //                 $or: [
        //                   {
        //                     $eq: ["$favId", "$$senderId"],

        //                   },
        //                   {
        //                     $eq: ["$favId", "$$reciverId"],
        //                   }

        //                 ]
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
            from: "group",
            localField: "groupId",
            foreignField: "_id",
            as: "groupdata"
          }
        },
        {
          "$unwind": {
            "path": "$groupdata",
            "preserveNullAndEmptyArrays": true
          }
        },
      
        {
          $lookup: {
            from: "chat",
            as: "groupunread",
            let: { groupId: "$groupId", senderId: "$sender_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                     // { $eq: ["$sender_id", "$$senderId"] },
                      { $eq: ["$groupId", "$$groupId"] },
                    //  { $in: ["$group_user", List] },
                    ],
                  },
                  isDeletedBy: { $nin: List },
                  unreadArray: { $in: List }

                },
              },

            ],
          },
        },

        // {
        //   $unwind: {
        //     path: "$groupunread",
        //     preserveNullAndEmptyArrays: true,
        //   },
        // },



        {
          "$project": {
            _id: 1,

            groupName: "$groupdata.group_name",
            group_image:"$groupdata.profile_image",
         //   senderData:1,
         
            "userData": {
              $cond: {
                if: { $ne: ["$sender_id", ObjectID(req.auth._id)] }, then: "sender",
                else: {
                  $cond: { if: { $ne: ["$reciver_id", ObjectID(req.auth._id)] }, then: "receiver", else: "" }
                }
              }
            },
           
            senderId: "$sender_id",
            //  sender_id: 1,
            // reciver_id: 1,
            userName: "$senderData.userName",
            status: "$senderData.status",
            countryCode: "$senderData.countryCode",
            countryName: "$senderData.countryName",
            mobileNo: "$senderData.mobileNo",
            senderName: "$senderData.userName",
            userId: "$senderData._id",
            profile_image: "$senderData.profile_image",
            isverified: "$senderData.isverified",

            chat: "$message",
            createdAt: 1,
            messageAt: "$createdAt",
            isRead: 1,
            groupId: 1,
            isGroup: 1,
            unreadCount: { $size: "$groupunread" },
            
            // fromToUser1 :{$ifNull :["$reciver_id",["null","$sender_id"]},
            fromToUser: [
              "$groupId",

            ],
            // fromToUser:{$cond: {
            //   if: { $eq: ["$isGroup",true] }, 
            //   then: [null ,"$sender_id"],
            //   else: "$fromToUser2"
            // }},
            isFavourite: {
              $cond: {
                if: { $eq: ["$favouritedata", []] },
                then: false,
                else: true,
              }
            },

            file_name: 1,
            size: 1,
            thumbnail: 1,
            video_screenshort: 1,
          }
        },
        {
          $unwind: "$fromToUser"
        },
        // {
        //   $unwind: "$groupId"
        // },
        {
          $sort: {
            "fromToUser": 1
          }
        },
        {
          $group: {
            _id: "$_id",

            "fromToUser": {
              $push: "$fromToUser"
            },
          

            "unreadCount": {
              "$first": "$unreadCount"
            },
            "file_name": {
              "$first": "$file_name"
            },
            "size": {
              "$first": "$size"
            },
            "thumbnail": {
              "$first": "$thumbnail"
            },
            "video_screenshort": {
              "$first": "$video_screenshort"
            },
            "senderId": {
              "$first": "$senderId"
            },
           
            "chat": {
              "$first": "$chat"
            },
            "createdAt": {
              "$first": "$createdAt"
            },
            "senderData": {
              "$first": "$senderData"
            },
            "receiverData": {
              "$first": "$receiverData"
            },
            "userData": {
              "$first": "$userData"
            },
            "userData": {
              "$first": "$userData"
            },
            "senderName": {
              "$first": "$senderName"
            },
           
            "groupId": {
              "$first": "$groupId"
            },
            "isGroup": {
              "$first": "$isGroup"
            },
           
            "userName": {
              "$first": "$userName"
            },
            "countryCode": {
              "$first": "$countryCode"
            },
            "countryName": {
              "$first": "$countryName"
            },
            "mobileNo": {
              "$first": "$mobileNo"
            },
            "userId": {
              "$first": "$userId"
            },
            "profile_image": {
              "$first": "$profile_image"
            },
            "messageAt": {
              "$first": "$messageAt"
            },
            "isverified": {
              "$first": "$isverified"
            },
            "groupName": {
              "$first": "$groupName"
            },
            "group_image": {
              "$first": "$group_image"
            },
            "status": {
              "$first": "$status"
            },



          }
        },
        {
          "$sort": {
            "createdAt": -1
          }
        },
        {
          "$group": {
            "_id": "$fromToUser",
            "unreadCount": {
              "$first": "$unreadCount"
            },
           
            "file_name": {
              "$first": "$file_name"
            },
            "size": {
              "$first": "$size"
            },
            "thumbnail": {
              "$first": "$thumbnail"
            },
            "video_screenshort": {
              "$first": "$video_screenshort"
            },
            "senderId": {
              "$first": "$senderId"
            },
           
            "chat": {
              "$first": "$chat"
            },
            "createdAt": {
              "$first": "$createdAt"
            },

            "userData": {
              "$first": "$userData"
            },
            "senderName": {
              "$first": "$senderName"
            },
           
            "groupId": {
              "$first": "$groupId"
            },
            "isGroup": {
              "$first": "$isGroup"
            },
          
           
            "userName": {
              "$first": "$userName"
            },
            "countryCode": {
              "$first": "$countryCode"
            },
            "countryName": {
              "$first": "$countryName"
            },
            "mobileNo": {
              "$first": "$mobileNo"
            },
            "userId": {
              "$first": "$userId"
            },
            "profile_image": {
              "$first": "$profile_image"
            },
            "messageAt": {
              "$first": "$messageAt"
            },
            "isverified": {
              "$first": "$isverified"
            },
            "groupName": {
              "$first": "$groupName"
            },
            "group_image": {
              "$first": "$group_image"
            },
            "status": {
              "$first": "$status"
            },

          }
        }
      ]

    const options = {}
    if (!!data.searchKey) {
      console.log("....searchKeysearchKeysearchKeysearchKey....", data.searchkey)
      options.limit = !!data.recordsPerPage ? parseInt(data.recordsPerPage) : 10;
      options.skip = !!data.recordsOffset ? parseInt(data.recordsOffset) : 0;
      options.sort = { createdAt: sort }
    }
    else {
      //console.log(",,,,,,,without,,,,,,,")
      options.limit = 1000;
      options.skip = 0;
      options.sort = { createdAt: sort }
    }
    try {
      let result = {};
      let array = []
      let array2 = []
      async.waterfall([
        function (cb) {
          chatModel.advancedAggregate(query, {}, (err, messages) => {
            if (err) {
              throw err;
            } else {
              console.log("messagesmessagesmessagesmessages", messages);
              if (!data.searchKey) {
                result.recordsTotal = messages.length;
              }
              cb(null);
            }
          });
        },
        function (cb) {
          chatModel.advancedAggregate(query, options, (err, messages) => {
            if (err) {
              throw err;
            }
            else if (options.skip === 0 && _.isEmpty(messages)) {
              cb(null)
            } else if (options.skip > 0 && _.isEmpty(messages)) {
              cb(null);
            } else {
              array = messages
              console.log("arrayyyyyyyyyyy", array);

              let msg = [];
              if (!!data.searchKey) {
                _.forEach(messages, (chatData) => {
                  var re = new RegExp('^' + data.searchKey.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
                  if (ObjectID(chatData.sender_id) !== ObjectID(req.auth._id)) {
                    if (re.test(chatData.userName)) {
                      msg.push(chatData);
                    }
                  }
                  else {
                    if (re.test(chatData.senderData.userName)) {
                      msg.push(chatData);
                    }
                  }
                });
                result.messages = msg;
                result.recordsTotal = msg.length;
              }
              else {
                result.messages = messages;
              }
              cb(null);
            }
          });
        },
        function (cb) {
          chatModel.advancedAggregate(groupquery, {}, (err, groupmessage) => {
            if (err) {
              throw err;
            } else {
              //    console.log("groupmessagegroupmessagegroupmessagegroupmessage",groupmessage);
              if (!data.searchKey) {
                result.recordsTotal = groupmessage.length;
              }
              cb(null);
            }
          });
        },
        function (cb) {
          chatModel.advancedAggregate(groupquery, options, (err, groupmessage) => {
            if (err) {
              throw err;
            } else if (options.skip === 0 && _.isEmpty(groupmessage)) {
              cb(null)
            } else if (options.skip > 0 && _.isEmpty(groupmessage)) {
              cb(null);
            } else {
              console.log("groupmessagegroupmessagegroupmessagegroupmessage", groupmessage);

              let msg = [];
              if (!!data.searchKey) {
                _.forEach(groupmessage, (chatData) => {
                  var re = new RegExp('^' + data.searchKey.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
                  if (ObjectID(chatData.sender_id) !== ObjectID(req.auth._id)) {
                    if (re.test(chatData.userName)) {
                      msg.push(chatData);
                    }
                  }
                  else {
                    if (re.test(chatData.senderData.userName)) {
                      msg.push(chatData);
                    }
                  }
                });
                result.groupmessage = msg;
                result.recordsTotal = msg.length;
              }
              else {
                // console.log("result",message);
                console.log("result", groupmessage);
                array2 = groupmessage

                // result.groupmessage = array.concat(array2);
              }
              cb(null);
            }
          });
        }
      ], function (err) {
        if (err) {
          throw err;
        }
        else if (options.skip === 0 && _.isEmpty(result)) {

          response.setData(AppCode.Success, {});
          response.send(res);
        } else if (options.skip > 0 && _.isEmpty(result)) {
          response.setData(AppCode.Success, {});
          response.send(res);
        }
        else {

          // if(array.length >= 0 && array2.length >=0)
          // {
          result.groupmessage = array.concat(array2);
          console.log("arrayyyyyyyyyy", array);
          console.log("arrray222222222222", array2);
          let FinalData = result.groupmessage.sort(function (a, b) { var c = new Date(a.messageAt); var d = new Date(b.messageAt); return d - c; });
          response.setData(AppCode.Success, FinalData);
          response.send(res);

          // }else if(_.isEmpty(array))
          // {
          //   console.log("else if array null");

          // }
          // else if (_.isEmpty(array2))
          // {
          //   console.log("else if array2 null");

          // }



        }
      });
    } catch (exception) {
      Logger.error(AppCode.InternalServerError.message, exception);
      response.setError(AppCode.InternalServerError);
      response.send(res);
    }
  }
  else {
    response.setData(AppCode.LoginAgain, {});
    response.send(res);
  }
}


//-not use
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
                console.log(".............................")
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
                  console.log(".............................")
                  response.setData(AppCode.Success);
                  response.send(res);
                }
              }
            );
          }
        }
      });
    } catch (exception) { }
  } else {
    response.setError(AppCode.Fail);
    response.send(res);
  }
};


//-not use
ChatCtrl.updateMessageReadStatus = (req, res) => {
  console.log(req.body);
  var response = new HttpRespose();
  if (!!req.body && !!req.body.senderId) {
    try {
      //let icon = '';
      let result = {};
      let query = {
        sender_id: ObjectID(req.body.senderId),
        reciver_id: ObjectID(req.auth._id),
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
                                  $eq: [
                                    "$reciver_id",
                                    ObjectID(req.auth._id),
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
    } catch (exception) {
      console.log(".......", exception)
    }
  } else {
    response.setError(AppCode.Fail);
    response.send(res);
  }
};


//-not use
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


//-not use
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


//-not use
// user chat Delete
ChatCtrl.chatDelete = (req, res) => {
  const response = new HttpRespose();
  let updateDataQuery = {
    isDeleted: true,
  };
  chatModel.updateOne(
    { _id: ObjectID(req.query._id) },
    { $set: updateDataQuery },
    function (err, deletechat) {
      if (err) {
        console.log(err);
        response.setError(AppCode.Fail);
        response.send(res);
      } else {
        response.setData(AppCode.Success);
        response.send(res);
      }
    }
  );
};


//-not use
// all chat delete between two user
ChatCtrl.chatDeleteAll = (req, res) => {
  const response = new HttpRespose();
  let data = req.query;


  let query = [
    {
      $match: {
        $or: [
          {
            sender_id: ObjectID(req.auth._id),
            reciver_id: ObjectID(req.query.user_id),
          },
          {
            reciver_id: ObjectID(req.auth._id),
            sender_id: ObjectID(req.query.user_id),
          },
        ],
      },
    },

  ];

  console.log("..............................", query)

  chatModel.advancedAggregate(query, {}, (err, menu) => {
    if (err) {
      throw err;
    } else if (_.isEmpty(menu)) {
      response.setError(AppCode.NoUserFound);
      response.send(res);
    } else {
      console.log("........................", menu);
      let updateDataquery =
      {
        isDeleted: true,
        isDeletedBy: parseInt(req.query.isDeletedBy)

      }
      chatModel.updateIsRead({
        reciver_id: ObjectID(req.auth._id),
        sender_id: ObjectID(data.user_id),
      }, { $set: updateDataquery }, function (err, eventupdate) {
        if (err) {
          response.setError(AppCode.Fail);
          response.send(res);
        } else if (eventupdate == undefined || (eventupdate.matchedCount === 0 && eventupdate.modifiedCount === 0)) {
          response.setError(AppCode.NotFound);
        } else {
          chatModel.updateIsRead({
            sender_id: ObjectID(req.auth._id),
            reciver_id: ObjectID(data.user_id),
          }, { $set: updateDataquery }, function (err, eventupdate) {
            if (err) {
              response.setError(AppCode.Fail);
              response.send(res);
            } else if (eventupdate == undefined || (eventupdate.matchedCount === 0 && eventupdate.modifiedCount === 0)) {
              response.setError(AppCode.NotFound);
            } else {

              response.setData(AppCode.Success);
              response.send(res);
            }
          });

          // response.setData(AppCode.Success);
          // response.send(res);
        }
      });

    }
  });



};



//-not use
// _id wise chat delete
ChatCtrl.chatDeleteById = (req, res) => {
  const response = new HttpRespose();
  const data = req.body;
  const query = {
    _id: ObjectID(data._id)
  };
  chatModel.findOne(query, function (err, chat) {
    if (err) {
      AppCode.Fail.error = err.message;
      response.setError(AppCode.Fail);
      response.send(res);
    } else {
      if (chat == null) {
        AppCode.Fail.error = "No record found";
        response.setError(AppCode.Fail);
        response.send(res);
      } else {
        let updateDataQuery = {};

        if (!!chat.isDeletedBy) {
          console.log("................", chat.isDeletedBy)
          let aaa = []
          let bbb = []
          aaa = chat.isDeletedBy
          console.log(",,,,,,,,,,,,,,,,,,,,,,,", req.body.isDeletedBy)
          bbb = req.body.isDeletedBy

          let abc = aaa.concat(bbb)
          console.log("......................................abcccccccc", abc)
          abc.map((obj, index) => {
            abc[index] = ObjectID(obj);
          });

          console.log(".........abc after", abc)


          updateDataQuery.isDeletedBy = abc
          console.log(".......updateDataQuery.......", updateDataQuery)

        }
        else {

          updateDataQuery = req.body

          updateDataQuery.isDeletedBy.map((obj, index) => {
            updateDataQuery.isDeletedBy[index] = ObjectID(obj);
          });


        }


        delete req.body._id
        chatModel.update(query, updateDataQuery, function (err, roleUpdate) {
          if (err) {
            console.log("...........", err);
            response.setError(AppCode.Fail);
          } else {
            response.setData(AppCode.Success);
            response.send(res);
          }
        });
      }
    }
  });
};


//-not use
ChatCtrl.allchatDelete = (req, res) => {
  const response = new HttpRespose();
  let data = req.query;


  let query = [
    {
      $match: {
        $or: [
          {
            sender_id: ObjectID(req.auth._id),
            reciver_id: ObjectID(req.body.user_id),
          },
          {
            reciver_id: ObjectID(req.auth._id),
            sender_id: ObjectID(req.body.user_id),
          },
        ],
      },
    },

  ];

  console.log("..............................", query)

  chatModel.advancedAggregate(query, {}, (err, menu) => {
    if (err) {
      throw err;
    } else if (_.isEmpty(menu)) {
      response.setError(AppCode.NoUserFound);
      response.send(res);
    } else {
      console.log("........................", menu);
      // console.log("........................",menu._id);

      menu.forEach(Element => {
        let id = Element._id
        let Query =
        {
          _id: ObjectID(id)
        }
        let bodydata = {
          isDeletedBy: [ObjectID(req.auth._id)]
        }
        console.log("isdeletedby", bodydata);


        chatModel.update(Query, bodydata, function (err, chat) {
          if (err) {
            console.log(err)
            response.setError(AppCode.Fail);
            response.send(res);
          } else if (chat == undefined || (chat.matchedCount === 0 && chat.modifiedCount === 0)) {
            response.setError(AppCode.NotFound);
          } else {

          }
        });




      })
      response.setData(AppCode.Success);
      response.send(res);






    }
  });



};


//-not use
//EMP Info Save API
ChatCtrl.imageUpload = (req, res) => {
  var response = new HttpRespose();
  var data = req.body;


  console.log("--------------------", req.file);
  if (!!req.files.profile_image) {
    data.profile_image = req.files.profile_image[0].filename;
  }

  console.log("--------------------", data.profileImage);
  ImageModel.findOne({}, (err, empInfo) => {
    if (err) {
      console.log(err);
      response.setError(AppCode.Fail);
      response.send(res);
    } else {

      ImageModel.create(data, (err, empData) => {
        if (err) {
          console.log(err);
          response.setError(AppCode.Fail);
          response.send(res);
        } else {
          response.setData(AppCode.Success, empData);
          response.send(res);
        }
      });

    }
  });
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
          foreignField: "_id",
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
          foreignField: "_id",
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
            _id: "$senderData._id",
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
            _id: "$receiverData._id",
            profileHeader: 1,
            name: 1,
            profileImage: {
              $ifNull: [
                "$receiverData.profileImageId.photo_name",
                CONFIG.DEFAULT_PROFILE_PHOTO,
              ],
            },
          },
          groupId: 1,
          isGroup: 1,
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
          groupId: {
            $first: "$groupId",
          },
          isGroup: {
            $first: "$isGroup",
          },
          // groupId:1,
          //  isGroup:1,

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
          groupId: {
            $first: "$groupId",
          },
          isGroup: {
            $first: "$isGroup",
          },
        },
      },
    ];



    chatModel.advancedAggregate(query, {}, (err, chats) => {
      if (err) {
        return reject(err);
      }
      console.log("chatchatchat", chats)
      // console.log("Count", Chats.length)
      return resolve(chats);
    });
    // console.log("chatchatchat", chats)
    // return resolve(chats);



  });

  return promise;
};

module.exports = ChatCtrl;
