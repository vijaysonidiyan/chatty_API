const express = require("express");
const router = express.Router();
const ContactCtrl = require("../../../services/security/contactCtrl");
const CONFIG = require("../../../config");

//Create Content API: http://localhost:3005/v1/contact/create
router.route("/create").post(ContactCtrl.create)

//Get Content Data List API : http://localhost:3005/v1/contact/get-contantDataList
router.route("/get-contantDataList").get(CONFIG.JWTTOKENALLOWACCESS, ContactCtrl.contantDataList);

module.exports = router;

