const express = require("express");
const router = express.Router();
const PostCtrl = require("../../../services/security/postCtrl");
const uniqueCtrl = require("../../../services/security/uniqueCtrl");
const CONFIG = require("../../../config");

//Save post API: http://localhost:3014/v1/post/post-create
 router.route("/post-create").post(CONFIG.JWTTOKENALLOWACCESS,PostCtrl.create)

//Save post API: http://localhost:3014/v1/post/post-update
router.route("/post-update").post(CONFIG.JWTTOKENALLOWACCESS,PostCtrl.update)

 
 
 
module.exports = router;
