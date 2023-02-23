const express = require("express");
const router = express.Router();
const userCtrl = require("../../../services/security/userCtrl");
const groupCtrl = require("../../../services/security/groupCtrl");
const uniqueCtrl = require("../../../services/security/uniqueCtrl");
const CONFIG = require("../../../config");

/**
 * @description 
 * @example http://localhost:3001/v1/AdminMaster/'Route name'
 */
////Un Read Notification Count API : http://localhost:3000/v1/notification/getUnReadNotificationCount

//List country Data : http://localhost:3017/v1/group/groupCreate
router.route("/groupCreate").post(groupCtrl.groupCreate)



module.exports = router;

