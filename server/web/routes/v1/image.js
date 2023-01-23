const express = require("express");
const router = express.Router();
const imageCtrl = require("../../../services/security/imageCtrl");
const CONFIG = require("../../../config");

/**
 * @description Post routes
 * @example http://localhost:3000/v1/followers/'Route name'
 */

//Get Messages of Users : http://localhost:3017/v1/image/create
router
  .route("/create")
  .post(CONFIG.JWTTOKENALLOWACCESS, imageCtrl.imageCreate);

  //Get Messages of Users : http://localhost:3017/v1/image/imageUpdate
router
.route("/imageUpdate")
.post(CONFIG.JWTTOKENALLOWACCESS, imageCtrl.imageUpdate);




module.exports = router;
