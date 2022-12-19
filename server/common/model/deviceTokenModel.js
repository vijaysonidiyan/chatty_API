const ModelBase = require("./modelBase");
const CONFIG = require("./../../config");
const _ = require("lodash")

class deviceTokenModel extends ModelBase {
    constructor() {
        super(CONFIG.DB.MONGO.DB_NAME, "deviceToken", {
            deviceToken: { type: String, allowNullEmpty: false },
            deviceType: { type: Number, allowNullEmpty: false },
            deviceId: { type: String, allowNullEmpty: false },
            userId: { type: Object, allowNullEmpty: false },
            createdAt: { type: Object, allowNullEmpty: false },
            updatedAt: { type: Object, allowNullEmpty: false }
        });
    }

    /**
     * @description create Always return an unique id after inserting new user
     * @param {*} data
     * @param {*} cb
     */
    create(data, cb) {
        console.log(data);
        var err = this.validate(data);

        if (err) {
            return cb(err);
        }

        data.createdAt = new Date();

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
                model.aggregate(query).skip(skip).limit(limit).sort(sort).toArray(cb);
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
            model.aggregate(query).sort({ createdAt: -1 }).toArray(cb);
        });
    }
    remove(query, cb) {
        // do a validation with this.schema
        this.getModel(function (err, model) {
            if (err) {
                return cb(err);
            }
            model.deleteOne(query, cb);
        });
    }

    update(query, data, cb) {
        var err = this.validate(data);
        if (err) {
            return cb(err);
        }

        data.updatedAt = new Date();

        var self = this;
        self.updateOne(query, { $set: data }, function (err, result) {
            if (err) {
                return cb(err);
            }

            cb(null, result);
        });
    }

    // removeMany(query, cb) {
    //     console.log('queryyyyyy', query)
    //     // do a validation with this.schema
    //     this.getModel(function (err, model) {
    //         if (err) {
    //             return cb(err);
    //         }

    //         model.deleteMany(query, cb);
    //     });
    // }
}

module.exports = deviceTokenModel;