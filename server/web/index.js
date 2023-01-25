const http = require("http");
const express = require("express");
const app = express();
const app2 = express();
const fs = require("fs");
var cors = require("cors");
const AppCode = require("../common/constant/appCods");
const ChatModel = new (require("./../../server/common/model/chatModel"))();
const UserModel = new (require("./../../server/common/model/UserModel"))();
const ChatScreenManagementModel =
  new (require("./../../server/common/model/chatScreenManagementModel"))();
const NotificationModel =
  new (require("../../server/common/model/NotificationModel"))();
const DeviceTokenModel =
  new (require("./../../server/common/model/deviceTokenModel"))();
const ObjectID = require("mongodb").ObjectID;
const MongoConnect = require("../common/nosql/mongoDb/index");
const async = require("async");
const CONFIG = require("../config");
const _ = require("lodash");

//var siofu = require("socketio-file-upload");
const ChatCtrl = require("../services/security/chatCtrl");
//const chatModel = require("./../../server/common/model/chatModel");
const PostModel = new (require("./../../server/common/model/postModel").Post)();

let server;
if (CONFIG.NODE_ENV === "development") {
  console.log("Your server is running on developer mode...!");
}
else if (CONFIG.NODE_ENV === "production") {
  console.log("Your server is running on production mode...!");
}
else if (CONFIG.NODE_ENV === "staging") {
  console.log("Your server is running on staging mode...!");
}
MongoConnect.init()
  .then(() => {
    require("./middleware")(app);

    app.set("port", CONFIG.APP.WEB.PORT);
    server = http.createServer(app);

    // server.listen(CONFIG.APP.WEB.PORT, err => {
    //     console.log(
    //         `your project API is listening on port ${CONFIG.APP.WEB.PORT}`
    //     );
    // });



    const socketio = require("socket.io");

    const io = socketio(server, {

      cors: {

        origin: "*",

        methods: ["GET", "POST"],

        allowedHeaders: ["my-custom-header"],

        credentials: true,

      },

    });

    function getkeyByValue(object, value) {

      console.log(",,,,,,,,,,,,,,,", users, value);

      return Object.keys(object).find((key) => object[key] === value);

    }
    var users = [];
    var usersss = [];

    var USERS = [];



    //setup event listener
    io.on("connection", function (socket) {
      //console.log("........socket",socket)
      // console.log("", socket.id);
      // console.log("", socket.handshake.query.userId);
      socket.userId = socket.handshake.query.userId;
      //socket.userId1 = socket.query.userId;
      console.log("user connection Established");

      usersss[socket.userId] = socket.id;
      console.log("Connected user's old code", usersss);

      // new code

      let value = {

        socketId: socket.id,

        userId: socket.handshake.query.userId

      }
      io.emit("socket_connection", value);
      socket.broadcast.emit("status", {
        userId: socket.handshake.query.userId,
        status: "Online",
      });

      console.log("Connected user's", value);


      users.push(value)

      console.log("userssssssssssssssss connected........", users)




      socket.on("user_connected", function () {


        io.emit("user_connected");
        console.log("Connected user's");
      });




      socket.on("socket_disconnection", function (socket) {


        // for (let i = 0; i < users.length; i++) {

        //   if (socket.socketId == users[i].socketId) {
        //     console.log("disconneceted user...................", users[i])
        //     users.splice(i, 1)



        //     for (let j = 0; i < users.length; j++) {
        //       if (socket.userId == users[j].userId && users[j].userId != undefined) {

        //       }
        //       else {
        //         socket.broadcast.emit("status", {
        //           userId: socket.userId,
        //           status: "Offline",
        //         });

        //       }

        //     }

        //   }

        // }





        async.waterfall([
          function (callback) {

            let AllreadyExist = false;



            var bar = new Promise((resolve, reject) => {
              let UserSData = users
              for (let i = 0; i < users.length; i++) {

                if (socket.socketId == users[i].socketId && socket.userId == users[i].userId) {

                  users.splice(i, 1)
                  resolve()
                  // status = 1


                }
                // if ((UserSData.length - 1) == i) {

                //   resolve()

                // }
                // if (users.length == 0) {
                //   resolve()
                // }

              }

            });

            bar.then(() => {

              let Status = 0
              async.waterfall([
                function (callback) {

                  let AllreadyExist = false;
                  // let UsersData = users
                  var bar = new Promise((resolve, reject) => {
                    if (users.length > 0) {
                      console.log("11111111111111111111")
                      for (let j = 0; j < users.length; j++) {
                        if (socket.userId == users[j].userId) {
                          Status = 1
                          resolve()
                        }
                        if ((users.length - 1) == j) {

                          resolve()

                        }
                      }
                    }
                    else {
                      console.log("222222222222222222")
                      Status = 0
                      resolve()
                    }

                  });

                  bar.then(() => {

                    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@")

                    if (Status == 1) {

                      io.to(socket.id).emit("status", {

                        userId: socket.userId,

                        status: "Online",

                      });

                      console.log("Online");

                    }

                    if (Status == 0) {

                      io.to(socket.id).emit("status", {

                        userId: socket.userId,

                        status: "Offline",

                      });

                      console.log("offline");

                    }







                  });

                },

              ]);








            });

          },

        ]);


        //console.log("user disconnected", users);
        console.log("user connected after disconnecting......", users);



      });


      socket.on("disconnect", function () {

        // socket.broadcast.emit("status", {
        //   userId: ans,
        //   status: "Offline",
        // });
        // console.log("user disconnected", usersss);

        // USERS = users;
        // users = []
        // for (let i = 0; i < USERS.length; i++) {
        //   if (socket.id == USERS[i].socketId) {
        //   }
        //   else {
        //     let value1 = {
        //       socketId: USERS[i].socketId,
        //       userId: USERS[i].userId
        //     }
        //     users.push(value1)
        //   }
        // }

        for (let i = 0; i < users.length; i++) {

          if (socket.id == users[i].socketId) {
            console.log("disconneceted user...................", users[i])

            io.emit("user_disconnected", users[i]);

            users.splice(i, 1)


          }

        }

        //console.log("user disconnected", users);
        console.log("user connected after disconnecting......", users);
      });



      // socket.on("user_connected", function (userData) {
      //   console.log("before Connect", userData);
      //   usersss[userData.senderId] = userData.socketId;
      //   io.emit("user_connected", userData.senderId);
      //   console.log("Connected user's", usersss);
      // });

      // socket.on("user_connected", function (userId) {
      //   console.log("userid",userId);
      //   let socketId = userId;
      //   console.log(".....",socketId)
      //   io.emit("user_connected", users);
      //   console.log("Connected user's", users[0]);
      // });

      socket.on("user_disconnected", function (userId) {
        console.log("userid", userId);
        let socketId = userId;
        console.log(".....", socketId)
        io.emit("user_disconnected", users);
        console.log("disconnected user's", users);



      });






      //Someone is Online/Offline
      socket.on("checkStatus", function (userId) {
        //USERS = users;
        // users = []
        //old...............
        //   let status = users[userId];
        //   if (!!status) {
        //     io.to(socket.id).emit("status", {
        //       userId: userId,
        //       status: "Online",
        //     });
        //     console.log("Online");
        //   } else {
        //     io.to(socket.id).emit("status", {
        //       userId: userId,
        //       status: "Offline",
        //     });
        //     console.log("offline");
        //   }

        let status = 0

        async.waterfall([
          function (callback) {

            let AllreadyExist = false;

            var bar = new Promise((resolve, reject) => {
              for (let i = 0; i < users.length; i++) {

                if (users[i].userId == userId) {

                  status = 1

                }
                if ((users.length - 1) == i) {

                  resolve()

                }
              }

            });

            bar.then(() => {

              if (status == 1) {

                io.to(socket.id).emit("status", {

                  userId: userId,

                  status: "Online",

                });

                console.log("Online");

              } else {

                io.to(socket.id).emit("status", {

                  userId: userId,

                  status: "Offline",

                });

                console.log("offline");

              }

            });

          },

        ]);

      });

      //Someone is enter in chat

      socket.on("onChat", function (userId) {
        console.log("userid", userId);
        let socketId = userId;
        console.log(".....", socketId)
        if (!!socketId) {
          io.to(socket.id).emit("chatStatus", {
            userId: userId,
            status: "OnChat",
          });
          console.log("onchat");
        }

      });
      //Someone is leave the chat
      socket.on("offChat", function (userId) {
        console.log("userid", userId);
        let socketId = userId;
        console.log(".....", socketId)
        if (!!socketId) {
          io.to(socket.id).emit("chatStatus", {
            userId: userId,
            status: "offChat",
          });
          console.log("offChat");
        }
      });

      //Someone is typing
      socket.on("typing", (data) => {
        io.broadcast.emit("notifyTyping", {
          user: data.user,
          message: data.message,
          // message: "aaa",
        });
      });

      //when soemone stops typing
      socket.on("stopTyping", () => {
        socket.broadcast.emit("notifyStopTyping");
      });


      //update unreadcount and return data to reciver open in all tab
      socket.on("updateUnReadCount", function (data) {
        //  let socketId = users[userId];

        let query = {
          _id: ObjectID(data._id)
        }
        ChatModel.findOne(query, function (err, msg) {
          if (err) {
            response.setError(AppCode.Fail);
            response.send(res);
          }
          else if (_.isEmpty(msg)) {
            response.setError(AppCode.NotFound);
            response.send(res);
          }
          else {

            ChatModel.updateOne(query, { $set: { isRead: true } }, function (err, chat) {
              if (err) {
                console.log("......err.....")
                //TODO: Log the error here
                console.log(err.message);
                console.log(err);
              } else {

                for (let i = 0; i < users.length; i++) {

                  if (msg.reciver_id == users[i].userId && users[i].userId != undefined) {

                    io.to(users[i].socketId).emit("return_unreadcount", {
                      _id: msg._id,

                      message: msg.message,

                      sender_id: msg.sender_id,

                      reciver_id: msg.reciver_id,

                    });
                  }
                }
                console.log(".....isRead=true ")

              }
            });
          }
        })



      });


      socket.on("img", function (info) {
        console.log("inside receiver");
        console.log(".........", info)
        io.to(socket.id).emit('base64 image', //exclude sender
          // io.sockets.emit(
          //   "base64 file", //include sender

          {
            file: info.file,
            fileName: info.fileName,
          }
        );
        // var base64Str = info;
        //  var buff = new Buffer(base64Str ,"base64");
        // fs.writeFileSync("test.png", buff)
      });





      socket.on("message", function (msg) {
        console.log(".......messageeeeeeeeeeeeeeeeeeeeeeeeeeeeeee...", msg)


        // console.log(Buffer.from("SGVsbG8gV29ybGQ=", 'base64').toString('ascii'))
        // console.log("message Data Before");


        var query = {
          message: msg.message,
          sender_id: msg.sender_id,
          reciver_id: msg.reciver_id,
          type: "message",
        };
        var query1 = {
          message: msg.message,
          sender_id: msg.sender_id,
          reciver_id: msg.reciver_id,
          type: msg.type,
          file_name: msg.file_name
        };
        console.log("message data", query1);
        // console.log("message Dataaaaaaaaaaaaaaaaaaaaaaaaaaa", query);
        var socket_id = usersss[msg.reciver_id];
        console.log("m old socketId: reciverID ", socket_id);
        var socket_id1 = usersss[msg.sender_id];
        console.log("m old socketId: sender_id ", socket_id1);

        console.log("new_message call", users)



        const groupList = [];
        groupList.push(ObjectID(msg.reciver_id))
        console.log("reciver_id......................................................", groupList)

        let Query = [
          {
            $match: {

              blockUser: {
                $in: groupList,
              },

            },
          }

        ]


        console.log(Query);
        UserModel.aggregate(Query, (err, user) => {
          if (err) {
            throw err;
          }
          else if (_.isEmpty(user)) {
            console.log("else iffffffffffffffffffffffffffffffffffff")
            ChatModel.create(query1, function (err, chat) {
              if (err) {
                console.log("......err.....")
                //TODO: Log the error here
                console.log(err.message);
                console.log(err);
              } else {
                console.log(".....else in else if")
                if (!!chat) {
                  console.log("chatchatchatchatchatchatchatchatchat", chat);


                  for (let i = 0; i < users.length; i++) {



                    if (msg.reciver_id == users[i].userId && users[i].userId != undefined) {


                      io.to(users[i].socketId).emit("new_message", {
                        _id: chat._id,

                        message: msg.message,

                        sender_id: msg.sender_id,

                        reciver_id: msg.reciver_id,

                        type: msg.type,

                        file_name: msg.file_name,

                        createdAt: new Date()

                      });




                    }
                    if (msg.sender_id == users[i].userId && users[i].userId != undefined) {

                      io.to(users[i].socketId).emit("return_message", {
                        _id: chat._id,

                        message: msg.message,

                        sender_id: msg.sender_id,

                        reciver_id: msg.reciver_id,

                        type: msg.type,

                        file_name: msg.file_name,

                        createdAt: new Date()

                      });



                    }

                  }

                  // io.to(socket_id).emit("new_message", {
                  //   _id:chat._id,
                  //   message: msg.message,
                  //   sender_id: msg.sender_id,
                  //   reciver_id: msg.reciver_id,
                  //   type: "message",
                  //   createdAt:new Date()
                  // });

                  let isSendNotification = true;
                  ChatScreenManagementModel.findOne(
                    { userId: ObjectID(msg.reciver_id) },
                    function (err, chatManage) {
                      if (err) {
                        console.log(err);
                      } else {
                        console.log(".........chatscreenmanagementModel")
                        if (!!chatManage) {
                          let idD = "";
                          if (!!chatManage.chatWith) {
                            idD = chatManage.chatWith.toString();
                          }

                          console.log("Chat With ID", idD);
                          // if (chatManage.status == 1) {
                          //   isSendNotification = false;
                          // }
                          // if (chatManage.status == 2 && idD == msg.sender_id) {
                          //   isSendNotification = false;
                          // }
                        }
                        if (isSendNotification == true) {
                          UserModel.findOne(
                            { _id: ObjectID(msg.sender_id) },
                            (err, user) => {
                              if (err) {
                                console.log(err);
                              } else if (!!user) {
                                UserModel.findOne(
                                  { _id: ObjectID(msg.reciver_id) },
                                  (err, receiverUser) => {
                                    if (err) {
                                      console.log(err);
                                    } else if (!!receiverUser) {
                                      let mesg = user.userName + " message you!",
                                        title = "New Message",
                                        type = "message",
                                        senderId = msg.sender_id,
                                        receiverId = msg.reciver_id,
                                        receiverName = user.userName,
                                        senderImage = !!receiverUser.profileUrl
                                          ? receiverUser.profileUrl
                                          : "",
                                        receiverImage = !!user.profileUrl
                                          ? user.profileUrl
                                          : "",
                                        res = "";

                                      // DeviceTokenModel.findOne({ userId: ObjectID(msg.reciver_id) }, function (err, deviceTokensData) {
                                      //     if (err) {
                                      //         throw err
                                      //     } else {
                                      //         if (!!deviceTokensData) {
                                      //             console.log("DT", deviceTokensData)
                                      //             let tokens = deviceTokensData.deviceToken;
                                      //             sendToTopics(mesg, title, type, senderId, receiverId, receiverName, receiverImage, senderImage, tokens, res)
                                      //         }

                                      //     }
                                      // });
                                      let query = [
                                        {
                                          $match: { userId: ObjectID(msg.reciver_id) },
                                        },
                                      ];
                                      DeviceTokenModel.aggregate(
                                        query,
                                        function (err, deviceTokensData) {
                                          if (err) {
                                            console.log(err);
                                          } else {
                                            console.log(
                                              "deviceTokensDataaaaaaaaaaaaaa",
                                              deviceTokensData
                                            );
                                            if (!!deviceTokensData) {
                                              deviceTokensData.forEach((element) => {
                                                let tokens = element.deviceToken;
                                                if (!!tokens) {
                                                  sendToTopics(
                                                    mesg,
                                                    title,
                                                    type,
                                                    senderId,
                                                    receiverId,
                                                    receiverName,
                                                    receiverImage,
                                                    senderImage,
                                                    tokens,
                                                    res
                                                  );
                                                }
                                              });
                                            }
                                          }
                                        }
                                      );

                                      let notificationQuery = {
                                        senderId: msg.sender_id,
                                        reciverId: msg.reciver_id,
                                        message: mesg,
                                        type: type
                                      }
                                      NotificationModel.create(notificationQuery, (err, notification) => {
                                        if (err) {
                                          throw err;
                                        } else {
                                          console.log(".....notificationModel")

                                        }
                                      });
                                    }
                                  }
                                );
                              }
                            }
                          );
                        }
                      }
                    }
                  );
                }
              }
            });

          }
          else {
            console.log("reciver id is in block List so you cant message .......................................");
            for (let i = 0; i < users.length; i++) {

              if (msg.sender_id == users[i].userId && users[i].userId != undefined) {

                io.to(users[i].socketId).emit("block_user", {


                  message: msg.message,

                  sender_id: msg.sender_id,

                  reciver_id: msg.reciver_id,

                  type: "message",

                  createdAt: new Date(),

                  isblock: true

                });



              }
            }
            //  response.setError(AppCode.unblockFirst);
            // response.send(res);



          }
        });



      });




      socket.on("chatdeletebyId", function (msg) {
        console.log(".......messageeeeeeeeeeeeeeeeeeeeeeeeeeeeeee...", msg)

        const data = msg;

        var array = msg.isDeletedBy
        console.log("datadtadatdatdatmsg.................datadtadtadta", msg);
        const query = {
          _id: ObjectID(msg._id)
        };
        console.log("queryyyyyyyyyyyyy", query);
        ChatModel.findOne(query, function (err, chat) {
          if (err) {
            console.log("err", err);
          } else {
            if (chat == null) {
              console.log("******no chat found***********")
            } else {
              let updateDataQuery = {};

              for (let i = 0; i < users.length; i++) {
                for (let j = 0; j < array.length; j++)



                  if (array[j] == users[i].userId && users[i].userId != undefined) {


                    io.to(users[i].socketId).emit("chatdeletedbyId", {
                      _id: msg._id,
                      isDeletedBy: msg.isDeletedBy


                    });


                  }


              }


              if (!!chat.isDeletedBy) {
                console.log("................", chat.isDeletedBy)
                let firstArray = []
                let secondArray = []
                firstArray = chat.isDeletedBy
                //        console.log(",,,,,,,,,,,,,,,,,,,,,,,",req.body.isDeletedBy)
                secondArray = data.isDeletedBy

                let finalArray = firstArray.concat(secondArray)
                console.log("......................................finalArrayccccccc", finalArray)
                finalArray.map((obj, index) => {
                  finalArray[index] = ObjectID(obj);
                });

                console.log(".........finalArray after", finalArray)


                updateDataQuery.isDeletedBy = finalArray
                console.log(".......if part updateDataQuery.......", updateDataQuery)



              }
              else {


                updateDataQuery = msg

                updateDataQuery.isDeletedBy.map((obj, index) => {
                  updateDataQuery.isDeletedBy[index] = ObjectID(obj);
                });

                console.log("else part updatequery,,,,,,,,,,,,,,,,,,,,")


              }


              delete updateDataQuery._id
              ChatModel.update(query, updateDataQuery, function (err, roleUpdate) {
                if (err) {
                  console.log("...........", err);
                  // response.setError(AppCode.Fail);
                } else {
                  console.log("upadteeeeeeeeeeeeeeeeeeeeeeeeee");

                  // response.setData(AppCode.Success);
                  // response.send(res);
                }
              });
            }
          }
        });



      });





      socket.on("allchatdelete", function (msg) {
        console.log(".......messagee...", msg)


        let query = [
          {
            $match: {
              $or: [
                {
                  sender_id: ObjectID(msg._id),
                  reciver_id: ObjectID(msg.user_id),
                },
                {
                  reciver_id: ObjectID(msg._id),
                  sender_id: ObjectID(msg.user_id),
                },
              ],
            },
          },

        ];

        console.log("..............................", query)

        ChatModel.advancedAggregate(query, {}, (err, chat) => {
          if (err) {
            throw err;
          } else if (_.isEmpty(chat)) {
            console.log("not chat user");
          } else {

            for (let i = 0; i < users.length; i++) {

              if (msg._id == users[i].userId && users[i].userId != undefined) {

                io.to(users[i].socketId).emit("allchatdeleted", {
                  _id: msg._id,
                  user_id: msg.user_id,

                });
              }

            }

            chat.forEach(Element => {
              let id = Element._id
              let Query =
              {
                _id: ObjectID(id)
              }
              let updateDataQuery = {}
              console.log("chatchatchatchatchatchat", Element);
              if (!!Element.isDeletedBy) {

                console.log("iffffffffffffffffff");
                console.log("................", Element.isDeletedBy)
                let aaa = []
                let bbb = []
                aaa = Element.isDeletedBy
                console.log(",,,,,,,,,,,,,,,,,,,,,,,", msg._id)
                bbb = msg._id
                console.log("aaaaaaaaa", aaa);
                console.log("bbbbbbbb", bbb);

                let abc = aaa.concat(bbb)
                console.log("......................................abcccccccc", abc)
                abc.map((obj, index) => {
                  abc[index] = ObjectID(obj);
                });

                console.log(".........abc after", abc)


                updateDataQuery.isDeletedBy = abc
                console.log(".......updateDataQuery.......", updateDataQuery)

              }
              else {
                console.log("else part exicuted");
                updateDataQuery.isDeletedBy = [ObjectID(msg._id)]

              }




              ChatModel.update(Query, updateDataQuery, function (err, chat) {
                if (err) {
                  console.log("***********err***********", err)

                } else if (chat == undefined || (chat.matchedCount === 0 && chat.modifiedCount === 0)) {
                  console.log("************chat not found");
                } else {

                  console.log("all chat deleted");

                }
              });
            })






          }
        });




      });

      socket.on("allchatdelete", function (msg) {
        console.log(".......messagee...", msg)


        let query = [
          {
            $match: {
              $or: [
                {
                  sender_id: ObjectID(msg.userId),
                  reciver_id: ObjectID(msg.chatwithuserId),
                },
                {
                  reciver_id: ObjectID(msg.userId),
                  sender_id: ObjectID(msg.chatwithuserId),
                },
              ],
            },
          },

        ];

        console.log("..............................", query)

        ChatModel.advancedAggregate(query, {}, (err, chat) => {
          if (err) {
            throw err;
          } else if (_.isEmpty(chat)) {
            console.log("not chat user");
          } else {

            for (let i = 0; i < users.length; i++) {

              if (msg.userId == users[i].userId && users[i].userId != undefined) {

                io.to(users[i].socketId).emit("allchatdeleted", {
                  userId: msg.userId,
                  chatwithuserId: msg.chatwithuserId,

                });
              }

            }

            chat.forEach(Element => {
              let id = Element._id
              let Query =
              {
                _id: ObjectID(id)
              }
              let updateDataQuery = {}
              console.log("chatchatchatchatchatchat", Element);
              if (!!Element.isDeletedBy) {

                console.log("iffffffffffffffffff");
                console.log("................", Element.isDeletedBy)
                let aaa = []
                let bbb = []
                aaa = Element.isDeletedBy
                console.log(",,,,,,,,,,,,,,,,,,,,,,,", msg.userId)
                bbb = msg.userId
                console.log("aaaaaaaaa", aaa);
                console.log("bbbbbbbb", bbb);

                let abc = aaa.concat(bbb)
                console.log("......................................abcccccccc", abc)
                abc.map((obj, index) => {
                  abc[index] = ObjectID(obj);
                });

                console.log(".........abc after", abc)


                updateDataQuery.isDeletedBy = abc
                console.log(".......updateDataQuery.......", updateDataQuery)

              }
              else {
                console.log("else part exicuted");
                updateDataQuery.isDeletedBy = [ObjectID(msg.userId)]

              }




              ChatModel.update(Query, updateDataQuery, function (err, chat) {
                if (err) {
                  console.log("***********err***********", err)

                } else if (chat == undefined || (chat.matchedCount === 0 && chat.modifiedCount === 0)) {
                  console.log("************chat not found");
                } else {

                  console.log("all chat deleted");

                }
              });
            })






          }
        });




      });




      socket.on("sharePost", function (msg) {
        console.log("message Data Before", msg);
        var query = {
          message: msg.message,
          sender_id: msg.sender_id,
          reciver_id: msg.reciver_id,
          type: "post",
          postId: msg.postId,
        };
        console.log("query", query);
        //save chat to the database
        ChatModel.create(query, function (err, chat) {
          if (err) {
            //TODO: Log the error here
            console.log(err.message);
          } else {
            if (!!chat) {
              let conditionQuery = [
                {
                  $match: {
                    $and: [
                      {
                        _id: ObjectID(msg.postId),
                      },
                      {
                        isDeleted: { $ne: true },
                      },
                    ],
                  },
                },
                {
                  $lookup: {
                    from: "userDetails",
                    localField: "user_id",
                    foreignField: "userId",
                    as: "user_id",
                  },
                },
                {
                  $unwind: {
                    path: "$user_id",
                    preserveNullAndEmptyArrays: true,
                  },
                },
                {
                  $lookup: {
                    from: "photo",
                    as: "media",
                    let: {
                      photoId: "$media.photos.files",
                      videoId: "$media.videos.files",
                    },
                    pipeline: [
                      {
                        $match: {
                          $expr: {
                            $or: [
                              {
                                $in: ["$_id", { $ifNull: ["$$photoId", []] }],
                              },
                              {
                                $in: ["$_id", { $ifNull: ["$$videoId", []] }],
                              },
                            ],
                          },
                        },
                      },
                      {
                        $project: {
                          _id: 1,
                          path: "$photo_name",
                          thumbnail: 1,
                          video_screenshot: 1,
                          type: {
                            $cond: {
                              if: { $eq: ["$type", "video"] },
                              then: "video",
                              else: "photo",
                            },
                          },
                        },
                      },
                    ],
                  },
                },
                {
                  $project: {
                    //"_id": 0,
                    content: 1,
                    userDetails: {
                      userId: "$user_id.userId",
                      firstName: "$user_id.firstName",
                      lastName: "$user_id.lastName",
                      userName: "$user_id.userName",
                      profileUrl: { $ifNull: ["$user_id.profileUrl", ""] },
                      statusType: "$user_id.statusType",
                    },
                    media: 1,
                  },
                },
              ];

              let isSendNotification = true;

              PostModel.aggregate(conditionQuery, function (err, posts) {
                if (err) {
                  console.log(err);
                } else {
                  if (posts.length > 0) {
                    let postData = posts[0];
                    let postImagePath = "";
                    let contentData = "";
                    if (!!contentData) {
                      contentData = postData.content;
                    }
                    if (postData.media[0].type == "video") {
                      postImagePath = postData.media[0].video_screenshot;
                    } else {
                      postImagePath = postData.media[0].path;
                    }
                    let messageData = {
                      message: msg.message,
                      sender_id: msg.sender_id,
                      reciver_id: msg.reciver_id,
                      type: "post",
                      postId: postData._id,
                      userId: postData.userDetails.userId,
                      userName: postData.userDetails.userName,
                      userImage: postData.userDetails.profileUrl,
                      postImage: postImagePath,
                      content: contentData,
                    };

                    console.log("message Data", messageData);
                    var socket_id = users[msg.reciver_id];
                    console.log("m socketId: ", socket_id);
                    //broadcast message to everyone in port:5000 except yourself.
                    io.to(socket_id).emit("new_message", messageData);
                  }
                }
              });

              ChatScreenManagementModel.findOne(
                { userId: ObjectID(msg.reciver_id) },
                function (err, chatManage) {
                  if (err) {
                    console.log(err);
                  } else {
                    if (!!chatManage) {
                      let idD = "";
                      if (!!chatManage.chatWith) {
                        idD = chatManage.chatWith.toString();
                      }

                      console.log("Chat With ID", idD);
                      // if (chatManage.status == 1) {
                      //   isSendNotification = false;
                      // }
                      // if (chatManage.status == 2 && idD == msg.sender_id) {
                      //   isSendNotification = false;
                      // }
                    }
                    if (isSendNotification == true) {
                      UserModel.findOne(
                        { userId: ObjectID(msg.sender_id) },
                        (err, user) => {
                          if (err) {
                            console.log(err);
                          } else if (!!user) {
                            UserModel.findOne(
                              { userId: ObjectID(msg.reciver_id) },
                              (err, receiverUser) => {
                                if (err) {
                                  console.log(err);
                                } else if (!!receiverUser) {
                                  let mesg = user.userName + " message you!",
                                    title = "New Message",
                                    type = "message",
                                    senderId = msg.sender_id,
                                    receiverId = msg.reciver_id,
                                    receiverName = user.userName,
                                    senderImage = !!receiverUser.profileUrl
                                      ? receiverUser.profileUrl
                                      : "",
                                    receiverImage = !!user.profileUrl
                                      ? user.profileUrl
                                      : "",
                                    res = "";
                                  let query = [
                                    {
                                      $match: { userId: ObjectID(msg.reciver_id) },
                                    },
                                  ];
                                  DeviceTokenModel.aggregate(
                                    query,
                                    function (err, deviceTokensData) {
                                      if (err) {
                                        console.log(err);
                                      } else {
                                        console.log(
                                          "deviceTokensDatfirstArrayaaaaaaaaaaa",
                                          deviceTokensData
                                        );
                                        if (!!deviceTokensData) {
                                          deviceTokensData.forEach((element) => {
                                            let tokens = element.deviceToken;
                                            if (!!tokens) {
                                              sendToTopics(
                                                mesg,
                                                title,
                                                type,
                                                senderId,
                                                receiverId,
                                                receiverName,
                                                receiverImage,
                                                senderImage,
                                                tokens,
                                                res
                                              );
                                            }
                                          });
                                        }
                                      }
                                    }
                                  );
                                }
                              }
                            );
                          }
                        }
                      );
                    }
                  }
                }
              );
            }
          }
        });
      });
    });

    // server.listen(process.env.PORT || 3006, function () {
    //   console.log("Running on Port: " + port);
    // });
    server.listen(process.env.PORT || 3017, function () {

      console.log(

        `chatty API is listening on port ${CONFIG.APP.WEB.PORT}`

      );

    });

    server.on("error", onError);

  })

  .catch(err => {

    console.log(err);

    console.log("Unable to connect to database");

  });

// sendToTopics(mesg, title, type,senderId,receiverId,receiverName,receiverImage, tokens, res)
const sendToTopics = (
  msg,
  title,
  topic,
  senderId,
  reeciverId,
  receiverName,
  receiverImage,
  senderImage,
  token,
  response
) => {
  var message = {
    notification: {
      body: msg,
      title: title,
    },
    data: {
      message: msg,
      type: topic,
      senderId: senderId,
      reeciverId: reeciverId,
      receiverName: receiverName,
      receiverImage: receiverImage,
      senderImage: senderImage,
    },
    // Apple specific settings
    apns: {
      headers: {
        "apns-priority": "10",
      },
      payload: {
        aps: {
          sound: "default",
        },
      },
    },
    token: token,
  };

  admin
    .messaging()
    .send(message)
    .then((response) => {
      // Response is a message ID string.
      console.log("Successfully sent message:", response);
    })
    .catch((error) => {
      console.log("Error sending message:", error);
    });
};

//
function onError(error) {
  if (error.syscall !== "listen") {
    throw error;
  }

  var bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges");
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(bind + " is already in use");
      process.exit(1);
      break;
    default:
      throw error;
  }
}
function shutdownServer() {
  server.close(() => {
    process.exit(0);
  });
  setTimeout(() => {
    process.exit(0);
  }, 5000);
}
process.stdin.resume();
process
  .on("SIGINT", () => {
    shutdownServer();
  })
  .on("SIGTERM", () => {
    shutdownServer();
  })
  .on("SIGTSTP", () => {
    shutdownServer();
  })
  .on("SIGTSTOP", () => {
    shutdownServer();
  })
  .on("SIGHUP", () => {
    shutdownServer();
  })
  .on("SIGQUIT", () => {
    shutdownServer();
  })
  .on("SIGABRT", () => {
    shutdownServer();
  })
  .on("unhandledRejection", err => {
    console.log("Unhandled reject throws: ");
    console.log(err);
  })
  .on("uncaughtException", err => {
    console.log("Uncaught exception throws: ");
    console.log(err);
    process.exit(1);
  });