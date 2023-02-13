const express = require("express");
const router = express.Router();
const BlockUserCtrl = require("../../../services/security/blockUserCtrl");
const uniqueCtrl = require("../../../services/security/uniqueCtrl");
const CONFIG = require("../../../config");


/**
 * @description 
 * @example http://localhost:3001/v1/AdminMaster/'Route name'
 */


// save seshType details: http://localhost:3001/v1/blockUser/blockUser
router.route("/blockUser").post(CONFIG.JWTTOKENALLOWACCESS,BlockUserCtrl.blockUser);

// Get Interest  details: http://localhost:3001/v1/blockUser/get-blockeduserList-Byid
//router.route("/getBlockUserList").get(CONFIG.JWTTOKENALLOWACCESS,BlockUserCtrl.getBlockUserList);

// Get Interest  details: http://localhost:3001/v1/blockUser/blockUserList
router.route("/blockUserList").get(CONFIG.JWTTOKENALLOWACCESS,BlockUserCtrl.blockUserList);

// save seshType details: http://localhost:3001/v1/blockUser/unblockUser
router.route("/unblockUser").post(CONFIG.JWTTOKENALLOWACCESS,BlockUserCtrl.unblockUser);







module.exports = router; 

