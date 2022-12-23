const express = require("express");
const router = express.Router();
const NotificationCtrl = require("../../../services/security/notificationCtrl");
const CONFIG = require("../../../config");

/**
 * @description Post routes
 * @example http://localhost:3000/v1/notification/'Route name'
 */

//Send Request API : http://localhost:3017/v1/notifications/notificationData
router.route("/notificationData").get(CONFIG.JWTTOKENALLOWACCESS, NotificationCtrl.notificationData);

//Un Read Notification Count API : http://localhost:3017/v1/notifications/getUnReadNotificationCount
router.route("/getUnReadNotificationCount").get(CONFIG.JWTTOKENALLOWACCESS, NotificationCtrl.unReadNotificationCount);

//Un Read Notification Count API : http://localhost:3017/v1/notifications/viewNotifications
router.route("/viewNotifications").post(CONFIG.JWTTOKENALLOWACCESS, NotificationCtrl.viewNotifications);

//Un Read Notification Count API : http://localhost:3017/v1/notifications/readNotification
router.route("/readNotification").post(CONFIG.JWTTOKENALLOWACCESS, NotificationCtrl.readNotification);
module.exports = router;
