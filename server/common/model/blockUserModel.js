const ModelBase = require("./modelBase");
const CONFIG = require("../../config");
const _ = require("lodash");


class blockUserModel extends ModelBase {


    constructor() {
        super(CONFIG.DB.MONGO.DB_NAME, "blockedUser", {
            userId: { type: Object, allowNullEmpty: false },
            blockedUserId: { type: Object, allowNullEmpty: true },//blockuserId
            isBlock:{type: Boolean, allowNullEmpty: true},
            status: {
                type: Number,
                allowNullEmpty: false,
                enum: { 1: "bolck", 2: "blocked" } //block = user block other User // blocked = which is blocked by someone
            },
            createdAt: { type: Object, allowNullEmpty: true }
        });
    }


    /**
     * @description create Always return an unique id after inserting new user
     * @param {*} data
     * @param {*} cb
     */
    create(data, cb) {
        var err = this.validate(data);

        if (err) {
            return cb(err);
        }

        data.createdAt = new Date();
       // data.startDate = data.createdAt;


        if (data.status === undefined) {
            data.status = 1;
        }
        this.insert(data, (err, result) => {
            if (err) {
                return cb(err);
            }

            cb(null, result.ops[0]);
        });
    }

    aggregate(query, options, cb) {
        // do a validation with this.schema
        this.getModel(function (err, model) {
            if (err) {
                return cb(err);
            }
            const limit = (!_.isEmpty(options) && options.limit) ? options.limit : 20;
            const skip = options.skip ? options.skip : 0;
            const sort = options.sort ? options.sort : { createdAt: -1 };
            model.aggregate(query).skip(skip).limit(limit).sort(sort).toArray(cb);
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
                model.aggregate(query).skip(skip).limit(limit).sort(sort).toArray(cb);
            } else {
                model.aggregate(query).toArray(cb);
            }
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
}

module.exports = blockUserModel;
