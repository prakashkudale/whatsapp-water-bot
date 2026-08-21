const logger = require('../utils/logger');
const whatsappService = require('../services/whatsappService');
const userService = require('../services/userService');

/**
 * Helper to extract incoming message data from either Meta Cloud API or OpenWA webhook payloads
 * @param {object} body - Webhook request body
 * @returns {object|null} { from, text, messageId, name, timestamp } or null
 */
const extractIncomingMessage = (body) => {
  if (!body) return null;

  // 1. Check Meta WhatsApp Cloud API format
  if (body.object === 'whatsapp_business_account' && Array.isArray(body.entry)) {
    for (const entry of body.entry) {
      for (const change of entry.changes || []) {
        const value = change.value;
        if (value && Array.isArray(value.messages) && value.messages.length > 0) {
          const message = value.messages[0];
          const contact = value.contacts?.[0] || {};
          
          let text = '';
          if (message.type === 'text' && message.text?.body) {
            text = message.text.body;
          } else if (message.type === 'button' && message.button?.text) {
            text = message.button.text;
          } else if (message.type === 'interactive') {
            text = message.interactive?.button_reply?.title || message.interactive?.list_reply?.title || '';
          }

          return {
            from: message.from,
            text: text.trim(),
            messageId: message.id,
            name: contact.profile?.name || '',
            timestamp: message.timestamp,
            provider: 'meta'
          };
        }
      }
    }
  }

  // 2. Check OpenWA standard webhook format
  // OpenWA sends events like { event: "message", session: "...", data: { ... } } or direct message object
  const data = body.data || body.message || body;

  // Ensure it's a message and not a status update or outgoing echo
  if (data.fromMe === true) {
    return null; // Ignore our own sent messages
  }

  const from = data.from || data.sender?.id || data.chatId || body.from;
  const text = data.body || data.text || data.content || body.text || '';
  const messageId = data.id?._serialized || data.id || data.messageId || body.id || `msg_${Date.now()}`;
  const name = data.sender?.pushname || data.notifyName || data.name || body.name || '';

  if (from && text) {
    return {
      from: whatsappService.normalizePhoneNumber(from),
      text: String(text).trim(),
      messageId: String(messageId),
      name: String(name),
      timestamp: data.timestamp || Date.now(),
      provider: 'openwa'
    };
  }

  return null;
};

/**
 * Webhook Verification (GET /webhook)
 * Primarily used by Meta Cloud API verification challenge
 */
const verifyWebhook = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode && token) {
    if (mode === 'subscribe' && token === verifyToken) {
      logger.info('WhatsApp webhook verified successfully!');
      return res.status(200).send(challenge);
    } else {
      logger.warn('WhatsApp webhook verification failed. Token mismatch.');
      return res.status(403).json({ success: false, message: 'Verification failed' });
    }
  }

  // Simple browser check
  res.status(200).json({
    success: true,
    message: 'WhatsApp Webhook endpoint is active. Use POST /webhook for receiving incoming events.'
  });
};

/**
 * Incoming Webhook Handler (POST /webhook)
 * Receives messages from WhatsApp Cloud API or OpenWA Gateway
 */
const handleWebhook = async (req, res) => {
  // Always acknowledge webhook immediately with 200 OK
  res.status(200).json({ status: 'received' });

  try {
    const incoming = extractIncomingMessage(req.body);

    if (!incoming || !incoming.text) {
      logger.debug('Webhook received non-message event (e.g. status/delivery update). Skipping.');
      return;
    }

    logger.info(`📥 Processing message from ${incoming.from} (${incoming.name || 'User'}): "${incoming.text}"`);

    // Route through userService for setup, commands, and water intake logging
    const replyText = await userService.processIncomingMessage(incoming.from, incoming.text, incoming.name);

    if (replyText) {
      await whatsappService.sendTextMessage(incoming.from, replyText);
    }

  } catch (error) {
    logger.error('Error handling incoming WhatsApp webhook:', error.message);
  }
};

module.exports = {
  verifyWebhook,
  handleWebhook,
  extractIncomingMessage
};
