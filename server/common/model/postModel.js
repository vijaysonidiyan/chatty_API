const ModelBase = require("./modelBase");
const CONFIG = require("./../../config");
const _ = require("lodash");
const ObjectID = require("mongodb").ObjectID;

class Post extends ModelBase {
    constructor() {
        super(CONFIG.DB.MONGO.DB_NAME, "post", {
            userId: { type: Object, allowNullEmpty: false },
            content: { type: String, allowNullEmpty: true },
            media: { type: Object, allowNullEmpty: true },
            like: { type: Array, allowNullEmpty: true },
            comment: { type: Array, allowNullEmpty: true },
            locationName: { type: String, allowNullEmpty: true },
            location: { type: Array, allowNullEmpty: true },
            isDeleted: { type: Boolean, allowNullEmpty: true },
            isBigImage: { type: Boolean, allowNullEmpty: true },
            createdAt: { type: Object, allowNullEmpty: false },
            updatedAt: { type: Object, allowNullEmpty: true },
            status : {
                type: Number,
                allowNullEmpty: false,
                enum: { 1: "active", 2: "inactive" }

            },
            privacyStatus: {
                type: Number,
                allowNullEmpty: true,
                enum: { 1: "friends",  2: "everyone", 3: "onlyMe" }
            },
        });
    }

    /**
     * @param {*} data
     * @param {*} cb
     */
    create(data, cb) {
        if (!!data.user_id) {
            data.user_id = ObjectID(data.user_id);
        }
        if (!!data.isBigImage) {
            if (data.isBigImage == "true") {
                data.isBigImage=true;
            }     
            else{
                data.isBigImage=false;
            }
        }
        var err = this.validate(data);

        if (err) {
            return cb(err);
        }
        var self = this;
        data.createdAt = new Date();

        if (data.status === undefined) {
            data.status = 1;
        }
        self.insert(data, function (err, result) {

            if (err) {
                return cb(err);
            }

            cb(null, result.ops[0]);
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

    likeUnlike(query, updateQuery, cb) {
        var self = this;
        self.updateOne(query, updateQuery, function (err, post) {
            if (err) {
                return cb(err);
            }
            cb(null, post);
        });
    }
    update(query, data, cb) {
        if (!!data.user_id) {
            data.user_id = ObjectID(data.user_id);
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
                //after update find and then update postType (Note make these conditons same as create time condition)
                self.findOne(query, function (err, latestPost) {
                    if (err) {
                    } else {
                        if (latestPost !== null) {
                            cb(null, latestPost);
                        }
                        else {
                            cb(null, post);
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

    savePost(query, updateQuery, cb) {
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
    deletePost(query, updateQuery, cb) {
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
    Post: Post
};
