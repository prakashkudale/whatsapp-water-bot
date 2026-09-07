const qrcode = require('qrcode-terminal');
const pino = require('pino');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');
const userService = require('./userService');
const User = require('../models/User');

class WhatsAppDirectService {
  constructor() {
    this.sock = null;
    this.isConnected = false;
    this.authDir = path.join(process.cwd(), 'baileys_auth_info');
    this.sentMessageIds = new Set();
  }

  /**
   * Initialize WhatsApp connection via Baileys with terminal QR code
   */
  async initWhatsApp() {
    try {
      // Dynamic import of ESM Baileys module
      const baileys = await import('@whiskeysockets/baileys');
      const makeWASocket = baileys.default || baileys.makeWASocket;
      const { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = baileys;

      const { state, saveCreds } = await useMultiFileAuthState(this.authDir);
      const { version } = await fetchLatestBaileysVersion();

      logger.info(`Starting WhatsApp direct connection (v${version.join('.')})...`);

      this.sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state,
        browser: ['WhatsApp Water Reminder Bot', 'Chrome', '1.0.0']
      });

      // Save credentials whenever updated
      this.sock.ev.on('creds.update', saveCreds);

      // Handle connection updates & QR code display
      this.sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          console.log('\n======================================================');
          console.log('📱 SCAN THIS QR CODE WITH WHATSAPP TO LINK YOUR BOT:');
          console.log('👉 Open WhatsApp > Linked Devices > Link a Device');
          console.log('======================================================\n');
          qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
          this.isConnected = false;
          const statusCode = (lastDisconnect?.error)?.output?.statusCode;
          const isLoggedOut = statusCode === DisconnectReason.loggedOut || statusCode === 401;

          if (isLoggedOut) {
            logger.warn('WhatsApp session logged out. Clearing old session and generating fresh QR code...');
            try {
              if (fs.existsSync(this.authDir)) {
                fs.rmSync(this.authDir, { recursive: true, force: true });
              }
            } catch (e) {
              logger.error('Error removing authDir:', e.message);
            }
            setTimeout(() => this.initWhatsApp(), 2000);
          } else {
            logger.warn(`WhatsApp connection closed (status: ${statusCode}). Reconnecting in 5s...`);
            setTimeout(() => this.initWhatsApp(), 5000);
          }
        } else if (connection === 'open') {
          this.isConnected = true;
          logger.info('🎉 WhatsApp successfully linked and connected!');
          console.log('\n======================================================');
          console.log('✅ WhatsApp Linked! Send "/setup" to subscribe & start.');
          console.log('======================================================\n');
        }
      });

      // Handle incoming messages
      this.sock.ev.on('messages.upsert', async (m) => {
        try {
          if (!m.messages || m.messages.length === 0) return;

          for (const msg of m.messages) {
            if (!msg.message) continue;

            const remoteJid = msg.key?.remoteJid;
            if (!remoteJid || remoteJid === 'status@broadcast') continue;

            const msgId = msg.key?.id;

            // Check if this message was sent by the bot's own outbound code
            if (msgId && this.sentMessageIds.has(msgId)) {
              continue; // Skip bot's own programmatic replies
            }

            // Extract clean phone number / user ID by removing device index (:1) and domain
            const jidUserPart = remoteJid.split('@')[0].split(':')[0];
            let senderPhone = jidUserPart.replace(/\D/g, '');
            if (!senderPhone && this.sock?.user?.id) {
              senderPhone = this.sock.user.id.split(':')[0].split('@')[0].replace(/\D/g, '');
            }

            const pushName = msg.pushName || '';

            // Extract message body text from all possible message formats
            let text = 
              msg.message.buttonsResponseMessage?.selectedButtonId ||
              msg.message.buttonsResponseMessage?.selectedDisplayText ||
              msg.message.templateButtonReplyMessage?.selectedId ||
              msg.message.templateButtonReplyMessage?.selectedDisplayText ||
              msg.message.listResponseMessage?.singleSelectReply?.selectedRowId ||
              msg.message.listResponseMessage?.title ||
              msg.message.conversation ||
              msg.message.extendedTextMessage?.text ||
              msg.message.imageMessage?.caption ||
              msg.message.videoMessage?.caption ||
              '';

            // Handle native flow interactive button clicks
            if (!text && msg.message.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson) {
              try {
                const params = JSON.parse(msg.message.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson);
                text = params.id || params.value || '';
              } catch (e) {}
            }

            if (!text || !String(text).trim()) continue;

            // Route through user service with remoteJid for JID persistence
            const reply = await userService.processIncomingMessage(senderPhone, text, pushName, remoteJid);

            if (reply) {
              logger.info(`📥 Command from ${senderPhone}: "${text}"`);
              if (typeof reply === 'object' && reply.buttons && reply.buttons.length > 0) {
                await this.sendButtonMessage(remoteJid, reply.text, reply.buttons, reply.footer);
              } else {
                const replyText = typeof reply === 'string' ? reply : reply.text;
                await this.sendTextMessage(remoteJid, replyText);
              }
              logger.info(`📤 Sent reply to ${remoteJid}`);
            }
          }
        } catch (msgErr) {
          logger.error('Error processing WhatsApp message:', msgErr.message);
        }
      });

      // Handle Read Receipts (Blue Ticks / Message Seen events)
      this.sock.ev.on('message-receipt.update', async (receipts) => {
        try {
          for (const receipt of receipts) {
            const msgId = receipt.key?.id;
            const remoteJid = receipt.key?.remoteJid;
            if (!msgId || !remoteJid) continue;

            const isRead = receipt.receiptType === 'read' || receipt.receiptType === 'read-self' || receipt.status === 3;
            if (isRead) {
              const jidUser = remoteJid.split('@')[0].split(':')[0];
              const cleanPhone = jidUser.replace(/\D/g, '');

              const user = await User.findOne({
                $or: [
                  { phoneNumber: cleanPhone },
                  { whatsappJid: remoteJid },
                  { lastReminderMessageId: msgId }
                ]
              });

              if (user && user.lastReminderMessageId === msgId && user.lastReminderStatus !== 'REPLIED') {
                user.lastReminderStatus = 'SEEN';
                user.lastReminderSeenAt = new Date();
                await user.save();
                logger.info(`👀 User ${user.phoneNumber} opened and viewed water reminder at ${new Date().toLocaleTimeString()} (Blue Tick ✓✓)`);
              }
            }
          }
        } catch (rErr) {
          logger.error('Error handling message receipt:', rErr.message);
        }
      });

    } catch (err) {
      logger.error('Failed to initialize WhatsApp direct connection:', err.message);
    }
  }

  /**
   * Send interactive action menu message to a WhatsApp user
   * @param {string} to - Recipient JID or phone number
   * @param {string} text - Main message text
   * @param {Array<{ id: string, text: string }>} buttons - Button list
   * @param {string} [footer=''] - Optional footer text
   * @returns {Promise<object>}
   */
  async sendButtonMessage(to, text, buttons = [], footer = '') {
    let messageBody = text;

    if (buttons && buttons.length > 0) {
      const buttonRows = buttons.map(b => `🔘 *${b.text}*`).join('   ');
      messageBody += `\n\n━━━━━━━━━━━━━━━\n${buttonRows}`;
    }

    if (footer) {
      messageBody += `\n_${footer}_`;
    }

    return await this.sendTextMessage(to, messageBody);
  }

  /**
   * Send a WhatsApp text message to a phone number or JID
   * @param {string} to - Recipient phone number or JID
   * @param {string} text - Message text
   * @returns {Promise<{ success: boolean, messageId?: string, error?: string }>}
   */
  async sendTextMessage(to, text) {
    if (!this.sock || !this.isConnected) {
      logger.warn(`Cannot send message to ${to}: WhatsApp is not connected yet.`);
      return { success: false, error: 'WhatsApp not connected' };
    }

    // Security Gate: Validate recipient authorization and rate limits
    const securityService = require('./securityService');
    const secCheck = await securityService.validateOutboundMessage(to);
    if (!secCheck.allowed) {
      logger.warn(`[SECURITY INTERCEPT] Blocked message to ${to}: ${secCheck.reason}`);
      return { success: false, error: secCheck.reason };
    }

    try {
      let jid = String(to || '').trim();
      if (!jid.includes('@')) {
        let cleanPhone = jid.replace(/\D/g, '');
        // Auto-prepend default country code '91' for 10-digit numbers
        if (cleanPhone.length === 10 && /^[6-9]/.test(cleanPhone)) {
          cleanPhone = `91${cleanPhone}`;
        }
        jid = `${cleanPhone}@s.whatsapp.net`;
      }

      const sentMsg = await this.sock.sendMessage(jid, { text });
      const msgId = sentMsg?.key?.id;
      if (msgId) {
        this.sentMessageIds.add(msgId);
      }
      return { success: true, messageId: msgId };
    } catch (error) {
      logger.error(`Error sending direct WhatsApp message to ${to}:`, error.message);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new WhatsAppDirectService();
