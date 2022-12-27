const ModelBase = require("./modelBase");
const CONFIG = require("./../../config");
const ObjectID = require("mongodb").ObjectID;

const _ = require("lodash");

class Photo extends ModelBase {
    constructor() {
        super(CONFIG.DB.MONGO.DB_NAME, "photo", {
            //id: { type: String, allowNullEmpty: false },
            user_id: { type: Object, allowNullEmpty: false },
            photo_name: { type: String, allowNullEmpty: false },
            photo_description: { type: String, allowNullEmpty: false },
            thumbnail: { type: String, allowNullEmpty: false },
            isSquareImage: { type: Boolean, allowNullEmpty: true },
            tags: { type: Array, allowNullEmpty: false },
            module: {
                type: Number,
                allowNullEmpty: false,
                enum: { 1: "post", 2: "profile_photo", 3: "comment", 4: "reply", 5: "function_photo",6:"Story" }
            },
            like: { type: Array, allowNullEmpty: true },
            comment: { type: Array, allowNullEmpty: true },
            status: {
                type: Number,
                allowNullEmpty: false,
                enum: { 1: "active", 2: "inactive" }
            },
            isDelete: {
                type: Number,
                allowNullEmpty: false,
                enum: { 0: "non-deleted", 1: "deleted" }
            },
            type: {
                type: String,
                allowNullEmpty: false,
                enum: { 1: "photo", 2: "video" }
            },
            video_screenshot: { type: String, allowNullEmpty: true },
            createdAt: { type: Object, allowNullEmpty: false },
            updatedAt: { type: Object, allowNullEmpty: true },
            albumType: { type: Number, allowNullEmpty: true }
        });
    }

    /**
     * @param {*} data
     * @param {*} cb
     */
    createMany(data, cb) {
        var id = [data.content];
        var self = this;
        //data.createdAt = new Date();;

        self.insertMany(data, function (err, result) {
            if (err) {
                return cb(err);
            }
            cb(null, result.ops);
        });
    }

    /**
     * @param {*} data
     * @param {*} cb
     */
    create(data, cb) {
        var err = this.validate(data);

        if (err) {
            return cb(err);
        }

        var id = [data.content];
        var self = this;
        data.createdAt = new Date();;

        if (!!data.user_id) {
            data.user_id = ObjectID(data.user_id);
        }

        self.insert(data, function (err, result) {
            if (err) {
                return cb(err);
            }

            cb(null, result.ops[0]);
        });
    }

    update(query, data, cb) {
        if (!!data.user_id) {
            data.user_id = ObjectID(data.user_id);
        }

        // var err = this.validate(data);
        // if (err) {
        //     return cb(err);
        // }

        var id = [data.content];
        data.updatedAt = new Date();;

        // if(!!data.user_id){
        //   data.user_id = ObjectID(data.user_id);
        // }

        var self = this;
        console.log("data :::::::", data);
        self.updateOne(query, { $set: data }, function (err, result) {
            if (err) {
                return cb(err);
            }

            cb(null, result);
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

    advancedAggregate(query, options, cb) {
        // do a validation with this.schema
        this.getModel(function (err, model) {
            if (err) {
                return cb(err);
            }
            if (!_.isEmpty(options)) {
                const limit = (!_.isEmpty(options) && options.limit) ? options.limit : 20;
                const skip = options.skip ? options.skip : 0;
                const sort = options.sort ? options.sort : { _id: -1 };
                model.aggregate(query).sort(sort).skip(skip).limit(limit).toArray(cb);
            } else {
                model.aggregate(query).toArray(cb);
            }
        });
    }

}

module.exports = {
    Photo: Photo
};
