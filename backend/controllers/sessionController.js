const wasenderService = require("../services/wasenderService");

/**
 * GET /api/session/status
 * Returns current WhatsApp session status.
 */
const getStatus = async (req, res, next) => {
  try {
    const status = await wasenderService.getSessionStatus();
    res.status(200).json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/session/qr
 * Returns current QR code if available.
 */
const getQR = async (req, res, next) => {
  try {
    const qrCode = await wasenderService.getQRCode();
    res.status(200).json({
      success: true,
      data: { qrCode },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/session/connect
 */
const connect = async (req, res, next) => {
  try {
    const result = await wasenderService.connectSession();
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/session/disconnect
 */
const disconnect = async (req, res, next) => {
  try {
    const result = await wasenderService.disconnectSession();
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/session/restart
 */
const restart = async (req, res, next) => {
  try {
    const result = await wasenderService.restartSession();
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStatus,
  getQR,
  connect,
  disconnect,
  restart,
};
