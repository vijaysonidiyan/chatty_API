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

//List country Data : http://localhost:3017/v1/story/create
router.route("/create").post(CONFIG.JWTTOKENALLOWACCESS, storyCtrl.create)

// user Sttory List : http://localhost:3017/v1/story/userStoryList
router.route("/userStoryList").get(CONFIG.JWTTOKENALLOWACCESS, storyCtrl.userStoryList)

// story See By User API : http://localhost:3017/v1/story/storySeeByUser
router.route("/storySeeByUser").get(CONFIG.JWTTOKENALLOWACCESS, storyCtrl.storySeeByUser)

// A list of users who have viewed the story : http://localhost:3017/v1/story/userListByStoryId
router.route("/userListByStoryId").get(CONFIG.JWTTOKENALLOWACCESS, storyCtrl.userListByStoryId)


module.exports = router;

