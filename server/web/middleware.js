const createError = require("http-errors");
const express = require("express");
const logger = require("morgan");
const cookieParser = require("cookie-parser");
var expressSession = require("express-session");
const bodyParser = require("body-parser");
const path = require("path");
const compression = require("compression");
const cors = require("cors");
const CONFIG = require("./../config");
const multer = require("multer");
const { expressjwt: jwt } = require('express-jwt');
const blacklist = require("express-jwt-blacklist");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let dirPath = CONFIG.UPLOADS.DEFAULT;
    if (!!file.fieldname) {
      if (
        file.fieldname === "photos" ||
        file.fieldname === "image" ||
        file.fieldname === "profile_image" ||
        file.fieldname === "logo" ||
        file.fieldname === "Image"
      ) {
        dirPath = CONFIG.UPLOADS.DIR_PATH_PHOTOS;
      } else if (
        file.fieldname === "videos" ||
        file.fieldname === "function_video"
      ) {
        dirPath = CONFIG.UPLOADS.DIR_PATH_VIDEOS;
      } else if (
        file.fieldname === "documents"
      ) {
        dirPath = CONFIG.UPLOADS.DIR_PATH_DOCUMENTS;
      }
    }
    cb(null, dirPath);
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});
const upload = multer({
  storage: storage,
});
module.exports = (app) => {
  app.use(compression());
  app.use(cors());
 
  CONFIG.JWTTOKENALLOWACCESS = jwt({
    secret: CONFIG.JWTTOKENKEY,
    algorithms: ['HS256'],
    userProperty: "payload",
 //   isRevoked: blacklist.isRevoked,
  });
  app.use(bodyParser.json({ limit: "2gb" }));
  app.use(
    bodyParser.urlencoded({
      limit: "2gb",
      extended: true,
    })
  );
  app.use(cookieParser());
  /**
   *@description Express Session
   */
  app.use(
    expressSession({
      secret: CONFIG.COOKIE_PRIVATE_KEY,
      name: "onn-app",
      proxy: true,
      resave: true,
      saveUninitialized: true,
      httponly: true,
    })
  );
  app.use(express.static("server/web/public"));
  app.use(logger("dev"));
  app.use("/v1/auth/modify-business-details", function (req, res, next) {
    next();
  });
  app.use("/", express.static(path.join(__dirname, "/")));
  app.use("/uploads", express.static(path.resolve("../../uploads")));
  app.use(
    "/images",
    express.static(path.resolve("../../client/dist/assets/images/default"))
  );
  app.use("/assets", express.static(path.resolve("../../client/dist/assets")));
  var cpUpload = upload.fields([
    {
      name: "photos",
      maxCount: 15,
    },
    {
      name: "videos",
      maxCount: 15,
    },
    {
      name: "documents",
      maxCount: 15,
    },
    {
      name: "profile_image",
      maxCount: 1,
    },
    {
      name: "profile_video",
      maxCount: 1,
    },
    {
      name: "vedioUrl",
      maxCount: 1,
    },
    {
      name: "function_video",
      maxCount: 1,
    },
    {
      name: "icon_image",
      maxCount: 1,
    },
    {
      name: "storyVideos",
      maxCount: 30,
    },
    {
      name: "storyImages",
      maxCount: 30,
    },
    {
      name: "logo",
      maxCount: 1,
    },
    {
      name: "Image",
      maxCount: 1,
    },
  ]);

  app.use("/v1/blog", cpUpload, require("../web/routes/v1/blog"));
  app.use("/v1/user", cpUpload, require("./routes/v1/user"));
  app.use("/v1/chat", cpUpload, require("./routes/v1/chat"));
  app.use("/v1/blockUser", cpUpload, require("./routes/v1/blockUser"));
  
  app.get(
    /^\/(?!.*assets\/.*|.*resize\/.*|.*vendor\/.*|.*css\/.*|.*admin\/.*).*$/,
    function (req, res) {
      console.log("path not found.......req.url=" + req.url);
      res.sendFile(path.resolve(__dirname + "/index.html"));
    }
  );
  
  app.use((req, res, next) => {
    next(createError(404));
  });
  app.use((err, req, res, next) => {
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};
    console.log("err", err);
    if (err.name === "UnauthorizedError") {
      if (err.message === "jwt expired") {
        res.status(401);
        res.json({
          meta: { code: 402, message: err.name + ": " + err.message },
        });
      } else {
        res.status(401);
        res.json({
          meta: { code: 401, message: err.name + ": " + err.message },
        });
      }
    } else {
      res.status(err.status || 500).send({
        error: err.message ? err.message : "Something failed!",
      });
    }
  });
  return app;
};
