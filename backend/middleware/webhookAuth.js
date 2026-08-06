const config = require("../config/env");

const verifyWebhookSecret = (req, res, next) => {
  // If no secret configured, pass through
  if (!config.webhookSecret) {
    return next();
  }

  const signature =
    req.headers["x-wasender-signature"] ||
    req.headers["x-signature"] ||
    req.headers["x-webhook-secret"] ||
    req.query.secret;

  if (!signature || signature !== config.webhookSecret) {
    return res.status(401).json({
      error: true,
      message: "Unauthorized: Invalid webhook secret signature",
    });
  }

  next();
};

module.exports = verifyWebhookSecret;
