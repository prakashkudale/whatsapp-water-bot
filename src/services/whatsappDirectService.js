const qrcode = require('qrcode-terminal');
const pino = require('pino');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');
const userService = require('./userService');

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
          console.log('✅ WhatsApp Linked! Send "setup" from WhatsApp to start.');
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

            // Check if this message was sent by the bot itself
            if (msgId && this.sentMessageIds.has(msgId)) {
              continue; // Skip bot's own outbound replies
            }

            // Extract clean phone number
            let senderPhone = remoteJid.replace(/@s\.whatsapp\.net|@c\.us/g, '').replace(/\D/g, '');
            if (!senderPhone && this.sock?.user?.id) {
              senderPhone = this.sock.user.id.split(':')[0].replace(/\D/g, '');
            }

            const pushName = msg.pushName || '';

            // Extract message body text from all possible message and button formats
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

            logger.info(`📥 Received message from ${senderPhone} (${pushName || 'User'}): "${text}"`);

            // Route through user service
            const reply = await userService.processIncomingMessage(senderPhone, text, pushName);

            if (reply) {
              if (typeof reply === 'object' && reply.buttons && reply.buttons.length > 0) {
                await this.sendButtonMessage(remoteJid, reply.text, reply.buttons, reply.footer);
              } else {
                const replyText = typeof reply === 'string' ? reply : reply.text;
                await this.sendTextMessage(remoteJid, replyText);
              }
              logger.info(`📤 Replied to ${senderPhone}`);
            }
          }
        } catch (msgErr) {
          logger.error('Error processing WhatsApp direct message:', msgErr.message);
        }
      });

    } catch (err) {
      logger.error('Failed to initialize WhatsApp direct connection:', err.message);
    }
  }

  /**
   * Send interactive action menu message to a WhatsApp user
   * @param {string} to - Recipient phone number or JID
   * @param {string} text - Main message text
   * @param {Array<{ id: string, text: string }>} buttons - Button list
   * @param {string} [footer=''] - Optional footer text
   * @returns {Promise<boolean>}
   */
  async sendButtonMessage(to, text, buttons = [], footer = '') {
    if (!this.sock || !this.isConnected) {
      logger.warn(`Cannot send button message to ${to}: WhatsApp is not connected yet.`);
      return false;
    }

    try {
      const cleanPhone = to.replace(/@s\.whatsapp\.net|@c\.us/g, '').replace(/\D/g, '');
      const jid = `${cleanPhone}@s.whatsapp.net`;

      let messageBody = text;

      if (buttons && buttons.length > 0) {
        const buttonRows = buttons.map(b => `🔘 *${b.text}*`).join('   ');
        messageBody += `\n\n━━━━━━━━━━━━━━━\n${buttonRows}`;
      }

      if (footer) {
        messageBody += `\n_${footer}_`;
      }

      return await this.sendTextMessage(jid, messageBody);
    } catch (error) {
      logger.error(`Error sending button message to ${to}:`, error.message);
      return false;
    }
  }

  /**
   * Send a WhatsApp text message to a phone number
   * @param {string} to - Recipient phone number (e.g. 919876543210)
   * @param {string} text - Message text
   * @returns {Promise<boolean>}
   */
  async sendTextMessage(to, text) {
    if (!this.sock || !this.isConnected) {
      logger.warn(`Cannot send message to ${to}: WhatsApp is not connected yet.`);
      return false;
    }

    try {
      const cleanPhone = to.replace(/@s\.whatsapp\.net|@c\.us/g, '').replace(/\D/g, '');
      const jid = `${cleanPhone}@s.whatsapp.net`;

      const sentMsg = await this.sock.sendMessage(jid, { text });
      if (sentMsg?.key?.id) {
        this.sentMessageIds.add(sentMsg.key.id);
      }
      logger.info(`📤 Sent direct message to ${cleanPhone}`);
      return true;
    } catch (error) {
      logger.error(`Error sending direct WhatsApp message to ${to}:`, error.message);
      return false;
    }
  }
}

module.exports = new WhatsAppDirectService();
