let PostCtrl = {};
const HttpRespose = require("./../../common/httpResponse");
const AppCode = require("../../common/constant/appCods");
const fs = require("fs");
const async = require("async");

const PostModel = new (require("./../../common/model/postModel").Post)();
const http = require("https");
const PhotoModel = new (require("./../../common/model/photoModel").Photo)();

const imageThumbnail = require("image-thumbnail");
const sizeOf = require("image-size");
const UserModel = new (require("../../common/model/userModel"))();
const NotificationModel =
  new (require("../../common/model/NotificationModel"))();
const DeviceTokenModel =
  new (require("./../../common/model/deviceTokenModel"))();
const ObjectID = require("mongodb").ObjectID;
const CONFIG = require("./../../config");
const _ = require("lodash");
const AWS = require("aws-sdk");
//const AWS_ACCESS_KEY_ID = CONFIG.UPLOADS_BUCKET.accessKeyId;
const Logger = require("../../common/logger");
const admin = require("firebase-admin");
//var serviceAccount = require("../../config/serviceAccountKey.json");
// const s3 = new AWS.S3({
//   ///endpoint: spacesEndpoint,
//   accessKeyId: AWS_ACCESS_KEY_ID,
//   region: "us-east-2",
//   secretAccessKey: CONFIG.UPLOADS_BUCKET.secretAccessKey,
//   rejectUnauthorized: false,
// });

PostCtrl.create = (req, res) => {
  const response = new HttpRespose();
  if (!!req.auth._id) {
    const data = req.body;
    data.userId = ObjectID(req.auth._id);
    let deviceId = data.deviceId;
    data.privacyStatus = parseInt(req.body.privacyStatus)
    delete data.deviceId;
    const filesArr = req.files;
    const dateTimeData = Date.now();
    async.waterfall(
      [

        function (cb) {
          //Set photos and videos name array and other to params
          if (
            filesArr !== "" &&
            filesArr !== null &&
            filesArr !== undefined &&
            filesArr !== [] &&
            filesArr !== {}
          ) {
            if (data.media === undefined) {
              data.media = {};
              data.media.photos = {};
              data.media.videos = {};
            }
            data.media.photos.files = [];
            data.media.videos.files = [];

            for (let filesArrKey in filesArr) {
              let files = filesArr[filesArrKey];
              console.log("filess111111111111111111", files)
              let ind = 0;
              for (let filesKey in files) {
                console.log("filesKeyfilesKeyfilesKey", filesKey)
                let file = files[filesKey];
                console.log("filefilefilefilefile", file);
                //  let promise = new Promise((resolve, reject) => {
                if (file.fieldname === "photos") {
                  // const Imageurl = s3.getSignedUrl("getObject", {
                  //   Bucket: CONFIG.UPLOADS_BUCKET.bucketName,
                  //   Key: file.key,
                  //   // Expires: signedUrlExpireSeconds
                  // });
                 

                  data.media[file.fieldname].files.push({
                    filename: file.filename,
                    originalname: file.originalname,
                  });
                  console.log("imageeeeeURLLLLL", data.media.photos.files)
                } else if (file.fieldname === "videos") {
                  // data.media[file.fieldname].files.push(
                  //   "http://" + req.hostname + "/uploads/" + file.filename
                  // );

                  data.media[file.fieldname].files.push({
                    filename: file.key,
                    originalname: file.originalname,
                  });
                  //data.media[file.fieldname].files.push(file.filename);
                }
                //  });
              }
            }
          }
          // console.log("Before", data.tagBuddies);


          if (data.location !== undefined) {
            data.location = data.location.split(",");
            data.location.map((obj, index) => {
              data.location[index] = parseFloat(obj);
            });
          }
          cb(null);
        },
        function (cb) { 
          //Store photos in photo model
          //console.log("new body data :",data.media.photos.files);

          if (
            !!data.media &&
            !!data.media.photos &&
            !!data.media.photos.files &&
            data.media.photos.files.length > 0
          ) {
            let photosData = [];
            //console.log("All data.tags >>>>>>>>>> :",data.tags);
            data.media.photos.files.map((obj, index) => {
              console.log("..........objobjobj",obj)
              photosData[index] = {
                photo_name: obj.filename,
                userId: ObjectID(data.userId),
                status: 1,
                isDelete: 0,
                module: 1,
                type: "photo",
                isPostPhoto: true,
                createdAt: new Date(),
              };

            });
            data.media.photos.files = [];
            PhotoModel.createMany(photosData, function (err, photos) {
              if (err) {
                //TODO: Log the error here
                cb(err);
              } else {
                if (!!photos && photos.length > 0) {
                  photos.map((obj) => {
                    data.media.photos.files.push(obj._id);
                  });
                  cb(null);
                }

              }
            });
          } else {
            data.media.photos.files = [];
            cb(null);
          }
        },
        // function (cb) {
        //   //Store videos in video model
        //   //console.log("new videos data :",data.media.videos.files);

        //   if (
        //     !!data.media &&
        //     !!data.media.videos &&
        //     !!data.media.videos.files &&
        //     data.media.videos.files.length > 0
        //   ) {
        //     let videosData = [];
        //     data.media.videos.files.map((obj, index) => {
        //       let VideoNameForScreenShot = path.basename(obj.filename);
        //       //For takes screen shot

        //       let video_screenshot =
        //         CONFIG.S3UPLOADS.DIR_PATH_POST_PHOTOS +
        //         VideoNameForScreenShot.split(".")[0] +
        //         ".jpg";

        //       let thumbKey =
        //         CONFIG.S3UPLOADS.DIR_PATH_POST_PHOTOS +
        //         dateTimeData +
        //         "Thumb" +
        //         VideoNameForScreenShot.split(".")[0] +
        //         ".jpg";

        //       videosData[index] = {
        //         user_id: ObjectID(data.user_id),
        //         photo_name: obj.filename,
        //         thumbnail: thumbKey,
        //         video_screenshot: video_screenshot,
        //         status: 1,
        //         isDelete: 0,
        //         module: 1,
        //         createdAt: new Date(),
        //         type: "video",
        //       };
        //     });

        //     //console.log("videosDatavideosDatavideosDatavideosDatavideosData:",videosData);

        //     data.media.videos.files = [];

        //     //set default album type 2 which is uploads album type
        //     _.forEach(videosData, (obj) => {
        //       obj.albumType = data.albumType ? data.albumType : 2;
        //     });

        //     PhotoModel.createMany(videosData, function (err, videos) {
        //       if (err) {
        //         //TODO: Log the error here
        //         cb(err);
        //       } else {
        //         //console.log("here videos result after insert : ", videos);
        //         if (!!videos && videos.length > 0) {
        //           videos.map((obj) => {
        //             data.media.videos.files.push(obj._id);
        //           });
        //           if (req.body.albumType && req.body.albumId) {
        //             const albumType = parseInt(req.body.albumType);
        //             AlbumModel.update(
        //               { _id: ObjectID(req.body.albumId) },
        //               { $push: { videos: { $each: data.media.videos.files } } },
        //               (err, updateResullt) => {
        //                 if (err) {
        //                   cb(err);
        //                 } else if (updateResullt.result.nModified === 0) {
        //                   cb(new Error("fail"));
        //                 } else {
        //                   cb(null);
        //                 }
        //               }
        //             );
        //           } else {
        //             cb(null);
        //           }
        //         }
        //       }
        //     });
        //   } else {
        //     data.media.videos.files = [];
        //     cb(null);
        //   }
        // },
      ],
      function (err) {
        if (err) {
          AppCode.Fail.error = err.message;
          response.setError(AppCode.Fail);
          response.send(res);
        } else {

          PostModel.create(data, function (err, post) {
            if (err) {
              //TODO: Log the error here
              AppCode.Fail.error = err.message;
              response.setError(AppCode.Fail);
              response.send(res);
            } else {
              // UserModel.findOne(
              //   { _id: ObjectID(req.auth._id) },
              //   function (err, users) {
              //     if (err) {
              //       console.log("TestDATAATATATAT", err);
              //     } else {

              //       if (!!req.body.content) {
              //         console.log("Before Contetnt", req.body.content);
              //         var rx = /(?:^|\s)(@[_a-z0-9]\S*)/gi;
              //         var m,
              //           resData = [];
              //         while ((m = rx.exec(req.body.content))) {
              //           resData.push(m[1]);
              //         }
              //         console.log("Result Array", resData);
              //         if (resData.length > 0) {
              //           resData.forEach((element) => {
              //             var usName = element.substring(1);
              //             console.log("usNameusNameusNameusName", usName);
              //             UserModel.findOne(
              //               { userName: usName },
              //               function (err, usersNameData) {
              //                 if (err) {
              //                   console.log(err);
              //                 } else {
              //                   if (!_.isEmpty(usersNameData)) {
              //                     if (usersNameData._id != users._id) {
              //                       let msg =
              //                         users.userName +
              //                         " mention you in their post!",
              //                         title = "Mention In Post",
              //                         type = "tagPost",
              //                         postId = post._id.toString();
              //                       let notificationQuery = {
              //                         senderId: req.auth._id,
              //                         reciverId: usersNameData._id,
              //                         message: msg,
              //                         type: type,
              //                         postId: post._id,
              //                       };
              //                       NotificationModel.create(
              //                         notificationQuery,
              //                         (err, notification) => {
              //                           if (err) {
              //                             throw err;
              //                           } else {
              //                             let query = [
              //                               {
              //                                 $match: {
              //                                   userId: usersNameData._id,
              //                                 },
              //                               },
              //                             ];
              //                             DeviceTokenModel.aggregate(
              //                               query,
              //                               function (err, deviceTokensData) {
              //                                 if (err) {
              //                                   console.log(err);
              //                                 } else {
              //                                   console.log(
              //                                     "deviceTokensDataaaaaaaaaaaaaa",
              //                                     deviceTokensData
              //                                   );
              //                                   if (!!deviceTokensData) {
              //                                     deviceTokensData.forEach(
              //                                       (element) => {
              //                                         let tokens =
              //                                           element.deviceToken;
              //                                         if (!!tokens) {
              //                                           sendToTopics(
              //                                             msg,
              //                                             title,
              //                                             type,
              //                                             postId,
              //                                             tokens,
              //                                             res
              //                                           );
              //                                         }
              //                                       }
              //                                     );
              //                                   }
              //                                 }
              //                               }
              //                             );
              //                           }
              //                         }
              //                       );
              //                     }
              //                   }
              //                 }
              //               }
              //             );
              //           });
              //         }
              //         else {
              //           console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@")
              //         }
              //       }
              //     }
              //   }
              // );


              response.setData(AppCode.Success, post);
              response.send(res);
            }
          });
        }
      }
    );
  } else {
    response.setData(AppCode.PleaseLoginAgain, {});
    response.send(res);
  }
};
PostCtrl.update = (req, res) => {
  const response = new HttpRespose();
  console.log("original body data::::::::::::::::::::::", req.body);
  console.log("--------------------");

  if (!!req.auth._id) {
    console.log("--------------------", req.auth);
    const data = Object.assign({}, req.body);
    const filesArr = req.files;
    let deviceId = data.deviceId;
    data.privacyStatus = parseInt(data.privacyStatus);
    delete data.deviceId;
    let userId = ObjectID(req.auth._id);
    const dateTimeData = Date.now();
    let deletedPhotos;
    let videos = [];
    if (!!req.body.deletedPhotos) {
      deletedPhotos = req.body.deletedPhotos.split(",");
      delete data.deletedPhotos;
    } else {
      delete data.deletedPhotos;
    }

    const query = {
      _id: ObjectID(data._id),
      userId: userId,
    };

    delete data._id;

    //For get old data with image, video, etc name
    PostModel.aggregate(
      [
        {
          $match: query,
        },
        {
          $lookup: {
            from: "photo",
            localField: "media.photos.files",
            foreignField: "_id",
            as: "media.photos.files",
          },
        },
        {
          $lookup: {
            from: "photo",
            localField: "media.videos.files",
            foreignField: "_id",
            as: "media.videos.files",
          },
        },

        {
          $project: {
            _id: 1,
            media: {
              photos: { files: { _id: 1, photo_name: 1 } },
              videos: { files: { _id: 1, video_name: 1, video_screenshot: 1 } },
            },
          },
        },
        { $skip: 0 },
        { $limit: 1 },
      ],
      function (err, oldPost) {
        if (err) {
          AppCode.Fail.error = err.message;
          response.setError(AppCode.Fail);
          response.send(res);
        } else {
          if (!!oldPost && oldPost.length > 0) {
            oldPost = oldPost[0];
            async.waterfall(
              [
                function (cb) {
                  //Set new photos and videos name array and other to params
                  if (
                    filesArr !== "" &&
                    filesArr !== null &&
                    filesArr !== undefined &&
                    filesArr !== [] &&
                    filesArr !== {}
                  ) {
                    if (data.media === undefined) {
                      data.media = {};
                      data.media.photos = {};
                      data.media.videos = {};
                    }
                    data.media.photos.files = [];
                    data.media.videos.files = [];

                    for (let filesArrKey in filesArr) {
                      let files = filesArr[filesArrKey];
                      for (let filesKey in files) {
                        let file = files[filesKey];
                        if (file.fieldname === "photos") {
                          const Imageurl = s3.getSignedUrl("getObject", {
                            Bucket: CONFIG.UPLOADS_BUCKET.bucketName,
                            Key: file.key,
                            // Expires: signedUrlExpireSeconds
                          });
                          console.log("----------------------", Imageurl)
                        }
                        //console.log("filefilefilefilefile",file);

                        // if (file.fieldname === "photos") {
                        //   let thumbnailName =
                        //     filesArr[filesArrKey][filesKey].originalname;
                        //   console.log("-------------------", thumbnailName);
                        //   let thumbnailKey =
                        //     CONFIG.S3UPLOADS.DIR_PATH_POST_PHOTOS +
                        //     dateTimeData +
                        //     thumbnailName.split(".")[0] +
                        //     ".jpg";
                        //   const Imageurl = s3.getSignedUrl("getObject", {
                        //     Bucket: CONFIG.UPLOADS_BUCKET.bucketName,
                        //     Key: file.key,
                        //     // Expires: signedUrlExpireSeconds
                        //   });

                        //   imageThumbnail({ uri: Imageurl })
                        //     .then((thumbnail) => {
                        //       // console.log(thumbnail)
                        //       var params = {
                        //         Bucket: CONFIG.UPLOADS_BUCKET.bucketName,
                        //         Key: thumbnailKey,
                        //         ACL: "public-read",
                        //         Body: thumbnail, //got buffer by reading file path
                        //       };

                        //       s3.putObject(params, function (err, data) {
                        //         console.log(err, data);
                        //       });
                        //     })
                        //     .catch((err) => console.error(err));

                        //   // data.media[file.fieldname].files.push(
                        //   //   "http://" + req.hostname + "/uploads/" + file.filename
                        //   // );
                        data.media[file.fieldname].files.push({
                          filename: file.key,

                          originalname: file.originalname,
                        });
                        // } else if (file.fieldname === "videos") {
                        //   // data.media[file.fieldname].files.push(
                        //   //   "http://" + req.hostname + "/uploads/" + file.filename
                        //   // );

                        //   videos.push(file.key);
                        //   data.media[file.fieldname].files.push({
                        //     filename: file.key,
                        //     originalname: file.originalname,
                        //   });
                        //   //data.media[file.fieldname].files.push(file.filename);
                        // }
                      }
                    }
                  }
                  if (data.location !== undefined) {
                    data.location = data.location.split(",");
                    data.location.map((obj, index) => {
                      data.location[index] = parseFloat(obj);
                    });
                  } else {
                    data.location = [];
                    data.locationName = "";
                  }

                  cb(null);
                },
                function (cb) {
                  //Store new photos in photo model
                  //console.log("new body data :",data.media.photos.files);

                  if (
                    !!data.media &&
                    !!data.media.photos &&
                    !!data.media.photos.files &&
                    data.media.photos.files.length > 0
                  ) {
                    let photosData = [];
                    //console.log("All data.tags >>>>>>>>>> :",data.tags);
                    data.media.photos.files.map((obj, index) => {
                      photosData[index] = {
                        photo_name: obj.filename,
                        userId: userId,
                        status: 1,
                        isDelete: 0,
                        module: 1,
                        type: "photo",
                        isPostPhoto: true,
                        createdAt: new Date(),
                      };
                    });
                    data.media.photos.files = [];
                    //set default album type 2 which is uploads album type
                    _.forEach(photosData, (obj) => {
                      obj.albumType = data.albumType ? data.albumType : 2;
                    });
                    PhotoModel.createMany(photosData, function (err, photos) {
                      if (err) {
                        //TODO: Log the error here
                        cb(err);
                      } else {
                        //console.log("here photos result after insert : ", photos);
                        if (!!photos && photos.length > 0) {
                          photos.map((obj) => {
                            data.media.photos.files.push(obj._id);
                          });
                        }
                        cb(null);
                      }
                    });
                  } else {
                    if (data.media === undefined) {
                      data.media = {};
                    }
                    if (data.media.photos === undefined) {
                      data.media.photos = {};
                    }
                    data.media.photos.files = [];

                    cb(null);
                  }
                },
                function (cb) {
                  //Merge new and remaining old photos and get deleted photos data
                  let oldPhotoIds = [];
                  let oldDeletedPhotos = [];
                  if (
                    !!oldPost.media &&
                    !!oldPost.media.photos &&
                    oldPost.media.photos.files &&
                    oldPost.media.photos.files.length > 0
                  ) {
                    oldPost.media.photos.files.map((oldPhotoObj) => {
                      let deletedPhotoObj;
                      if (deletedPhotos !== undefined) {
                        deletedPhotos.map((deletedPhotosObj) => {
                          if (
                            deletedPhotosObj.toString() ===
                            oldPhotoObj._id.toString()
                          ) {
                            deletedPhotoObj = oldPhotoObj;
                          }
                        });
                      }
                      if (deletedPhotoObj === undefined) {
                        oldPhotoIds.push(ObjectID(oldPhotoObj._id));
                      } else {
                        oldDeletedPhotos.push(deletedPhotoObj);
                      }
                    });
                    data.media.photos.files = oldPhotoIds.concat(
                      data.media.photos.files
                    );
                    cb(null, oldDeletedPhotos);
                  } else {
                    cb(null, oldDeletedPhotos);
                  }
                },

              ],
              function (err, oldDeletedPhotos) {
                if (err) {
                  AppCode.Fail.error = err.message;
                  response.setError(AppCode.Fail);
                  response.send(res);
                } else {
                  console.log()
                  PostModel.update(query, data, function (err, post) {
                    if (err) {
                      //TODO: Log the error here
                      AppCode.Fail.error = err.message;
                      response.setError(AppCode.Fail);
                      response.send(res);
                    } else if (
                      post == undefined ||
                      (post.matchedCount === 0 && post.modifiedCount === 0)
                    ) {
                      AppCode.Fail.error = "No post found";
                      response.setError(AppCode.Fail);
                      response.send(res);
                    } else {
                      console.log("oldDeletedPhotos oldDeletedPhotos oldDeletedPhotos :", oldDeletedPhotos);
                      //For remove old photos form directory and photo collection
                      if (oldDeletedPhotos.length > 0) {
                        oldDeletedPhotos.map((oldDeletedPhotosObj) => {
                          let photoName = oldDeletedPhotosObj.photo_name
                            ? oldDeletedPhotosObj.photo_name
                            : "";
                          if (!!oldDeletedPhotosObj._id) {
                            PhotoModel.remove(
                              { _id: ObjectID(oldDeletedPhotosObj._id) },
                              function (err, removedPhoto) {
                                if (err) {
                                } else {
                                }
                              }
                            );

                            imagePath = CONFIG.UPLOADS.ROOT_PATH + photoName;
                            //console.log("imagePath imagePath imagePath imagePath imagePath imagePath  : ", imagePath);

                            if (fs.existsSync(imagePath)) {
                              fs.unlink(imagePath, (err) => {
                                if (err) {
                                  console.error(err);
                                  return;
                                }
                                //file removed
                              });
                            }
                          }
                        });
                      }
                      response.setData(AppCode.Success, post);
                      response.send(res);

                      //For remove old videos form directory and video collection

                    }
                  });
                }
              }
            );
          } else {
            AppCode.Fail.error = "No post found";
            response.setError(AppCode.Fail);
            response.send(res);
          }
        }
      }
    );
  } else {
    response.setData(AppCode.PleaseLoginAgain, {});
    response.send(res);
  }
};
PostCtrl.getPostFeedList = (req, res) => {
  const response = new HttpRespose();
  var data = {};
  data.posts = [];

  if (!!req.auth._id) {
    let condition = {};
    let options = {};
    let userId = ObjectID(req.auth._id);
    let pageNumber = !!req.query.pageNumber ? req.query.pageNumber : 0;
    const limit = !!req.query.limit ? req.query.limit : 5;
    const skip = limit * parseInt(pageNumber);
    options.skip = skip;
    options.limit = limit;
    console.log(req.auth)
    async.waterfall(
      [
        function (callback) {
          let deletedIds = [];

          UserModel.find(
            { isdeleted: true },
            { _id: 1 },
            (err, deletedUsers) => {
              if (err) {
                callback(null, deletedIds);
              } else {
                if (!!deletedUsers) {
                  deletedUsers.map((follwerObj) => {
                    deletedIds.push(follwerObj._id);
                  });
                  callback(null, deletedIds);
                }
              }
            }
          );
        },
        function (deletedIds, callback) {
          let userfriendsIds = [];
          const friendsQuery = {
            userId: userId,
          };

          FriendsModel.find(
            friendsQuery,
            (err, userfriends) => {
              if (err) {
                callback(null, deletedIds, userfriendsIds);
              } else {
                console.log("userfriendsuserfriendsuserfriends", userfriends)
                if (!!userfriends) {
                  userfriends.map((follwerObj) => {
                    userfriendsIds.push(follwerObj.friendsId);
                  });
                  console.log("%%%%%%%%%%%%%%%%%%%%%%%%%%%", userfriendsIds)
                  callback(null, deletedIds, userfriendsIds);
                }
              }
            }
          );
        },
        function (deletedIds, userfriendsIds, callback) {
          condition["$and"] = [{ isDeleted: { $ne: true } }];
          condition["$and"].push({
            userId: { $nin: deletedIds },
          });
          condition["$and"].push({
            "$or": [
              { privacyStatus: 2 },//everyone
              { "$and": [{ privacyStatus: 1 }, { "$or": [{ userId: userId }, { userId: { $in: userfriendsIds } }] }] },
              { "$and": [{ privacyStatus: 3 }, { userId: userId }] }
            ]
          });
          console.log(deletedIds);
          let conditionQuery = [
            {
              $match: condition,
            },
            {
              $sort: {
                createdAt: -1,
              },
            },
            { $skip: options.skip },
            { $limit: options.limit },
            {
              $lookup: {
                from: "user",
                localField: "userId",
                foreignField: "_id",
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
                privacyStatus: 1,
                userDetails: {
                  userId: "$user_id._id",
                  firstName: "$user_id.firstName",
                  lastName: "$user_id.lastName",
                  userName: "$user_id.userName",
                  accountType: "$user_id.accountType",
                  profile_image: { $ifNull: ["$user_id.profile_image", ""] },
                  userRating: { $ifNull: ["$user_id.userRating", 0] },

                },
                totalLike: {
                  $cond: {
                    if: { $isArray: "$like" },
                    then: { $size: "$like" },
                    else: 0,
                  },
                },
                // totalComment: { $cond: { if: { $isArray: "$comment" }, then: { $size: "$comment" }, else: 0 } },
                totalComment: {
                  $sum: [
                    {
                      $cond: {
                        if: { $isArray: "$comment" },
                        then: { $size: "$comment" },
                        else: 0,
                      },
                    },
                    {
                      $cond: {
                        if: { $isArray: "$replyData" },
                        then: { $size: "$replyData" },
                        else: 0,
                      },
                    },
                  ],
                },
                isLike: {
                  $gt: [
                    {
                      $size: {
                        $ifNull: [
                          {
                            $filter: {
                              input: "$like",
                              as: "liked",
                              cond: {
                                $eq: ["$$liked", userId],
                              },
                            },
                          },
                          [],
                        ],
                      },
                    },
                    0,
                  ],
                },
                media: 1,
                location: 1,
                locationName: 1,
                createdAt: 1,
              },
            },
          ];
          callback(null, conditionQuery);
        },
        function (conditionQuery, callback) {
          async.parallel(
            [
              function (cb) {
                PostModel.aggregate(conditionQuery, function (err, posts) {
                  if (err) {
                    cb(err);
                  } else {
                    data.posts = data.posts.concat(posts);
                    cb(null);
                  }
                });
              },
              function (cb) {
                PostModel.count(condition, function (err, totalPosts) {
                  if (err) {
                    cb(err);
                  } else {
                    if (totalPosts <= skip + limit) {
                    } else {
                      data.nextPage = parseInt(pageNumber) + 1;
                    }
                    data.recordsTotal = totalPosts;
                    cb(null);
                  }
                });
              },
            ],
            function (err) {
              if (err) {
                callback(err);
              } else {
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
    response.setData(AppCode.MissingParameter, {});
    response.send(res);
  }
};
PostCtrl.getPostFeedListForUser = (req, res) => {
  const response = new HttpRespose();
  var data = {};
  data.posts = [];

  if (!!req.auth._id) {
    let condition = {};
    let options = {};
    let userId = ObjectID(req.auth._id);
    let uId = ObjectID(req.query.userId);
    let pageNumber = !!req.query.pageNumber ? req.query.pageNumber : 0;
    const limit = 5;
    const skip = limit * parseInt(pageNumber);
    options.skip = skip;
    options.limit = limit;
    // options.recordsPerPage = !!req.query.recordsPerPage ? parseInt(req.query.recordsPerPage) : 200;
    // options.recordsOffset = !!req.query.recordsOffset ? parseInt(req.query.recordsOffset) : 0;

    async.waterfall(
      [

        function (callback) {
          let deletedIds = [];

          UserModel.find(
            { isdeleted: true },
            { _id: 1 },
            (err, deletedUsers) => {
              if (err) {
                callback(null, deletedIds);
              } else {
                if (!!deletedUsers) {
                  deletedUsers.map((follwerObj) => {
                    deletedIds.push(follwerObj._id);
                  });
                  callback(null, deletedIds);
                }
              }
            }
          );
        },
        function (deletedIds, callback) {
          let userfriendsIds = [];
          const friendsQuery = {
            userId: userId,
          };

          FriendsModel.find(
            friendsQuery,
            (err, userfriends) => {
              if (err) {
                callback(null, deletedIds, userfriendsIds);
              } else {
                console.log("userfriendsuserfriendsuserfriends", userfriends)
                if (!!userfriends) {
                  userfriends.map((follwerObj) => {
                    userfriendsIds.push(follwerObj.friendsId);
                  });
                  console.log("%%%%%%%%%%%%%%%%%%%%%%%%%%%", userfriendsIds)
                  callback(null, deletedIds, userfriendsIds);
                }
              }
            }
          );
        },
        function (deletedIds, userfriendsIds, callback) {
          condition["$and"] = [{ isDeleted: { $ne: true } }, { userId: uId }];
          condition["$and"].push({
            "$or": [
              { privacyStatus: 2 },//everyone
              { "$and": [{ privacyStatus: 1 }, { "$or": [{ userId: userId }, { userId: { $in: userfriendsIds } }] }] },
              { "$and": [{ privacyStatus: 3 }, { userId: userId }] }
            ]
          });
          let conditionQuery = [
            {
              $match: condition,
            },
            {
              $lookup: {
                from: "user",
                localField: "userId",
                foreignField: "_id",
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
            // {
            //   $lookup: {
            //     from: "userDetails",
            //     let: { tagBuddies: "$tagBuddies" },
            //     pipeline: [
            //       {
            //         $match: {
            //           $expr: {
            //             $in: [
            //               "$userId",
            //               {
            //                 $cond: {
            //                   if: { $isArray: "$$tagBuddies" },
            //                   then: "$$tagBuddies",
            //                   else: [],
            //                 },
            //               },
            //             ],
            //           },
            //         },
            //       },
            //       {
            //         $project: {
            //           _id: 1,
            //           userId: 1,
            //           firstName: 1,
            //           lastName: 1,
            //           userName: 1,
            //           locationName: 1,
            //           profileUrl: { $ifNull: ["$profileUrl", ""] },
            //           statusType: 1,
            //         },
            //       },
            //     ],
            //     as: "tagBuddies",
            //   },
            // },
            // {
            //   $addFields: {
            //     replyData: {
            //       $reduce: {
            //         input: "$comment.reply",
            //         initialValue: [],
            //         in: {
            //           $concatArrays: [
            //             { $ifNull: ["$$value", []] },
            //             { $ifNull: ["$$this", []] },
            //           ],
            //         },
            //       },
            //     },
            //   },
            // },
            {
              $project: {
                //"_id": 0,
                content: 1,
                userDetails: {
                  userId: "$user_id.userId",
                  userRating: { $ifNull: ["$user_id.userRating", 0] },
                  firstName: "$user_id.firstName",
                  lastName: "$user_id.lastName",
                  userName: "$user_id.userName",
                  locationName: "$user_id.locationName",
                  profileUrl: { $ifNull: ["$user_id.profileUrl", ""] },
                  statusType: "$user_id.statusType",

                },
                media: 1,
                totalLike: {
                  $cond: {
                    if: { $isArray: "$like" },
                    then: { $size: "$like" },
                    else: 0,
                  },
                },
                // totalComment: { $cond: { if: { $isArray: "$comment" }, then: { $size: "$comment" }, else: 0 } },
                totalComment: {
                  $sum: [
                    {
                      $cond: {
                        if: { $isArray: "$comment" },
                        then: { $size: "$comment" },
                        else: 0,
                      },
                    },
                    {
                      $cond: {
                        if: { $isArray: "$replyData" },
                        then: { $size: "$replyData" },
                        else: 0,
                      },
                    },
                  ],
                },
                tagBuddies: 1,
                location: 1,
                locationName: 1,
                createdAt: 1,
              },
            },
            {
              $sort: {
                createdAt: -1,
              },
            },
            { $skip: options.skip },
            { $limit: options.limit },
          ];
          callback(null, conditionQuery);
        },
        function (conditionQuery, callback) {
          async.parallel(
            [
              function (cb) {
                //Get records / documents for original post list
                //console.log("conditionQueryconditionQueryconditionQuery:",JSON.stringify(conditionQuery, null, 4));
                PostModel.aggregate(conditionQuery, function (err, posts) {
                  if (err) {
                    cb(err);
                  } else {
                    //data.posts = posts;
                    data.posts = data.posts.concat(posts);
                    cb(null);
                  }
                });
              },
              function (cb) {
                PostModel.count(condition, function (err, totalPosts) {
                  if (err) {
                    cb(err);
                  } else {
                    if (totalPosts <= skip + limit) {
                    } else {
                      data.nextPage = parseInt(pageNumber) + 1;
                    }
                    data.recordsTotal = totalPosts;
                    cb(null);
                  }
                });
              },
            ],
            function (err) {
              if (err) {
                callback(err);
              } else {
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
    response.setData(AppCode.MissingParameter, {});
    response.send(res);
  }
};
/*
 *Like/dislike post
 */
PostCtrl.likeDislikePost = (req, res) => {
  const response = new HttpRespose();
  console.log("Payload Data", req.auth);
  if (!!req.auth._id) {
    if (!!req.body.postId) {
      let condition = {};
      let userId = ObjectID(req.auth._id);
      condition._id = ObjectID(req.body.postId);
      //condition.user_id = userId;
      PostModel.findOne(
        condition,
        { _id: 0, like: 1, comment: 1, userId: 1 },
        function (err, post) {
          if (err) {
            //TODO: Log the error here
            AppCode.Fail.error = err.message;
            response.setError(AppCode.Fail);
            response.send(res);
          } else {
            if (post !== null) {
              let isLike = true;
              let update;
              update = { $push: { like: userId } };
              if (!!post.like && post.like.length > 0) {
                post.like.map((likedObj) => {
                  if (likedObj.toString() === userId.toString()) {
                    isLike = false;
                    update = { $pull: { like: userId } };
                  }
                });
              }
              //This condition is required because if comments or reply not found then we can thorow error for comment or reply not found.
              if (!!update) {
                PostModel.likeUnlike(
                  condition,
                  update,
                  function (err, updatedPost) {
                    if (err) {
                      AppCode.Fail.error = err.message;
                      response.setError(AppCode.Fail);
                      response.send(res);
                    } else {
                      // if (isLike) {
                      //   UserModel.findOne(
                      //     { _id: ObjectID(req.auth._id) },
                      //     function (err, users) {
                      //       if (err) {
                      //         console.log("---", err);
                      //       } else {
                      //         if (req.auth._id != post.userId) {
                      //           let msg = users.userName + " liked your post!",
                      //             title = "Liked Post",
                      //             type = "likePost",
                      //             postId = req.body.postId;
                      //           let notificationQuery = {
                      //             senderId: req.auth._id,
                      //             reciverId: post.user_id,
                      //             message: msg,
                      //             type: type,
                      //             postId: req.body.postId,
                      //           };
                      //           NotificationModel.create(
                      //             notificationQuery,
                      //             (err, notification) => {
                      //               if (err) {
                      //                 throw err;
                      //               } else {
                      //                 let query = [
                      //                   {
                      //                     $match: {
                      //                       userId: ObjectID(post.userId),
                      //                     },
                      //                   },
                      //                 ];
                      //                 DeviceTokenModel.aggregate(
                      //                   query,
                      //                   function (err, deviceTokensData) {
                      //                     if (err) {
                      //                       console.log(err);
                      //                     } else {
                      //                       console.log(
                      //                         "deviceTokensDataaaaaaaaaaaaaa",
                      //                         deviceTokensData
                      //                       );
                      //                       if (!!deviceTokensData) {
                      //                         deviceTokensData.forEach(
                      //                           (element) => {
                      //                             if (!!element.deviceToken) {
                      //                               let tokens =
                      //                                 element.deviceToken;
                      //                               if (!!tokens) {
                      //                                 sendToTopics(
                      //                                   msg,
                      //                                   title,
                      //                                   type,
                      //                                   postId,
                      //                                   tokens,
                      //                                   ""
                      //                                 );
                      //                               }
                      //                             }
                      //                           }
                      //                         );
                      //                       }
                      //                     }
                      //                   }
                      //                 );
                      //               }
                      //             }
                      //           );
                      //         }
                      //       }
                      //     }
                      //   );
                      // } else {
                      //   let removeNotificationQuery = {
                      //     reciverId: post.userId,
                      //     senderId: ObjectID(req.auth._id),
                      //     type: "likePost",
                      //   };
                      //   NotificationModel.removeMany(
                      //     removeNotificationQuery,
                      //     (err, notification) => {
                      //       if (err) {
                      //         console.log("err", err);
                      //       } else {
                      //       }
                      //     }
                      //   );
                      // }

                      response.setData(AppCode.Success, { isLike: isLike });
                      response.send(res);
                    }
                  }
                );
              } else {
                response.setData(AppCode.SomethingWrong);
                response.send(res);
              }
            } else {
              response.setData(AppCode.SomethingWrong);
              response.send(res);
            }
          }
        }
      );
    } else {
      response.setData(AppCode.MissingParameter);
      response.send(res);
    }
  } else {
    response.setData(AppCode.PleaseLoginAgain);
    response.send(res);
  }
};

/*
 *add comment post
 */
PostCtrl.addCommentPost = (req, res) => {
  const response = new HttpRespose();
  if (!!req.auth._id) {
    if (!!req.body.postId && !!req.body.text) {
      let data = {};
      let userId = ObjectID(req.auth._id);
      let condition = {};
      condition._id = ObjectID(req.body.postId);
      let update;
      let newCommentId = new ObjectID();
      update = {
        $push: {
          comment: {
            _id: newCommentId,
            userId: userId,
            updatedAt: new Date(),
          },
        },
      };
      update["$push"].comment.text = req.body.text;
      async.waterfall(
        [
          function (cb) {
            PostModel.addCommentReply(
              condition,
              update,
              function (err, updatedPost) {
                if (err) {
                  cb(err);
                } else {
                  cb(null);
                }
              }
            );
          },
          function (cb) {
            //Get total comments/reply
            PostModel.findOne(
              condition,
              { like: 1, comment: 1, userId: 1 },
              function (err, newPost) {
                if (err) {
                  cb(err);
                } else {
                  data.Id = newCommentId;
                  if (newPost !== null && !!newPost.comment) {
                    var totalReply = newPost.comment.reduce(
                      (count, current) =>
                        count +
                        (current.reply != undefined ? current.reply.length : 0),
                      0
                    );
                    console.log(totalReply);
                    var totalComment = newPost.comment.length;
                    data.totalComment = totalComment + totalReply;
                  } else {
                    data.totalComment = 0;
                  }
                  // UserModel.findOne(
                  //   { _id: ObjectID(req.auth._id) },
                  //   function (err, users) {
                  //     if (err) {
                  //       console.log(err);
                  //     } else {
                  //       if (req.auth._id != newPost.userId) {
                  //         let msg = users.userName + " commented on your post!",
                  //           title = "Comment On Post",
                  //           type = "commentPost",
                  //           postId = req.body.postId;
                  //         let notificationQuery = {
                  //           senderId: req.auth._id,
                  //           reciverId: newPost.userId,
                  //           message: msg,
                  //           type: type,
                  //           postId: req.body.postId,
                  //         };
                  //         NotificationModel.create(
                  //           notificationQuery,
                  //           (err, notification) => {
                  //             if (err) {
                  //               throw err;
                  //             } else {
                  //               let query = [
                  //                 {
                  //                   $match: {
                  //                     userId: ObjectID(newPost.userId),
                  //                   },
                  //                 },
                  //               ];
                  //               DeviceTokenModel.aggregate(
                  //                 query,
                  //                 function (err, deviceTokensData) {
                  //                   if (err) {
                  //                     console.log(err);
                  //                   } else {
                  //                     console.log(
                  //                       "deviceTokensDataaaaaaaaaaaaaa",
                  //                       deviceTokensData
                  //                     );
                  //                     if (!!deviceTokensData) {
                  //                       deviceTokensData.forEach((element) => {
                  //                         let tokens = element.deviceToken;
                  //                         if (!!tokens) {
                  //                           sendToTopics(
                  //                             msg,
                  //                             title,
                  //                             type,
                  //                             postId,
                  //                             tokens,
                  //                             res
                  //                           );
                  //                         }
                  //                       });
                  //                     }
                  //                   }
                  //                 }
                  //               );
                  //             }
                  //           }
                  //         );
                  //       }

                  //       if (!!req.body.text) {
                  //         console.log(
                  //           "Before Contetnt",
                  //           req.body.text
                  //         );
                  //         // var rx = /(?:^|\s)(@[_a-z0-9]\w*)/gi;
                  //         var rx = /(?:^|\s)(@[_a-z0-9]\S*)/gi;
                  //         var m,
                  //           resData = [];
                  //         while (
                  //           (m = rx.exec(req.body.text))
                  //         ) {
                  //           resData.push(m[1]);
                  //         }
                  //         console.log("Result Array", resData);
                  //         if (resData.length > 0) {
                  //           console.log("hsdfshgjksfhgjkhfkjghfjhgjsfdh")
                  //           resData.forEach((element) => {
                  //             var usName = element.substring(1);
                  //             console.log("usNameusNameusNameusNameusName", usName)
                  //             UserModel.findOne(
                  //               { userName: usName },
                  //               function (err, usersNameData) {
                  //                 if (err) {
                  //                   console.log(err);
                  //                 } else {
                  //                   if (
                  //                     !_.isEmpty(usersNameData)
                  //                   ) {
                  //                     if (
                  //                       usersNameData._id !=
                  //                       users._id
                  //                     ) {
                  //                       let msg =
                  //                         users.userName +
                  //                         " tagged you on a post comment!",
                  //                         title =
                  //                           "New Comment Tag",
                  //                         type = "tagComment",
                  //                         postId = newPost._id.toString();
                  //                       let notificationQuery =
                  //                       {
                  //                         senderId:
                  //                           req.auth
                  //                             ._id,
                  //                         reciverId:
                  //                           usersNameData._id,
                  //                         message: msg,
                  //                         type: type,
                  //                         postId: newPost._id,
                  //                       };
                  //                       NotificationModel.create(
                  //                         notificationQuery,
                  //                         (
                  //                           err,
                  //                           notification
                  //                         ) => {
                  //                           if (err) {
                  //                             throw err;
                  //                           } else {
                  //                             let query = [
                  //                               {
                  //                                 $match: {
                  //                                   userId:
                  //                                     usersNameData._id,
                  //                                 },
                  //                               },
                  //                             ];
                  //                             DeviceTokenModel.aggregate(
                  //                               query,
                  //                               function (
                  //                                 err,
                  //                                 deviceTokensData
                  //                               ) {
                  //                                 if (err) {
                  //                                   console.log(
                  //                                     err
                  //                                   );
                  //                                 } else {
                  //                                   console.log(
                  //                                     "deviceTokensDataaaaaaaaaaaaaa",
                  //                                     deviceTokensData
                  //                                   );
                  //                                   if (
                  //                                     !!deviceTokensData
                  //                                   ) {
                  //                                     deviceTokensData.forEach(
                  //                                       (
                  //                                         element
                  //                                       ) => {
                  //                                         let tokens =
                  //                                           element.deviceToken;
                  //                                         if (
                  //                                           !!tokens
                  //                                         ) {
                  //                                           sendToTopics(
                  //                                             msg,
                  //                                             title,
                  //                                             type,
                  //                                             postId,
                  //                                             tokens,
                  //                                             res
                  //                                           );
                  //                                         }
                  //                                       }
                  //                                     );
                  //                                   }
                  //                                 }
                  //                               }
                  //                             );
                  //                           }
                  //                         }
                  //                       );
                  //                     }
                  //                   }
                  //                 }
                  //               }
                  //             );
                  //           });
                  //         }
                  //       }
                  //     }
                  //   }
                  // );


                  cb(null);
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
            response.setData(AppCode.Success, data);
            response.send(res);
          }
        }
      );
    } else {
      response.setData(AppCode.MissingParameter, {});
      response.send(res);
    }
  } else {
    response.setData(AppCode.PleaseLoginAgain, {});
    response.send(res);
  }
};

/*add comment reply*/

PostCtrl.addCommentReply = (req, res) => {
  const response = new HttpRespose();
  if (!!req.auth._id) {
    if (!!req.body.postId && !!req.body.text && !!req.body.commentId) {
      let data = {};
      let userId = ObjectID(req.auth._id);
      let Id = new ObjectID();
      let condition = {};
      condition._id = ObjectID(req.body.postId);
      condition["comment._id"] = ObjectID(req.body.commentId);
      let update;
      update = {
        $push: {
          "comment.$.reply": {
            _id: Id,
            userId: userId,
            updatedAt: new Date(),
          },
        },
      };
      if (!!req.body.text) {
        update["$push"]["comment.$.reply"].text = req.body.text;
      }
      async.waterfall(
        [
          function (cb) {
            PostModel.addCommentReply(
              condition,
              update,
              function (err, updatedPost) {
                if (err) {
                  cb(err);
                } else {
                  cb(null);
                }
              }
            );
          },
          function (cb) {
            //Get total comments/reply
            PostModel.findOne(
              condition,
              { like: 1, comment: 1 },
              function (err, newPost) {
                if (err) {
                  cb(err);
                } else {
                  if (newPost !== null && !!newPost.comment) {
                    if (!!newPost.comment && !!newPost.comment[0].reply) {
                      const comment = _.find(newPost.comment, (comment) => {
                        return comment._id.toString() === req.body.commentId;
                      });
                      data.Id = Id;
                      data.totalReply = comment.reply.length;
                      //data.totalComment = newPost.comment.length;
                      data.totalLike = newPost.like ? newPost.like.length : 0;

                      var totalPostReply = newPost.comment.reduce(
                        (count, current) =>
                          count +
                          (current.reply != undefined
                            ? current.reply.length
                            : 0),
                        0
                      );
                      console.log(totalPostReply);
                      var totalCommentCount = newPost.comment.length;
                      data.totalComment = totalCommentCount + totalPostReply;
                    } else {
                      const comment = _.find(newPost.comment, (comment) => {
                        return comment._id.toString() === req.body.commentId;
                      });
                      data.totalReply = comment.reply.length;
                    }
                  } else {
                    data.totalReply = 0;
                  }
                  const comment = _.find(newPost.comment, (comment) => {
                    return comment._id.toString() === req.body.commentId;
                  });
                  let sendNotifyId = comment.userId;
                  if (!!req.body.repliedToId) {
                    sendNotifyId = req.body.repliedToId;
                  }
                  // UserModel.findOne(
                  //   { _id: ObjectID(req.auth._id) },
                  //   function (err, users) {
                  //     if (err) {
                  //       console.log(err);
                  //     } else {
                  //       if (req.auth._id != sendNotifyId) {
                  //         let msg =
                  //           users.userName + " replied on your comment!",
                  //           title = "Reply On Comment",
                  //           type = "commentReply",
                  //           postId = req.body.postId,
                  //           commentId = req.body.commentId;
                  //         let notificationQuery = {
                  //           senderId: req.auth._id,
                  //           reciverId: sendNotifyId,
                  //           message: msg,
                  //           type: type,
                  //           postId: req.body.postId,
                  //           commentId: req.body.commentId,
                  //         };
                  //         NotificationModel.create(
                  //           notificationQuery,
                  //           (err, notification) => {
                  //             if (err) {
                  //               throw err;
                  //             } else {
                  //               let query = [
                  //                 {
                  //                   $match: { userId: ObjectID(sendNotifyId) },
                  //                 },
                  //               ];
                  //               DeviceTokenModel.aggregate(
                  //                 query,
                  //                 function (err, deviceTokensData) {
                  //                   if (err) {
                  //                     console.log(err);
                  //                   } else {
                  //                     console.log(
                  //                       "deviceTokensDataaaaaaaaaaaaaa",
                  //                       deviceTokensData
                  //                     );
                  //                     if (!!deviceTokensData) {
                  //                       deviceTokensData.forEach((element) => {
                  //                         let tokens = element.deviceToken;
                  //                         if (!!tokens) {
                  //                           sendToTopics(
                  //                             msg,
                  //                             title,
                  //                             type,
                  //                             postId,
                  //                             commentId,
                  //                             tokens,
                  //                             res
                  //                           );
                  //                         }
                  //                       });
                  //                     }
                  //                   }
                  //                 }
                  //               );
                  //             }
                  //           }
                  //         );
                  //       }
                  //       if (!!req.body.text) {

                  //         console.log(
                  //           "Before Contetnt",
                  //           req.body.text
                  //         );
                  //         // let abc = req.body.text;
                  //         // let rx = abc.split("@" , " ")
                  //         // var rx = /(?:^|\s)(@[_a-z0-9]\w*)/gi;
                  //         var rx = /(?:^|\s)(@[_a-z0-9]\S*)/gi;
                  //         var m,
                  //           resData = [];
                  //         while (
                  //           (m = rx.exec(req.body.text))
                  //         ) {
                  //           resData.push(m[1]);
                  //         }
                  //         console.log("Result Array", resData);
                  //         if (resData.length > 0) {
                  //           resData.forEach((element) => {
                  //             var usName = element.substring(1);

                  //             UserModel.findOne(
                  //               { userName: usName },
                  //               function (err, usersNameData) {
                  //                 if (err) {
                  //                   console.log(err);
                  //                 } else {
                  //                   if (
                  //                     !_.isEmpty(usersNameData)
                  //                   ) {
                  //                     if (
                  //                       usersNameData.userId !=
                  //                       users.userId
                  //                     ) {
                  //                       let msg =
                  //                         users.userName +
                  //                         " tagged you on a post comment!",
                  //                         title =
                  //                           "New Comment Tag",
                  //                         type = "tagComment",
                  //                         postId = req.body.postId;
                  //                       let notificationQuery =
                  //                       {
                  //                         senderId:
                  //                           req.payload
                  //                             .userId,
                  //                         reciverId:
                  //                           usersNameData.userId,
                  //                         message: msg,
                  //                         type: type,
                  //                         postId: req.body.postId,
                  //                       };
                  //                       NotificationModel.create(
                  //                         notificationQuery,
                  //                         (
                  //                           err,
                  //                           notification
                  //                         ) => {
                  //                           if (err) {
                  //                             throw err;
                  //                           } else {
                  //                             let query = [
                  //                               {
                  //                                 $match: {
                  //                                   userId:
                  //                                     usersNameData.userId,
                  //                                 },
                  //                               },
                  //                             ];
                  //                             DeviceTokenModel.aggregate(
                  //                               query,
                  //                               function (
                  //                                 err,
                  //                                 deviceTokensData
                  //                               ) {
                  //                                 if (err) {
                  //                                   console.log(
                  //                                     err
                  //                                   );
                  //                                 } else {
                  //                                   console.log(
                  //                                     "deviceTokensDataaaaaaaaaaaaaa",
                  //                                     deviceTokensData
                  //                                   );
                  //                                   if (
                  //                                     !!deviceTokensData
                  //                                   ) {
                  //                                     deviceTokensData.forEach(
                  //                                       (
                  //                                         element
                  //                                       ) => {
                  //                                         let tokens =
                  //                                           element.deviceToken;
                  //                                         if (
                  //                                           !!tokens
                  //                                         ) {
                  //                                           sendToTopics(
                  //                                             msg,
                  //                                             title,
                  //                                             type,
                  //                                             postId,
                  //                                             tokens,
                  //                                             res
                  //                                           );
                  //                                         }
                  //                                       }
                  //                                     );
                  //                                   }
                  //                                 }
                  //                               }
                  //                             );
                  //                           }
                  //                         }
                  //                       );
                  //                     }
                  //                   }
                  //                 }
                  //               }
                  //             );
                  //           });
                  //         }
                  //       }
                  //     }
                  //   }
                  // );

                  cb(null);
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
            response.setData(AppCode.Success, data);
            response.send(res);
          }
        }
      );
    } else {
      response.setData(AppCode.MissingParameter, {});
      response.send(res);
    }
  } else {
    response.setData(AppCode.PleaseLoginAgain, {});
    response.send(res);
  }
};
PostCtrl.postLikeListForHomePage = (req, res) => {
  const response = new HttpRespose();
  let searchKey = "";
  searchKey = !!req.query.searchKey ? req.query.searchKey : "";
  try {
    let query = [
      {
        $match: {
          _id: ObjectID(req.query.postId),
        }
      },
      {
        $lookup: {
          from: "user",
          as: "Likedata",
          let: { likeid: "$like" },
          pipeline: [
            {
              $match: {
                $or: [
                  {
                    firstName: new RegExp(
                      ".*" + searchKey.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&") + ".*",
                      "i"
                    ),
                  },
                  {
                    lastName: new RegExp(
                      ".*" + searchKey.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&") + ".*",
                      "i"
                    ),
                  },
                  {
                    userName: new RegExp(
                      ".*" + searchKey.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&") + ".*",
                      "i"
                    ),
                  },
                  {
                    accountType: new RegExp(
                      ".*" + searchKey.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&") + ".*",
                      "i"
                    ),
                  },
                ],

                $expr: {
                  $in: [
                    "$_id",
                    {
                      $cond: {
                        if: { $isArray: "$$likeid" },
                        then: "$$likeid",
                        else: [],
                      },
                    },
                  ],

                },
                isdeleted: { $ne: true },
              },
            },
            {
              $project: {
                _id: 0,
                userId: 1,
                firstName: 1,
                lastName: 1,
                userName: 1,
                accountType: 1,
                userRating: 1,
                profile_image: { $ifNull: ["$profile_image", ""] },
                userRating: 1,
              },
            },
          ],
        },
      },
      {
        $project: {
          //like : 1,
          Likedata: 1,
          totalcheers: {
            $cond: {
              if: { $isArray: "$Likedata" },
              then: { $size: "$Likedata" },
              else: 0,
            },
          },
        }
      }
    ];
    PostModel.aggregate(query, (err, postLike) => {
      if (err) {
        throw err;
      } else if (_.isEmpty(postLike)) {
        response.setError(AppCode.NoMenuFound);
        response.send(res);
      } else {
        response.setData(AppCode.Success, postLike[0]);
        response.send(res);
      }
    });
  } catch (exception) {
    console.log(exception)
    response.setError(AppCode.InternalServerError);
    response.send(res);
  }
}
/*
 *Get comment list of post
 */
PostCtrl.commentListForHomePage = (req, res) => {
  const response = new HttpRespose();
  if (!!req.query.postId) {
    let data = {};
    let condition = {};
    let pageNumber = !!req.query.pageNumber ? req.query.pageNumber : 0;
    //let userId = ObjectID(req.payload.userId);
    condition._id = ObjectID(req.query.postId);
    const limit = 10000;
    const skip = limit * parseInt(pageNumber);
    // let offset = !!req.query.recordsOffset ? parseInt(req.query.recordsOffset) : 0;
    // let recordsPerPage = !!req.query.recordsPerPage ? parseInt(req.query.recordsPerPage) : 5;

    // here, sort1 and sort2 are taken for web for get data from last to up and as per assending
    let sort1 = -1;
    let sort2 = 1;

    if (!!req.query.sort && parseInt(req.query.sort) === 1) {
      //This condition used for mobile developer for get comment list in oldest to lates for infinite scroll pagingation
      sort1 = 1;
      sort2 = 1;
    }

    async.parallel(
      [
        function (cb) {
          //get list of comments
          PostModel.aggregate(
            [
              {
                $match: condition,
              },

              {
                $unwind: {
                  path: "$comment",
                },
              },
              {
                $lookup: {
                  from: "user",
                  localField: "comment.userId",
                  foreignField: "_id",
                  as: "comment.user_id",
                },
              },
              {
                $unwind: {
                  path: "$comment.user_id",
                  preserveNullAndEmptyArrays: true,
                },
              },
              {
                $unwind: {
                  path: "$comment.reply",
                  preserveNullAndEmptyArrays: true,
                },
              },
              {
                $lookup: {
                  from: "user",
                  localField: "comment.reply.userId",
                  foreignField: "_id",
                  as: "comment.reply.user_id",
                },
              },
              {
                $unwind: {
                  path: "$comment.reply.user_id",
                  preserveNullAndEmptyArrays: true,
                },
              },
              {
                $project: {
                  comment: "$comment",
                  _id: "$comment.reply._id",
                  text: "$comment.reply.text",
                  updatedAt: "$comment.reply.updatedAt",
                  userId: "$comment.reply.user_id._id",
                  userName: "$comment.reply.user_id.userNam",
                  firstName: "$comment.reply.user_id.firstName",
                  lastName: "$comment.reply.user_id.lastName",
                  accountType: "$comment.reply.user_id.accountType",
                  profile_image: "$comment.reply.user_id.profile_image",
                  userRating: { $ifNull: ["$comment.reply.user_id.userRating", 0] },
                  totalReply: {
                    $cond: {
                      if: { $isArray: "$comment.reply" },
                      then: { $size: "$comment.reply" },
                      else: 0,
                    },
                  },
                },
              },
              { $sort: { updatedAt: sort1 } },
              {
                $group: {
                  _id: "$comment._id",
                  text: { $first: "$comment.text" },
                  updatedAt: { $first: "$comment.updatedAt" },
                  userId: { $first: "$comment.user_id._id" },
                  userName: { $first: "$comment.user_id.userName" },
                  firstName: { $first: "$comment.user_id.firstName" },
                  lastName: { $first: "$comment.user_id.lastName" },
                  accountType: { $first: "$comment.user_id.accountType" },
                  profile_image: { $first: "$comment.user_id.profile_image" },
                  userRating: { $first: "$comment.user_id.userRating" },
                  totalReply: {
                    $first: {
                      $cond: {
                        if: { $isArray: "$comment.reply" },
                        then: { $size: "$comment.reply" },
                        else: 0,
                      },
                    },
                  },
                  reply: {
                    $push: {
                      _id: "$comment.reply._id",
                      text: "$comment.reply.text",
                      updatedAt: "$comment.reply.updatedAt",
                      userId: "$comment.reply.user_id._id",
                      userName: "$comment.reply.user_id.userName",
                      firstName: "$comment.reply.user_id.firstName",
                      lastName: "$comment.reply.user_id.lastName",
                      accountType: "$comment.reply.user_id.accountType",
                      profile_image: "$comment.reply.user_id.profile_image",
                      userRating: "$comment.reply.user_id.userRating",
                    },
                  },
                },
              },
              {
                $addFields: {
                  reply: {
                    $filter: {
                      input: "$reply",
                      as: "r",
                      cond: {
                        $ne: ["$$r", {}],
                      },
                    },
                  },
                },
              },
              {
                $project: {
                  _id: 1,
                  text: 1,
                  updatedAt: 1,
                  userId: 1,
                  userName: 1,
                  firstName: 1,
                  lastName: 1,
                  accountType: 1,
                  profile_image: 1,
                  userRating : { $ifNull: ["$userRating", 0] },
                  totalReply: {
                    $cond: {
                      if: { $isArray: "$reply" },
                      then: { $size: "$reply" },
                      else: 0,
                    },
                  },
                  reply: 1,
                },
              },
              { $sort: { updatedAt: sort1 } },
              { $skip: skip },
              { $limit: limit },
              { $sort: { updatedAt: sort2 } },
            ],
            function (err, comment) {
              if (err) {
                cb(err);
                // AppCode.Fail.error = err.message;
                // response.setError(AppCode.Fail);
                // response.send(res);
              } else {
                data.comment = comment;
                cb(null);
              }
            }
          );
        },
        function (cb) {
          //get counter of total comments
          PostModel.aggregate(
            [
              {
                $match: condition,
              },
              {
                $project: {
                  totalComment: {
                    $cond: {
                      if: { $isArray: "$comment" },
                      then: { $size: "$comment" },
                      else: 0,
                    },
                  },
                },
              },
            ],
            function (err, posts) {
              if (err) {
                cb(err);
              } else {
                data.totalComment =
                  !!posts && posts.length > 0 ? posts[0].totalComment : 0;
                if (data.totalComment > skip + limit) {
                  data.nextPage = parseInt(pageNumber) + 1;
                }
                cb(null);
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
          response.setData(AppCode.Success, data);
          response.send(res);
        }
      }
    );
  } else {
    response.setData(AppCode.MissingParameter, {});
    response.send(res);
  }
};

PostCtrl.postDelete = (req, res) => {
  const response = new HttpRespose();
  var bodyData = req.body;
  if (!!req.auth) {
    if (!!bodyData.postId) {
      try {
        var Id = ObjectID(req.body.postId);
        let query = { _id: Id };
        PostModel.findOne(query, function (err, post) {
          if (err) {
            //TODO: Log the error here
            AppCode.Fail.error = err.message;
            response.setError(AppCode.Fail);
            response.send(res);
          } else {
            if (post === null) {
              response.setError(AppCode.NoDataFoundFound);
              response.send(res);
            } else {
              PostModel.deletePost(
                { _id: Id },
                { $set: { isDeleted: true } },
                function (err, post) {
                  if (err) {
                    AppCode.Fail.error = err.message;
                    response.setError(AppCode.Fail);
                  } else if (
                    post == undefined ||
                    (post.matchedCount === 0 && post.modifiedCount === 0)
                  ) {
                    response.setError(AppCode.NoPostFound);
                  } else {
                    response.setData(AppCode.Success, Id);
                  }
                  response.send(res);
                }
              );
            }
          }
        });
      } catch (exception) {
        AppCode.Fail.error =
          "Oops! something went wrong, please try again later";
        response.setError(AppCode.Fail);
        response.send(exception);
      }
    } else {
      response.setError(AppCode.MissingParameter);
      response.send(res);
    }
  } else {
    response.setError(AppCode.LoginAgain);
    response.send(res);
  }
};

const sendToTopics = (
  msges,
  title,
  type,
  postId,
  tokens,
  res
) => {
  console.log("In send message", msges);
  var message = {
    notification: {
      body: msges,
      title: title,
    },
    data: {
      message: msges,
      type: type,
      postId: postId,
    },
    // Apple specific settings
    apns: {
      headers: {
        "apns-priority": "10",
      },
      payload: {
        aps: {
          sound: "default",
        },
      },
    },
    token: tokens,
  };

  admin
    .messaging()
    .send(message)
    .then((response) => {
      // Response is a message ID string.
      console.log("Successfully sent message:", response);
    })
    .catch((error) => {
      console.log("Error sending message:", error);
    });
};

module.exports = PostCtrl;
