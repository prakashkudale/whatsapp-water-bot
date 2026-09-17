const logger = require('../utils/logger');

let ExpoModule = null;
let expoInstance = null;

const getExpo = async () => {
  if (!expoInstance) {
    ExpoModule = await import('expo-server-sdk');
    expoInstance = new ExpoModule.Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN });
  }
  return { Expo: ExpoModule.Expo, expo: expoInstance };
};

// ===== Funny Hinglish One-Liner Push Notifications =====
const HINGLISH_PUSH_NOTIFICATIONS = {
  critical: [
    { title: '🚨 Emergency Alert!', body: 'Bhai, body ne resign kar di toh mat bolna humne bola nahi!' },
    { title: '⏰ Time Chal Raha Hai!', body: 'Paani peena tha ya selfie le rahe the? ABHI PI LO!' },
    { title: '🏃 Bhago Mat, Paani Lo!', body: 'Goal miss hone wala hai! 1 glass = 30 second ka kaam hai boss!' },
    { title: '🌵 Sookh Jaoge!', body: 'Itna dry feel kar rahe ho ki desert ban jaoge. Paani pi lo yaar!' },
    { title: '🚒 Fire Alarm!', body: 'Gale me aag lagi hai kya? Jaldi ek glass thel do!' },
    { title: '🔋 Battery 1%!', body: 'Tumhara internal battery dead hone wala hai. Paani se charge karo!' },
    { title: '💀 Zombie Mode?', body: 'Aise chaloge bina paani ke toh zombie ban jaoge. Ek glass gatak lo!' }
  ],
  behind: [
    { title: '🌵 Cactus Alert!', body: 'Cactus bhi paani maangta hai — aur tum? Utho, gatak lo!' },
    { title: '💧 Paani, Paani!', body: 'Gala sookha, lips chatt rahi hain? 1 glass lo, jaldi!' },
    { title: '😤 Arre Bhai!', body: 'Target se peeche ho. Body parcel wapas bhej degi — paani do!' },
    { title: '📢 Dhyan Do!', body: 'Instagram scroll baad mein, pehle 1 glass paani pi lo!' },
    { title: '🐢 Kachhua Speed!', body: 'Pace itna slow kyun? Ek glass paani piyo aur speed badhao!' },
    { title: '👀 Koi Dekh Raha Hai...', body: 'Haan, main dekh raha hoon tumne paani nahi piya hai. Utho!' },
    { title: '🏜️ Rajasthan Feel?', body: 'Garmi bhale hi na ho, andar se Rajasthan ban gaya hai. Hydrate karo!' },
    { title: '🔍 Missing Report!', body: 'Tumhara paani ka glass gayab hai. Dhundo aur piyo!' }
  ],
  ontrack: [
    { title: '💧 Hydration Break!', body: 'Phone rakh, paani uth, 1 glass pi, wapas aa. 30 second ka kaam!' },
    { title: '⚡ Energy Boost Time!', body: 'Ek glass paani = instant energy. Try karo, fark dikhega!' },
    { title: '🥛 Time Ho Gaya!', body: 'Paani peene ka reminder? Kyunki hum care karte hain boss!' },
    { title: '🎵 Paani Paani!', body: 'Aaj ka pace smooth chal raha hai — 1 aur glass aur winner!' },
    { title: '👍 Sahi Ja Rahe Ho!', body: 'Bilkul track par ho! Ek aur glass piyo aur momentum banaye rakho.' },
    { title: '💪 Flex It!', body: 'Paani peete hue jo muscle flex hoti hai na? Woh karo abhi!' },
    { title: '🎯 Focus Mode!', body: 'Paani piyo aur kaam pe lag jao. Boss mode ON!' }
  ],
  ahead: [
    { title: '🔥 Almost There!', body: 'Thoda sa aur aur aaj ka goal phat jaega! Chalo ek aur!' },
    { title: '👑 Champion Chal Raha!', body: 'Pace ekdum mast hai. Bas 1 glass aur aur trophy pakka!' },
    { title: '🚀 Rocket Speed!', body: 'Kya speed hai bhai! Bas thoda aur bacha hai, finish kar daalo!' },
    { title: '🌟 Super Star!', body: 'Aaj toh form me ho! Ek glass paani aur tum record tod doge.' },
    { title: '🌊 Tsunami Aa Gayi!', body: 'Paani peene ki speed dekh ke ocean bhi sharma jaye. Keep going!' }
  ],
  chill: [
    { title: '😎 Chill Mode!', body: 'Aaj toh bahut accha piya! No rush — jab mann kare 1 aur pi lena.' },
    { title: '🧘 Relax Karo!', body: 'Hydration game strong hai aaj. Proud of you boss! ☕' },
    { title: '🏖️ Vacation Vibes!', body: 'Tension nahi lene ka, paani limit cross ho chuka hai lagta hai. Chill maro!' },
    { title: '😌 Peace of Mind!', body: 'Body fully hydrated hai. Ab aaram se baith ke duniya dekho.' }
  ],
  goalComplete: [
    { title: '🏆 100% GOAL DONE!', body: 'Aaj ka target tod diya! Tu certified Hydration King/Queen hai! 👑' },
    { title: '🎉 BOOM! Goal Complete!', body: 'Body bol rahi hai — shukriya dost! Kal bhi aisi hi dedication chahiye!' },
    { title: '🥳 Party Time!', body: 'Goal pura! Ab jaake cold drink nahi... ek aur glass paani hi peena!' },
    { title: '🥇 Gold Medal!', body: 'Hydration Olympics me aaj ka gold tumhara. Awesome job!' },
    { title: '🎤 Mic Drop!', body: 'Goal achieved. Haters gonna hate, hydrators gonna hydrate!' }
  ],
  morning: [
    { title: '🌅 Good Morning!', body: 'Utho, jaago, 1 glass paani piyo! Din ki sahi shuruat yahi se!' },
    { title: '☀️ Namaste!', body: 'Khali pet 1 glass paani = superpower on! Aaj ka goal start karo!' },
    { title: '🥱 Neend Bhagao!', body: 'Chai se pehle paani? Try karo, neend fatak se ud jayegi!' },
    { title: '🌞 Naya Din, Naya Goal!', body: 'Fresh start. Pehla glass gatak lo aur din pe kabza karo!' }
  ],
  bedtime: [
    { title: '🌙 Sone Se Pehle!', body: 'Goal poora? Agar nahi, toh 1 aur glass pi lo — kal ka body thank you bolega!' },
    { title: '😴 Good Night!', body: 'Aaj ka paani score dekha? Kal aur better karo! Sweet dreams 💧' },
    { title: '🛏️ Bedtime Hydration!', body: 'Ek chota sip lo, aur aaram se so jao. Subah milte hain!' },
    { title: '🦉 Night Owl?', body: 'Abhi tak jag rahe ho? Toh ek ghoont paani bhi peete jao!' }
  ]
};

/**
 * Get a random notification for the given urgency type
 * @param {string} type - 'critical'|'behind'|'ontrack'|'ahead'|'chill'|'goalComplete'|'morning'|'bedtime'
 * @returns {{ title: string, body: string }}
 */
const getHinglishNotification = (type = 'ontrack') => {
  const pool = HINGLISH_PUSH_NOTIFICATIONS[type] || HINGLISH_PUSH_NOTIFICATIONS.ontrack;
  return pool[Math.floor(Math.random() * pool.length)];
};

/**
 * Send a push notification to a single user
 * @param {string} expoPushToken
 * @param {string} title
 * @param {string} body
 * @param {object} [data={}] - Extra data payload for the app to handle
 */
const sendPushNotification = async (expoPushToken, title, body, data = {}) => {
  try {
    const { Expo, expo } = await getExpo();

    if (!expoPushToken) return { success: false, error: 'No push token' };
    if (!Expo.isExpoPushToken(expoPushToken)) {
      logger.warn(`Invalid Expo push token: ${expoPushToken}`);
      return { success: false, error: 'Invalid push token' };
    }

    const message = {
      to: expoPushToken,
      sound: 'default',
      title,
      body,
      data,
      priority: 'high',
      channelId: 'hydrosmart-reminders',
    };

    const chunks = expo.chunkPushNotifications([message]);
    for (const chunk of chunks) {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      const error = ticketChunk.find(t => t.status === 'error');
      if (error) {
        logger.error(`Push notification error for ${expoPushToken}:`, error.message);
        return { success: false, error: error.message };
      }
    }

    logger.info(`📲 Push sent: "${title}" → ${expoPushToken.slice(-6)}`);
    return { success: true };
  } catch (err) {
    logger.error('sendPushNotification error:', err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Send smart reminder push to a user
 * @param {object} user - User document with expoPushToken
 * @param {string} urgency - 'critical'|'behind'|'ontrack'|'ahead'|'chill'
 * @param {object} logData - { totalConsumed, goal, remaining }
 */
const sendSmartReminderPush = async (user, urgency, logData) => {
  if (!user.expoPushToken) return { success: false, error: 'No push token registered' };

  const notification = getHinglishNotification(urgency);
  return sendPushNotification(
    user.expoPushToken,
    notification.title,
    notification.body,
    { type: 'reminder', urgency, ...logData }
  );
};

module.exports = {
  sendPushNotification,
  sendSmartReminderPush,
  getHinglishNotification,
  HINGLISH_PUSH_NOTIFICATIONS
};
