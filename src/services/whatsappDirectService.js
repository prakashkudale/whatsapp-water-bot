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

    // --- Anti-Ban: Connection management state ---
    this.retryCount = 0;              // Tracks consecutive failed reconnect attempts
    this.MAX_RETRIES = 5;             // Stop reconnecting after this many failures
    this.MAX_BACKOFF_MS = 60000;      // Max delay between retries (1 minute)
    this.qrAttempts = 0;              // Tracks how many QR codes shown without a scan
    this.MAX_QR_ATTEMPTS = 5;         // Stop generating QR codes after this many
    this._onConnectedCallback = null; // Callback for server.js to know when we're ready
  }

  /**
   * Register a callback that fires once when the connection is first established.
   * Used by server.js to delay the reminder job until WhatsApp is actually connected.
   * @param {Function} cb
   */
  onConnected(cb) {
    this._onConnectedCallback = cb;
  }

  /**
   * Initialize WhatsApp connection via Baileys with terminal QR code
   */
  async initWhatsApp() {
    try {
      // Dynamic import of ESM Baileys module
      const baileys = await import('@whiskeysockets/baileys');
      const makeWASocket = baileys.default || baileys.makeWASocket;
      const {
        useMultiFileAuthState,
        DisconnectReason,
        fetchLatestBaileysVersion,
        Browsers
      } = baileys;

      const { state, saveCreds } = await useMultiFileAuthState(this.authDir);
      const { version } = await fetchLatestBaileysVersion();

      logger.info(`Starting WhatsApp direct connection (v${version.join('.')})...`);

      this.sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state,

        // ===== Anti-Ban Configuration =====
        // Use Baileys' official Browsers helper — produces a protocol-correct tuple
        // that matches what WhatsApp Web expects from a real macOS Chrome session.
        browser: Browsers.macOS('Chrome'),

        // Don't sync old message history on connect — reduces initial data burst
        syncFullHistory: false,

        // Don't broadcast "online" presence the instant we connect
        markOnlineOnConnect: false,

        // Don't generate link previews (reduces background HTTP requests)
        generateHighQualityLinkPreview: false,

        // Don't re-emit our own sent messages as incoming events
        emitOwnEvents: false
      });

      // Save credentials whenever updated
      this.sock.ev.on('creds.update', saveCreds);

      // Handle connection updates & QR code display
      this.sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          this.qrAttempts++;

          if (this.qrAttempts > this.MAX_QR_ATTEMPTS) {
            logger.error(`⛔ QR code shown ${this.MAX_QR_ATTEMPTS} times without scan. Stopping to prevent WhatsApp from flagging this IP. Please restart the bot manually when ready to scan.`);
            console.log('\n======================================================');
            console.log('⛔ Too many unscanned QR codes. Bot stopped.');
            console.log('   Restart with: npm start');
            console.log('======================================================\n');
            // Don't call initWhatsApp again — just stop
            return;
          }

          console.log('\n======================================================');
          console.log(`📱 SCAN THIS QR CODE WITH WHATSAPP (Attempt ${this.qrAttempts}/${this.MAX_QR_ATTEMPTS}):`);
          console.log('👉 Open WhatsApp > Linked Devices > Link a Device');
          console.log('======================================================\n');
          qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
          this.isConnected = false;
          const statusCode = (lastDisconnect?.error)?.output?.statusCode;
          const errorMessage = lastDisconnect?.error?.message || 'Unknown';
          const isLoggedOut = statusCode === DisconnectReason.loggedOut || statusCode === 401;

          logger.warn(`WhatsApp connection closed — Status: ${statusCode}, Reason: ${errorMessage}`);

          if (isLoggedOut) {
            // Session is dead. Clear credentials and let user re-scan.
            logger.warn('Session logged out. Clearing old session for fresh QR code...');
            try {
              if (fs.existsSync(this.authDir)) {
                fs.rmSync(this.authDir, { recursive: true, force: true });
              }
            } catch (e) {
              logger.error('Error removing authDir:', e.message);
            }
            // Reset counters for fresh start
            this.retryCount = 0;
            this.qrAttempts = 0;
            setTimeout(() => this.initWhatsApp(), 3000);

          } else {
            // --- Exponential backoff with max retry cap ---
            this.retryCount++;

            if (this.retryCount > this.MAX_RETRIES) {
              logger.error(`⛔ Failed to reconnect after ${this.MAX_RETRIES} attempts. Stopping auto-reconnect to protect your WhatsApp account. Please restart the bot manually.`);
              console.log('\n======================================================');
              console.log(`⛔ Reconnection failed ${this.MAX_RETRIES} times. Bot stopped.`);
              console.log('   This prevents WhatsApp from banning your number.');
              console.log('   Restart with: npm start');
              console.log('======================================================\n');
              return; // STOP — do not reconnect
            }

            // Exponential delay: 5s, 10s, 20s, 40s, 60s (capped)
            const delay = Math.min(
              Math.pow(2, this.retryCount - 1) * 5000,
              this.MAX_BACKOFF_MS
            );
            // Add jitter (±20%) to avoid synchronized retries
            const jitter = delay * (0.8 + Math.random() * 0.4);
            const delaySec = Math.round(jitter / 1000);

            logger.warn(`Reconnecting in ${delaySec}s (attempt ${this.retryCount}/${this.MAX_RETRIES})...`);
            setTimeout(() => this.initWhatsApp(), jitter);
          }

        } else if (connection === 'open') {
          this.isConnected = true;
          // Reset all counters on successful connection
          this.retryCount = 0;
          this.qrAttempts = 0;

          logger.info('🎉 WhatsApp successfully linked and connected!');
          console.log('\n======================================================');
          console.log('✅ WhatsApp Linked! Send "/setup" to subscribe & start.');
          console.log('======================================================\n');

          // Fire the onConnected callback (used by server.js to start reminder job)
          if (this._onConnectedCallback) {
            try {
              this._onConnectedCallback();
            } catch (cbErr) {
              logger.error('Error in onConnected callback:', cbErr.message);
            }
            this._onConnectedCallback = null; // Fire only once
          }
        }
      });

      // Handle incoming messages
      this.sock.ev.on('messages.upsert', async (m) => {
        try {
          if (!m.messages || m.messages.length === 0) return;

          for (const msg of m.messages) {
            if (!msg.message) continue;

            // Skip messages sent by the bot itself
            if (msg.key?.fromMe) continue;

            const remoteJid = msg.key?.remoteJid;
            if (!remoteJid || remoteJid === 'status@broadcast') continue;

            const msgId = msg.key?.id;

            // Double-check: skip bot's own programmatic replies
            if (msgId && this.sentMessageIds.has(msgId)) {
              continue;
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
   * Send a WhatsApp text message to a phone number or JID.
   * NOTE: Security validation is handled by whatsappService.js (the caller).
   *       This method does NOT duplicate the security check.
   * @param {string} to - Recipient phone number or JID
   * @param {string} text - Message text
   * @returns {Promise<{ success: boolean, messageId?: string, error?: string }>}
   */
  async sendTextMessage(to, text) {
    if (!this.sock || !this.isConnected) {
      logger.warn(`Cannot send message to ${to}: WhatsApp is not connected yet.`);
      return { success: false, error: 'WhatsApp not connected' };
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
        // Prevent sentMessageIds from growing forever (keep last 500)
        if (this.sentMessageIds.size > 500) {
          const first = this.sentMessageIds.values().next().value;
          this.sentMessageIds.delete(first);
        }
      }
      return { success: true, messageId: msgId };
    } catch (error) {
      logger.error(`Error sending direct WhatsApp message to ${to}:`, error.message);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new WhatsAppDirectService();
