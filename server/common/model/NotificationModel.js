const ModelBase = require("./modelBase");
const CONFIG = require("./../../config");
const _ = require("lodash");
const { ObjectID } = require("bson");

class notificationModel extends ModelBase {
    constructor() {
        super(CONFIG.DB.MONGO.DB_NAME, "notification", {
            message: { type: String, allowNullEmpty: true },
            senderId: { type: Object, allowNullEmpty: false },
            reciverId: { type: Object, allowNullEmpty: false },
            status: {
                type: Number,
                allowNullEmpty: false,
                enum: { 1: "active", 2: "inactive" }
            },
            SehshionId: { type: Object, allowNullEmpty: true },
            postId: { type: Object, allowNullEmpty: true },
            commentId: { type: Object, allowNullEmpty: true },
            createdAt: { type: Object, allowNullEmpty: false },
            updatedAt: { type: Object, allowNullEmpty: false },
            isRead: { type: Boolean, allowNullEmpty: false },
            isView: { type: Boolean, allowNullEmpty: false },
            readAt: { type: Object, allowNullEmpty: true },
            type: { type: String, allowNullEmpty: true }
        });
    }

    /**
     * @description create Always return an unique id after inserting new user
     * @param {*} data
     * @param {*} cb
     */
    create(data, cb) {
        data.senderId = ObjectID(data.senderId);
        data.reciverId = ObjectID(data.reciverId);
        if (!!data.senderId) {
            data.senderId = ObjectID(data.senderId);
        }
        if (!!data.reciverId) {
            data.reciverId = ObjectID(data.reciverId);
        }
        if (!!data.SehshionId) {
            data.SehshionId = ObjectID(data.SehshionId);
        }
        if (!!data.postId) {
            data.postId = ObjectID(data.postId);
        }
        if (!!data.commentId) {
            data.commentId = ObjectID(data.commentId);
        }
        
        var err = this.validate(data);
        if (err) {
            return cb(err);
        }

        data.createdAt = new Date();
        data.isRead = false;
        data.isView = false;
        this.insert(data, (err, result) => {
            if (err) {
                return cb(err);
            }

            cb(null, result.ops[0]);
        });
    }

    find(conditions, options, cb) {
        this.getModel(function (err, model) {
            if (err) {
                return cb(err);
            }
            if (!_.isEmpty(options)) {
                const limit = (!_.isEmpty(options) && options.limit) ? options.limit : 20;
                const skip = options.skip ? options.skip : 0;
                const sort = options.sort ? options.sort : { _id: -1 };
                model.find(conditions).sort(options.sort).skip(options.skip).limit(options.limit).toArray(cb);
            } else {
                model.find(conditions).toArray(cb);
            }
        });
    }

    viewupdate(query, data, cb) {

        let err = this.validate(data);
        if (err) {
            return cb(err);
        }
        var self = this;
        data.updatedAt = new Date();

        self.updateMany(query, { $set: data }, function (err, industry) {
            if (err) {
                return cb(err);
            }
            cb(null, industry);
        });
    }
    readupdate(query, data, cb) {

        let err = this.validate(data);
        if (err) {
            return cb(err);
        }
        var self = this;
        data.updatedAt = new Date();
        data.readAt = new Date();
        self.updateOne(query, { $set: data }, function (err, industry) {
            if (err) {
                return cb(err);
            }

            cb(null, industry);
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
                const sort = options.sort ? options.sort : { createdAt: -1 };
                model.aggregate(query).sort(sort).skip(skip).limit(limit).toArray(cb);
            } else {
                model.aggregate(query).toArray(cb);
            }
        });
    }
    aggregate(query, cb) {
        // do a validation with this.schema
        this.getModel(function (err, model) {
            if (err) {
                return cb(err);
            }
            model.aggregate(query).toArray(cb);
        });
    }
}

module.exports = notificationModel;