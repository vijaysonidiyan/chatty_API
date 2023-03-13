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
// - not use
imageCtrl.imageCreate1 = (req, res) => {
    var response = new HttpRespose()
    var data = req.body;
    console.log("fileeeeeeeee", req.files.Image)

    for (let i = 0; i < req.files.Image.length; i++) {


        data.Image = req.files.Image[i].filename;

        console.log("............", data);
       
        ImageModel.create(data, (err, image) => {
            if (err) {
                console.log("////////////", err)
                response.setError(AppCode.Fail);
                response.send(res);
            } else {

                console.log("else");

            }
        });
    }


    response.setData(AppCode.Success);
    response.send(res);
};


/* Create Decoration Data */
// - not use
imageCtrl.imageCreate = (req, res) => {
    var response = new HttpRespose()
    var data = req.body;
    let filesArr = req.files;

    let abc = [];
    if (
        filesArr !== "" &&
        filesArr !== null &&
        filesArr !== undefined &&
        filesArr !== [] &&
        filesArr !== {}
    ) {
        for (let filesArrKey in filesArr) {
            let files = filesArr[filesArrKey];
            for (let filesKey in files) {
                let file = files[filesKey];
                console.log("filefilefile",file);
              

            
                abc.push(file.filename)
            }
        }
    }
    console.log("abcabcabcbabc", abc);
    abc.forEach(Element => {
        let query = {}
        if (!!file.mimetype && file.mimetype !== "video/mp4") {
            query.file_name = Element.filename,
            query.type = "video"
        }
        else {
            query.file_name = Element.filename,
            query.type = "photo" 

        }
      //  query.file_name = Element
        ImageModel.create(query, (err, decoration) => {
            if (err) {
                response.setError(AppCode.Fail);
                response.send(res);
            } else {
                // response.setData(AppCode.Success, decoration);
                // response.send(res);
            }
        });



    })
    response.setData(AppCode.Success);
    response.send(res);
    
   
};


// - not use
// imageCtrl.imageCreate = (req, res) => {
//     var response = new HttpRespose()
//     var data = req.body;
//     let filesArr = req.files;
//     console.log(".................",req.files.Image)

//     let abc = [];
//     if (
//         filesArr !== "" &&
//         filesArr !== null &&
//         filesArr !== undefined &&
//         filesArr !== [] &&
//         filesArr !== {}
//     ) {
//         for (let filesArrKey in filesArr) {
//             let files = filesArr[filesArrKey];
//             for (let filesKey in files) {
//                 let file = files[filesKey];
//                 data.Image = file.filename
//                 console.log("datadtadtadat",data);

//                 ImageModel.create(data, (err, decoration) => {
//                     if (err) {
//                         console.log("err",err);
//                         response.setError(AppCode.Fail);
//                         response.send(res);
//                     } else {
//                        // response.setData(AppCode.Success, decoration);
//                       //  response.send(res);
//                     }
//                 });
               
//             }
//         }
//     }
   
// };


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
// - not use
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