/**
 * Utility functions for water progress calculation, natural container parsing, and visualization
 */

/**
 * Standard container sizes in ml
 */
const CONTAINER_SIZES = {
  glass: 250,
  cup: 200,
  bottle: 500,
  mug: 350,
  liter: 1000,
  litre: 1000
};

/**
 * Parse natural language drink inputs
 * Supports numbers, fractions, Hindi/Hinglish casual phrases, and container names
 * @param {string} input
 * @returns {{ amount: number, containerName: string } | null}
 */
const parseContainerAmount = (input) => {
  if (!input) return null;
  const str = String(input).trim().toLowerCase();

  // 1. Casual affirmative phrases (e.g. "pi liya", "paani pi liya", "pani pi liya", "drank water", "done", "drank")
  if (/^(pi\s*liya|paani\s*pi\s*liya|pani\s*pi\s*liya|drank\s*water|water\s*done|drank|done|had\s*water)$/i.test(str)) {
    return { amount: 250, containerName: '1 glass' };
  }

  // 2. Hindi number prefixes (e.g. "ek glass", "do glass", "ek bottle", "adha glass", "aadha bottle")
  if (/^(ek\s*glass|1\s*glass\s*pani|ek\s*glass\s*paani)$/i.test(str)) return { amount: 250, containerName: '1 glass' };
  if (/^(do\s*glass|2\s*glass\s*pani|do\s*glass\s*paani)$/i.test(str)) return { amount: 500, containerName: '2 glasses' };
  if (/^(teen\s*glass|3\s*glass\s*pani)$/i.test(str)) return { amount: 750, containerName: '3 glasses' };
  if (/^(ek\s*bottle|1\s*bottle\s*pani)$/i.test(str)) return { amount: 500, containerName: '1 bottle' };
  if (/^(aadh[aa]\s*bottle|half\s*bottle)$/i.test(str)) return { amount: 250, containerName: 'half bottle' };
  if (/^(aadh[aa]\s*glass|half\s*glass)$/i.test(str)) return { amount: 125, containerName: 'half glass' };

  // 3. Direct milliliter number (e.g. "250", "500", "250ml", "300 ml")
  const numMatch = str.match(/^(\d+)\s*(?:ml)?$/);
  if (numMatch) {
    const amt = parseInt(numMatch[1], 10);
    if (amt > 0 && amt <= 5000) {
      return { amount: amt, containerName: `${amt} ml` };
    }
  }

  // 4. Liters (e.g. "1L", "1.5L", "0.5L", "1 liter", "2 litres")
  const literMatch = str.match(/^(\d+(?:\.\d+)?)\s*(?:l|liters?|litres?)$/);
  if (literMatch) {
    const liters = parseFloat(literMatch[1]);
    const amt = Math.round(liters * 1000);
    if (amt > 0 && amt <= 10000) {
      return { amount: amt, containerName: `${liters}L` };
    }
  }

  // 5. Single container word without quantity (e.g. "glass", "bottle", "cup", "mug")
  if (str === 'glass') return { amount: 250, containerName: '1 glass' };
  if (str === 'bottle') return { amount: 500, containerName: '1 bottle' };
  if (str === 'cup') return { amount: 200, containerName: '1 cup' };
  if (str === 'mug') return { amount: 350, containerName: '1 mug' };

  // 6. Decimal / Fractional quantities (e.g. "1.5 bottle", "0.5 bottle", "2.5 glasses")
  const fracMatch = str.match(/^(\d+(?:\.\d+)?)\s*(glass(?:es)?|bottles?|cups?|mugs?)$/);
  if (fracMatch) {
    const count = parseFloat(fracMatch[1]);
    const containerType = fracMatch[2];

    let baseSize = 250;
    let label = 'glass';
    if (containerType.startsWith('bottle')) { baseSize = 500; label = 'bottle'; }
    else if (containerType.startsWith('cup')) { baseSize = 200; label = 'cup'; }
    else if (containerType.startsWith('mug')) { baseSize = 350; label = 'mug'; }
    else if (containerType.startsWith('glass')) { baseSize = 250; label = 'glass'; }

    const total = Math.round(count * baseSize);
    if (total > 0 && total <= 5000) {
      return {
        amount: total,
        containerName: `${count} ${label}${count > 1 ? (label === 'glass' ? 'es' : 's') : ''}`
      };
    }
  }

  return null;
};

/**
 * Generate a dynamic visual progress bar using block characters
 * @param {number} percentage - 0 to 100+
 * @param {number} [totalBlocks=16]
 * @returns {string} e.g. "██████████░░░░░░"
 */
const createProgressBar = (percentage, totalBlocks = 16) => {
  const clamped = Math.max(0, Math.min(100, percentage));
  const filledBlocks = Math.round((clamped / 100) * totalBlocks);
  const emptyBlocks = totalBlocks - filledBlocks;

  return '█'.repeat(filledBlocks) + '░'.repeat(emptyBlocks);
};

/**
 * Format progress report for the "progress" command
 * @param {number} goal - in ml
 * @param {number} consumed - in ml
 * @returns {string}
 */
const formatProgressReport = (goal, consumed) => {
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

/**
 * Format response when user logs water intake
 * @param {number} addedAmount
 * @param {number} goal
 * @param {number} totalConsumed
 * @param {boolean} justCompletedGoal
 * @param {string} [containerLabel='']
 * @returns {string}
 */
const formatWaterAddedResponse = (addedAmount, goal, totalConsumed, justCompletedGoal = false, containerLabel = '') => {
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

module.exports = {
  CONTAINER_SIZES,
  parseContainerAmount,
  createProgressBar,
  formatProgressReport,
  formatWaterAddedResponse
};
