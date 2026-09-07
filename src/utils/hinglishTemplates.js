/**
 * Funny & Engaging Hinglish Message Templates for Water Reminder Bot
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
    `💧 *Step 1 of 4: Daily Goal*\n` +
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
    `🌅 *Step 2 of 4: Wake-Up Time*\n` +
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

// 8. Step 3: Bedtime
const getStepSleepMessage = () => {
  return (
    `🌙 *Step 3 of 4: Bedtime*\n` +
    `Raat ko phone rakh ke kitne baje sote ho? 😴\n\n` +
    `👉 Example: *11:00 PM* (ya *10:30 PM*, *11 PM*, *11*)`
  );
};

// 9. Step 4: Reminder Frequency
const getStepIntervalMessage = () => {
  return (
    `⏱️ *Step 4 of 4: Reminder Frequency*\n` +
    `Kitni der me paani ka reminder bhejun?\n\n` +
    `👉 Reply kijiye:\n` +
    `*1* = Har 1 ghante me\n` +
    `*2* = Har 2 ghante me\n` +
    `*3* = Har 3 ghante me`
  );
};

// 10. Invalid Interval Input
const getInvalidIntervalMessage = () => {
  return (
    `⚠️ *Valid frequency number choose kijiye:*\n\n` +
    `👉 Reply:\n` +
    `*1* = Har 1 ghante me\n` +
    `*2* = Har 2 ghante me\n` +
    `*3* = Har 3 ghante me\n\n` +
    `_(Cancel karne ke liye *cancel* bhejo)_`
  );
};

// 11. Setup Completed Confirmation
const getSetupCompleteMessage = (user) => {
  return (
    `🎉 *Badhai ho! Setup ekdum mast complete ho gaya!* 🥳\n\n` +
    `🎯 Daily Goal: *${user.dailyGoal} ml*\n` +
    `🌅 Uthne ka time: *${user.wakeUpTime}*\n` +
    `🌙 Sone ka time: *${user.sleepTime}*\n` +
    `⏰ Reminders: *Har ${user.reminderInterval} ghante me*\n\n` +
    `━━━━━━━━━━━━━━━\n` +
    `💡 *Super Easy Logging:*\n` +
    `• Bas likho *1 glass*, *250*, *1 bottle*, ya *pi liya* aur log ho jayega!\n` +
    `• */progress* bhej ke apna scorecard dekho.\n` +
    `• Galti se galat log ho gaya toh */undo* bhej do.\n` +
    `• */help* saare commands ke liye.\n\n` +
    `Ab chaliye, pehla 1 glass paani pi ke shuruat kijiye! 💧🥛`
  );
};

// 12. Funny & Adaptive Scheduled Reminders
const getAdaptiveReminderMessage = (goal, totalConsumed, user) => {
  const remaining = Math.max(0, goal - totalConsumed);
  const glassesDrank = Math.round(totalConsumed / 250 * 10) / 10;
  const totalGlasses = Math.round(goal / 250);
  const remainingGlasses = Math.max(0, Math.round(remaining / 250));

  const guide = (
    `━━━━━━━━━━━━━━━\n` +
    `💡 *Quick Log Guide:*\n` +
    `🥛 *1 glass* = 250 ml\n` +
    `🍶 *1 bottle* = 500 ml\n` +
    `☕ *1 cup* = 200 ml\n\n` +
    `👉 Bas reply karo: *1 glass* (ya *250*, *pi liya*)`
  );

  // Close to goal (< 800ml remaining)
  if (remaining > 0 && remaining <= 800 && totalConsumed > 0) {
    return (
      `🔥 *Arey waah! Aaj toh finish line ke ekdum paas ho!* 🚀\n\n` +
      `Intake: *${totalConsumed} / ${goal} ml* (🥛 ${glassesDrank}/${totalGlasses} glasses).\n` +
      `Sirf *${remaining} ml* (~${remainingGlasses} glasses) baaki hai goal phodne ke liye! 🎯\n\n` +
      guide
    );
  }

  // Behind goal
  const wakeTotal = (user.wakeUpHour ?? 8) * 60 + (user.wakeUpMinute ?? 0);
  const sleepTotal = (user.sleepHour ?? 23) * 60 + (user.sleepMinute ?? 0);
  const activeDay = Math.max(60, sleepTotal > wakeTotal ? sleepTotal - wakeTotal : (1440 - wakeTotal) + sleepTotal);
  
  // Choose among hilarious random templates when behind or on track
  const behindTemplates = [
    `🌵 *Hello! Cactus banne ka plan hai kya?* 😜\n\nTarget se thoda peeche chal rahe ho dost!\nIntake: *${totalConsumed} / ${goal} ml* (🥛 ${glassesDrank}/${totalGlasses} glasses).\n\nUtho aur turant 1 glass paani gatak lo! 🥛⚡\n\n${guide}`,
    `🚨 *Hydro Alert! Gala sookh raha hai boss!* 🏜️\n\nAapne abhi tak sirf *${totalConsumed} / ${goal} ml* paani piya hai.\nScreen se 10 second nazrein hatao aur 1 glass paani piyo! 💧\n\n${guide}`
  ];

  const onTrackTemplates = [
    `💧 *Oye dost! Paani peene ka time ho gaya!* 🥛\n\nPhone scroll karte karte gale ko thandak do, 1 glass fresh paani pi lo!\nAaj ka intake: *${totalConsumed} / ${goal} ml* (🥛 ${glassesDrank} of ${totalGlasses} glasses).\n\n${guide}`,
    `⚡ *Energy booster break!* 🥤\n\nEk glass paani piyo aur lethargy ko bye-bye bolo!\nIntake: *${totalConsumed} / ${goal} ml* (🥛 ${glassesDrank}/${totalGlasses} glasses).\n\n${guide}`
  ];

  if (totalConsumed < (goal * 0.4)) {
    return behindTemplates[Math.floor(Math.random() * behindTemplates.length)];
  }

  return onTrackTemplates[Math.floor(Math.random() * onTrackTemplates.length)];
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
    `• */interval 2* — Reminder ka frequency change karo\n` +
    `• */setup* — Sab kuch naye sire se set karo\n` +
    `• */status* — Current settings check karo\n` +
    `• */stop* — Reminders pause karo\n` +
    `• */start* — Reminders resume karo\n` +
    `• */reset* — Aaj ka intake 0 karo\n` +
    `• */help* — Ye menu dekho`
  );
};

module.exports = {
  createProgressBar,
  getWelcomeConsentMessage,
  getConsentCancelMessage,
  getInvalidConsentMessage,
  getStepGoalMessage,
  getInvalidGoalMessage,
  getStepWakeMessage,
  getInvalidTimeMessage,
  getStepSleepMessage,
  getStepIntervalMessage,
  getInvalidIntervalMessage,
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
