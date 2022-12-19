let BlogCtrl = {};
const HttpRespose = require("../../common/httpResponse");
const Logger = require("../../common/logger");
const bcrypt = require("bcryptjs");
const blacklist = require('express-jwt-blacklist');
const ObjectID = require("mongodb").ObjectID;
const CONFIG = require("../../config");
// const _ = require("lodash");
const async = require("async");
const AppCode = require("../../common/constant/appCods");
const { ObjectId } = require("mongodb");
const { query } = require("express");
const _ = require("lodash");

const BlogModel = new (require("../../common/model/blogModel"));


const fs = require("fs");



/* Create Blog Data */
BlogCtrl.create = (req, res) => {
    const response = new HttpRespose();
    if (!!req.payload._id) {
        const data = req.body;
        console.log(data)
        data.createdBy = ObjectID(req.payload._id);
        if (!!req.files.Image) {

            data.Image = req.files.Image[0].filename;
        }

        // data.categoryId = ObjectID(req.body.categoryId);
        const filesArr = req.files;
        const dateTimeData = Date.now();
        async.waterfall([
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
                        //  data.media.videos = {};

                    }
                    data.media.photos.files = [];
                    for (let filesArrKey in filesArr) {
                        let files = filesArr[filesArrKey];
                        for (let filesKey in files) {
                            let file = files[filesKey];

                            console.log("filefilefilefilefile", file);


                            if (file.fieldname === "documents") {
                                data.documents.files.push({ filename: file.filename, originalname: file.originalname, mimetype: file.mimetype, ext: file.filename.split(".")[1] });
                            } else if (file.fieldname === "photos") {
                               
                                data.media[file.fieldname].files.push({ filename: file.filename, originalname: file.originalname });
                            }
                        }
                    }
                }
                //console.log("Before", data.documents.files)


                if (data.location !== undefined) {
                    data.location = data.location.split(",");
                    data.location.map((obj, index) => {
                        data.location[index] = parseFloat(obj);
                    });
                }
                cb(null);
            },
            function (cb) {

                if (!!data.media && !!data.media.photos && !!data.media.photos.files && data.media.photos.files.length > 0) {
                    let photosData = [];
                    //console.log("All data.tags >>>>>>>>>> :",data.tags);
                    data.media.photos.files.map((obj, index) => {

                        photosData[index] = { photo_name: obj.filename, isDefalut: obj.isDefalut, module: 2, createdBy: ObjectID(req.payload._id), status: 1, isDelete: 0, createdAt: new Date() };

                        //for find by photo name and sotore it in photo module
                        //let tempTag = undefined;
                        let tempProductInfo = undefined;
                        if (data.productInfo !== undefined && data.productInfo.length > 0) {
                            let productInfoIndex = data.productInfo.map(e => { return e.reference; }).indexOf(obj.originalname);
                            if (productInfoIndex !== -1) {
                                tempProductInfo = data.productInfo[productInfoIndex];
                                delete tempProductInfo.reference;
                                photosData[index].productInfo = tempProductInfo;
                            }
                        }
                    });

                    //console.log("photosDataphotosDataphotosDataphotosData:",photosData);

                    data.media.photos.files = [];
                    //for remove previoust set tags and productInfo for remove form news feed
                    // delete data.tags;
                    delete data.productInfo;
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
                                photos.map(obj => {
                                    data.media.photos.files.push(obj._id);
                                });
                                if (req.body.albumType && req.body.albumId) {
                                    AlbumModel.update({ _id: ObjectID(req.body.albumId) }, { $push: { photos: { $each: data.media.photos.files } } }, (err, updateResullt) => {
                                        if (err) {
                                            cb(err);
                                        } else if (updateResullt.result.nModified === 0) {
                                            cb(new Error('fail'));
                                        } else {
                                            cb(null);
                                        }
                                    });
                                } else {
                                    cb(null);
                                }
                            }
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

        ], function (err) {
            if (err) {
                AppCode.Fail.error = err.message;
                response.setError(AppCode.Fail);
                response.send(res);
            } else {
                BlogModel.create(data, function (err, blog) {
                    if (err) {
                        //TODO: Log the error here
                        AppCode.Fail.error = err.message;
                        response.setError(AppCode.Fail);
                        response.send(res);
                    } else {
                        response.setData(AppCode.Success, blog);
                        response.send(res);
                    }
                });
            }
        });
    } else {
        response.setData(AppCode.PleaseLoginAgain, {});
        response.send(res);
    }
}

/* Blog Details By Id For Admin */
BlogCtrl.blogDetailsByIdForAdmin = (req, res) => {
    const response = new HttpRespose();

    try {
        let query = [
            {
                $match: {
                    _id: ObjectID(req.query._id)
                }
            },

            {
                $lookup: {
                    from: "photo",
                    localField: "media.photos.files",
                    foreignField: "_id",
                    as: "field",

                },

            },







            {
                $project: {
                    "createdBy": 1,
                    "title": 1,
                    "slug": 1,
                    "shortDescription": 1,
                    "longDescription": 1,
                    "Image": 1,
                    "metaTitle": 1,
                    "metaKeyWord": 1,
                    "metaDescription": 1,
                    "status": 1,
                    "photosId": "$field",

                    // // "photoDataaaaaa" : {
                    // //     $let: {
                    // //       vars: {
                    // //         firstReport: {'$arrayElemAt': ['$field', 0]},
                    // //       },
                    // //       in: '$$firstReport.photo_name',
                    // //     },
                    // //   },




                }
            },






        ];
        // console.log(query)

        BlogModel.advancedAggregate(query, {}, (err, blog) => {
            if (err) {
                throw err;
            } else if (_.isEmpty(admin)) {

                response.setError(AppCode.NoBlogDataFound);
                response.send(res);
            } else {
                response.setData(AppCode.Success, blog[0]);
                response.send(res);
            }
        });
    } catch (exception) {
        response.setError(AppCode.InternalServerError);
        response.send(res);
    }
}

/* Blog List For Admin */
BlogCtrl.blogListForAdmin = (req, res) => {
    const response = new HttpRespose();

    try {
        let query = [

            {
                $lookup: {
                    from: "photo",
                    localField: "media.photos.files",
                    foreignField: "_id",
                    as: "field"
                }


            },





            {
                $project: {
                    "createdBy": 1,
                    "title": 1,
                    "slug": 1,
                    "shortDescription": 1,
                    "longDescription": 1,
                    "Image": 1,
                    "metaTitle": 1,
                    "metaKeyWord": 1,
                    "metaDescription": 1,
                    "status": 1,
                    //  "photosId": "$field",
                    "photo": {
                        $let: {
                            vars: {
                                firstReport: { '$arrayElemAt': ['$field', 0] },
                            },
                            in: '$$firstReport.photo_name',
                        },
                    },





                }
            },




        ];
        // console.log(query)

        BlogModel.advancedAggregate(query, {}, (err, blog) => {
            if (err) {
                throw err;
            } else if (_.isEmpty(admin)) {
                response.setError(AppCode.NoBlogDataFound);
                response.send(res);
            } else {
                response.setData(AppCode.Success, blog);
                response.send(res);
            }
        });
    } catch (exception) {
        response.setError(AppCode.InternalServerError);
        response.send(res);
    }
}

/* Blog Active-Deactive */
BlogCtrl.blogActiveDeactive = (req, res) => {
    const response = new HttpRespose();
    let query = { _id: ObjectID(req.body._id) };
    BlogModel.updateOne(query, { $set: { status: req.body.status } }, function (err, product) {
        if (err) {
            //TODO: Log the error here
            AppCode.Fail.error = err.message;
            response.setError(AppCode.Fail);
            response.send(res);
        } else {
            response.setData(AppCode.Success, product);
            response.send(res);
        }
    });
};

/* Update Blog Data */
BlogCtrl.update = (req, res) => {
    const response = new HttpRespose();

    console.log("original body data::::::::::::::::::::::", req.body);

    if (!!req.payload._id) {
        const data = Object.assign({}, req.body);
        const filesArr = req.files;

        // let userId = ObjectID(req.payload._id);
        if (!!req.files.Image) {

            data.Image = req.files.Image[0].filename;
        }
        let deletedPhotos;
        // let deletedVideos;
        data.updatedBy = ObjectID(req.payload._id);
        data.createdAt = new Date();
        if (!!req.body.deletedPhotos) {
            deletedPhotos = req.body.deletedPhotos.split(",");
            delete data.deletedPhotos;
        }
        // if (!!req.body.deletedVideos) {
        //     deletedVideos = req.body.deletedVideos.split(",");
        //     delete data.deletedVideos;
        // }

        const query = {
            _id: ObjectID(data._id),
           // status: 1,
            // user_id: userId
        };

        delete data._id;

        //For get old data with image, video, etc name
        BlogModel.aggregate(
            [
                {
                    $match: query
                },
                {
                    $lookup: {
                        from: "photo",
                        localField: "media.photos.files",
                        foreignField: "_id",
                        as: "media.photos.files"
                    }
                },
                // {
                //     $lookup: {
                //         from: "photo",
                //         localField: "media.videos.files",
                //         foreignField: "_id",
                //         as: "media.videos.files"
                //     }
                // },
                // {
                //     $lookup: {
                //         from: "user",
                //         localField: "with",
                //         foreignField: "_id",
                //         as: "with"
                //     }
                // },
                {
                    $project: {
                        "_id": 1,
                        "media": { photos: { files: { _id: 1, photo_name: 1, type: "photo" } } },
                    }
                },
                { "$skip": 0 },
                { "$limit": 1 }
            ]
            , function (err, oldPost) {
                if (err) {
                    console.log(err)
                    // AppCode.Fail.error = err.message;
                    response.setError(AppCode.Fail);
                    response.send(res);
                } else {
                    console.log("oldPost" , oldPost)
                    if (!!oldPost && oldPost.length > 0) {
                        oldPost = oldPost[0];

                        async.waterfall([
                            function (cb) {
                                // convert new video to mp4 if required
                                for (let filesArrKey in filesArr) {
                                    let files = filesArr[filesArrKey];
                                    for (let filesKey in files) {
                                        let file = files[filesKey];

                                        // if (file.fieldname === "videos") {

                                        //     //For takes screen shot
                                        //     let VideoNameForScreenShot = filesArr[filesArrKey][filesKey].filename;
                                        //     let VideoNameForScreenShotWithPath = CONFIG.UPLOADS.DIR_PATH_VIDEOS + VideoNameForScreenShot;
                                        //     ffmpeg(VideoNameForScreenShotWithPath)
                                        //         .on('end', function () {
                                        //             console.log('Screenshots taken');
                                        //         })
                                        //         .on('error', function (err) {
                                        //             console.error(err);
                                        //         })
                                        //         .screenshots({
                                        //             // Will take screenshots at 20%, 40%, 60% and 80% of the video if increase count 1 to 4
                                        //             count: 1,
                                        //             folder: CONFIG.UPLOADS.DIR_PATH_PHOTOS,
                                        //             filename: VideoNameForScreenShot.split(".")[0] + '.jpg'
                                        //         });

                                        //     // Create a command to convert any video file to MP4
                                        //     if (!!file.mimetype && file.mimetype !== 'video/mp4') {
                                        //         var oldVideoName = filesArr[filesArrKey][filesKey].filename;
                                        //         filesArr[filesArrKey][filesKey].filename = filesArr[filesArrKey][filesKey].filename.split('.')[0] + '.mp4';
                                        //         var originalVideoNameWithPath = CONFIG.UPLOADS.DIR_PATH_VIDEOS + oldVideoName;
                                        //         var command = ffmpeg(originalVideoNameWithPath);
                                        //         command
                                        //             .videoCodec('libx264')
                                        //             .on('error', function (err) {
                                        //                 logger.log("error", 'An error occurred:' + err);
                                        //             })
                                        //             .on('progress', function (progress) {
                                        //                 logger.log("info", 'Processing: mp4');
                                        //             })
                                        //             .on('end', function () {
                                        //                 logger.log("info", 'Processing finished ................!' + originalVideoNameWithPath);
                                        //                 //cb(null);
                                        //                 //For remove uploaded video which is not mp3 or main video
                                        //                 if (!!originalVideoNameWithPath) {
                                        //                     fs.exists(originalVideoNameWithPath, function (exists) {
                                        //                         if (exists) {
                                        //                             fs.unlinkSync(originalVideoNameWithPath);
                                        //                         }
                                        //                     });
                                        //                 }
                                        //             })
                                        //             .save(CONFIG.UPLOADS.DIR_PATH_VIDEOS + filesArr[filesArrKey][filesKey].filename.split('.')[0] + '.mp4');
                                        //     } else {
                                        //         //cb(null);
                                        //     }
                                        // }
                                    }
                                }
                                cb(null);
                            },
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
                                        //  data.media.videos = {};
                                    }
                                    data.media.photos.files = [];
                                    //  data.media.videos.files = [];


                                    for (let filesArrKey in filesArr) {
                                        let files = filesArr[filesArrKey];
                                        for (let filesKey in files) {
                                            let file = files[filesKey];

                                            console.log("filefilefilefilefile", file);

                                            if (file.fieldname === "photos") {
                                                data.media[file.fieldname].files.push({ filename: file.filename, originalname: file.originalname });
                                            } else if (file.fieldname === "videos") {

                                                data.media[file.fieldname].files.push({ filename: file.key, originalname: file.originalname });
                                            }
                                        }
                                    }
                                }

                                // if (data.taguser !== undefined) {
                                //     data.taguser = data.taguser.split(",");
                                //     data.taguser.map((obj, index) => {
                                //         data.taguser[index] = ObjectID(obj);
                                //     });
                                // }
                                // if (data.specificFollowers !== undefined) {
                                //     data.followersExcept = [];
                                //     data.specificFollowers = data.specificFollowers.split(",");
                                //     data.specificFollowers.map((obj, index) => {
                                //         data.specificFollowers[index] = ObjectID(obj);
                                //     });
                                // } else if (data.followersExcept !== undefined) {
                                //     data.specificFollowers = [];
                                //     data.followersExcept = data.followersExcept.split(",");
                                //     data.followersExcept.map((obj, index) => {
                                //         data.followersExcept[index] = ObjectID(obj);
                                //     });
                                // }

                                cb(null);
                            },
                            function (cb) {
                                //Store new photos in photo model
                                //console.log("new body data :",data.media.photos.files);

                                if (!!data.media && !!data.media.photos && !!data.media.photos.files && data.media.photos.files.length > 0) {
                                    let photosData = [];
                                    //console.log("All data.tags >>>>>>>>>> :",data.tags);
                                    data.media.photos.files.map((obj, index) => {

                                        photosData[index] = { photo_name: obj.filename, status: 1, isDelete: 0, module: 2 };
                                        // photosData[index] = { photo_name: obj.filename, createdBy: ObjectID(data.createdBy), status: 1, isDelete: 0, createdAt: new Date() };


                                        //for find by photo name and sotore it in photo module
                                        //let tempTag = undefined;
                                        let tempProductInfo = undefined;
                                        if (data.productInfo !== undefined && data.productInfo.length > 0) {
                                            let productInfoIndex = data.productInfo.map(e => { return e.reference; }).indexOf(obj.originalname);
                                            if (productInfoIndex !== -1) {
                                                tempProductInfo = data.productInfo[productInfoIndex];
                                                delete tempProductInfo.reference;
                                                photosData[index].productInfo = tempProductInfo;
                                            }
                                        }
                                    });

                                    console.log("photosDataphotosDataphotosDataphotosData:", photosData);

                                    data.media.photos.files = [];
                                    //for remove previoust set tags and productInfo for remove form news feed
                                    // delete data.tags;
                                    delete data.productInfo;
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
                                                photos.map(obj => {
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
                                    //for remove previoust set tags and productInfo for remove form news feed
                                    delete data.tags;
                                    cb(null);
                                }
                            },
                            // function (cb) {
                            //     //Store new videos in video model
                            //     //console.log("new videos data :",data.media.videos.files);

                            //     if (!!data.media && !!data.media.videos && !!data.media.videos.files && data.media.videos.files.length > 0) {
                            //         let videosData = [];
                            //         data.media.videos.files.map((obj, index) => {
                            //             let video_screenshot = obj.filename.split(".")[0] + ".jpg";
                            //             video_screenshot = video_screenshot.split("/");
                            //             video_screenshot = CONFIG.UPLOADS.DB_PATH_PHOTOS + video_screenshot[video_screenshot.length - 1];
                            //             videosData[index] = { user_id: userId, video_name: obj.filename, status: 1, isDelete: 0, module: 1 };
                            //         });

                            //         //console.log("videosDatavideosDatavideosDatavideosDatavideosData:",videosData);

                            //         data.media.videos.files = [];

                            //         VideoModel.createMany(videosData, function (err, videos) {
                            //             if (err) {
                            //                 //TODO: Log the error here
                            //                 cb(err);
                            //             } else {
                            //                 //console.log("here videos result after insert : ", videos);
                            //                 if (!!videos && videos.length > 0) {
                            //                     videos.map(obj => {
                            //                         data.media.videos.files.push(obj._id);
                            //                     });
                            //                 }
                            //                 cb(null);
                            //             }
                            //         });
                            //     } else {
                            //         if (data.media === undefined) {
                            //             data.media = {};
                            //         }
                            //         if (data.media.videos === undefined) {
                            //             data.media.videos = {};
                            //         }
                            //         data.media.videos.files = [];
                            //         cb(null);
                            //     }
                            // },
                            function (cb) {
                                //Merge new and remaining old photos and get deleted photos data
                                let oldPhotoIds = [];
                                let oldDeletedPhotos = [];
                                if (!!oldPost.media && !!oldPost.media.photos && oldPost.media.photos.files && oldPost.media.photos.files.length > 0) {

                                    //console.log("oldPost photo data >>>>>>>>>>>>>>>>>>>>>>>> :", oldPost.media.photos.files);
                                    //console.log("oldPost.media.photos.files :", oldPost.media.photos.files);

                                    oldPost.media.photos.files.map(oldPhotoObj => {
                                        let deletedPhotoObj;
                                        //console.log("oldPhotoObj :", oldPhotoObj);
                                        if (deletedPhotos !== undefined) {
                                            //console.log("deletedPhotos :", deletedPhotos);
                                            deletedPhotos.map(deletedPhotosObj => {
                                                //console.log("deletedPhotosObj :", deletedPhotosObj);
                                                if (deletedPhotosObj.toString() === oldPhotoObj._id.toString()) {
                                                    //console.log("oldPhotoObj @@@@@@@@:", oldPhotoObj);
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
                                    data.media.photos.files = oldPhotoIds.concat(data.media.photos.files);
                                    cb(null, oldDeletedPhotos);
                                } else {
                                    cb(null, oldDeletedPhotos);
                                }
                            },
                            // function (oldDeletedPhotos, cb) {
                            //     //Merge new and remaining old videos and get deleted videos data
                            //     let oldVideoIds = [];
                            //     let oldDeletedVideos = [];
                            //     if (!!oldPost.media && !!oldPost.media.videos && oldPost.media.videos.files && oldPost.media.videos.files.length > 0) {

                            //         //console.log("oldPost video data >>>>>>>>>>>>>>>>>>>>>>>> :", oldPost.media.videos.files);
                            //         //console.log("oldPost.media.videos.files :", oldPost.media.videos.files);

                            //         oldPost.media.videos.files.map(oldVideoObj => {
                            //             let deletedVideoObj;
                            //             //console.log("oldVideoObj :", oldVideoObj);
                            //             if (deletedVideos !== undefined) {
                            //                 //console.log("deletedVideos :", deletedVideos);
                            //                 deletedVideos.map(deletedVideosObj => {
                            //                     //console.log("deletedVideosObj :", deletedVideosObj);

                            //                     if (deletedVideosObj.toString() === oldVideoObj._id.toString()) {
                            //                         deletedVideoObj = oldVideoObj;
                            //                     }
                            //                 });
                            //             }
                            //             if (deletedVideoObj === undefined) {
                            //                 oldVideoIds.push(ObjectID(oldVideoObj._id));
                            //             } else {
                            //                 oldDeletedVideos.push(deletedVideoObj);
                            //             }
                            //         });

                            //         // console.log("final data.media.videos.files :", data.media.videos.files);
                            //         // console.log("final oldVideoIds :", oldVideoIds);
                            //         data.media.videos.files = oldVideoIds.concat(data.media.videos.files);
                            //         //console.log("final data.media.videos.files :", data.media.videos.files);
                            //         cb(null, oldDeletedPhotos, oldDeletedVideos);
                            //     } else {
                            //         cb(null, oldDeletedPhotos, oldDeletedVideos);
                            //     }
                            // },

                        ], function (err, oldDeletedPhotos, oldDeletedVideos) {
                            if (err) {
                                AppCode.Fail.error = err.message;
                                response.setError(AppCode.Fail);
                                response.send(res);
                            } else {
                                BlogModel.update(query, data, function (err, post) {
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

                                        //console.log("oldDeletedPhotos oldDeletedPhotos oldDeletedPhotos :",oldDeletedPhotos);

                                        //For remove old photos form directory and photo collection
                                        if (oldDeletedPhotos.length > 0) {
                                            oldDeletedPhotos.map(oldDeletedPhotosObj => {
                                                let photoName = oldDeletedPhotosObj.photo_name ? oldDeletedPhotosObj.photo_name : "";
                                                if (!!oldDeletedPhotosObj._id) {
                                                    PhotoModel.remove({ _id: ObjectID(oldDeletedPhotosObj._id) }, function (err, removedPhoto) { if (err) { } else { } });

                                                    imagePath = CONFIG.UPLOADS.ROOT_PATH + photoName;
                                                    //console.log("imagePath imagePath imagePath imagePath imagePath imagePath  : ", imagePath);

                                                    if (fs.existsSync(imagePath)) {
                                                        fs.unlink(imagePath, err => {
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

                                        //For remove old videos form directory and video collection
                                        // if (oldDeletedVideos.length > 0) {
                                        //     oldDeletedVideos.map(oldDeletedVideosObj => {
                                        //         let videoName = oldDeletedVideosObj.video_name ? oldDeletedVideosObj.video_name : "";
                                        //         let videoScreenshotName = oldDeletedVideosObj.video_screenshot ? oldDeletedVideosObj.video_screenshot : "";
                                        //         if (!!oldDeletedVideosObj._id) {
                                        //             VideoModel.remove({ _id: ObjectID(oldDeletedVideosObj._id) }, function (err, removedVideo) { if (err) { } else { } });

                                        //             videoPath = CONFIG.UPLOADS.ROOT_PATH + videoName;
                                        //             screenshotPath = CONFIG.UPLOADS.ROOT_PATH + videoScreenshotName;
                                        //             console.log("videoPath @@@@@@@@@ : ", videoPath);
                                        //             console.log("screenshotPath @@@@@@@@@ : ", screenshotPath);

                                        //             if (fs.existsSync(videoPath)) {
                                        //                 fs.unlink(videoPath, err => {
                                        //                     if (err) {
                                        //                         console.error(err);
                                        //                         return;
                                        //                     }
                                        //                     //file removed
                                        //                 });
                                        //             }
                                        //             if (fs.existsSync(screenshotPath)) {
                                        //                 fs.unlink(screenshotPath, err => {
                                        //                     if (err) {
                                        //                         console.error(err);
                                        //                         return;
                                        //                     }
                                        //                     //file removed
                                        //                 });
                                        //             }
                                        //         }
                                        //     });
                                        // }

                                        response.setData(AppCode.Success, post);
                                        response.send(res);

                                    }
                                });
                            }
                        });
                    } else {
                        AppCode.Fail.error = "No blog found";
                        response.setError(AppCode.Fail);
                        response.send(res);
                    }
                }
            });
    } else {
        response.setData(AppCode.PleaseLoginAgain, {});
        response.send(res);
    }
};


module.exports = BlogCtrl;