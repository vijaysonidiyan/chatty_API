const express = require("express");
const router = express.Router();
const ChatCtrl = require("../../../services/security/chatCtrl");
const CONFIG = require("../../../config");

/**
 * @description Post routes
 * @example http://localhost:3000/v1/followers/'Route name'
 */

//Get Messages of Users : http://localhost:3017/v1/chat/get-messages
router
  .route("/get-messages")
  .post(CONFIG.JWTTOKENALLOWACCESS, ChatCtrl.getMessages);

//Get Messages of Users : http://localhost:3000/v1/chat/get-messages-all
router
  .route("/getMessagesAll")
  .post(CONFIG.JWTTOKENALLOWACCESS, ChatCtrl.getMessagesAll);

// //Get Messages of Users : http://localhost:3000/v1/chat/get-chat-users-list
// router.route("/get-users-list-chat").get(CONFIG.JWTTOKENALLOWACCESS, ChatCtrl.getUsersChatList);

//Get Messages of Users : http://localhost:3000/v1/chat/get-chat-users-list
router
  .route("/get-chat-users-list")
  .get(CONFIG.JWTTOKENALLOWACCESS, ChatCtrl.getChatUsersList);



  //Get chat of Users : http://localhost:3000/v1/chat/getChatWithUsersList
router
.route("/getChatWithUsersList")
.get(CONFIG.JWTTOKENALLOWACCESS, ChatCtrl.getChatWithUsersList);



//update Messages status  : http://localhost:3000/v1/chat/update-messageReadStatus
router
  .route("/update-messageReadStatus")
  .post(CONFIG.JWTTOKENALLOWACCESS, ChatCtrl.updateMessageReadStatus);

//Update User Chat Screen Status : http://localhost:3000/v1/chat/update-users-chat-screen-status
router
  .route("/update-users-chat-screen-status")
  .post(CONFIG.JWTTOKENALLOWACCESS, ChatCtrl.manageChatScreenData);

//get chats with pagination : http://localhost:3000/v1/chat/getMessageswithPagination
router
  .route("/getMessageswithPagination")
  .post(CONFIG.JWTTOKENALLOWACCESS, ChatCtrl.getMessageswithPagination);



//Unread Chat Count Data : http://localhost:3017/v1/chat/unread-chat-count
router
  .route("/unread-chat-count")
  .get(CONFIG.JWTTOKENALLOWACCESS, ChatCtrl.unreadChatCount);

  //Check OnChatOrNot : http://localhost:3000/v1/chat/check-chat-live
router
.route("/onChatScreen")
.get(CONFIG.JWTTOKENALLOWACCESS, ChatCtrl.onChatScreen);





module.exports = router;
