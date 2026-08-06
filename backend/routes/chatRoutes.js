const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");

// GET /api/chats - Get list of contacts/chats from Wasender
router.get("/", chatController.getChats);

// GET /api/chats/:id/messages - Get chat messages from Wasender
router.get("/:id/messages", chatController.getMessages);

// POST /api/chats/:id/messages - Send a message to chat
router.post("/:id/messages", chatController.sendMessage);

module.exports = router;
