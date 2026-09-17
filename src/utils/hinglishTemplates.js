/**
 * Funny & Engaging Hinglish Message Templates for Water Reminder Bot
 * With Smart Adaptive Reminders & Vegetarian Nutrition Tips
 */

/**
 * Visual Progress Bar generator
 * @param {number} percentage
 * @param {number} totalBlocks
 * @returns {string}
 */
const createProgressBar = (percentage, totalBlocks = 12) => {
  const clamped = Math.max(0, Math.min(100, percentage));
  const filledBlocks = Math.round((clamped / 100) * totalBlocks);
  const emptyBlocks = totalBlocks - filledBlocks;
  return '█'.repeat(filledBlocks) + '░'.repeat(emptyBlocks);
};

// ===== Vegetarian Nutrition Tips Pool (No eggs, 100% veg) =====
const NUTRITION_TIPS = [
  `💪 *Nutrition Tip:* Paneer (100g) me 18g protein hota hai — dinner me paneer tikka try karo!`,
  `💪 *Nutrition Tip:* Ek glass doodh me 8g protein — paani ke baad doodh bhi pi lo!`,
  `💪 *Nutrition Tip:* Chana (chickpeas) me 19g protein per 100g — budget bodybuilding! 💰`,
  `💪 *Nutrition Tip:* Soybean me 36g protein per 100g — sabse sasta protein source! 🫘`,
  `💪 *Nutrition Tip:* Moong dal me 24g protein per 100g — roz dal chawal khao boss! 🍚`,
  `💪 *Nutrition Tip:* Dahi (curd) 200g me 7g protein + gut health boost! Roz khao! 🥛`,
  `💪 *Nutrition Tip:* Rajma me 24g protein per 100g — rajma chawal = muscle fuel! 💥`,
  `💪 *Nutrition Tip:* Peanut butter 2 spoon me 8g protein — roti pe laga ke khao! 🥜`,
  `💪 *Nutrition Tip:* Palak (spinach) me iron + calcium — Popeye bhi yahi khata tha! 🥬`,
  `💪 *Nutrition Tip:* Badam (almonds) 20 pcs = 6g protein + vitamin E — snack me khao! 🌰`,
  `💪 *Nutrition Tip:* Tofu 100g me 8g protein — paneer ka healthy cousin! Try karo! 🧈`,
  `💪 *Nutrition Tip:* Sprouts (ankurit chana) me protein 2x ho jaata hai + digestion improve! 🌱`,
  `💪 *Nutrition Tip:* Sattu drink me 20g protein per glass — Bihar ka OG protein shake! 🥤`,
  `💪 *Nutrition Tip:* Masoor dal me 26g protein per 100g — roz 1 katori zaroor khao! 🥣`,
  `💪 *Nutrition Tip:* Banana + doodh = instant energy + 10g protein — gym ke baad perfect! 🍌`,
  `💪 *Nutrition Tip:* Kaju (cashew) 30g me 5g protein + healthy fats — mood bhi accha hoga! 😊`,
  `💪 *Nutrition Tip:* Chana dal ka besan chilla = 15g protein per serving — nashte me bana lo! 🥞`,
  `💪 *Nutrition Tip:* Ragi (nachni) me calcium gai ke doodh se 3x zyada hota hai! 💀🦴`,
  `💪 *Nutrition Tip:* Til (sesame seeds) 2 spoon me iron + calcium — laddu bana ke khao! ✨`,
  `💪 *Nutrition Tip:* Paani + nimbu + honey = electrolytes reset — workout ke baad peena! 🍋`
];

/**
 * Get a random vegetarian nutrition tip
 * @returns {string}
 */
const getRandomNutritionTip = () => {
  return NUTRITION_TIPS[Math.floor(Math.random() * NUTRITION_TIPS.length)];
};

// 1. Welcome & Consent
const getWelcomeConsentMessage = () => {
  return (
    `👋 *Arre Dost! Welcome to Water Reminder Bot!* 💧\n\n` +
    `Human body me 70% paani hota hai, lekin aap camel (oont 🐪) ban ke baithe ho!\n\n` +
    `Hum aapko daily reminders bhejenge taaki aap active aur fit raho:\n` +
    `• Time to time paani peene ka reminder ⏰\n` +
    `• Raat ko aaram se sone denge, koi disturb nahi 😴\n` +
    `• Mast scorecard aur visual progress bar 📊\n\n` +
    `━━━━━━━━━━━━━━━\n` +
    `Toh kya bolte ho, shuru karein hydration ka safar?\n\n` +
    `👉 *YES* reply kijiye shuru karne ke liye!\n` +
    `👉 *NO* reply kijiye cancel karne ke liye.`
  );
};

// 2. Consent Cancelled
const getConsentCancelMessage = () => {
  return (
    `❌ *Subscription Cancel ho gaya.*\n\n` +
    `Koi baat nahi! Hum aapko pareshan nahi karenge.\n` +
    `Jab bhi mann kare, bas */setup* bhej dena aur hum wapas aa jayenge! 👍`
  );
};

// 3. Invalid Consent Response
const getInvalidConsentMessage = () => {
  return (
    `ℹ️ *Arey samajh nahi aaya!* 😅\n\n` +
    `Water reminders shuru karne hain kya?\n\n` +
    `👉 Reply: *YES* (Shuru karo)\n` +
    `👉 Reply: *NO* (Rehne do)`
  );
};

// 4. Step 1: Daily Goal
const getStepGoalMessage = () => {
  return (
    `🎉 *Shabash! Chalo aapka schedule set karte hain.*\n\n` +
    `💧 *Step 1 of 3: Daily Goal*\n` +
    `Din bhar me kitna paani peene ka target hai (ml ya liters me)?\n\n` +
    `👉 Example: *2000* (ya *2L*, *2500*, *3000*)`
  );
};

// 5. Invalid Goal Input
const getInvalidGoalMessage = () => {
  return (
    `⚠️ *Arey number theek se daalo dost!*\n\n` +
    `Daily goal 500 se 15000 ml ke beech hona chahiye.\n\n` +
    `👉 Example: *2000* (ya *2.5L*, *3000*)\n` +
    `_(Setup cancel karne ke liye *cancel* bhejo)_`
  );
};

// 6. Step 2: Wake-Up Time
const getStepWakeMessage = () => {
  return (
    `🌅 *Step 2 of 3: Wake-Up Time*\n` +
    `Subah kitne baje neend khulti hai? (Kumbhakaran timing mat daalna 😜)\n\n` +
    `👉 Example: *8:00 AM* (ya *7:30 AM*, *9 AM*, *8*)`
  );
};

// 7. Invalid Time Input
const getInvalidTimeMessage = (context = 'time') => {
  return (
    `⚠️ *Arey timing samajh nahi aayi!*\n\n` +
    `👉 Example: *8:00 AM* ya *11:00 PM* (ya bas *8*, *11*)\n` +
    `_(Cancel karne ke liye *cancel* bhejo)_`
  );
};

// 8. Step 3: Bedtime (FINAL STEP)
const getStepSleepMessage = () => {
  return (
    `🌙 *Step 3 of 3: Bedtime*\n` +
    `Raat ko phone rakh ke kitne baje sote ho? 😴\n\n` +
    `👉 Example: *11:00 PM* (ya *10:30 PM*, *11 PM*, *11*)`
  );
};

// 9-10. REMOVED: Step 4 (Interval) — now handled by Smart Adaptive System automatically

// 11. Setup Completed Confirmation
const getSetupCompleteMessage = (user) => {
  return (
    `🎉 *Badhai ho! Setup ekdum mast complete ho gaya!* 🥳\n\n` +
    `🎯 Daily Goal: *${user.dailyGoal} ml*\n` +
    `🌅 Uthne ka time: *${user.wakeUpTime}*\n` +
    `🌙 Sone ka time: *${user.sleepTime}*\n` +
    `⏰ Reminders: *🧠 Smart Auto Mode*\n` +
    `_(Aapki pace ke hisaab se automatic adjust honge!)_\n\n` +
    `━━━━━━━━━━━━━━━\n` +
    `💡 *Super Easy Logging:*\n` +
    `• Bas likho *1 glass*, *250*, *1 bottle*, ya *pi liya* aur log ho jayega!\n` +
    `• */progress* bhej ke apna scorecard dekho.\n` +
    `• Galti se galat log ho gaya toh */undo* bhej do.\n` +
    `• */help* saare commands ke liye.\n\n` +
    `Ab chaliye, pehla 1 glass paani pi ke shuruat kijiye! 💧🥛`
  );
};

// 12. Smart Adaptive Scheduled Reminders (urgency-aware + nutrition tips)
/**
 * @param {number} goal - Daily goal in ml
 * @param {number} totalConsumed - Current consumed in ml
 * @param {object} user - User document
 * @param {string} urgency - 'critical' | 'behind' | 'ontrack' | 'ahead' | 'chill'
 * @returns {string}
 */
const getAdaptiveReminderMessage = (goal, totalConsumed, user, urgency = 'ontrack') => {
  const remaining = Math.max(0, goal - totalConsumed);
  const glassesDrank = Math.round(totalConsumed / 250 * 10) / 10;
  const totalGlasses = Math.round(goal / 250);
  const remainingGlasses = Math.max(0, Math.round(remaining / 250));
  const percentage = goal > 0 ? Math.round((totalConsumed / goal) * 100) : 0;
  const bar = createProgressBar(percentage);
  const tip = getRandomNutritionTip();

  const guide = (
    `━━━━━━━━━━━━━━━\n` +
    `💡 *Quick Log:* 🥛 *1 glass* = 250ml | 🍶 *1 bottle* = 500ml\n` +
    `👉 Bas reply karo: *1 glass* (ya *250*, *pi liya*)\n\n` +
    `${tip}`
  );

  const scorecard = `📊 *${totalConsumed}/${goal} ml* (${percentage}%) ${bar}`;

  // --- CRITICAL: Way behind, very little time left ---
  if (urgency === 'critical') {
    const criticalTemplates = [
      `🚨🚨 *EMERGENCY HYDRATION ALERT!* 🚨🚨\n\n` +
      `Bhai time bohot kam hai aur paani bohot zyada baaki hai!\n` +
      `${scorecard}\n` +
      `Abhi *${remaining} ml* (~${remainingGlasses} glasses) peena hai — TURANT shuru karo! 🏃‍♂️💨\n\n${guide}`,

      `⏰🔥 *Time chal raha hai aur glass khaali hai!*\n\n` +
      `${scorecard}\n` +
      `Bas *${remaining} ml* baaki — har 15 min me 1 glass gatak lo warna goal miss! 😤\n\n${guide}`
    ];
    return criticalTemplates[Math.floor(Math.random() * criticalTemplates.length)];
  }

  // --- BEHIND: Noticeably behind pace ---
  if (urgency === 'behind') {
    const behindTemplates = [
      `🌵 *Hello! Cactus banne ka plan hai kya?* 😜\n\n` +
      `Target se peeche chal rahe ho dost!\n` +
      `${scorecard}\n` +
      `Abhi *${remaining} ml* (~${remainingGlasses} glasses) baaki — utho aur gatak lo! 🥛⚡\n\n${guide}`,

      `🚨 *Hydro Alert! Gala sookh raha hai boss!* 🏜️\n\n` +
      `${scorecard}\n` +
      `Screen se 10 second nazrein hatao aur 1 glass paani piyo! 💧\n\n${guide}`,

      `📢 *Arre sun! Body bol rahi hai — PAANI DE!* 😩\n\n` +
      `${scorecard}\n` +
      `Abhi *${remainingGlasses} glasses* aur peene hain — chalo thoda speed badhao! 🏎️\n\n${guide}`
    ];
    return behindTemplates[Math.floor(Math.random() * behindTemplates.length)];
  }

  // --- ON TRACK: Doing well, gentle reminder ---
  if (urgency === 'ontrack') {
    const onTrackTemplates = [
      `💧 *Oye dost! Paani peene ka time ho gaya!* 🥛\n\n` +
      `Pace acchi chal rahi hai, keep it up!\n` +
      `${scorecard}\n` +
      `1 glass fresh paani pi lo aur chill karo! 😎\n\n${guide}`,

      `⚡ *Energy booster break!* 🥤\n\n` +
      `Ek glass paani piyo aur lethargy ko bye-bye bolo!\n` +
      `${scorecard}\n\n${guide}`,

      `🎵 *Paani paani paani... peene ka time hai!* 💃\n\n` +
      `Sab smooth chal raha hai — ek aur glass add karo!\n` +
      `${scorecard}\n\n${guide}`
    ];
    return onTrackTemplates[Math.floor(Math.random() * onTrackTemplates.length)];
  }

  // --- AHEAD: Doing great, relaxed tone ---
  if (urgency === 'ahead') {
    const aheadTemplates = [
      `🔥 *Arey waah! Aaj toh finish line ke ekdum paas ho!* 🚀\n\n` +
      `${scorecard}\n` +
      `Sirf *${remaining} ml* (~${remainingGlasses} glasses) baaki hai goal phodne ke liye! 🎯\n\n${guide}`,

      `👑 *Kya baat hai champion! Pace ekdum zabardast hai!* 💪\n\n` +
      `${scorecard}\n` +
      `Thoda aur aur aaj ka goal done! Keep rocking! 🎸\n\n${guide}`
    ];
    return aheadTemplates[Math.floor(Math.random() * aheadTemplates.length)];
  }

  // --- CHILL: Way ahead, almost done ---
  const chillTemplates = [
    `😎 *Chill mode ON! Aaj toh bahut accha piya hai!*\n\n` +
    `${scorecard}\n` +
    `Bas thoda sa aur aur 🏆 trophy leke jaao! Koi rush nahi.\n\n${guide}`,

    `🧘 *Relax karo boss — hydration game strong hai aaj!*\n\n` +
    `${scorecard}\n` +
    `Jab mann kare tab 1 glass aur pi lena. No pressure! ☕\n\n${guide}`
  ];
  return chillTemplates[Math.floor(Math.random() * chillTemplates.length)];
};


// 13. Good Morning Kickoff
const getMorningKickoffMessage = (user, yesterdayLog) => {
  const totalGlasses = Math.round((user.dailyGoal || 2000) / 250);
  const yesterdayAchieved = yesterdayLog && yesterdayLog.goalCompleted;

  if (yesterdayAchieved) {
    return (
      `🌅 *Good Morning Rockstar! Naya din, naya hydration swag!* ☀️\n\n` +
      `🔥 *Kal toh aapne 100% goal complete karke aag laga di thi!* Winning streak tutni nahi chahiye boss!\n\n` +
      `🎯 Aaj ka target: *${user.dailyGoal} ml* (approx ${totalGlasses} glasses).\n\n` +
      `Din ki shuruat 1 fresh glass paani se kijiye aur dimag ki batti jalaiye 💡🥛\n\n` +
      `👉 Reply: *1 glass* (ya *250*)`
    );
  }

  return (
    `🌅 *Good Morning! Utho, jaago aur paani piyo!* ☀️\n\n` +
    `Bina paani ke body aadhi battery pe chalti hai! 🪫➡️🔋\n` +
    `🎯 Aaj ka daily target: *${user.dailyGoal} ml* (~${totalGlasses} glasses).\n\n` +
    `Khali pet 1 glass paani peene se freshness aur digestion 10x ho jaati hai! 💧\n\n` +
    `👉 Reply: *1 glass* (ya *250*)`
  );
};

// 14. Bedtime Recap
const getBedtimeRecapMessage = (user, todayLog) => {
  const goal = user.dailyGoal || 2000;
  const consumed = todayLog.totalConsumed || 0;
  const remaining = Math.max(0, goal - consumed);
  const totalGlasses = Math.round(goal / 250);
  const glassesDrank = Math.round(consumed / 250 * 10) / 10;
  const remainingGlasses = Math.max(0, Math.round(remaining / 250));

  if (consumed >= goal || todayLog.goalCompleted) {
    return (
      `🌙 *Good Night Champion! Aaj toh kamaal kar diya!* 🎉\n\n` +
      `Aapne aaj ka *${goal} ml* goal 100% complete kar liya hai! 💧\n` +
      `Aapki body aapko thank you bol rahi hai. Sweet dreams, kal subah milte hain! 😴`
    );
  }

  return (
    `🌙 *Good Evening! Sone se pehle ek zaroori check...* 😴\n\n` +
    `Aaj ka scorecard: *${consumed} / ${goal} ml* (🥛 ${glassesDrank}/${totalGlasses} glasses).\n` +
    `Goal complete karne ke liye bas *${remaining} ml* (~${remainingGlasses} glasses) bacha hai!\n\n` +
    `Sone se pehle 1 glass paani pi lo taaki subah fresh neend khule 💧\n\n` +
    `👉 Reply: *1 glass* (ya *250*)`
  );
};

// 15. Gentle Nudge (Blue Tick Seen > 25 mins ago)
const getGentleNudgeMessage = () => {
  return (
    `👀 *Ahem ahem! Blue tick toh dikh gaya tha humein!* 😜\n\n` +
    `Paani ka glass bhool gaye ya WhatsApp pe kho gaye?\n` +
    `Chalo fatafat 1 glass paani pi lo aur reply karo 🥛💧\n\n` +
    `👉 Reply: *1 glass* (ya *250*, *pi liya*)`
  );
};

// 16. Drink Logged Response
const formatWaterAddedHinglish = (addedAmount, goal, totalConsumed, justCompletedGoal = false, containerLabel = '') => {
  const percentage = goal > 0 ? Math.round((totalConsumed / goal) * 100) : 0;
  const remaining = Math.max(0, goal - totalConsumed);
  const glassesDrank = Math.round(totalConsumed / 250 * 10) / 10;
  const totalGlasses = Math.round(goal / 250);
  const labelSuffix = containerLabel ? ` (${containerLabel})` : '';
  const bar = createProgressBar(percentage);

  if (justCompletedGoal) {
    return (
      `🎉🎊 *BOOM! 100% GOAL COMPLETED!* 🏆🥳\n\n` +
      `Added *${addedAmount} ml*${labelSuffix}!\n` +
      `Aapne aaj ka *${goal} ml* target 100% poora kar liya!\n\n` +
      `${bar} *100%*\n\n` +
      `👑 *Aap certified Hydration King/Queen ban chuke ho!*\n` +
      `Aaj ke reminders pause ho gaye hain. Mazze karo! 💧`
    );
  }

  if (totalConsumed > goal) {
    return (
      `🌟 *Bhai bhai bhai! Target se bhi aage nikal gaye!* 🚀\n\n` +
      `Added *${addedAmount} ml*${labelSuffix}!\n` +
      `Total: *${totalConsumed} / ${goal} ml* (🥛 ${glassesDrank} glasses — ${percentage}%)\n\n` +
      `Gazab ka stamina hai aapka! 💧`
    );
  }

  return (
    `💧 *Mast! ${addedAmount} ml${labelSuffix} add ho gaya!* 🥛\n\n` +
    `Aaj ka Scorecard:\n` +
    `*${totalConsumed} / ${goal} ml* (🥛 ${glassesDrank}/${totalGlasses} glasses)\n` +
    `Progress: *${percentage}%*\n` +
    `${bar}\n\n` +
    `Baaki: *${remaining} ml*\n` +
    `Agla reminder timer reset ho gaya hai! 👍`
  );
};

// 17. Progress Report (/progress)
const formatProgressReportHinglish = (goal, consumed) => {
  const percentage = goal > 0 ? Math.round((consumed / goal) * 100) : 0;
  const remaining = Math.max(0, goal - consumed);
  const progressBar = createProgressBar(percentage);
  const glassesDrank = Math.round(consumed / 250 * 10) / 10;
  const totalGlasses = Math.round(goal / 250);
  const remainingGlasses = Math.max(0, Math.round(remaining / 250));

  if (consumed >= goal) {
    return (
      `📊 *Aaj Ka Hydration Scorecard* 🏆\n\n` +
      `Target: *${goal} ml* (~${totalGlasses} glasses)\n` +
      `Piya: *${consumed} ml* (🥛 ${glassesDrank} glasses)\n` +
      `Baaki: *0 ml*\n\n` +
      `Progress: *${percentage}%*\n` +
      `${progressBar}\n\n` +
      `🎉 *Goal 100% complete ho chuka hai! Shaandar discipline!* 💧`
    );
  }

  return (
    `📊 *Aaj Ka Hydration Scorecard* 💧\n\n` +
    `Target: *${goal} ml* (~${totalGlasses} glasses)\n` +
    `Piya: *${consumed} ml* (🥛 ${glassesDrank} of ${totalGlasses} glasses)\n` +
    `Baaki: *${remaining} ml* (~${remainingGlasses} glasses)\n\n` +
    `Progress: *${percentage}%*\n` +
    `${progressBar}`
  );
};

// 18. Undo Drink Response
const formatUndoHinglish = (amount, totalConsumed, goal) => {
  const percentage = goal > 0 ? Math.round((totalConsumed / goal) * 100) : 0;
  const remaining = Math.max(0, goal - totalConsumed);
  return (
    `↩️ *Koi baat nahi! Last entry (${amount} ml) hata di gayi hai.*\n\n` +
    `Updated Total: *${totalConsumed} / ${goal} ml* (${percentage}%)\n` +
    `Remaining: *${remaining} ml*`
  );
};

// 19. Help Menu
const getHelpMessageHinglish = () => {
  return (
    `💧 *Water Reminder Bot — Mast Commands List* 📜\n\n` +
    `🥛 *Paani Log Karne Ke Tareeqe:*\n` +
    `• *1 glass* (ya *250*) — 1 glass (250 ml)\n` +
    `• *2 glasses* (ya *500*) — 2 glasses (500 ml)\n` +
    `• *1 bottle* (ya *500*) — 1 bottle (500 ml)\n` +
    `• *1 cup* (ya *200*) — 1 cup chai/coffee size (200 ml)\n` +
    `• *pi liya* / *done* — Quick 1 glass\n` +
    `• *<number>* (jaise *350*, *750*) — Exact ml\n\n` +
    `⚙️ *Control Commands:*\n` +
    `• */progress* — Aaj ka scorecard aur visual bar\n` +
    `• */undo* — Galti se galat enter hua toh wapas lo\n` +
    `• */goal 3000* — Daily target change karo\n` +
    `• */setup* — Sab kuch naye sire se set karo\n` +
    `• */status* — Current settings check karo\n` +
    `• */stop* — Reminders pause karo\n` +
    `• */start* — Reminders resume karo\n` +
    `• */reset* — Aaj ka intake 0 karo\n` +
    `• */help* — Ye menu dekho\n\n` +
    `🧠 *Smart Reminders:* Bot apne aap pace ke hisaab se\n` +
    `reminder timing adjust karta hai — peeche ho toh zyada,\n` +
    `aage ho toh kam!`
  );
};

module.exports = {
  createProgressBar,
  getRandomNutritionTip,
  getWelcomeConsentMessage,
  getConsentCancelMessage,
  getInvalidConsentMessage,
  getStepGoalMessage,
  getInvalidGoalMessage,
  getStepWakeMessage,
  getInvalidTimeMessage,
  getStepSleepMessage,
  getSetupCompleteMessage,
  getAdaptiveReminderMessage,
  getMorningKickoffMessage,
  getBedtimeRecapMessage,
  getGentleNudgeMessage,
  formatWaterAddedHinglish,
  formatProgressReportHinglish,
  formatUndoHinglish,
  getHelpMessageHinglish
};
