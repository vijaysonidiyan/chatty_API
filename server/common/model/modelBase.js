const CONFIG = require("./../../config");
const _ = require("lodash");
const customError = require("./../error/customError");

class ModelBase {
    constructor(dbName, collectionName, schema) {
        this.dbName = dbName;
        this.collectionName = collectionName;
        this.schema = schema;
    }

    getModel(cb) {
        global.mongoCon.db(this.dbName).collection(this.collectionName, cb);
    }

    insert(data, cb) {
        this.getModel(function (err, model) {
            if (err) {
                return cb(err);
            }
            model.insertOne(data, cb);
        });
    }

    insertMany(data, cb) {
        this.getModel(function (err, model) {
            if (err) {
                return cb(err);
            }
            model.insertMany(data, cb);
        });
    }

    count(query, cb) {
        this.getModel(function (err, model) {
            if (err) {
                return cb(err);
            }
            model.countDocuments(query, cb);
        });
    }

    updateOne(query, data, cb) {
        this.getModel(function (err, model) {
            if (err) {
                return cb(err);
            }
            model.updateOne(query, data, cb);
        });
    }

    updateMany(query, data, cb) {
        this.getModel(function (err, model) {
            if (err) {
                return cb(err);
            }
            model.updateMany(query, data, cb);
        });
    }

    findOne(conditions, projection, options, callback) {
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
        this.getModel(function (err, model) {
            if (err) {
                return callback(err);
            }
            model.findOne(conditions, projectionAndOpt, callback);
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
        this.getModel(function (err, model) {
            if (err) {
                return callback(err);
            }

            model.find(conditions).project(projection).sort(options.sort).skip(options.skip).limit(options.limit).toArray(callback);
        });
    }

    aggregate(query, cb) {
        this.getModel(function (err, model) {
            if (err) {
                return cb(err);
            }
            model.aggregate(query).toArray(cb);
        });
    }

    advancedAggregate(query, options, cb) {
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

    remove(query, cb) {
        this.getModel(function (err, model) {
            if (err) {
                return cb(err);
            }
            model.deleteOne(query, cb);
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

    /**
     * @description Validate data based on entire schema
     * @param {*} data
     */
    validate(data) {
        var self = this;

        for (var key in data) {
            let scm = self.schema[key];
            let val = data[key];

            if (
                val === "" ||
                val === null ||
                val === undefined ||
                val === [] ||
                val === {}
            ) {
                if (scm === undefined) {
                    return new customError.InvalidInputError(
                        "field " + key + " not exist"
                    );
                }

                if (!scm.allowNullEmpty) {
                    return new customError.InvalidInputError(
                        key + " should not be empty"
                    );
                }
            } else {
                if (scm === undefined) {
                    return new customError.InvalidInputError(
                        "field " + key + " not exist"
                    );
                }
                if (
                    !_.isObject(val) &&
                    /^\d+$/.test(val) &&
                    scm.type.name.toString().toLowerCase() === "number"
                ) {
                    val = parseInt(val);
                }

                if (!(typeof val === scm.type.name.toString().toLowerCase())) {
                    if (_.isArray(val)) {
                        if ("array" !== scm.type.name.toString().toLowerCase()) {
                            return new customError.InvalidInputError(
                                key + " should not be empty"
                            );
                        }
                    } else if (_.isObject(val)) {
                        if ("object" !== scm.type.name.toString().toLowerCase()) {
                            return new customError.InvalidInputError(
                                key + " should not be empty"
                            );
                        }
                    } else {
                        return new customError.InvalidInputError(
                            key + " should be type of " + scm.type.name
                        );
                    }
                } else if (scm.enum && !scm.enum[val]) {
                    return new customError.InvalidInputError(
                        key + " should be type of supported type"
                    );
                } else if (scm.regex && !scm.regex.test(String(val).toLowerCase())) {
                    return new customError.InvalidInputError(
                        val + " is not a valid " + key
                    );
                }
            }
        }
    }

    /**
     *
     * @param {*} data
     * @param {Array} fields
     */
    oneOfTheFieldMustPresent(data, fields) {
        var f = false;
        var isFieledAvailable = false;
        for (let idx = 0; idx < fields.length; idx++) {
            f = f || !_.isEmpty(data[fields[idx]]);
            var val = data[fields[idx]];
            if (
                val === "" ||
                val === null ||
                val === undefined ||
                val === [] ||
                val === {}
            ) {
            } else {
                isFieledAvailable = true;
            }
        }

        if (!isFieledAvailable)
            return new customError.InvalidInputError(
                "one of the fields " + fields.join(", ") + " should exist"
            );
    }

    /**
     *
     * @param {*} data
     * @param {Array} fields
     */
    validateNotEmptyFields(data, fields) {
        for (let idx = 1; idx < fields.length; idx++) {
            if (_.isEmpty(data[fields[idx]])) {
                return new customError.InvalidInputError(
                    fields[idx] + " should not be empty"
                );
            }
        }
    }

    /**
     *
     * @param {*} data
     * @param {Array} fields
     */
    validateNumberFields(data, fields) {
        for (let idx = 0; idx < fields.length; idx++) {
            if (!_.isNumber(data[fields[idx]])) {
                return new customError.InvalidInputError(
                    fields[idx] + " should be a number"
                );
            }
        }
    }

    /**
     *
     * @param {*} data
     * @param {Array} fields
     */
    validateBooleanFields(data, fields) {
        for (let idx = 1; idx < fields.length; idx++) {
            if (!_.isBoolean(data[fields[idx]])) {
                return new customError.InvalidInputError(
                    fields[idx] + " should be a bool"
                );
            }
        }
    }
}

module.exports = ModelBase;
