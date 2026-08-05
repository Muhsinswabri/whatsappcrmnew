const express = require("express");
const router = express.Router();

const chatRoutes = require("./chatRoutes");
const sessionRoutes = require("./sessionRoutes");

router.use("/chats", chatRoutes);
router.use("/session", sessionRoutes);

module.exports = router;
