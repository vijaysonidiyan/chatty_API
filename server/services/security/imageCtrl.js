let imageCtrl = {};
const HttpRespose = require("../../common/httpResponse");
const Logger = require("../../common/logger");
const bcrypt = require("bcryptjs");
const blacklist = require("express-jwt-blacklist");
const ObjectID = require("mongodb").ObjectID;
const CONFIG = require("../../config");
const _ = require("lodash");
const async = require("async");
const AppCode = require("../../common/constant/appCods");
const MasterUserModel = new (require("../../common/model/userModel"))();
const ImageModel = new (require("../../common/model/imageModel"))();
const BlockUserModel = new (require("../../common/model/blockUserModel"))();
const FavouriteModel = new (require("../../common/model/favouriteModel"))();
const NotificationModel =
  new (require("../../common/model/NotificationModel"))();
const UserModel =
  new (require("../../common/model/userModel"))();

/* Create Decoration Data */

imageCtrl.imageCreate = (req, res) => {
    var response = new HttpRespose()
    var data = req.body;
 console.log("fileeeeeeeee",req.files.Image)
    if (!!req.files.Image) {
        data.Image = req.files.Image[0].filename;
    }

    console.log("............",data);
   
    ImageModel.create(data, (err, image) => {
        if (err) {
            response.setError(AppCode.Fail);
            response.send(res);
        } else {
            response.setData(AppCode.Success, image);
            response.send(res);
        }
    });
};


// update image

//update menuMaster Api
imageCtrl.imageUpdate = (req, res) => {
    var response = new HttpRespose();
   var data = req.body
   
   
    let query = {
        _id: ObjectID(req.body._id)
    }
    ImageModel.findOne(query, function (err, imagefind) {
        if (err) {
            response.setError(AppCode.Fail);
            response.send(res);
        }
        else if (_.isEmpty(imagefind)) {
            response.setError(AppCode.NoMenuFound);
            response.send(res);
        }
        else {
            let updateDataquery = {}
            if (!!req.files.Image) { 
                updateDataquery.Image = req.files.Image[0].filename; 
            } 
           
           // delete req.body._id
            ImageModel.updateOne(query, { $set: updateDataquery }, function (err, menuUpdate) {
                if (err) {
                    response.setError(AppCode.Fail);
                } else {
                    console.log("///////")
                    response.setData(AppCode.Success);
                    response.send(res);
                }
            });
        }
    })
};


/* decoration Delete*/

imageCtrl.decorationDelete = (req, res) => {
    const response = new HttpRespose();
    const data = req.query;
    const query = {
        _id: ObjectID(data._id)
    };
    decorationModel.findOne(query, function (err, decoration) {
        if (err) {
            response.setError(AppCode.Fail);
            response.send(res);
        } else {
            if (decoration == null) {
                AppCode.Fail.error = "No decorationdata found";
                response.setError(AppCode.Fail);
                response.send(res);
            } else {
                decorationModel.remove(query, function (err, decoration) {
                    if (err) {
                        AppCode.Fail.error = err.message;
                        response.setError(AppCode.Fail);
                        response.send(res);
                    } else if (decoration == undefined || decoration.deletedCount === 0) {
                        AppCode.Fail.error = "No decoration found";
                        response.setError(AppCode.Fail);
                        response.send(res);
                    } else {
                        response.setData(AppCode.Success);
                        response.send(res);
                    }
                });
            }
        }
    });
};



module.exports = imageCtrl;