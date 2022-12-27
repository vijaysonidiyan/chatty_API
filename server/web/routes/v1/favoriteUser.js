const express = require("express");
const router = express.Router();
const BlockUserCtrl = require("../../../services/security/blockUserCtrl");
const FavoriteUserCtrl = require("../../../services/security/favoriteUserCtrl");
const uniqueCtrl = require("../../../services/security/uniqueCtrl");
const CONFIG = require("../../../config");


/**
 * @description 
 * @example http://localhost:3001/v1/AdminMaster/'Route name'
 */


// save seshType details: http://localhost:3001/v1/favoriteUser/favoriteUser
router.route("/favoriteUser").post(CONFIG.JWTTOKENALLOWACCESS,FavoriteUserCtrl.favoriteUser);

// Get Interest  details: http://localhost:3001/v1/favoriteUser/getFavoriteUserList
router.route("/getFavoriteUserList").get(CONFIG.JWTTOKENALLOWACCESS,FavoriteUserCtrl.getFavoriteUserList);

// Get Interest  details: http://localhost:3001/v1/favoriteUser/getBlockedList
//router.route("/getBlockedList").get(CONFIG.JWTTOKENALLOWACCESS,BlockUserCtrl.getBlockedList);

// save seshType details: http://localhost:3001/v1/favoriteUser/unFavoriteUser
router.route("/unFavoriteUser").post(CONFIG.JWTTOKENALLOWACCESS,FavoriteUserCtrl.unFavoriteUser);







module.exports = router; 

