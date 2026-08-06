const wasenderService = require("../services/wasenderService");

/**
 * GET /api/chats
 * Returns list of chats / contacts directly from Wasender API.
 */
const getChats = async (req, res, next) => {
  try {
    const chats = await wasenderService.getChats();
    res.status(200).json({
      success: true,
      count: chats.length,
      data: chats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/chats/:id/messages
 * Returns message history for a specific contact / phone.
 */
const getMessages = async (req, res, next) => {
  try {
    const chatId = req.params.id;
    const messages = await wasenderService.getMessages(chatId);
    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/chats/:id/messages
 * Sends a message to a specific contact / phone.
 */
const sendMessage = async (req, res, next) => {
  try {
    const chatId = req.params.id;
    const { text, mediaUrl } = req.body;
    const result = await wasenderService.sendMessage(chatId, text, mediaUrl);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getChats,
  getMessages,
  sendMessage,
};
