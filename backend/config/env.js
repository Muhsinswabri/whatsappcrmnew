const dotenv = require("dotenv");
dotenv.config();

module.exports = {
  port: process.env.PORT || 5000,
  apiUrl: process.env.API_URL || "https://wasenderapi.com/api",
  apiKey:
    process.env.API_KEY ||
    "c460f962c1a9134e761f67d379de9b36824423bc5ead27dc7a6484f8f6df0f9c",
  webhookSecret: process.env.WEBHOOK_SECRET || "",
  sessionId: process.env.SESSION_ID || "105975",
};
