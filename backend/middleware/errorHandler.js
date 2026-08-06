const logger = require("../utils/logger");

const errorHandler = (err, req, res, next) => {
  logger.error(`Unhandled error on ${req.method} ${req.originalUrl}`, err);

  const statusCode = err.statusCode || res.statusCode !== 200 ? res.statusCode : 500;

  res.status(statusCode).json({
    error: true,
    message: err.message || "Internal Server Error",
  });
};

module.exports = errorHandler;
