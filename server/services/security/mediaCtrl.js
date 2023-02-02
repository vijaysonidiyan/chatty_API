let mediaCtrl = {};
const HttpRespose = require("../../common/httpResponse");
const Logger = require("../../common/logger");
const bcrypt = require("bcryptjs");
const blacklist = require("express-jwt-blacklist");
const ObjectID = require("mongodb").ObjectID;
const CONFIG = require("../../config");
const _ = require("lodash");
const async = require("async");
const fs = require("fs");
const AppCode = require("../../common/constant/appCods");
const MasterUserModel = new (require("../../common/model/userModel"))();
const ImageModel = new (require("../../common/model/imageModel"))();
const mediaModel = new (require("../../common/model/mediaModel"))();
const BlockUserModel = new (require("../../common/model/blockUserModel"))();
const FavouriteModel = new (require("../../common/model/favouriteModel"))();
const NotificationModel =
    new (require("../../common/model/NotificationModel"))();
const UserModel =
    new (require("../../common/model/userModel"))();
 const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
 const ffmpeg = require('fluent-ffmpeg');
 const ffprobePath = require("ffprobe-static").path;
 const path = require("path");
const imageThumbnail = require("image-thumbnail");
let options = { width: 100, height: 100, responseType: 'base64', jpegOptions: { force:true, quality:90 } }
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

/* Create media Data */

mediaCtrl.mediaMasterSave1 = (req, res) => {
    const response = new HttpRespose();
    if (!!req.auth._id) {
        const data = req.body;
        console.log(data)
        data.createdBy = ObjectID(req.auth._id);

        const filesArr = req.files;
        const dateTimeData = Date.now();
        async.waterfall([
            function (cb) {
                // convert video to mp4 if required
                for (let filesArrKey in filesArr) {
                    let files = filesArr[filesArrKey];
                    for (let filesKey in files) {
                        let file = files[filesKey];

                        if (file.fieldname === "videos") {

                            //For takes screen shot
                            let VideoNameForScreenShot = filesArr[filesArrKey][filesKey].filename;
                            let VideoNameForScreenShotWithPath = CONFIG.UPLOADS.DIR_PATH_VIDEOS + VideoNameForScreenShot;
                            // ffmpeg(VideoNameForScreenShotWithPath)
                            //     .on('end', function () {
                            //         console.log('Screenshots taken');
                            //     })

                            //     .on('error', function (err) {
                            //         console.error(err);
                            //     })
                            //     .screenshots({
                            //         // Will take screenshots at 20%, 40%, 60% and 80% of the video if increase count 1 to 4
                            //         count: 1,
                            //         folder: CONFIG.UPLOADS.DIR_PATH_PHOTOS,
                            //         filename: VideoNameForScreenShot.split(".")[0] + '.  '
                            //     });


                            // Create a command to convert any video file to MP4
                            if (!!file.mimetype && file.mimetype !== 'video/mp4') {
                                var oldVideoName = filesArr[filesArrKey][filesKey].filename;
                                filesArr[filesArrKey][filesKey].filename = filesArr[filesArrKey][filesKey].filename.split('.')[0] + '.mp4';
                                var originalVideoNameWithPath = CONFIG.UPLOADS.DIR_PATH_VIDEOS + oldVideoName;
                                // var command = ffmpeg(originalVideoNameWithPath);
                                // command
                                //     .videoCodec('libx264')
                                //     .on('error', function (err) {
                                //         logger.log("error", 'An error occurred:' + err);
                                //     })
                                //     .on('progress', function (progress) {
                                //         logger.log("info", 'Processing: mp4');
                                //     })
                                //     .on('end', function () {
                                //         logger.log("info", 'Processing finished ................!' + originalVideoNameWithPath);
                                //         //cb(null);
                                //         //For remove uploaded video which is not mp3 or main video
                                //         if (!!originalVideoNameWithPath) {
                                //             fs.exists(originalVideoNameWithPath, function (exists) {
                                //                 if (exists) {
                                //                     fs.unlinkSync(originalVideoNameWithPath);
                                //                 }
                                //             });
                                //         }
                                //     })
                                //     .save(CONFIG.UPLOADS.DIR_PATH_VIDEOS + filesArr[filesArrKey][filesKey].filename.split('.')[0] + '.mp4');
                            } else {
                                //cb(null);
                            }
                        }
                    }
                }
                cb(null);
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

                    }
                    data.media.photos.files = [];
                    data.media.videos.files = [];
                    data.documents = {};
                    data.documents.files = [];


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
                                data.documents.files.push({ filename: file.filename, originalname: file.originalname, mimetype: file.mimetype, ext: file.filename.split(".")[1] });
                            } else if (file.fieldname === "photos") {

                                
                                // data.media[file.fieldname].files.push(
                                //   "http://" + req.hostname + "/uploads/" + file.filename
                                // );
                                data.media[file.fieldname].files.push({ filename: file.filename, originalname: file.originalname });
                            } else if (file.fieldname === "videos") {
                                // data.media[file.fieldname].files.push(
                                //   "http://" + req.hostname + "/uploads/" + file.filename
                                // );
                                data.media[file.fieldname].files.push({ filename: file.filename, originalname: file.originalname });
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

                        photosData[index] = { photo_name: obj.filename, originalname: obj.originalname, createdBy: ObjectID(req.auth._id), type: 1, status: 1, createdAt: new Date() };

                    });

                    //console.log("photosDataphotosDataphotosDataphotosData:",photosData);

                    data.media.photos.files = [];

                    mediaModel.createMany(photosData, function (err, photos) {
                        if (err) {
                            //TODO: Log the error here
                            cb(err);
                        } else {
                            //console.log("here photos result after insert : ", photos);

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
                        let video_screenshot = obj.filename.split(".")[0] + ".jpg";
                        video_screenshot = video_screenshot.split("/");
                        video_screenshot = CONFIG.UPLOADS.DB_PATH_PHOTOS + video_screenshot[video_screenshot.length - 1];
                        videosData[index] = { video_name: obj.filename, video_screenshot: video_screenshot, status: 1, originalname: obj.originalname, type: 2, createdBy: ObjectID(req.auth._id), createdAt: new Date() };
                    });

                    //console.log("videosDatavideosDatavideosDatavideosDatavideosData:",videosData);

                    data.media.videos.files = [];

                    mediaModel.createMany(videosData, function (err, videos) {
                        if (err) {
                            //TODO: Log the error here
                            cb(err);
                        } else {
                            //console.log("here videos result after insert : ", videos);

                            cb(null);

                        }
                    });
                } else {
                    data.media.videos.files = [];
                    cb(null);
                }
            },
        ], function (err) {
            if (err) {
                AppCode.Fail.error = err.message;
                response.setError(AppCode.Fail);
                response.send(res);
            } else {
                response.setData(AppCode.Success);
                response.send(res);

            }
        });
    } else {
        response.setData(AppCode.PleaseLoginAgain, {});
        response.send(res);
    }

};



mediaCtrl.mediaMasterSavefinal = (req, res) => {
    const response = new HttpRespose();

    let result =[]
    if (!!req.auth._id) {
        const data = req.body;
        console.log(data)
        data.createdBy = ObjectID(req.auth._id);

        const filesArr = req.files;
        const dateTimeData = Date.now();
        async.waterfall([
            function (cb) {
                // convert video to mp4 if required
                for (let filesArrKey in filesArr) {
                    let files = filesArr[filesArrKey];
                    for (let filesKey in files) {
                        let file = files[filesKey];
                        console.log("fileeeeeeeeeeeeeeeeeeeeeee", file);

                        if (file.fieldname === "videos") {

                            //For takes screen shot
                            let VideoNameForScreenShot = filesArr[filesArrKey][filesKey].filename;
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
                                        dateTimeData +
                                        VideoNameForScreenShot.split(".")[0] +
                                        ".jpg";
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


                            // Create a command to convert any video file to MP4
                            if (!!file.mimetype && file.mimetype !== 'video/mp4') {
                                var oldVideoName = filesArr[filesArrKey][filesKey].filename;
                                filesArr[filesArrKey][filesKey].filename = filesArr[filesArrKey][filesKey].filename.split('.')[0] + '.mp4';
                                var originalVideoNameWithPath = CONFIG.UPLOADS.DIR_PATH_VIDEOS + oldVideoName;
                                var command = ffmpeg(originalVideoNameWithPath);
                                command
                                    .videoCodec('libx264')
                                    .on('error', function (err) {
                                        logger.log("error", 'An error occurred:' + err);
                                    })
                                    .on('progress', function (progress) {
                                        logger.log("info", 'Processing: mp4');
                                    })
                                    .on('end', function () {
                                        logger.log("info", 'Processing finished ................!' + originalVideoNameWithPath);
                                        //cb(null);
                                        //For remove uploaded video which is not mp3 or main video
                                        if (!!originalVideoNameWithPath) {
                                            fs.exists(originalVideoNameWithPath, function (exists) {
                                                if (exists) {
                                                    fs.unlinkSync(originalVideoNameWithPath);
                                                }
                                            });
                                        }
                                    })
                                    .save(CONFIG.UPLOADS.DIR_PATH_VIDEOS + filesArr[filesArrKey][filesKey].filename.split('.')[0] + '.mp4');
                            } else {
                                //cb(null);
                            }
                        }
                    }
                }
                cb(null);
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
                                data.media[file.fieldname].files.push({ filename: file.filename, originalname: file.originalname, mimetype: file.mimetype, ext: file.filename.split(".")[1] });
                            } else if (file.fieldname === "photos") {
                                let isSquareImage = false;
                                let thumbnailName =
                                  filesArr[filesArrKey][filesKey].originalname;
                                  console.log("-------thumbnailName------------",thumbnailName)

                                  let thumbnailKey =
                                  CONFIG.UPLOADS.DIR_PATH_PHOTOS +
                                  dateTimeData +
                                  thumbnailName.split(".")[0] +
                                  ".jpg";
                                  console.log("---------thumbnailKey----------",thumbnailKey)

                                
                                  
                               // const fileContent = fs.readFileSync(thumbnailKey);

                                imageThumbnail(file.path)
                                    .then((thumbnail) => {
                                         console.log("thumbnailthumbnail",thumbnail)

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


                                  console.log("dateTimeData",dateTimeData)

                               
                                data.media[file.fieldname].files.push({ filename: file.filename,  thumbnail: thumbnailKey, originalname: file.originalname });
                            } else if (file.fieldname === "videos") {
                                // data.media[file.fieldname].files.push(
                                //   "http://" + req.hostname + "/uploads/" + file.filename
                                // );
                                data.media[file.fieldname].files.push({ filename: file.filename, originalname: file.originalname});
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
                       let thumbnailphoto = dateTimeData + obj.originalname

                        photosData[index] = { photo_name: obj.filename, originalname: obj.originalname,thumbnail :thumbnailphoto ,createdBy: ObjectID(req.auth._id), type: 1, status: 1, createdAt: new Date() };

                    });

                    //console.log("photosDataphotosDataphotosDataphotosData:",photosData);

                    data.media.photos.files = [];

                    mediaModel.createMany(photosData, function (err, photos) {
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
                        let video_screenshot = obj.filename.split(".")[0] + ".jpg";
                        video_screenshot = video_screenshot.split("/");
                        video_screenshot = video_screenshot[video_screenshot.length - 1];

                        let thumbnails=dateTimeData+obj.filename.split(".")[0] + ".jpg";
                        videosData[index] = { video_name: obj.filename, video_screenshot: video_screenshot,thumbnail: thumbnails ,status: 1, originalname: obj.originalname, type: 2, createdBy: ObjectID(req.auth._id), createdAt: new Date() };
                    });

                    //console.log("videosDatavideosDatavideosDatavideosDatavideosData:",videosData);

                    data.media.videos.files = [];

                    mediaModel.createMany(videosData, function (err, videos) {
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

                        documentsData[index] = { document_name: obj.filename, originalname: obj.originalname,createdBy: ObjectID(req.auth._id), type: 3, status: 1, createdAt: new Date() };

                    });

                    console.log("documentsDatadocumentsDatadocumentsDatadocumentsData:",documentsData);

                    data.media.documents.files = [];

                    mediaModel.createMany(documentsData, function (err, document) {
                        if (err) {
                            console.log("errrrrrrrrr",err);
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
                AppCode.Fail.error = err.message;
                response.setError(AppCode.Fail);
                response.send(res);
            } else {
                console.log("resultresultresultresult",result);
                response.setData(AppCode.Success,result);
                response.send(res);
                //result=[]

            }
        });
    } else {
        response.setData(AppCode.PleaseLoginAgain, {});
        response.send(res);
    }

};



mediaCtrl.mediaMasterSave = (req, res) => {
    const response = new HttpRespose();

    let result =[]
    if (!!req.auth._id) {
        const data = req.body;
        console.log(data)
        data.createdBy = ObjectID(req.auth._id);

        const filesArr = req.files;
        const dateTimeData = Date.now();
        async.waterfall([
            function (cb) {
                // convert video to mp4 if required
                for (let filesArrKey in filesArr) {
                    let files = filesArr[filesArrKey];
                    for (let filesKey in files) {
                        let file = files[filesKey];
                        console.log("fileeeeeeeeeeeeeeeeeeeeeee", file);

                        if (file.fieldname === "videos") {

                            //For takes screen shot
                            let VideoNameForScreenShot = filesArr[filesArrKey][filesKey].filename;
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
                                        ".jpg";
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
                                            cb(null);
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


                            // Create a command to convert any video file to MP4
                            // if (!!file.mimetype && file.mimetype !== 'video/mp4') {
                            //     var oldVideoName = filesArr[filesArrKey][filesKey].filename;
                            //     filesArr[filesArrKey][filesKey].filename = filesArr[filesArrKey][filesKey].filename.split('.')[0] + '.mp4';
                            //     var originalVideoNameWithPath = CONFIG.UPLOADS.DIR_PATH_VIDEOS + oldVideoName;
                            //     var command = ffmpeg(originalVideoNameWithPath);
                            //     command
                            //         .videoCodec('libx264')
                            //         .on('error', function (err) {
                            //             logger.log("error", 'An error occurred:' + err);
                            //         })
                            //         .on('progress', function (progress) {
                            //             logger.log("info", 'Processing: mp4');
                            //         })
                            //         .on('end', function () {
                            //             logger.log("info", 'Processing finished ................!' + originalVideoNameWithPath);
                            //             //cb(null);
                            //             //For remove uploaded video which is not mp3 or main video
                            //             if (!!originalVideoNameWithPath) {
                            //                 fs.exists(originalVideoNameWithPath, function (exists) {
                            //                     if (exists) {
                            //                         fs.unlinkSync(originalVideoNameWithPath);
                            //                     }
                            //                 });
                            //             }
                            //         })
                            //         .save(CONFIG.UPLOADS.DIR_PATH_VIDEOS + filesArr[filesArrKey][filesKey].filename.split('.')[0] + '.mp4');
                            // } else {
                            //     //cb(null);
                            // }
                        }
                    }
                }
               // cb(null);
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
                                data.media[file.fieldname].files.push({ filename: file.filename, originalname: file.originalname, mimetype: file.mimetype, ext: file.filename.split(".")[1] });
                            } else if (file.fieldname === "photos") {
                                let isSquareImage = false;
                                let thumbnailName =
                                  filesArr[filesArrKey][filesKey].filename;
                                  console.log("-------thumbnailName------------",thumbnailName)

                                  let thumbnailKey =
                                  CONFIG.UPLOADS.DIR_PATH_PHOTOS +
                                  "thumb-" +
                                  thumbnailName.split(".")[0] +
                                  ".png";
                                  console.log("---------thumbnailKey----------",thumbnailKey)

                                
                                  
                               // const fileContent = fs.readFileSync(thumbnailKey);

                                imageThumbnail(file.path)
                                    .then((thumbnail) => {
                                         console.log("thumbnailthumbnail",thumbnail)

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


                                  console.log("dateTimeData",dateTimeData)

                               
                                data.media[file.fieldname].files.push({ filename: file.filename,  thumbnail: thumbnailKey, originalname: file.originalname });
                            } else if (file.fieldname === "videos") {
                                // data.media[file.fieldname].files.push(
                                //   "http://" + req.hostname + "/uploads/" + file.filename
                                // );
                                data.media[file.fieldname].files.push({ filename: file.filename, originalname: file.originalname});
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
                        console.log("&&&&&&&&&&&&&&&&&&&",obj);

                        let thumbnailName =
                       obj.filename;
                        console.log("-------thumbnailName------------",thumbnailName)

                        let thumbnailKeyy=
                        "thumb-" +
                        thumbnailName.split(".")[0] +
                        ".png";
                        console.log("---------thumbnailKey----------",thumbnailKeyy)

                    

                        photosData[index] = { photo_name: obj.filename, originalname: obj.originalname,thumbnail :thumbnailKeyy ,createdBy: ObjectID(req.auth._id), type: 1, status: 1, createdAt: new Date() };

                    });

                    //console.log("photosDataphotosDataphotosDataphotosData:",photosData);

                    data.media.photos.files = [];

                    mediaModel.createMany(photosData, function (err, photos) {
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

                        let thumbnails="thumb-"+obj.filename.split(".")[0] + ".jpg";
                        videosData[index] = { video_name: obj.filename, video_screenshot: video_screenshot,thumbnail: thumbnails ,status: 1, originalname: obj.originalname, type: 2, createdBy: ObjectID(req.auth._id), createdAt: new Date() };
                    });

                    //console.log("videosDatavideosDatavideosDatavideosDatavideosData:",videosData);

                    data.media.videos.files = [];

                    mediaModel.createMany(videosData, function (err, videos) {
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

                        documentsData[index] = { document_name: obj.filename, originalname: obj.originalname,createdBy: ObjectID(req.auth._id), type: 3, status: 1, createdAt: new Date() };

                    });

                    console.log("documentsDatadocumentsDatadocumentsDatadocumentsData:",documentsData);

                    data.media.documents.files = [];

                    mediaModel.createMany(documentsData, function (err, document) {
                        if (err) {
                            console.log("errrrrrrrrr",err);
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
                AppCode.Fail.error = err.message;
                response.setError(AppCode.Fail);
                response.send(res);
            } else {
                console.log("resultresultresultresult",result);
                response.setData(AppCode.Success,result);
                response.send(res);
                //result=[]

            }
        });
    } else {
        response.setData(AppCode.PleaseLoginAgain, {});
        response.send(res);
    }

};

mediaCtrl.mediaMasterDelete = (req, res) => {
    const response = new HttpRespose();

    try {
        let query = { _id: ObjectID(req.body._id) };
        console.log(query);
        mediaModel.findOne(query, {}, (err, data) => {
            if (err) {
                console.log(err)
                response.setError(AppCode.Fail);
                response.send(res);
            }
            else if (data === null) {
                response.setError(AppCode.NotFound);
                response.send(res);

            }
            else {
                console.log("mediamediamedia", data);
                mediaModel.remove(query, (err, media) => {

                    if (err) {
                        console.log("error", err);
                        throw err;
                    } else {
                        console.log("removeeeeeeeeeee");
                        console.log("data............", data.type);

                        let typee = data.type

                        if (typee == 2) {

                            console.log((" 22222222222222222222"));
                            let filename = data.video_name
                            let filename1 = data.thumbnail
                            let videoscreenshot = data.video_screenshot

                            var filePath = CONFIG.UPLOADS.DIR_PATH_VIDEOS + filename;

                            var filePath1 = CONFIG.UPLOADS.DIR_PATH_PHOTOS + filename1;
                            let aaa = filePath1.split(".")[0]

                            var vedioscreenshortpath = CONFIG.UPLOADS.DIR_PATH_PHOTOS + videoscreenshot
                            let bbb = vedioscreenshortpath.split(".")[0]

                            console.log("filePath..........", filePath);
                            console.log("filePath1..........", filePath1);
                            console.log("vedioscreenshortpath..........", vedioscreenshortpath);

                            fs.unlinkSync(filePath);
                            fs.unlinkSync(filePath1);
                            fs.unlinkSync(vedioscreenshortpath);

                        }
                        else if (typee == 1) {

                            console.log("1111111111111111111111");
                            let photoname = data.photo_name;
                            let photothumbnail = data.thumbnail

                            var photopath = CONFIG.UPLOADS.DIR_PATH_PHOTOS + photoname;
                            var thumbnailpath = CONFIG.UPLOADS.DIR_PATH_PHOTOS + photothumbnail;


                            fs.unlinkSync(photopath);
                            fs.unlinkSync(thumbnailpath);




                        }
                        else {

                            console.log("222222222222222");

                            let documentname = data.document_name

                            var documentpath = CONFIG.UPLOADS.DIR_PATH_DOCUMENTS + documentname;

                            fs.unlinkSync(documentpath);


                        }




                        response.setData(AppCode.Success);
                        response.send(res);
                    }
                });
                console.log("11111111111111");



            }
        });
    } catch (exception) {
        response.setError(AppCode.InternalServerError);
        response.send(res);
    }

}


module.exports = mediaCtrl;