let storyCtrl = {};
const HttpRespose = require("./../../common/httpResponse");
const AppCode = require("../../common/constant/appCods");
const path = require("path");
const fs = require("fs");
const url = require("url"); 
const async = require("async");
const ffmpeg = require('fluent-ffmpeg');
const StoryModel = new (require("./../../common/model/storyModel")).Story();
const PhotoModel = new (require("./../../common/model/photoModel")).Photo();
const HashTagModel = new (require("./../../common/model/HashTagModel"))();

const ObjectID = require("mongodb").ObjectID;
const CONFIG = require("./../../config");
const _ = require("lodash");
const AWS = require('aws-sdk');
//const storyModel = require("./../../common/model/storyModel");
//const AWS_ACCESS_KEY_ID = CONFIG.UPLOADS_BUCKET.accessKeyId;
//const storyModel = require("./../../common/model/storyModel");

//const spacesEndpoint = new AWS.Endpoint(CONFIG.UPLOADS_BUCKET.spacesEndpoint);
// const accessKeyId = CONFIG.UPLOADS_BUCKET.accessKeyId;
// const signedUrlExpireSeconds = 60 * 5
// const s3 = new AWS.S3({
//     //endpoint: spacesEndpoint,
//     accessKeyId: accessKeyId,
//     region: "us-east-2",
//     secretAccessKey: CONFIG.UPLOADS_BUCKET.secretAccessKey,
//     rejectUnauthorized: false
// });
//EMP Info Save API
storyCtrl.create = (req, res) => {
    var response = new HttpRespose();
    var data = req.body;
    
   
    if (!!req.files.storyImages) {
      data.storyImages = req.files.storyImages[0].filename;
    }
  
    console.log("--------------------", data.storyImages);
    StoryModel.findOne({}, (err, empInfo) => {
      if (err) {
        console.log(err);
        response.setError(AppCode.Fail);
        response.send(res);
      } else {
        
          StoryModel.create(data, (err, storyData) => {
            if (err) {
              console.log(err);
              response.setError(AppCode.Fail);
              response.send(res);
            } else {
              response.setData(AppCode.Success, storyData);
              response.send(res);
            }
          });
        
      }
    });
};


  /*
*Get story list for User
*/
storyCtrl.getStoryListData = (req, res) => {
    const response = new HttpRespose();
    var data = {};
    data.story = [];

    if (!!req.auth && !!req.auth._id) {
        let condition = {};
        let followerCondition = {};
        let connectionCondition = {};

        let userId = ObjectID(req.auth._id);
        let options = {};
        options.limit = !!req.query.recordsPerPage ? parseInt(req.query.recordsPerPage) : 10;
        options.skip = !!req.query.recordsOffset ? parseInt(req.query.recordsOffset) : 0;

        async.waterfall([
            function (callback) {
                getUserFollowerData(userId).then((followers) => {
                    const followerIds = [];
                    _.forEach(followers, (follower) => {
                        followerIds.push(ObjectID(follower.user_id));
                    });
                    callback(null, followerIds);
                });
            },

            function (followerIds, callback) {
                getUserConnectionsData(userId).then((connections) => {

                    const connectionsIds = [];
                    _.forEach(connections, (connection) => {
                        connectionsIds.push(ObjectID(connection.connectionId));
                    });
                    callback(null, followerIds, connectionsIds);
                });
            },

            function (followerIds, connectionsIds, callback) {
                condition["$and"] = [
                    // { status: 1 },
                    { "isDeleted": { $ne: true } },
                    { "createdAt": { $gt: new Date(Date.now() - 23 * 60 * 60 * 1000) } }
                ];

                condition["$and"].push({
                    "$or": [
                        { user_id: { $in: followerIds } },
                        { user_id: { $in: connectionsIds } }
                    ]
                });


                let conditionQuery = [
                    {
                        $match: condition
                    },
                    {
                        $lookup: {
                            from: "user",
                            localField: "user_id",
                            foreignField: "masterUserId",
                            as: "user_id"
                        }
                    },
                    {
                        "$unwind": {
                            "path": "$user_id",
                            "preserveNullAndEmptyArrays": true
                        }
                    },
                    {
                        $lookup: {
                            from: "photo",
                            localField: "user_id.profileImageId",
                            foreignField: "_id",
                            as: "user_id.profileImageId"
                        }
                    },
                    {
                        "$unwind": {
                            "path": "$user_id.profileImageId",
                            "preserveNullAndEmptyArrays": true
                        }
                    },
                    {
                        "$unwind": {
                            "path": "$storyData",
                            "preserveNullAndEmptyArrays": true
                        }
                    },
                    {
                        '$project': {
                            "user_id": {
                                _id: "$user_id.masterUserId", name: 1, accountType: 1, profileHeader: 1, profileImage: { $ifNull: ["$user_id.profileImageId.photo_name", CONFIG.DEFAULT_PROFILE_PHOTO] },
                                relationshipStatus: {
                                    $cond: {
                                        if: { $eq: ["$user_id.relationshipStatus", 1] }, then: "Single",
                                        else: {
                                            $cond: { if: { $eq: ["$user_id.relationshipStatus", 2] }, then: "Commited", else: "Single" }
                                        }
                                    }
                                }
                            },
                            "storyData": 1,
                            "createdAt": 1
                        }
                    },

                    {
                        "$lookup": {
                            "from": "user",
                            "as": "storyData.taguser",
                            "let": { "taguser": "$storyData.taguser" },
                            "pipeline": [
                                { "$match": { "$expr": { "$in": ["$masterUserId", { $cond: { if: { $isArray: "$$taguser" }, then: "$$taguser", else: [] } }] } } },
                                {
                                    "$lookup": {
                                        "from": "photo",
                                        "let": { "profileImageId": "$profileImageId" },
                                        "pipeline": [
                                            { "$match": { "$expr": { "$eq": ["$_id", "$$profileImageId"] } } },
                                        ],
                                        "as": "profileImageId",
                                    }
                                },
                                {
                                    "$unwind": {
                                        "path": "$profileImageId",
                                        "preserveNullAndEmptyArrays": true
                                    }
                                },
                                {
                                    "$project": {
                                        _id: 1,
                                        masterUserId: 1,
                                        name: 1,
                                        profileImage: { $ifNull: ['$profileImageId.photo_name', CONFIG.DEFAULT_PROFILE_PHOTO] }
                                    }
                                }
                            ],

                        }
                    },
                    {
                        "$lookup": {
                            "from": "photo",
                            "as": "storyData.media",
                            "let": { "photoId": "$storyData.mediaId" },
                            "pipeline": [
                                {
                                    "$match": {
                                        "$expr": {
                                            $eq: ["$_id", "$$photoId"]
                                        }
                                    }
                                },
                                {
                                    "$project": {
                                        "_id": 1,
                                        "path": "$photo_name",
                                        "video_screenshot": 1,
                                        "type": {
                                            $cond: {
                                                if: { $eq: ["$type", 'video'] }, then: "video",
                                                else: "photo"
                                            }
                                        },
                                    }
                                }
                            ]
                        }
                    },
                    { $unwind: '$storyData' },
                    {
                        $group: {
                            _id: "$user_id._id",
                            "userData": {
                                "$first": "$user_id"
                            },
                            "storyData": {
                                $push: {
                                    media: "$storyData.media",
                                    taguser: "$storyData.taguser",
                                    content: "$storyData.content",
                                    hashtag: "$storyData.hashtag",
                                    createdAt: "$createdAt",
                                    storyId: "$_id"
                                }
                            }
                        }
                    },
                ];
                callback(null, conditionQuery);
            },
            function (conditionQuery, callback) {
                async.parallel([
                    function (cb) {
                        //Get records / documents for original post list
                        //console.log("conditionQueryconditionQueryconditionQuery:",JSON.stringify(conditionQuery, null, 4));
                        StoryModel.advancedAggregate(conditionQuery, options, function (err, story) {
                            if (err) {
                                cb(err);
                            } else {
                                //data.posts = posts;
                                data.story = data.story.concat(story);
                                cb(null);
                            }
                        });
                    },
                    function (cb) {

                        StoryModel.advancedAggregate(conditionQuery, {}, (err, story) => {
                            if (err) {
                                throw err;
                            } else {
                                if (!data.searchKey) {
                                    data.recordsTotal = story.length;
                                }
                                cb(null);
                            }
                        });
                    },
                ], function (err) {
                    if (err) {
                        callback(err);
                    } else {
                        callback(null);
                    }
                });
            }
        ], function (err) {
            if (err) {
                AppCode.Fail.error = err.message;
                response.setError(AppCode.Fail);
                response.send(res);
            } else {
                //console.log("datadatadatadatadata;",JSON.stringify(data,null,4));
                response.setData(AppCode.Success, data);
                response.send(res);
            }
        });

    }
    else {
        response.setData(AppCode.LoginAgain, {});
        response.send(res);
    }
};

/*
*Get story list for User
*/
storyCtrl.getStoryUserList = (req, res) => {
    const response = new HttpRespose();
    var data = {};
    data.story = [];

    if (!!req.payload && !!req.payload._id) {
        let condition = {};
        let userId = ObjectID(req.payload._id);
        let options = {};
        options.limit = !!req.query.recordsPerPage ? parseInt(req.query.recordsPerPage) : 10;
        options.skip = !!req.query.recordsOffset ? parseInt(req.query.recordsOffset) : 0;

        async.waterfall([
            function (callback) {
                getUserFollowerData(userId).then((followers) => {
                    const followerIds = [];
                    _.forEach(followers, (follower) => {
                        followerIds.push(ObjectID(follower.user_id));
                    });
                    callback(null, followerIds);
                });
            },

            function (followerIds, callback) {
                getUserConnectionsData(userId).then((connections) => {

                    const connectionsIds = [];
                    _.forEach(connections, (connection) => {
                        connectionsIds.push(ObjectID(connection.connectionId));
                    });
                    callback(null, followerIds, connectionsIds);
                });
            },

            function (followerIds, connectionsIds, callback) {
                condition["$and"] = [
                    // { status: 1 },
                    { "isDeleted": { $ne: true } },
                    { "createdAt": { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
                ];

                condition["$and"].push({
                    "$or": [
                        { user_id: { $in: followerIds } },
                        { user_id: { $in: connectionsIds } }
                    ]
                });


                let conditionQuery = [
                    {
                        $match: condition
                    },
                    {
                        $lookup: {
                            from: "user",
                            localField: "user_id",
                            foreignField: "masterUserId",
                            as: "user_id"
                        }
                    },
                    {
                        "$unwind": {
                            "path": "$user_id",
                            "preserveNullAndEmptyArrays": true
                        }
                    },
                    {
                        $lookup: {
                            from: "photo",
                            localField: "user_id.profileImageId",
                            foreignField: "_id",
                            as: "user_id.profileImageId"
                        }
                    },
                    {
                        "$unwind": {
                            "path": "$user_id.profileImageId",
                            "preserveNullAndEmptyArrays": true
                        }
                    },
                    {
                        '$project': {
                            "user_id": {
                                _id: "$user_id.masterUserId", name: 1, accountType: 1, profileHeader: 1, profileImage: { $ifNull: ["$user_id.profileImageId.photo_name", CONFIG.DEFAULT_PROFILE_PHOTO] },
                                relationshipStatus: {
                                    $cond: {
                                        if: { $eq: ["$user_id.relationshipStatus", 1] }, then: "Single",
                                        else: {
                                            $cond: { if: { $eq: ["$user_id.relationshipStatus", 2] }, then: "Commited", else: "Single" }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    {
                        $group: {
                            _id: "$user_id._id",
                            "userData": {
                                "$first": "$user_id"
                            },
                        }
                    },
                ];
                callback(null, conditionQuery);
            },
            function (conditionQuery, callback) {
                async.parallel([
                    function (cb) {
                        //Get records / documents for original post list
                        //console.log("conditionQueryconditionQueryconditionQuery:",JSON.stringify(conditionQuery, null, 4));
                        StoryModel.advancedAggregate(conditionQuery, options, function (err, story) {
                            if (err) {
                                cb(err);
                            } else {
                                //data.posts = posts;
                                data.story = data.story.concat(story);
                                cb(null);
                            }
                        });
                    },
                    function (cb) {

                        StoryModel.advancedAggregate(conditionQuery, {}, (err, story) => {
                            if (err) {
                                throw err;
                            } else {
                                if (!data.searchKey) {
                                    data.recordsTotal = story.length;
                                }
                                cb(null);
                            }
                        });
                    },
                ], function (err) {
                    if (err) {
                        callback(err);
                    } else {
                        callback(null);
                    }
                });
            }
        ], function (err) {
            if (err) {
                AppCode.Fail.error = err.message;
                response.setError(AppCode.Fail);
                response.send(res);
            } else {
                //console.log("datadatadatadatadata;",JSON.stringify(data,null,4));
                response.setData(AppCode.Success, data);
                response.send(res);
            }
        });

    }
    else {
        response.setData(AppCode.LoginAgain, {});
        response.send(res);
    }
};


module.exports = storyCtrl;