const express = require("express");
const router = express.Router();
const webhookController = require("../controllers/webhookController");
const webhookAuth = require("../middleware/webhookAuth");

// POST /webhook/wasender - Receive Wasender webhooks
router.post("/wasender", webhookAuth, webhookController.handleWebhook);

module.exports = router;
