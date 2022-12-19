const ModelBase = require("./modelBase");
const CONFIG = require("../../config");
const _ = require("lodash")
const { ObjectID } = require("mongodb");


class blogModel extends ModelBase {
    constructor() {
        super(CONFIG.DB.MONGO.DB_NAME, "Blog", {
            title: { type: String, allowNullEmpty: false },
            slug: { type: String, allowNullEmpty: false },
            quantity: { type: String, allowNullEmpty: false },
            metaTitle: { type: String, allowNullEmpty: false },
            metaDescription: { type: String, allowNullEmpty: false },
            metaKeyword: { type: String, allowNullEmpty: false },
            shortDescription: { type: String, allowNullEmpty: false },
            longDescription: { type: String, allowNullEmpty: false },
            media: { type: Object, allowNullEmpty: true },
            Image: { type: String, allowNullEmpty: true },
            updatedBy: { type: Object, allowNullEmpty: false },
            createdBy: { type: Object, allowNullEmpty: false },
            status: {
                type: Number,
                allowNullEmpty: false,
                enum: { 1: "active", 2: "inactive" }
            },
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
        console.log(data)
        var err = this.validate(data);
        console.log(data)
        if (err) {
            return cb(err);
        }
        console.log(data)
        var self = this;
        data.status = 1;
        data.createdAt = new Date();




        self.insert(data, function (err, user) {
            if (err) {
                return cb(err);
            }
            delete user.ops[0].pwd;

            cb(null, user.ops[0]);
        });

    }

    find(conditions, projection, options, callback) {
        if (typeof conditions === 'function') {
            callback = conditions;
            conditions = null;
            projection = null;
            options = {};
        } else if (typeof projection === 'function') {
            callback = projection;
            options = {};
            projection = null;
        } else if (typeof options === 'function') {
            callback = options;
            options = {};
        }

        if (options.sort === undefined) {
            options.sort = {};
        }
        if (options.skip === undefined) {
            options.skip = 0;
        }
        if (options.limit === undefined) {
            options.limit = 0;
        }

        // do a validation with this.schema
        this.getModel(function (err, model) {
            if (err) {
                return callback(err);
            }

            model.find(conditions).project(projection).sort(options.sort).skip(options.skip).limit(options.limit).toArray(callback);
        });
    }

    findOne(conditions, projection, options, callback) {
        // if (typeof conditions === 'function') {
        //     callback = conditions;
        //     conditions = null;
        //     projection = null;
        // } else if (typeof projection === 'function') {
        //     callback = projection;
        //     projection = null;
        // }

        if (typeof conditions === 'function') {
            callback = conditions;
            conditions = null;
            projection = null;
            options = {};
        } else if (typeof projection === 'function') {
            callback = projection;
            options = {};
            projection = null;
        } else if (typeof options === 'function') {
            callback = options;
            options = {};
        }

        let projectionAndOpt = { fields: projection };
        if (!!options && typeof options !== 'function' && options.sort !== undefined) {
            projectionAndOpt.sort = options.sort;
        }

        // do a validation with this.schema
        this.getModel(function (err, model) {
            if (err) {
                return callback(err);
            }
            model.findOne(conditions, projectionAndOpt, callback);
            //model.findOne(conditions, { fields: projection }, callback);
        });
    }

    update(query, data, cb) {
        if (!!data.updatedBy) {
            data.updatedBy = ObjectID(data.updatedBy);
        }

        var err = this.validate(data);
        if (err) {
            return cb(err);
        }

        data.updatedAt = new Date();
        console.log(data)
        var self = this;
        self.updateOne(query, { $set: data }, function (err, result) {
            if (err) {
                return cb(err);
            }
            cb(null, result);
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

module.exports = blogModel;