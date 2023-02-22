const ModelBase = require("./modelBase");
const CONFIG = require("./../../config");
const _ = require("lodash");
const ObjectID = require("mongodb").ObjectID;

class Story extends ModelBase {
    constructor() {
        super(CONFIG.DB.MONGO.DB_NAME, "story", {
            photos: { type: Array, allowNullEmpty: true },
            photo_name:{type: String, allowNullEmpty: true},
            video_name:{type: String, allowNullEmpty: true},
            originalname:{type: String, allowNullEmpty: true},
            document_name:{type: String, allowNullEmpty: true},
            videos: { type: Array, allowNullEmpty: true },
            type: {
                type: Number,
                allowNullEmpty: false,
                enum: { 1: "photo", 2: "video",3:"document" }
            },
            documents: { type: Array, allowNullEmpty: true },  
            thumbnail:{type:Array, allowNullEmpty: true },   
            ext:{type:Array, allowNullEmpty: true},  
            mimetype:{type:Array, allowNullEmpty: true} ,
            size:{type:Number, allowNullEmpty: true},
            createdBy:{type: Object, allowNullEmpty: false },
            createdAt: { type: Object, allowNullEmpty: false },
            expiredAt: { type: Object, allowNullEmpty: false },
            updatedAt: { type: Object, allowNullEmpty: true },
            userId:{type: Object, allowNullEmpty: true },
            status: {
                type: Number,
                allowNullEmpty: false,
                enum: { 1: "active", 2: "inactive" }
            },
           
        });
    }

    /**
     * @param {*} data
     * @param {*} cb
     */
    // create(data, cb) {
    //     if (!!data.user_id) {
    //         data.user_id = ObjectID(data.user_id);
    //     }
    //     var err = this.validate(data);

    //     if (err) {
    //         return cb(err);
    //     }
    //     var id = [data.content];
    //     var self = this;
    //     data.createdAt = new Date();

    //     //Find and then update postType (Note make these conditons same as update time condition)
    //     // if (!!data.content) {
    //     //     data.postType = 1;
    //     //     if (!_.isEmpty(data.media) && !_.isEmpty(data.media.photos) && !_.isEmpty(data.media.photos.files) && data.media.photos.files.length === 1) {
    //     //         data.postType = 2;
    //     //     }
    //     //     if (!_.isEmpty(data.media) && !_.isEmpty(data.media.photos) && !_.isEmpty(data.media.photos.files) && data.media.photos.files.length > 1) {
    //     //         data.postType = 7;
    //     //     }


    //     //     if (!_.isEmpty(data.url_site_meta_info)) {
    //     //         data.postType = 12;
    //     //     }
    //     //     if (!_.isEmpty(data.media) && !_.isEmpty(data.media.videos) && !_.isEmpty(data.media.videos.files) && data.media.videos.files.length === 1) {
    //     //         data.postType = 13;
    //     //     }

    //     //     if (!_.isEmpty(data.media) && !_.isEmpty(data.media.videos) && !_.isEmpty(data.media.videos.files) && data.media.videos.files.length > 1) {
    //     //         data.postType = 23;
    //     //     }

    //     //     if (!_.isEmpty(data.documents) && !_.isEmpty(data.documents.files) && data.documents.files.length === 1) {
    //     //         data.postType = 16;
    //     //     }

    //     //     if (!_.isEmpty(data.documents) && !_.isEmpty(data.documents.files) && data.documents.files.length > 1) {
    //     //         data.postType = 22;
    //     //     }


    //     //     if (!_.isEmpty(data.media) && !_.isEmpty(data.media.photos) && !_.isEmpty(data.media.photos.files) && data.media.photos.files.length > 0 && !_.isEmpty(data.media) && !_.isEmpty(data.media.videos) && !_.isEmpty(data.media.videos.files) && data.media.videos.files.length > 0) {
    //     //         data.postType = 14;
    //     //     }

    //     // } else if (!_.isEmpty(data.media) && !_.isEmpty(data.media.photos) && !_.isEmpty(data.media.photos.files) && data.media.photos.files.length > 0 && !_.isEmpty(data.media) && !_.isEmpty(data.media.videos) && !_.isEmpty(data.media.videos.files) && data.media.videos.files.length > 0) {
    //     //     data.postType = 8;
    //     // } else if (!_.isEmpty(data.media) && !_.isEmpty(data.media.videos) && !_.isEmpty(data.media.videos.files) && data.media.videos.files.length === 1) {
    //     //     data.postType = 9;
    //     // } else if (!_.isEmpty(data.documents) && !_.isEmpty(data.documents.files) && data.documents.files.length === 1) {
    //     //     data.postType = 10;
    //     // } else if (!_.isEmpty(data.documents) && !_.isEmpty(data.documents.files) && data.documents.files.length > 1) {
    //     //     data.postType = 15;
    //     // } else if (!_.isEmpty(data.media) && !_.isEmpty(data.media.photos) && !_.isEmpty(data.media.photos.files) && data.media.photos.files.length === 1) {
    //     //     data.postType = 19;
    //     // } else if (!_.isEmpty(data.media) && !_.isEmpty(data.media.photos) && !_.isEmpty(data.media.photos.files) && data.media.photos.files.length > 1) {
    //     //     data.postType = 20;
    //     // } else if (!_.isEmpty(data.media) && !_.isEmpty(data.media.videos) && !_.isEmpty(data.media.videos.files) && data.media.videos.files.length > 1) {
    //     //     data.postType = 21
    //     // }

    //     self.insert(data, function (err, result) {

    //         if (err) {
    //             return cb(err);
    //         }

    //         cb(null, result.ops[0]);
    //     });
    // }

    create(data, cb) {


      
        var err = this.validate(data);
        if (err) {
            return cb(err);
        }
        data.status=1
        data.createdAt = new Date();;

        this.insert(data, (err, result) => {
            if (err) {
                return cb(err);
            }

            cb(null, result.ops[0]);
        });
    }
    createMany(data, cb) {

        var self = this;
        
        data.createdAt = new Date();;
        data.status = 1;
        //data.createdAt = new Date();;
        var currentTime = new Date();
        currentTime.setHours(currentTime.getHours() + 24);
        data.expiredAt = new Date();;
        console.log("expiredAtexpiredAtexpiredAtexpiredAtexpiredAtexpiredAtexpiredAtexpiredAtexpiredAt",data.expiredAt);
        // currentTime.setMinutes(currentTime.getMinutes() + 3);
        // data.expiredAt = currentTime;

        self.insertMany(data, function (err, result) {
            if (err) {
                return cb(err);
            }
            cb(null, result.ops);
        });
    }

    update(query, data, cb) {
        if (!!data.user_id) {
            data.user_id = ObjectID(data.user_id);
        }

        if (!!data.page_owner_user_id) {
            data.page_owner_user_id = ObjectID(data.page_owner_user_id);
        }

        if (!!data.privacy) {
            data.privacy = parseInt(data.privacy);
        } else {
            data.privacy = 5;
        }

        if (!!data.fromIndustry) {
            data.fromIndustry = ObjectID(data.fromIndustry);
        }

        if (!!data.toIndustry) {
            data.toIndustry = ObjectID(data.toIndustry);
        }

        var err = this.validate(data);
        if (err) {
            return cb(err);
        }

        var id = [data.content];
        data.updatedAt = new Date();

        // if(!!data.user_id){
        //   data.user_id = ObjectID(data.user_id);
        // }

        var self = this;
        self.updateOne(query, { $set: data }, function (err, post) {
            if (err) {
                return cb(err);
            } else {
                //after update send response back
                cb(null, post);
                //after update find and then update postType (Note make these conditons same as create time condition)
                self.findOne(query, function (err, latestPost) {
                    if (err) {
                    } else {
                        if (latestPost !== null) {
                            if (!_.isEmpty(latestPost.content)) {
                                latestPost.postType = 1;
                                if (!_.isEmpty(latestPost.media) && !_.isEmpty(latestPost.media.photos) && !_.isEmpty(latestPost.media.photos.files) && latestPost.media.photos.files.length === 1) {
                                    latestPost.postType = 2;
                                }
                                if (!_.isEmpty(latestPost.media) && !_.isEmpty(latestPost.media.photos) && !_.isEmpty(latestPost.media.photos.files) && latestPost.media.photos.files.length > 1) {
                                    latestPost.postType = 7;
                                }

                                if (!_.isEmpty(latestPost.url_site_meta_info)) {
                                    latestPost.postType = 12;
                                }
                                if (!_.isEmpty(latestPost.media) && !_.isEmpty(latestPost.media.videos) && !_.isEmpty(latestPost.media.videos.files) && latestPost.media.videos.files.length === 1) {
                                    latestPost.postType = 13;
                                }
 
                                if (!_.isEmpty(latestPost.media) && !_.isEmpty(latestPost.media.videos) && !_.isEmpty(latestPost.media.videos.files) && latestPost.media.videos.files.length > 1) {
                                    latestPost.postType = 23;
                                }

                                if (!_.isEmpty(latestPost.documents) && !_.isEmpty(latestPost.documents.files) && latestPost.documents.files.length === 1) {
                                    latestPost.postType = 16;
                                }

                                if (!_.isEmpty(latestPost.documents) && !_.isEmpty(latestPost.documents.files) && latestPost.documents.files.length > 1) {
                                    latestPost.postType = 22;
                                }

                                if (!_.isEmpty(latestPost.media) && !_.isEmpty(latestPost.media.photos) && !_.isEmpty(latestPost.media.photos.files) && latestPost.media.photos.files.length > 0 && !_.isEmpty(latestPost.media) && !_.isEmpty(latestPost.media.videos) && !_.isEmpty(latestPost.media.videos.files) && latestPost.media.videos.files.length > 0) {
                                    latestPost.postType = 14;
                                }
                            } else if (!_.isEmpty(latestPost.media) && !_.isEmpty(latestPost.media.photos) && !_.isEmpty(latestPost.media.photos.files) && latestPost.media.photos.files.length > 0) {
                                latestPost.postType = 8;
                            } else if (!_.isEmpty(latestPost.media) && !_.isEmpty(latestPost.media.videos) && !_.isEmpty(latestPost.media.videos.files) && latestPost.media.videos.files.length === 1) {
                                latestPost.postType = 9;
                            } else if (!_.isEmpty(latestPost.documents) && !_.isEmpty(latestPost.documents.files) && latestPost.documents.files.length === 1) {
                                latestPost.postType = 10;
                            } else if (!_.isEmpty(latestPost.documents) && !_.isEmpty(latestPost.documents.files) && latestPost.documents.files.length > 1) {
                                latestPost.postType = 15;
                            } else if (!_.isEmpty(latestPost.media) && !_.isEmpty(latestPost.media.photos) && !_.isEmpty(latestPost.media.photos.files) && latestPost.media.photos.files.length === 1) {
                                latestPost.postType = 19;
                            } else if (!_.isEmpty(latestPost.media) && !_.isEmpty(latestPost.media.photos) && !_.isEmpty(latestPost.media.photos.files) && latestPost.media.photos.files.length > 1) {
                                latestPost.postType = 20;
                            } else if (!_.isEmpty(latestPost.media) && !_.isEmpty(latestPost.media.videos) && !_.isEmpty(latestPost.media.videos.files) && latestPost.media.videos.files.length > 1) {
                                latestPost.postType = 21;
                            }

                            self.updateOne(query, { $set: { postType: latestPost.postType } }, function (err, post) { if (err) { } else { } });


                            let updateSharedPostObj = {};
                            updateSharedPostObj.content = latestPost.content;
                            updateSharedPostObj.media = latestPost.media;
                            updateSharedPostObj.documents = latestPost.documents;
                            updateSharedPostObj.checkIn = latestPost.checkIn;
                            updateSharedPostObj.url = latestPost.url;
                            updateSharedPostObj.url_site_meta_info = latestPost.url_site_meta_info;

                            self.updateMany({ share_main_post_id: latestPost._id }, { $set: updateSharedPostObj }, function (err, post) { if (err) { } else { } });
                        }
                    }
                });
            }
        });
    }


    updateAllSharedPost(query, updateQuery, cb) {
        var self = this;
        self.updateMany(query, { $set: updateQuery }, function (err, post) {
            if (err) {
                return cb(err);
            }
            cb(null, post);
        });
    }

    likeUnlike(query, updateQuery, cb) {
        var self = this;
        self.updateOne(query, updateQuery, function (err, post) {
            if (err) {
                return cb(err);
            }
            cb(null, post);
        });
    }

    addCommentReply(query, updateQuery, cb) {
        var self = this;
        self.updateOne(query, updateQuery, function (err, post) {
            if (err) {
                return cb(err);
            }
            cb(null, post);
        });
    }

    incDecShareCounter(query, incDecField, type, cb) {
        var self = this;

        let incDecVal = 0;
        if (type === "increment") {
            incDecVal = 1;
        } else if (type === "decrement") {
            incDecVal = -1;
        }

        let updateField = {};
        updateField[incDecField] = incDecVal;

        self.updateOne(query, { $inc: updateField }, function (err, updatedPostRes) {
            if (err) {
                return cb(err);
            }
            cb(null, updatedPostRes);
        });
    }

    hidePost(query, updateQuery, cb) {
        var self = this;
        self.updateOne(query, updateQuery, function (err, post) {
            if (err) {
                return cb(err);
            }
            cb(null, post);
        });
    }
}

module.exports = {
    Story: Story
};
