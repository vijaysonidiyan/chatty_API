const express = require("express");
const router = express.Router();
const userCtrl = require("../../../services/security/userCtrl");
const storyCtrl = require("../../../services/security/storyCtrl");
const uniqueCtrl = require("../../../services/security/uniqueCtrl");
const CONFIG = require("../../../config");

/**
 * @description 
 * @example http://localhost:3001/v1/AdminMaster/'Route name'
 */
////Un Read Notification Count API : http://localhost:3000/v1/notification/getUnReadNotificationCount

//List country Data : http://localhost:5001/v1/story/create
router.route("/create").post(CONFIG.JWTTOKENALLOWACCESS,storyCtrl.create)


module.exports = router;

