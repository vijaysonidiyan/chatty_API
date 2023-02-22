const ModelBase = require("./modelBase");
const CONFIG = require("../../config");
const _ = require("lodash");
const { ObjectID } = require("mongodb");

class userWiseVerifiedUserModel extends ModelBase {
    constructor() {
        super(CONFIG.DB.MONGO.DB_NAME, "userWiseVerifiedUser", {
            userId: { type: Object, allowNullEmpty: true },
            mobileNo: { type: String, allowNullEmpty: true },
            isverified: { type: Boolean, allowNullEmpty: true },
            userName: { type: String, allowNullEmpty: true },
            status: {
                type: Number,
                allowNullEmpty: false,
                enum: { 1: "active", 2: "inactive" }
            },
        });
    }

    /**
     * @description create Always return an unique id after inserting new user
     * @param {*} data
     * @param {*} cb
     */
    create(data, cb) {
        console.log(data)
        // if(!!data.parentId)
        // {
        //     data.parentId=ObjectID(data.parentId)
        // }
        // if (!!data.parentId) {

        //     data.parentId = ObjectID(data.parentId)
        // } else {
        //     delete data.parentId
        // }

        var err = this.validate(data);

        if (err) {
            return cb(err);
        }

        data.createdAt = new Date();
        data.status = 1;
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

        self.insertMany(data, function (err, result) {
            if (err) {
                return cb(err);
            }
            cb(null, result.ops);
        });
    }

    update(query, data, cb) {
        console.log(data)
        // if (!!data.parentId) {

        //     data.parentId = ObjectID(data.parentId)
        // } else {
        //     delete data.parentId
        // }
        if (!!data.updatedBy) {
            data.updatedBy = ObjectID(data.updatedBy)
        }
        // data.birthDate = new Date(data.birthDate);

        console.log(data);

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

    removeMany(query, cb) {
        console.log('queryyyyyy', query)
        this.getModel(function (err, model) {
            if (err) {
                return cb(err);
            }
            model.deleteMany(query, cb);
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
            model.aggregate(query).toArray(cb);
        });
    }
}

module.exports = userWiseVerifiedUserModel;