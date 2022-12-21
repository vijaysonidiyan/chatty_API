const express = require("express");
const router = express.Router();
const userCtrl = require("../../../services/security/userCtrl");
const BlogCtrl = require("../../../services/security/BlogCtrl");
const uniqueCtrl = require("../../../services/security/uniqueCtrl");
const CONFIG = require("../../../config");

/**
 * @description 
 * @example http://localhost:3001/v1/AdminMaster/'Route name'
 */
////Un Read Notification Count API : http://localhost:3000/v1/notification/getUnReadNotificationCount

//List country Data : http://localhost:5001/v1/user/countryList
router.route("/countryList").post(userCtrl.countryList)


//Create user Data : http://localhost:5001/v1/user/userCreate
router.route("/userCreate").post(userCtrl.userCreate)

//Create user Data : http://localhost:5001/v1/user/userUpdate
router.route("/userUpdate").post(userCtrl.userUpdate)

//Create user Data : http://localhost:5001/v1/user/checkOtpVerificationForUser
router.route("/checkOtpVerificationForUser").post(userCtrl.checkOtpVerificationForUser)

//Create user Data : http://localhost:5001/v1/user/userDataActiveDeActive
router.route("/userDataActiveDeActive").post(userCtrl.userDataActiveDeActive)

//Create user Data : http://localhost:5001/v1/user/userDetailsById
router.route("/userDetailsById").post(userCtrl.userDetailsById)

//Create user Data : http://localhost:5001/v1/user/getUserList
router.route("/getUserList").get(userCtrl.getUserList)

/*........favoriteList........*/
//Create favorite userList : http://localhost:5001/v1/user/favoriteCreate
router.route("/favoriteCreate").post(userCtrl.favoriteCreate)

//Create favorite userList : http://localhost:5001/v1/user/favouriteUserList
router.route("/favouriteUserList").post(userCtrl.favouriteUserList)

//Create favorite userList : http://localhost:5001/v1/user/favouriteUserList1
router.route("/favouriteUserList1").post(userCtrl.favouriteUserList1)


//Create user Data : http://localhost:5001/v1/user/resendOtpUser
router.route("/resendOtpUser").post(userCtrl.resendOtpUser)




module.exports = router;

