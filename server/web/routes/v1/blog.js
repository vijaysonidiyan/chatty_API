const express = require("express");
const router = express.Router();

const BlogCtrl = require("../../../services/security/BlogCtrl");
const uniqueCtrl = require("../../../services/security/uniqueCtrl");
const CONFIG = require("../../../config");

/**
 * @description 
 * @example http://localhost:3001/v1/AdminMaster/'Route name'
 */
////Un Read Notification Count API : http://localhost:3000/v1/notification/getUnReadNotificationCount

//Create Blog Data : http://localhost:3003/v1/blog/Blog-create
router.route("/Blog-create").post(CONFIG.JWTTOKENALLOWACCESS, BlogCtrl.create)


//Get Blog Details By Id For Admin  : http://localhost:3003/v1/blog/blog-DeatilsById:/id
router.route("/blog-DeatilsById").get(BlogCtrl.blogDetailsByIdForAdmin);


//Get Blog Data List For Admin : http://localhost:3003/v1/blog/blog-List
router.route("/blog-List").get(BlogCtrl.blogListForAdmin);

//Blog  Data Stataus Active-Deactive   : http://localhost:3003/v1/blog/blog-statusActiveDeactive
router.route("/blog-statusActiveDeactive").post(BlogCtrl.blogActiveDeactive);

//Update Blog Data  : http://localhost:3003/v1/blog/blog-update
router.route("/blog-update").post(CONFIG.JWTTOKENALLOWACCESS, BlogCtrl.update);

module.exports = router;

