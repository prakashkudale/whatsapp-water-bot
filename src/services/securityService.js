const logger = require('../utils/logger');
const User = require('../models/User');

class SecurityService {
  constructor() {
    this.outboundTimestamps = [];
    this.MAX_OUTBOUND_PER_MINUTE = 15; // Max 15 messages/minute across whole bot
    this.circuitBreakerTripped = false;
    this.circuitBreakerResetTimeout = null;
    
    // Primary Owner number for security alerts (updated with user's new host number 9978241539)
    this.PRIMARY_OWNER_PHONE = '919978241539';
    this.ownerNumbers = new Set([
      '919978241539',
      '9978241539',
      '919638767233',
      '9638767233',
      '14899426099415'
    ]);

    // Throttling for owner alerts (max 1 alert per 5 mins to prevent alert spam)
    this.lastOwnerAlertTime = 0;
    this.ALERT_THROTTLE_MS = 5 * 60 * 1000;
  }

  /**
   * Validate if an outbound message destination is strictly authorized
   * Prevents sending messages to random contacts or stolen session abuse
   * @param {string} to - Recipient phone or JID
   * @returns {Promise<{ allowed: boolean, reason?: string }>}
   */
  async validateOutboundMessage(to) {
    if (this.circuitBreakerTripped) {
      logger.error('🚨 SECURITY CIRCUIT BREAKER: Outbound sending blocked due to anomalous message rate!');
      return { allowed: false, reason: 'Circuit breaker active' };
    }

    const rawStr = String(to || '').trim();
    const userPart = rawStr.split('@')[0].split(':')[0];
    const cleanPhone = userPart.replace(/\D/g, '');

    if (!cleanPhone && !rawStr) {
      logger.warn('🚨 SECURITY ALERT: Attempted outbound message to empty destination.');
      return { allowed: false, reason: 'Empty destination' };
    }

    // 1. Check if recipient is owner
    if (
      this.ownerNumbers.has(cleanPhone) ||
      (cleanPhone.length === 10 && this.ownerNumbers.has(`91${cleanPhone}`)) ||
      (cleanPhone.startsWith('91') && this.ownerNumbers.has(cleanPhone.slice(2)))
    ) {
      return this._recordAndCheckRate(cleanPhone || 'owner');
    }

    // 2. Check if recipient is an active subscribed user or in active setup
    const user = await User.findOne({
      $or: [
        { phoneNumber: cleanPhone },
        ...(cleanPhone.length >= 10 ? [{ phoneNumber: { $regex: cleanPhone.slice(-10) + '$' } }] : []),
        { whatsappJid: rawStr }
      ]
    });

    if (user && (user.isSubscribed || (user.setupStep && user.setupStep !== 'NONE') || user.consentGiven)) {
      return this._recordAndCheckRate(cleanPhone);
    }

    // 3. Block unauthorized outbound message and notify owner
    logger.error(`🚨 SECURITY ALERT BLOCKED: Attempted to send unauthorized message to unknown number: ${cleanPhone || rawStr}`);
    
    // Trigger security alert to owner
    this.notifyOwner(
      '🛑 Unauthorized Recipient Blocked',
      `The bot intercepted and blocked an attempt to send a message to an unknown number (*+${cleanPhone || rawStr}*).`
    ).catch(() => {});

    return { allowed: false, reason: `Recipient ${cleanPhone || rawStr} is not an authorized subscribed user` };
  }

  /**
   * Rate-limiting and anomaly detection
   * @private
   */
  _recordAndCheckRate(cleanPhone) {
    const now = Date.now();
    this.outboundTimestamps = this.outboundTimestamps.filter(t => now - t < 60000);
    this.outboundTimestamps.push(now);

    if (this.outboundTimestamps.length > this.MAX_OUTBOUND_PER_MINUTE) {
      this.circuitBreakerTripped = true;
      logger.error(`🚨 CIRCUIT BREAKER TRIPPED: Outbound message rate exceeded ${this.MAX_OUTBOUND_PER_MINUTE}/min! Halting outbound messages for 2 minutes to protect your WhatsApp account.`);

      // Notify owner about circuit breaker
      this.notifyOwner(
        '⚡ Outbound Circuit Breaker Tripped',
        `Unusual outbound message spike (*>${this.MAX_OUTBOUND_PER_MINUTE} msgs/min*) detected! Outbound messaging is paused for 2 minutes to protect your WhatsApp account.`
      ).catch(() => {});

      if (this.circuitBreakerResetTimeout) clearTimeout(this.circuitBreakerResetTimeout);
      this.circuitBreakerResetTimeout = setTimeout(() => {
        this.circuitBreakerTripped = false;
        this.outboundTimestamps = [];
        logger.info('🛡️ Security circuit breaker auto-reset. Normal operation resumed.');
      }, 2 * 60 * 1000);

      return { allowed: false, reason: 'Outbound rate limit exceeded' };
    }

    return { allowed: true };
  }

  /**
   * Send a critical security/system alert directly to the bot owner's WhatsApp
   * @param {string} title
   * @param {string} details
   */
  async notifyOwner(title, details) {
    const now = Date.now();
    // Throttle to prevent alert flood
    if (now - this.lastOwnerAlertTime < this.ALERT_THROTTLE_MS) {
      logger.debug(`Owner alert throttled: ${title}`);
      return;
    }

    this.lastOwnerAlertTime = now;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const alertMessage = (
      `🚨 *SECURITY ALERT — Water Bot*\n\n` +
      `📌 *Issue:* ${title}\n` +
      `🕒 *Time:* ${timeStr}\n\n` +
      `📝 *Details:*\n${details}\n\n` +
      `━━━━━━━━━━━━━━━\n` +
      `🛡️ _Automated Safety Protection System_`
    );

    try {
      const whatsappDirectService = require('./whatsappDirectService');
      if (whatsappDirectService && whatsappDirectService.isConnected && whatsappDirectService.sock) {
        const jid = `${this.PRIMARY_OWNER_PHONE}@s.whatsapp.net`;
        await whatsappDirectService.sock.sendMessage(jid, { text: alertMessage });
        logger.info(`🚨 Security alert sent to owner (+${this.PRIMARY_OWNER_PHONE}): "${title}"`);
      }
    } catch (err) {
      logger.error('Failed to dispatch owner security alert to WhatsApp:', err.message);
    }
  }
}

module.exports = new SecurityService();
