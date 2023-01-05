const ModelBase = require("./modelBase");
const CONFIG = require("./../../config");
const _ = require("lodash");
const { ObjectID } = require("bson");

class imageModel extends ModelBase {
    constructor() {
        super(CONFIG.DB.MONGO.DB_NAME, "images", {
            profile_image: { type: String, allowNullEmpty: true },
        });
    }

    /**
     * @description create Always return an unique id after inserting new user
     * @param {*} data
     * @param {*} cb
     */
    create(data, cb) {


        if (!!data.sender_id) {
            data.sender_id = ObjectID(data.sender_id);
        }
        if (!!data.reciver_id) {
            data.reciver_id = ObjectID(data.reciver_id);
        }
        if (!!data.postId) {
            data.postId = ObjectID(data.postId);
        }
        console.log("DATTATATATATTATA",data)
        var err = this.validate(data);
        if (err) {
            return cb(err);
        }

        data.createdAt = new Date();;

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
                const limit = (!_.isEmpty(options) && options.limit) ? options.limit : 20000000000000;
                const skip = options.skip ? options.skip : 0;
                const sort = options.sort ? options.sort : { _id: -1 };
                model.find(conditions).sort(options.sort).skip(options.skip).limit(options.limit).toArray(cb);
            } else {
                model.find(conditions).toArray(cb);
            }
        });
    }

    advancedAggregate(query, options, cb) {
        // do a validation with this.schema
        this.getModel(function (err, model) {
            if (err) {
                return cb(err);
            }
            if (!_.isEmpty(options)) {
                const limit = (!_.isEmpty(options) && options.limit) ? options.limit : 200000000;
                const skip = options.skip ? options.skip : 0;
                const sort = options.sort ? options.sort : { createdAt: 1 };
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
    updateIsRead(query, data, cb) {
        // do a validation with this.schema
        this.getModel(function (err, model) {
            if (err) {
                return cb(err);
            }
            model.updateMany(query, data, cb);
        });
    }
}

module.exports = imageModel;