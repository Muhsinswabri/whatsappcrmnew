const express = require("express");
const router = express.Router();
const sessionController = require("../controllers/sessionController");

// GET /api/session/status
router.get("/status", sessionController.getStatus);

// GET /api/session/qr
router.get("/qr", sessionController.getQR);

// POST /api/session/connect
router.post("/connect", sessionController.connect);

// POST /api/session/disconnect
router.post("/disconnect", sessionController.disconnect);

// POST /api/session/restart
router.post("/restart", sessionController.restart);

module.exports = router;
