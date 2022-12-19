(function () {
    'use strict';
    const _ = require('lodash');
    const path = require('path');
    let CONST = require('./../common/constant/basic.json');
    let CONF_ALL = require('./all.json');
    let CONF_PROD = require('./production.json');
    let CONF_DEV = require('./development.json');
    let CONF_STAG = require('./staging.json');
    let CONF;

    if (_.isUndefined(process.env.NODE_ENV)) {
        process.env.NODE_ENV = CONST.ENV.DEVELOPMENT;
    }

    switch (process.env.NODE_ENV) {
        case CONST.ENV.PRODUCTION:
            CONF = Object.assign(Object.assign(CONST, CONF_ALL), CONF_PROD);
            break;
        case CONST.ENV.DEVELOPMENT:
            CONF = Object.assign(Object.assign(CONST, CONF_ALL), CONF_DEV);
            break;
        case CONST.ENV.STAGING:
            CONF = Object.assign(Object.assign(CONST, CONF_ALL), CONF_STAG);
            break;
    }

    CONF.LOGGER.DATA_PATH = path.join(__dirname, '/../log/' + CONF.LOGGER.DATA_PATH);
    CONF.LOGGER.INFO_PATH = path.join(__dirname, '/../log/' + CONF.LOGGER.INFO_PATH);
    CONF.LOGGER.ERROR_PATH = path.join(__dirname, '/../log/' + CONF.LOGGER.ERROR_PATH);
    CONF.LOGGER.CRITICAL_PATH = path.join(__dirname, '/../log/' + CONF.LOGGER.CRITICAL_PATH);

    //For getting directory and db path to store in 
    CONF.UPLOADS = {
        ROOT_PATH: path.join(__dirname, '/../..'),
        DEFAULT: path.join(__dirname, '/../../uploads/'),
        DIR_PATH_PHOTOS: path.join(__dirname, '/../../uploads/photos/'),
        DIR_PATH_VIDEOS: path.join(__dirname, '/../../uploads/videos/'),
        DIR_PATH_DOCUMENTS: path.join(__dirname, '/../../uploads/documents/'),
        DB_PATH_ICONS: '/uploads/',
        DB_PATH_PHOTOS: '/uploads/photos/',
        DB_PATH_VIDEOS: '/uploads/videos/',
        DB_PATH_DOCUMENTS: '/uploads/documents/'
    };


    //For get default profile image
    CONF.DEFAULT_PROFILE_PHOTO_ADMIN = "no-user.png";
    CONF.DEFAULT_PROFILE_PHOTO = "/uploads/images/no-user.png";
    CONF.DEFAULT_ALBUM_PHOTO = "/images/no-photo.png";
    CONF.DEFAULT_COVER_PHOTO = "/images/cover-img-user.jpeg";
    CONF.DEFAULT_VIDEO_IMAGE = "/images/gray.png";

    //JWT token
    CONF.JWTTOKENKEY = "bnRox$@2019";
    CONF.JWTTOKENALLOWACCESS = {};
    CONF.JWTTIMEOUT = 0; // 30 days
    // CONF.JWTTIMEOUT = 60 * 60 * 24 * 30 * 1000; // 30 days
    CONF.COOKIE_PRIVATE_KEY = 'bnRox$@2019##';
    CONF.NODE_ENV = process.env.NODE_ENV;

    module.exports = CONF;
})();