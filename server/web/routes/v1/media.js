const express = require("express");
const router = express.Router();
const imageCtrl = require("../../../services/security/imageCtrl");
const mediaCtrl = require("../../../services/security/mediaCtrl");
const CONFIG = require("../../../config");

/**
 * @description Post routes
 * @example http://localhost:3000/v1/followers/'Route name'
 */

//Get Messages of Users : http://localhost:3017/v1/media/mediaMasterSave
router
  .route("/mediaMasterSave")
  .post(CONFIG.JWTTOKENALLOWACCESS, mediaCtrl.mediaMasterSave);


  //Get Messages of Users : http://localhost:3017/v1/media/mediaMasterDelete
router
.route("/mediaMasterDelete")
.post( mediaCtrl.mediaMasterDelete);

  




module.exports = router;
