const app = require("./app");
const config = require("./config/env");
const logger = require("./utils/logger");

const PORT = config.port;

app.listen(PORT, () => {
  logger.log(`Backend proxy server running on http://localhost:${PORT}`);
  logger.log(`Wasender API: ${config.apiUrl}`);
  logger.log(`Session ID: ${config.sessionId}`);
});

// Prevent process crashes
process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception", err);
});

process.on("unhandledRejection", (err) => {
  logger.error("Unhandled Rejection", err);
});
