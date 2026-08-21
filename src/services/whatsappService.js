const axios = require('axios');
const logger = require('../utils/logger');

/**
 * WhatsApp Service supporting Direct Baileys QR, OpenWA, and Meta WhatsApp Cloud API
 */
class WhatsAppService {
  constructor() {
    this.provider = process.env.WHATSAPP_PROVIDER || 'direct';
    
    // OpenWA Configuration
    this.openWaApiUrl = process.env.OPENWA_API_URL || 'http://localhost:2785';
    this.openWaApiKey = process.env.OPENWA_API_KEY || '';
    this.openWaSession = process.env.OPENWA_SESSION_ID || 'default';

    // Meta Cloud API Configuration
    this.metaAccessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
    this.metaPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    this.metaApiVersion = process.env.WHATSAPP_API_VERSION || 'v21.0';
  }

  /**
   * Normalize phone number to standard format (digits only, e.g. 919876543210)
   * @param {string} phone
   * @returns {string}
   */
  normalizePhoneNumber(phone) {
    if (!phone) return '';
    // Remove WhatsApp chat suffix if present (e.g. 919876543210@c.us -> 919876543210)
    let clean = phone.replace(/@c\.us|@s\.whatsapp\.net/g, '');
    // Remove non-digit characters (+, spaces, dashes)
    return clean.replace(/\D/g, '');
  }

  /**
   * Send interactive button message to a WhatsApp user
   * @param {string} to - Recipient phone number
   * @param {string} text - Message text
   * @param {Array<{ id: string, text: string }>} buttons - Buttons array
   * @param {string} [footer=''] - Optional footer
   * @returns {Promise<object>}
   */
  async sendButtonMessage(to, text, buttons = [], footer = '') {
    const recipient = this.normalizePhoneNumber(to);

    if (!recipient) {
      logger.error('WhatsApp sendButtonMessage failed: Invalid recipient phone number');
      throw new Error('Recipient phone number is required');
    }

    if (this.provider === 'direct') {
      const whatsappDirectService = require('./whatsappDirectService');
      const sent = await whatsappDirectService.sendButtonMessage(recipient, text, buttons, footer);
      return { success: sent, provider: 'direct' };
    } else {
      // For OpenWA or Meta fallback, send formatted text menu
      const menuText = text + '\n\n' + buttons.map(b => `👉 *${b.text}*`).join('\n');
      return this.sendTextMessage(recipient, menuText);
    }
  }

  /**
   * Send a text message to a WhatsApp user
   * @param {string} to - Recipient phone number (e.g. 919876543210)
   * @param {string} text - Message text
   * @returns {Promise<object>}
   */
  async sendTextMessage(to, text) {
    const recipient = this.normalizePhoneNumber(to);

    if (!recipient) {
      logger.error('WhatsApp sendTextMessage failed: Invalid recipient phone number');
      throw new Error('Recipient phone number is required');
    }

    if (!text || !text.trim()) {
      logger.error('WhatsApp sendTextMessage failed: Message text is empty');
      throw new Error('Message text cannot be empty');
    }

    logger.info(`Sending WhatsApp message [Provider: ${this.provider}] to ${recipient}: ${text.substring(0, 50)}...`);

    if (this.provider === 'direct') {
      const whatsappDirectService = require('./whatsappDirectService');
      const sent = await whatsappDirectService.sendTextMessage(recipient, text);
      return { success: sent, provider: 'direct' };
    } else if (this.provider === 'meta') {
      return this._sendViaMetaCloudApi(recipient, text);
    } else if (this.provider === 'openwa') {
      return this._sendViaOpenWA(recipient, text);
    } else {
      // Mock / Local Test mode
      logger.info(`[MOCK MODE] WhatsApp message to ${recipient}:\n${text}`);
      return { success: true, mock: true, recipient, text };
    }
  }

  /**
   * Send message via OpenWA Gateway API
   * @private
   */
  async _sendViaOpenWA(recipient, text) {
    try {
      const url = `${this.openWaApiUrl.replace(/\/$/, '')}/api/v1/messages/send-text`;
      
      const payload = {
        sessionId: this.openWaSession,
        to: recipient.includes('@') ? recipient : `${recipient}@c.us`,
        text: text
      };

      const headers = {
        'Content-Type': 'application/json'
      };

      if (this.openWaApiKey) {
        headers['Authorization'] = `Bearer ${this.openWaApiKey}`;
        headers['x-api-key'] = this.openWaApiKey;
      }

      const response = await axios.post(url, payload, { headers, timeout: 15000 });
      logger.info(`OpenWA message sent successfully to ${recipient}`);
      return { success: true, data: response.data };
    } catch (error) {
      logger.error(`OpenWA API error sending message to ${recipient}:`, error.response?.data || error.message);
      return { success: false, error: error.response?.data || error.message };
    }
  }

  /**
   * Send message via Meta WhatsApp Cloud API
   * @private
   */
  async _sendViaMetaCloudApi(recipient, text) {
    if (!this.metaAccessToken || !this.metaPhoneNumberId) {
      logger.warn('Meta WhatsApp Cloud API credentials missing in .env. Logging message instead.');
      return { success: false, error: 'Meta Cloud API credentials not configured' };
    }

    try {
      const url = `https://graph.facebook.com/${this.metaApiVersion}/${this.metaPhoneNumberId}/messages`;
      
      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: recipient,
        type: 'text',
        text: {
          preview_url: false,
          body: text
        }
      };

      const response = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${this.metaAccessToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });

      logger.info(`Meta Cloud API message sent successfully to ${recipient}. Message ID:`, response.data?.messages?.[0]?.id);
      return { success: true, data: response.data };
    } catch (error) {
      logger.error(`Meta Cloud API error sending message to ${recipient}:`, error.response?.data || error.message);
      return { success: false, error: error.response?.data || error.message };
    }
  }
}

module.exports = new WhatsAppService();
