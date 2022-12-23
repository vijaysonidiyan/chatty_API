const express = require("express");
const router = express.Router();
const userCtrl = require("../../../services/security/userCtrl");
const AdminAuthCtrl = require("../../../services/security/adminAuthCtrl");

const CONFIG = require("../../../config");

/**
 * @description 
 * @example http://localhost:3001/v1/AdminMaster/'Route name'
 */
////Un Read Notification Count API : http://localhost:3000/v1/notification/getUnReadNotificationCount

//List country Data : http://localhost:3017/v1/adminAuth/adminCreate
router.route("/adminCreate").post(AdminAuthCtrl.adminCreate)

//List country Data : http://localhost:3017/v1/adminAuth/login
router.route("/login").post(AdminAuthCtrl.login)

//List country Data : http://localhost:3017/v1/adminAuth/ChangePasswordForAdmin
router.route("/ChangePasswordForAdmin").post(CONFIG.JWTTOKENALLOWACCESS,AdminAuthCtrl.ChangePasswordForAdmin)

//List country Data : http://localhost:3017/v1/adminAuth/forgotPassworForAdmin
router.route("/forgotPassworForAdmin").post(AdminAuthCtrl.forgotPassworForAdmin)

//List country Data : http://localhost:3017/v1/adminAuth/checkOtpVerificationForAdmin
router.route("/checkOtpVerificationForAdmin").post(AdminAuthCtrl.checkOtpVerificationForAdmin)

//List country Data : http://localhost:3017/v1/adminAuth/resendOtpAdmin
router.route("/resendOtpAdmin").post(AdminAuthCtrl.resendOtpAdmin)

//List country Data : http://localhost:3017/v1/adminAuth/passwordResetForUser
router.route("/passwordResetForUser").post(AdminAuthCtrl.passwordResetForUser)




module.exports = router;

