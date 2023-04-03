let storyCtrl = {};
const HttpRespose = require("./../../common/httpResponse");
const AppCode = require("../../common/constant/appCods");

const fs = require("fs");
const url = require("url");
const async = require("async");

const StoryModel = new (require("./../../common/model/storyModel")).Story();
const PhotoModel = new (require("./../../common/model/photoModel")).Photo();
const HashTagModel = new (require("./../../common/model/HashTagModel"))();
const UserModel = new (require("./../../common/model/userModel"))();

const ObjectID = require("mongodb").ObjectID;
const CONFIG = require("./../../config");
const _ = require("lodash");
const AWS = require('aws-sdk');
const storyModel = require("./../../common/model/storyModel");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffmpeg = require('fluent-ffmpeg');
const ffprobePath = require("ffprobe-static").path;
const path = require("path");
const imageThumbnail = require("image-thumbnail");
const { resolve } = require("path");
const { reject } = require("lodash");
const userModel = require("./../../common/model/userModel");
let options = { width: 100, height: 100, responseType: 'base64', jpegOptions: { force: true, quality: 90 } }
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

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


// storyCtrl.create = (req, res) => {
//     var response = new HttpRespose();
//     var data = req.body;


//     if (!!req.files.storyImages) {
//       data.storyImages = req.files.storyImages[0].filename;
//     }
//     if (!!req.body.userId) {
//         data.userId = ObjectID(req.body.userId)
//       }

//     console.log("--------------------", data.storyImages);
//     StoryModel.findOne({}, (err, empInfo) => {
//       if (err) {
//         console.log(err);
//         response.setError(AppCode.Fail);
//         response.send(res);
//       } else {

//           StoryModel.create(data, (err, storyData) => {
//             if (err) {
//               console.log(err);
//               response.setError(AppCode.Fail);
//               response.send(res);
//             } else {
//               response.setData(AppCode.Success, storyData);
//               response.send(res);
//             }
//           });

//       }
//     });
// };

// - not use
// stroy saved in photo , video folder with photo and video body parameteres - not use
storyCtrl.createold = (req, res) => {
    const response = new HttpRespose();

    let result = []
    if (!!req.auth._id) {
        const data = req.body;
        console.log("********************", data)
        data.createdBy = ObjectID(req.auth._id);

        var userId = ObjectID(req.auth._id);

        const filesArr = req.files;
        const dateTimeData = Date.now();
        async.waterfall([
            function (cb) {


                // convert video to mp4 if required
                if (!!filesArr.videos) {
                    for (let i = 0; i < filesArr.videos.length; i++) {
                        let file = filesArr.videos[i];

                        console.log("@@@@@@@@@@@@@@@@@@@@@@", file)

                        //For takes screen shot
                        let VideoNameForScreenShot = file.filename;
                        let VideoNameForScreenShotWithPath = CONFIG.UPLOADS.DIR_PATH_VIDEOS + VideoNameForScreenShot;
                        console.log("VideoNameForScreenShotWithPath", VideoNameForScreenShotWithPath);
                        ffmpeg(VideoNameForScreenShotWithPath)
                            .on('end', function () {
                                console.log("Processing finished successfully");
                                const localUrl =
                                    CONFIG.UPLOADS.DIR_PATH_PHOTOS +
                                    VideoNameForScreenShot.split(".")[0] +
                                    ".png";

                                const fileContent = fs.readFileSync(localUrl);

                                let videoscreenshitthumbnailKey =
                                    CONFIG.UPLOADS.DIR_PATH_PHOTOS +
                                    "thumb-" +
                                    VideoNameForScreenShot.split(".")[0] +
                                    ".png";
                                console.log("---------thumbnailKey----------", videoscreenshitthumbnailKey)

                                imageThumbnail(fileContent)
                                    .then((thumbnail) => {
                                        console.log(thumbnail)
                                        const buffer = Buffer.from(thumbnail, "base64");
                                        fs.writeFileSync(videoscreenshitthumbnailKey, buffer);


                                        //   var thumbParams = {
                                        //     Bucket: CONFIG.UPLOADS_BUCKET.bucketName,
                                        //     Key:
                                        //       CONFIG.S3UPLOADS.DIR_PATH_POST_PHOTOS +
                                        //       dateTimeData +
                                        //       "Thumb" +
                                        //       VideoNameForScreenShot.split(".")[0] +
                                        //       ".jpg",
                                        //     ACL: "public-read",
                                        //     Body: thumbnail, //got buffer by reading file path
                                        //   };
                                        //   s3.putObject(thumbParams, function (err, data) {
                                        //     console.log(err, data);
                                        //   });
                                        if ((filesArr.videos.length - 1) == i) {
                                            cb(null);
                                        }

                                    })
                                    .catch((err) => console.error(err));


                                console.log('Screenshots taken');
                            })

                            .on('error', function (err) {
                                console.error("**********", err);
                            })
                            .screenshots({
                                // Will take screenshots at 20%, 40%, 60% and 80% of the video if increase count 1 to 4
                                count: 1,
                                folder: CONFIG.UPLOADS.DIR_PATH_PHOTOS,
                                filename: VideoNameForScreenShot.split(".")[0] + '.png'
                            });


                    }
                }
                else {
                    cb(null);
                }



            },
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
                        data.media.documents = {};

                    }
                    data.media.photos.files = [];
                    data.media.videos.files = [];
                    data.documents = {};
                    data.media.documents.files = [];


                    for (let filesArrKey in filesArr) {
                        let files = filesArr[filesArrKey];
                        for (let filesKey in files) {
                            let file = files[filesKey];

                            console.log("filefilefilefilefile", file);


                            if (file.fieldname === "documents") {
                                // data.documents.files.push(
                                //   "http://" + req.hostname + "/uploads/" + file.filename
                                // );
                                //data.documents.files.push(file.filename);
                                data.media[file.fieldname].files.push({ filename: file.filename, originalname: file.originalname, mimetype: file.mimetype, ext: file.filename.split(".")[1], size: file.size });
                            } else if (file.fieldname === "photos") {
                                let isSquareImage = false;
                                let thumbnailName =
                                    filesArr[filesArrKey][filesKey].filename;
                                console.log("-------thumbnailName------------", thumbnailName)

                                let thumbnailKey =
                                    CONFIG.UPLOADS.DIR_PATH_PHOTOS +
                                    "thumb-" +
                                    thumbnailName.split(".")[0] +
                                    ".png";
                                console.log("---------thumbnailKey----------", thumbnailKey)



                                // const fileContent = fs.readFileSync(thumbnailKey);

                                imageThumbnail(file.path)
                                    .then((thumbnail) => {
                                        console.log("thumbnailthumbnail", thumbnail)

                                        const buffer = Buffer.from(thumbnail, "base64");
                                        fs.writeFileSync(thumbnailKey, buffer);



                                        // var thumbParams = {
                                        //     Bucket: CONFIG.UPLOADS_BUCKET.bucketName,
                                        //     Key:
                                        //         CONFIG.S3UPLOADS.DIR_PATH_POST_PHOTOS +
                                        //         dateTimeData +
                                        //         "Thumb" +
                                        //         VideoNameForScreenShot.split(".")[0] +
                                        //         ".jpg",
                                        //     ACL: "public-read",
                                        //     Body: thumbnail, //got buffer by reading file path
                                        // };
                                        // s3.putObject(thumbParams, function (err, data) {
                                        //     console.log(err, data);
                                        // });
                                    })
                                    .catch((err) => console.error(err));


                                console.log("dateTimeData", dateTimeData)


                                data.media[file.fieldname].files.push({ filename: file.filename, thumbnail: thumbnailKey, originalname: file.originalname, size: file.size });
                            } else if (file.fieldname === "videos") {
                                // data.media[file.fieldname].files.push(
                                //   "http://" + req.hostname + "/uploads/" + file.filename
                                // );
                                data.media[file.fieldname].files.push({ filename: file.filename, originalname: file.originalname, size: file.size });
                                //data.media[file.fieldname].files.push(file.filename);
                            }
                        }
                    }
                }
                //console.log("Before", data.documents.files)



                cb(null);
            },
            function (cb) {

                if (!!data.media && !!data.media.photos && !!data.media.photos.files && data.media.photos.files.length > 0) {
                    let photosData = [];
                    //console.log("All data.tags >>>>>>>>>> :",data.tags);
                    data.media.photos.files.map((obj, index) => {
                        console.log("&&&&&&&&&&&&&&&&&&&", obj);

                        let thumbnailName =
                            obj.filename;
                        console.log("-------thumbnailName------------", thumbnailName)

                        let thumbnailKeyy =
                            "thumb-" +
                            thumbnailName.split(".")[0] +
                            ".png";
                        console.log("---------thumbnailKey----------", thumbnailKeyy)

                        var currentTime = new Date();
                        var expiredAt;
                        currentTime.setHours(currentTime.getHours() + 24);
                        expiredAt = new Date(currentTime)



                        photosData[index] = { photo_name: obj.filename, originalname: obj.originalname, size: obj.size, thumbnail: thumbnailKeyy, createdBy: ObjectID(req.auth._id), type: 1, status: 1, createdAt: new Date(), expiredAt: expiredAt, userId: ObjectID(req.auth._id) };

                    });

                    //console.log("photosDataphotosDataphotosDataphotosData:",photosData);

                    data.media.photos.files = [];

                    StoryModel.createMany(photosData, function (err, photos) {
                        if (err) {
                            //TODO: Log the error here
                            cb(err);
                        } else {
                            console.log("here photos result after insert : ", photos);
                            photos.forEach(element => {
                                result.push(element)

                            });

                            cb(null);

                        }
                    });
                } else {
                    data.media.photos.files = [];
                    //for remove previoust set tags and productInfo for remove form news feed
                    delete data.tags;
                    delete data.productInfo;
                    cb(null);
                }
            },

            function (cb) {
                //Store videos in video model
                //console.log("new videos data :",data.media.videos.files);

                if (!!data.media && !!data.media.videos && !!data.media.videos.files && data.media.videos.files.length > 0) {
                    let videosData = [];
                    data.media.videos.files.map((obj, index) => {
                        let video_screenshot = obj.filename.split(".")[0] + ".png";
                        video_screenshot = video_screenshot.split("/");
                        video_screenshot = video_screenshot[video_screenshot.length - 1];

                        let thumbnails = "thumb-" + obj.filename.split(".")[0] + ".png";

                        var currentTime = new Date();
                        var expiredAt;
                        currentTime.setHours(currentTime.getHours() + 24);
                        expiredAt = new Date(currentTime)
                        videosData[index] = { video_name: obj.filename, video_screenshot: video_screenshot, thumbnail: thumbnails, size: obj.size, status: 1, originalname: obj.originalname, type: 2, createdBy: ObjectID(req.auth._id), createdAt: new Date(), expiredAt: expiredAt, userId: ObjectID(req.auth._id) };
                    });

                    //console.log("videosDatavideosDatavideosDatavideosDatavideosData:",videosData);

                    data.media.videos.files = [];

                    StoryModel.createMany(videosData, function (err, videos) {
                        if (err) {
                            //TODO: Log the error here
                            cb(err);
                        } else {
                            console.log("here videos result after insert : ", videos);
                            videos.forEach(element => {
                                result.push(element)

                            });

                            cb(null);

                        }
                    });
                } else {
                    data.media.videos.files = [];
                    cb(null);
                }
            },
            function (cb) {

                if (!!data.media && !!data.media.documents && !!data.media.documents.files && data.media.documents.files.length > 0) {
                    console.log("***********");
                    let documentsData = [];
                    //console.log("All data.tags >>>>>>>>>> :",data.tags);
                    data.media.documents.files.map((obj, index) => {
                        var currentTime = new Date();
                        var expiredAt;
                        currentTime.setHours(currentTime.getHours() + 24);
                        expiredAt = new Date(currentTime)

                        documentsData[index] = { document_name: obj.filename, originalname: obj.originalname, size: obj.size, createdBy: ObjectID(req.auth._id), type: 3, status: 1, createdAt: new Date(), expiredAt: expiredAt, userId: ObjectID(req.auth._id) };

                    });

                    console.log("documentsDatadocumentsDatadocumentsDatadocumentsData:", documentsData);

                    data.media.documents.files = [];

                    StoryModel.createMany(documentsData, function (err, document) {
                        if (err) {
                            console.log("errrrrrrrrr", err);
                            //TODO: Log the error here
                            cb(err);
                        } else {
                            console.log("here document result after insert : ", document);
                            document.forEach(element => {
                                result.push(element)

                            });

                            cb(null);

                        }
                    });
                } else {
                    data.media.documents.files = [];



                    cb(null);
                }
            },

        ], function (err) {
            if (err) {
                console.log("ddddddddddddddddddddddddddddd", err);
                AppCode.Fail.error = err.message;
                response.setError(AppCode.Fail);
                response.send(res);
            } else {
                console.log("resultresultresultresult", result);
                response.setData(AppCode.Success, result);
                response.send(res);
                //result=[]

            }
        });
    } else {
        response.setData(AppCode.PleaseLoginAgain, {});
        response.send(res);
    }

};


//story photo video saved in storyphotos , storyvideos folders with storyphotos , storyvideos body parameters
storyCtrl.create = (req, res) => {
    const response = new HttpRespose();

    let result = []
    if (!!req.auth._id) {
        const data = req.body;
        console.log("********************", data)
        data.createdBy = ObjectID(req.auth._id);

        var userId = ObjectID(req.auth._id);

        const filesArr = req.files;
        const dateTimeData = Date.now();
        async.waterfall([
            function (cb) {


                // convert video to mp4 if required
                if (!!filesArr.storyvideos) {
                    for (let i = 0; i < filesArr.storyvideos.length; i++) {
                        let file = filesArr.storyvideos[i];

                        console.log("@@@@@@@@@@@@@@@@@@@@@@", file)

                        //For takes screen shot
                        let VideoNameForScreenShot = file.filename;
                        let VideoNameForScreenShotWithPath = CONFIG.UPLOADS.DIR_PATH_STORYVIDEOS + VideoNameForScreenShot;
                        console.log("VideoNameForScreenShotWithPath", VideoNameForScreenShotWithPath);
                        ffmpeg(VideoNameForScreenShotWithPath)
                            .on('end', function () {
                                console.log("Processing finished successfully");
                                const localUrl =
                                    CONFIG.UPLOADS.DIR_PATH_STORYPHOTOS +
                                    VideoNameForScreenShot.split(".")[0] +
                                    ".png";

                                const fileContent = fs.readFileSync(localUrl);

                                let videoscreenshitthumbnailKey =
                                    CONFIG.UPLOADS.DIR_PATH_STORYPHOTOS +
                                    "thumb-" +
                                    VideoNameForScreenShot.split(".")[0] +
                                    ".png";
                                console.log("---------thumbnailKey----------", videoscreenshitthumbnailKey)

                                imageThumbnail(fileContent)
                                    .then((thumbnail) => {
                                        console.log(thumbnail)
                                        const buffer = Buffer.from(thumbnail, "base64");
                                        fs.writeFileSync(videoscreenshitthumbnailKey, buffer);


                                        //   var thumbParams = {
                                        //     Bucket: CONFIG.UPLOADS_BUCKET.bucketName,
                                        //     Key:
                                        //       CONFIG.S3UPLOADS.DIR_PATH_POST_PHOTOS +
                                        //       dateTimeData +
                                        //       "Thumb" +
                                        //       VideoNameForScreenShot.split(".")[0] +
                                        //       ".jpg",
                                        //     ACL: "public-read",
                                        //     Body: thumbnail, //got buffer by reading file path
                                        //   };
                                        //   s3.putObject(thumbParams, function (err, data) {
                                        //     console.log(err, data);
                                        //   });
                                        if ((filesArr.storyvideos.length - 1) == i) {
                                            cb(null);
                                        }

                                    })
                                    .catch((err) => console.error(err));


                                console.log('Screenshots taken');
                            })

                            .on('error', function (err) {
                                console.error("**********", err);
                            })
                            .screenshots({
                                // Will take screenshots at 20%, 40%, 60% and 80% of the video if increase count 1 to 4
                                count: 1,
                                folder: CONFIG.UPLOADS.DIR_PATH_STORYPHOTOS,
                                filename: VideoNameForScreenShot.split(".")[0] + '.png'
                            });


                    }
                }
                else {
                    cb(null);
                }



            },
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
                        data.media.storyphotos = {};
                        data.media.storyvideos = {};
                        data.media.documents = {};

                    }
                    data.media.storyphotos.files = [];
                    data.media.storyvideos.files = [];
                    data.documents = {};
                    data.media.documents.files = [];


                    for (let filesArrKey in filesArr) {
                        let files = filesArr[filesArrKey];
                        for (let filesKey in files) {
                            let file = files[filesKey];

                            console.log("filefilefilefilefile", file);


                            // if (file.fieldname === "documents") {
                            //     // data.documents.files.push(
                            //     //   "http://" + req.hostname + "/uploads/" + file.filename
                            //     // );
                            //     //data.documents.files.push(file.filename);
                            //     data.media[file.fieldname].files.push({ filename: file.filename, originalname: file.originalname, mimetype: file.mimetype, ext: file.filename.split(".")[1], size: file.size });
                            // } else

                            if (file.fieldname === "storyphotos") {
                                let isSquareImage = false;
                                let thumbnailName =
                                    filesArr[filesArrKey][filesKey].filename;
                                console.log("-------thumbnailName------------", thumbnailName)

                                let thumbnailKey =
                                    CONFIG.UPLOADS.DIR_PATH_STORYPHOTOS +
                                    "thumb-" +
                                    thumbnailName.split(".")[0] +
                                    ".png";
                                console.log("---------thumbnailKey----------", thumbnailKey)



                                // const fileContent = fs.readFileSync(thumbnailKey);

                                imageThumbnail(file.path)
                                    .then((thumbnail) => {
                                        console.log("thumbnailthumbnail", thumbnail)

                                        const buffer = Buffer.from(thumbnail, "base64");
                                        fs.writeFileSync(thumbnailKey, buffer);



                                        // var thumbParams = {
                                        //     Bucket: CONFIG.UPLOADS_BUCKET.bucketName,
                                        //     Key:
                                        //         CONFIG.S3UPLOADS.DIR_PATH_POST_PHOTOS +
                                        //         dateTimeData +
                                        //         "Thumb" +
                                        //         VideoNameForScreenShot.split(".")[0] +
                                        //         ".jpg",
                                        //     ACL: "public-read",
                                        //     Body: thumbnail, //got buffer by reading file path
                                        // };
                                        // s3.putObject(thumbParams, function (err, data) {
                                        //     console.log(err, data);
                                        // });
                                    })
                                    .catch((err) => console.error(err));


                                console.log("dateTimeData", dateTimeData)


                                data.media[file.fieldname].files.push({ filename: file.filename, thumbnail: thumbnailKey, originalname: file.originalname, size: file.size });
                            } else if (file.fieldname === "storyvideos") {
                                // data.media[file.fieldname].files.push(
                                //   "http://" + req.hostname + "/uploads/" + file.filename
                                // );
                                data.media[file.fieldname].files.push({ filename: file.filename, originalname: file.originalname, size: file.size });
                                //data.media[file.fieldname].files.push(file.filename);
                            }
                        }
                    }
                }
                //console.log("Before", data.documents.files)



                cb(null);
            },
            function (cb) {

                if (!!data.media && !!data.media.storyphotos && !!data.media.storyphotos.files && data.media.storyphotos.files.length > 0) {
                    let photosData = [];
                    //console.log("All data.tags >>>>>>>>>> :",data.tags);
                    data.media.storyphotos.files.map((obj, index) => {
                        console.log("&&&&&&&&&&&&&&&&&&&", obj);

                        let thumbnailName =
                            obj.filename;
                        console.log("-------thumbnailName------------", thumbnailName)

                        let thumbnailKeyy =
                            "thumb-" +
                            thumbnailName.split(".")[0] +
                            ".png";
                        console.log("---------thumbnailKey----------", thumbnailKeyy)

                        var currentTime = new Date();
                        var expiredAt;
                        currentTime.setHours(currentTime.getHours() + 24);
                        expiredAt = new Date(currentTime)



                        photosData[index] = { photo_name: obj.filename, originalname: obj.originalname, size: obj.size, thumbnail: thumbnailKeyy, createdBy: ObjectID(req.auth._id), type: 1, status: 1, createdAt: new Date(), expiredAt: expiredAt, userId: ObjectID(req.auth._id) };

                    });

                    //console.log("photosDataphotosDataphotosDataphotosData:",photosData);

                    data.media.storyphotos.files = [];

                    StoryModel.createMany(photosData, function (err, photos) {
                        if (err) {
                            //TODO: Log the error here
                            cb(err);
                        } else {
                            console.log("here photos result after insert : ", photos);
                            photos.forEach(element => {
                                result.push(element)

                            });

                            cb(null);

                        }
                    });
                } else {
                    data.media.storyphotos.files = [];
                    //for remove previoust set tags and productInfo for remove form news feed
                    delete data.tags;
                    delete data.productInfo;
                    cb(null);
                }
            },

            function (cb) {
                //Store videos in video model
                //console.log("new videos data :",data.media.videos.files);

                if (!!data.media && !!data.media.storyvideos && !!data.media.storyvideos.files && data.media.storyvideos.files.length > 0) {
                    let videosData = [];
                    data.media.storyvideos.files.map((obj, index) => {
                        let video_screenshot = obj.filename.split(".")[0] + ".png";
                        video_screenshot = video_screenshot.split("/");
                        video_screenshot = video_screenshot[video_screenshot.length - 1];

                        let thumbnails = "thumb-" + obj.filename.split(".")[0] + ".png";

                        var currentTime = new Date();
                        var expiredAt;
                        currentTime.setHours(currentTime.getHours() + 24);
                        expiredAt = new Date(currentTime)
                        videosData[index] = { video_name: obj.filename, video_screenshot: video_screenshot, thumbnail: thumbnails, size: obj.size, status: 1, originalname: obj.originalname, type: 2, createdBy: ObjectID(req.auth._id), createdAt: new Date(), expiredAt: expiredAt, userId: ObjectID(req.auth._id) };
                    });

                    //console.log("videosDatavideosDatavideosDatavideosDatavideosData:",videosData);

                    data.media.storyvideos.files = [];

                    StoryModel.createMany(videosData, function (err, videos) {
                        if (err) {
                            //TODO: Log the error here
                            cb(err);
                        } else {
                            console.log("here videos result after insert : ", videos);
                            videos.forEach(element => {
                                result.push(element)

                            });

                            cb(null);

                        }
                    });
                } else {
                    data.media.storyvideos.files = [];
                    cb(null);
                }
            },
            // function (cb) {

            //     if (!!data.media && !!data.media.documents && !!data.media.documents.files && data.media.documents.files.length > 0) {
            //         console.log("***********");
            //         let documentsData = [];
            //         //console.log("All data.tags >>>>>>>>>> :",data.tags);
            //         data.media.documents.files.map((obj, index) => {
            //             var currentTime = new Date();
            //             var expiredAt;
            //             currentTime.setHours(currentTime.getHours() + 24);
            //             expiredAt = new Date(currentTime)

            //             documentsData[index] = { document_name: obj.filename, originalname: obj.originalname, size: obj.size, createdBy: ObjectID(req.auth._id), type: 3, status: 1, createdAt: new Date(), expiredAt: expiredAt, userId: ObjectID(req.auth._id) };

            //         });

            //         console.log("documentsDatadocumentsDatadocumentsDatadocumentsData:", documentsData);

            //         data.media.documents.files = [];

            //         StoryModel.createMany(documentsData, function (err, document) {
            //             if (err) {
            //                 console.log("errrrrrrrrr", err);
            //                 //TODO: Log the error here
            //                 cb(err);
            //             } else {
            //                 console.log("here document result after insert : ", document);
            //                 document.forEach(element => {
            //                     result.push(element)

            //                 });

            //                 cb(null);

            //             }
            //         });
            //     } else {
            //         data.media.documents.files = [];



            //         cb(null);
            //     }
            // },

        ], function (err) {
            if (err) {
                console.log("ddddddddddddddddddddddddddddd", err);
                AppCode.Fail.error = err.message;
                response.setError(AppCode.Fail);
                response.send(res);
            } else {
                console.log("resultresultresultresult", result);
                response.setData(AppCode.Success, result);
                response.send(res);
                //result=[]

            }
        });
    } else {
        response.setData(AppCode.PleaseLoginAgain, {});
        response.send(res);
    }

};

/* story See By User  */
storyCtrl.storySeeByUser = (req, res) => {
    const response = new HttpRespose();
    if (!!req.auth._id) {
        try {
            let query = [
                {
                    $match: {
                        $and: [
                            {
                                _id: ObjectID(req.query.storyId)
                            },
                            {
                                storySeeBy: {
                                    $in: [ObjectID(req.auth._id)]
                                }
                            }
                        ]
                    }
                }
            ];
            StoryModel.aggregate(query, (err, storyDat) => {
                if (err) {
                    throw err;
                } else if (_.isEmpty(storyDat)) {


                    let updatedata = {
                        $push: { storySeeBy: ObjectID(req.auth._id) },
                    };

                    StoryModel.addUserId(
                        { _id: ObjectID(req.query.storyId) },
                        updatedata,
                        function (err, updatedata) {
                            if (err) {
                                // response.setError(AppCode.InternalServerError);
                                // response.send(res);
                            } else {
                                response.setData(AppCode.Success);
                                response.send(res);
                            }
                        }
                    );

                } else {
                    response.setData(AppCode.Success);
                    response.send(res);
                }
            });
        } catch (exception) {
            response.setError(AppCode.InternalServerError);
            response.send(res);
        }
    } else {
        response.setData(AppCode.PleaseLoginAgain, {});
        response.send(res);
    }
}

// /* user Story List  aggregate In User Model*/
// storyCtrl.userStoryList = (req, res) => {
//     const response = new HttpRespose();
//     try {
//         let query = [
//             {
//                 $match: {
//                     $and: [
//                         {
//                             status: 1,
//                         },
//                         {
//                             isverified: true
//                         }
//                     ]
//                 }
//             },

//             {
//                 $lookup: {
//                     from: "story",
//                     as: "storyData",
//                     let: { "userId": "$_id" },
//                     pipeline: [
//                         {
//                             $match: {
//                                 $expr: {
//                                     $and: [
//                                         {
//                                             $eq: ["$userId", "$$userId"]
//                                         },
//                                         {
//                                             $lte: ["$createdAt", new Date("2023-03-28T09:21:14.643Z")]
//                                         },
//                                         {
//                                             $gte: ["$expiredAt", new Date("2023-03-28T10:21:14.643Z")]
//                                         },
//                                     ]
//                                 },
//                             }
//                         },
//                         {
//                             $project: {
//                                 photo_name: 1,
//                                 originalname: 1,
//                                 size: 1,
//                                 type: 1,
//                                 createdAt: 1,
//                                 expiredAt: 1,
//                                 userId: 1,
//                                 video_name: 1,
//                                 video_screenshot: 1,
//                                 thumbnail: 1,
//                             }
//                         }
//                     ]
//                 }
//             },
//             {
//                 $project: {
//                     storyData: 1,
//                     "userName": 1
//                 }
//             },
//         ];

//         UserModel.aggregate(query, (err, userStory) => {
//             if (err) {
//                 throw err;
//             } else if (_.isEmpty(userStory)) {

//                 response.setError(AppCode.NotFound);
//                 response.send(res);
//             } else {
//                 response.setData(AppCode.Success, userStory);
//                 response.send(res);
//             }
//         });
//     } catch (exception) {
//         response.setError(AppCode.InternalServerError);
//         response.send(res);
//     }
// }

/* user Story List  aggregate In Story Model*/
storyCtrl.userStoryList = (req, res) => {
    const response = new HttpRespose();
    try {
        let query = [
            {
                $match: {
                    $expr: {
                        $and: [
                            {
                                $lte: ["$createdAt", new Date()]
                            },
                            {
                                $gte: ["$expiredAt", new Date()]
                            },
                        ]
                    },
                }
            },

            {
                $lookup: {
                    from: "user",
                    as: "userData",
                    let: { "userId": "$userId" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$_id", "$$userId"]
                                },
                            }
                        },
                        {
                            $project: {
                                _id: 1,
                                userName: 1,

                            }
                        }
                    ]
                }
            },
            {
                $unwind: {
                    path: "$userData",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $project: {
                    userName: "$userData.userName",
                    userId: "$userData._id",
                    originalname: 1,
                    size: 1,
                    type: 1,
                    createdAt: 1,
                    expiredAt: 1,
                    userId: 1,
                    video_name: 1,
                    video_screenshot: 1,
                    thumbnail: 1,
                }
            },
            {
                $group: {
                    _id: "$userId",
                    userName: { $first: "$userName" },
                    storyModel: { $push: '$$ROOT' }
                }
            }
        ];

        StoryModel.aggregate(query, (err, userStory) => {
            if (err) {
                throw err;
            } else if (_.isEmpty(userStory)) {

                response.setError(AppCode.NotFound);
                response.send(res);
            } else {
                response.setData(AppCode.Success, userStory);
                response.send(res);
            }
        });
    } catch (exception) {
        response.setError(AppCode.InternalServerError);
        response.send(res);
    }
}

/* A list of users who have viewed the story */
storyCtrl.userListByStoryId = (req, res) => {
    const response = new HttpRespose();
    try {
        let query = [
            {
                $match: {
                    _id: ObjectID(req.query.storyId)
                }
            },

            {
                $lookup: {
                    from: "user",
                    as: "userData",
                    let: { "storySeeBy": "$storySeeBy" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $in: ["$_id", { $ifNull: ["$$storySeeBy", []] }],
                                }
                            },
                        },
                        {
                            $project: {
                                userName: 1,
                                _id: 1
                            }
                        }
                    ]
                }
            },
            {
                $project: {
                    userData: 1,
                    "photo_name": 1,
                    "originalname": 1,
                    "thumbnail": 1,
                }
            },
        ];

        StoryModel.aggregate(query, (err, userStory) => {
            if (err) {
                throw err;
            } else if (_.isEmpty(userStory)) {
                response.setError(AppCode.NotFound);
                response.send(res);
            } else {
                let FinalData = {
                    _id: userStory[0]._id,
                    photo_name: userStory[0].photo_name,
                    originalname: userStory[0].originalname,
                    thumbnail: userStory[0].thumbnail,
                    userData: userStory[0].userData,
                    count: userStory.length
                }
                response.setData(AppCode.Success, FinalData);
                response.send(res);
            }
        });
    } catch (exception) {
        response.setError(AppCode.InternalServerError);
        response.send(res);
    }
}



// // - not use
// //Get story list for User
// //half done.
// storyCtrl.getStoryListData = (req, res) => {
//     const response = new HttpRespose();
//     var data = {};
//     data.story = [];

//     if (!!req.auth && !!req.auth._id) {
//         let condition = {};
//         let followerCondition = {};
//         let connectionCondition = {};

//         let user = []
//         user.push(ObjectID(req.auth._id))

//         let userId = ObjectID(req.auth._id);
//         let options = {};
//         options.limit = !!req.query.recordsPerPage ? parseInt(req.query.recordsPerPage) : 10;
//         options.skip = !!req.query.recordsOffset ? parseInt(req.query.recordsOffset) : 0;

//         async.waterfall([
//             // function (callback) {
//             //     getUserFollowerData(userId).then((followers) => {
//             //         const followerIds = [];
//             //         _.forEach(followers, (follower) => {
//             //             followerIds.push(ObjectID(follower.user_id));
//             //         });
//             //         callback(null, followerIds);
//             //     });
//             // },

//             // function (followerIds, callback) {
//             //     getUserConnectionsData(userId).then((connections) => {

//             //         const connectionsIds = [];
//             //         _.forEach(connections, (connection) => {
//             //             connectionsIds.push(ObjectID(connection.connectionId));
//             //         });
//             //         callback(null, followerIds, connectionsIds);
//             //     });
//             // },
//             function (callback) {
//                 getUserConnectionsData(userId).then((connections) => {

//                     const connectionsIds = [];
//                     _.forEach(connections, (connection) => {
//                         connectionsIds.push(ObjectID(connection._id));
//                     });
//                     callback(null, connectionsIds);
//                 });
//             },

//             function (connectionsIds, callback) {
//                 condition["$and"] = [
//                     // { status: 1 },
//                     { "isDeleted": { $ne: true } },
//                     { "createdAt": { $gt: new Date(Date.now() - 23 * 60 * 60 * 1000) } }
//                 ];

//                 condition["$and"].push({
//                     "$or": [
//                         { user_id: { $in: user } },
//                         { user_id: { $in: connectionsIds } }
//                     ]
//                 });


//                 let conditionQuery = [
//                     {
//                         $match: condition
//                     },
//                     {
//                         $lookup: {
//                             from: "user",
//                             localField: "_id",
//                             foreignField: "userId",
//                             as: "user_id"
//                         }
//                     },
//                     {
//                         "$unwind": {
//                             "path": "$user_id",
//                             "preserveNullAndEmptyArrays": true
//                         }
//                     },
//                     {
//                         $lookup: {
//                             from: "story",
//                             localField: "photo_name",
//                             foreignField: "_id",
//                             as: "user_id.profileImageId"
//                         }
//                     },
//                     {
//                         "$unwind": {
//                             "path": "$user_id.profileImageId",
//                             "preserveNullAndEmptyArrays": true
//                         }
//                     },
//                     {
//                         "$unwind": {
//                             "path": "$storyData",
//                             "preserveNullAndEmptyArrays": true
//                         }
//                     },
//                     {
//                         '$project': {
//                             "user_id": {
//                                 _id: "$user_id._id", name: 1, accountType: 1, profileHeader: 1, profileImage: { $ifNull: ["$user_id.profileImageId.photo_name", CONFIG.DEFAULT_PROFILE_PHOTO] },
//                                 // relationshipStatus: {
//                                 //     $cond: {
//                                 //         if: { $eq: ["$user_id.relationshipStatus", 1] }, then: "Single",
//                                 //         else: {
//                                 //             $cond: { if: { $eq: ["$user_id.relationshipStatus", 2] }, then: "Commited", else: "Single" }
//                                 //         }
//                                 //     }
//                                 // }
//                             },
//                             "storyData": 1,
//                             "createdAt": 1
//                         }
//                     },

//                     {
//                         "$lookup": {
//                             "from": "user",
//                             "as": "storyData.taguser",
//                             "let": { "taguser": "$storyData.taguser" },
//                             "pipeline": [
//                                 { "$match": { "$expr": { "$in": ["$masterUserId", { $cond: { if: { $isArray: "$$taguser" }, then: "$$taguser", else: [] } }] } } },
//                                 {
//                                     "$lookup": {
//                                         "from": "photo",
//                                         "let": { "profileImageId": "$profileImageId" },
//                                         "pipeline": [
//                                             { "$match": { "$expr": { "$eq": ["$_id", "$$profileImageId"] } } },
//                                         ],
//                                         "as": "profileImageId",
//                                     }
//                                 },
//                                 {
//                                     "$unwind": {
//                                         "path": "$profileImageId",
//                                         "preserveNullAndEmptyArrays": true
//                                     }
//                                 },
//                                 {
//                                     "$project": {
//                                         _id: 1,
//                                         masterUserId: 1,
//                                         name: 1,
//                                         profileImage: { $ifNull: ['$profileImageId.photo_name', CONFIG.DEFAULT_PROFILE_PHOTO] }
//                                     }
//                                 }
//                             ],

//                         }
//                     },
//                     {
//                         "$lookup": {
//                             "from": "photo",
//                             "as": "storyData.media",
//                             "let": { "photoId": "$storyData.mediaId" },
//                             "pipeline": [
//                                 {
//                                     "$match": {
//                                         "$expr": {
//                                             $eq: ["$_id", "$$photoId"]
//                                         }
//                                     }
//                                 },
//                                 {
//                                     "$project": {
//                                         "_id": 1,
//                                         "path": "$photo_name",
//                                         "video_screenshot": 1,
//                                         "type": {
//                                             $cond: {
//                                                 if: { $eq: ["$type", 'video'] }, then: "video",
//                                                 else: "photo"
//                                             }
//                                         },
//                                     }
//                                 }
//                             ]
//                         }
//                     },
//                     { $unwind: '$storyData' },
//                     {
//                         $group: {
//                             _id: "$user_id._id",
//                             "userData": {
//                                 "$first": "$user_id"
//                             },
//                             "storyData": {
//                                 $push: {
//                                     media: "$storyData.media",
//                                     taguser: "$storyData.taguser",
//                                     content: "$storyData.content",
//                                     hashtag: "$storyData.hashtag",
//                                     createdAt: "$createdAt",
//                                     storyId: "$_id"
//                                 }
//                             }
//                         }
//                     },
//                 ];
//                 callback(null, conditionQuery);
//             },
//             function (conditionQuery, callback) {
//                 async.parallel([
//                     function (cb) {
//                         //Get records / documents for original post list
//                         //console.log("conditionQueryconditionQueryconditionQuery:",JSON.stringify(conditionQuery, null, 4));
//                         StoryModel.advancedAggregate(conditionQuery, options, function (err, story) {
//                             if (err) {
//                                 cb(err);
//                             } else {
//                                 //data.posts = posts;
//                                 data.story = data.story.concat(story);
//                                 cb(null);
//                             }
//                         });
//                     },
//                     function (cb) {

//                         StoryModel.advancedAggregate(conditionQuery, {}, (err, story) => {
//                             if (err) {
//                                 throw err;
//                             } else {
//                                 if (!data.searchKey) {
//                                     data.recordsTotal = story.length;
//                                 }
//                                 cb(null);
//                             }
//                         });
//                     },
//                 ], function (err) {
//                     if (err) {
//                         callback(err);
//                     } else {
//                         callback(null);
//                     }
//                 });
//             }
//         ], function (err) {
//             if (err) {
//                 AppCode.Fail.error = err.message;
//                 response.setError(AppCode.Fail);
//                 response.send(res);
//             } else {
//                 //console.log("datadatadatadatadata;",JSON.stringify(data,null,4));
//                 response.setData(AppCode.Success, data);
//                 response.send(res);
//             }
//         });

//     }
//     else {
//         response.setData(AppCode.LoginAgain, {});
//         response.send(res);
//     }
// };

// // - not use
// // Get story list for User

// storyCtrl.getStoryUserList = (req, res) => {
//     const response = new HttpRespose();
//     var data = {};
//     data.story = [];

//     if (!!req.payload && !!req.payload._id) {
//         let condition = {};
//         let userId = ObjectID(req.payload._id);
//         let options = {};
//         options.limit = !!req.query.recordsPerPage ? parseInt(req.query.recordsPerPage) : 10;
//         options.skip = !!req.query.recordsOffset ? parseInt(req.query.recordsOffset) : 0;

//         async.waterfall([
//             function (callback) {
//                 getUserFollowerData(userId).then((followers) => {
//                     const followerIds = [];
//                     _.forEach(followers, (follower) => {
//                         followerIds.push(ObjectID(follower.user_id));
//                     });
//                     callback(null, followerIds);
//                 });
//             },

//             function (followerIds, callback) {
//                 getUserConnectionsData(userId).then((connections) => {

//                     const connectionsIds = [];
//                     _.forEach(connections, (connection) => {
//                         connectionsIds.push(ObjectID(connection.connectionId));
//                     });
//                     callback(null, followerIds, connectionsIds);
//                 });
//             },

//             function (followerIds, connectionsIds, callback) {
//                 condition["$and"] = [
//                     // { status: 1 },
//                     { "isDeleted": { $ne: true } },
//                     { "createdAt": { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
//                 ];

//                 condition["$and"].push({
//                     "$or": [
//                         { user_id: { $in: followerIds } },
//                         { user_id: { $in: connectionsIds } }
//                     ]
//                 });


//                 let conditionQuery = [
//                     {
//                         $match: condition
//                     },
//                     {
//                         $lookup: {
//                             from: "user",
//                             localField: "user_id",
//                             foreignField: "masterUserId",
//                             as: "user_id"
//                         }
//                     },
//                     {
//                         "$unwind": {
//                             "path": "$user_id",
//                             "preserveNullAndEmptyArrays": true
//                         }
//                     },
//                     {
//                         $lookup: {
//                             from: "photo",
//                             localField: "user_id.profileImageId",
//                             foreignField: "_id",
//                             as: "user_id.profileImageId"
//                         }
//                     },
//                     {
//                         "$unwind": {
//                             "path": "$user_id.profileImageId",
//                             "preserveNullAndEmptyArrays": true
//                         }
//                     },
//                     {
//                         '$project': {
//                             "user_id": {
//                                 _id: "$user_id.masterUserId", name: 1, accountType: 1, profileHeader: 1, profileImage: { $ifNull: ["$user_id.profileImageId.photo_name", CONFIG.DEFAULT_PROFILE_PHOTO] },
//                                 relationshipStatus: {
//                                     $cond: {
//                                         if: { $eq: ["$user_id.relationshipStatus", 1] }, then: "Single",
//                                         else: {
//                                             $cond: { if: { $eq: ["$user_id.relationshipStatus", 2] }, then: "Commited", else: "Single" }
//                                         }
//                                     }
//                                 }
//                             }
//                         }
//                     },
//                     {
//                         $group: {
//                             _id: "$user_id._id",
//                             "userData": {
//                                 "$first": "$user_id"
//                             },
//                         }
//                     },
//                 ];
//                 callback(null, conditionQuery);
//             },
//             function (conditionQuery, callback) {
//                 async.parallel([
//                     function (cb) {
//                         //Get records / documents for original post list
//                         //console.log("conditionQueryconditionQueryconditionQuery:",JSON.stringify(conditionQuery, null, 4));
//                         StoryModel.advancedAggregate(conditionQuery, options, function (err, story) {
//                             if (err) {
//                                 cb(err);
//                             } else {
//                                 //data.posts = posts;
//                                 data.story = data.story.concat(story);
//                                 cb(null);
//                             }
//                         });
//                     },
//                     function (cb) {

//                         StoryModel.advancedAggregate(conditionQuery, {}, (err, story) => {
//                             if (err) {
//                                 throw err;
//                             } else {
//                                 if (!data.searchKey) {
//                                     data.recordsTotal = story.length;
//                                 }
//                                 cb(null);
//                             }
//                         });
//                     },
//                 ], function (err) {
//                     if (err) {
//                         callback(err);
//                     } else {
//                         callback(null);
//                     }
//                 });
//             }
//         ], function (err) {
//             if (err) {
//                 AppCode.Fail.error = err.message;
//                 response.setError(AppCode.Fail);
//                 response.send(res);
//             } else {
//                 //console.log("datadatadatadatadata;",JSON.stringify(data,null,4));
//                 response.setData(AppCode.Success, data);
//                 response.send(res);
//             }
//         });

//     }
//     else {
//         response.setData(AppCode.LoginAgain, {});
//         response.send(res);
//     }
// };



// const getUserConnectionsData = (userId) => {
//     console.log(userId)
//     const promise = new Promise((resolve, reject) => {
//         const connectionQuery = {
//             _id: ObjectID(userId),
//         }

//         UserModel.find(connectionQuery, (err, connections) => {
//             if (err) {
//                 return reject(err);
//             } else {
//                 console.log("connectionsconnectionsconnections", connections);
//                 return resolve(connections);
//             }
//         });
//     });

//     return promise;
// }

module.exports = storyCtrl;