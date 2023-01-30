const ModelBase = require("./modelBase");
const CONFIG = require("./../../config");
const _ = require("lodash");
const { ObjectID } = require("bson");

class mediaModel extends ModelBase {
    constructor() {
        super(CONFIG.DB.MONGO.DB_NAME, "media", {
            photos: { type: Array, allowNullEmpty: true },
            videos: { type: Array, allowNullEmpty: true },
            documents: { type: Array, allowNullEmpty: true },  
            thumbnail:{type:Array, allowNullEmpty: true },      
            createdAt: { type: Object, allowNullEmpty: false },
            updatedAt: { type: Object, allowNullEmpty: true },
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

        self.insertMany(data, function (err, result) {
            if (err) {
                return cb(err);
            }
            cb(null, result.ops);
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

module.exports = mediaModel;