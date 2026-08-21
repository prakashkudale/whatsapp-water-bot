/**
 * Utility functions for water progress calculation and visualization
 */

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

  if (consumed >= goal) {
    return (
      `💧 *Today's Progress*\n\n` +
      `Goal: ${goal} ml\n` +
      `Consumed: ${consumed} ml\n` +
      `Remaining: 0 ml\n\n` +
      `Progress: ${percentage}%\n\n` +
      `${progressBar}\n\n` +
      `🎉 *Goal completed today!*`
    );
  }

  return (
    `💧 *Today's Progress*\n\n` +
    `Goal: ${goal} ml\n` +
    `Consumed: ${consumed} ml\n` +
    `Remaining: ${remaining} ml\n\n` +
    `Progress: ${percentage}%\n\n` +
    `${progressBar}`
  );
};

/**
 * Format response when user logs water intake (e.g. 250)
 * @param {number} addedAmount
 * @param {number} goal
 * @param {number} totalConsumed
 * @param {boolean} justCompletedGoal
 * @returns {string}
 */
const formatWaterAddedResponse = (addedAmount, goal, totalConsumed, justCompletedGoal = false) => {
  const percentage = goal > 0 ? Math.round((totalConsumed / goal) * 100) : 0;
  const remaining = Math.max(0, goal - totalConsumed);

  if (justCompletedGoal) {
    return (
      `🎉 *Great job!*\n\n` +
      `You've completed your ${goal} ml water goal for today.\n\n` +
      `I'll stop reminders for the rest of today. 💧`
    );
  }

  if (totalConsumed > goal) {
    return (
      `💧 Added ${addedAmount} ml!\n\n` +
      `Goal completed 🎉\n\n` +
      `Today's intake: ${totalConsumed} ml\n` +
      `Daily goal: ${goal} ml\n` +
      `Progress: ${percentage}%`
    );
  }

  return (
    `💧 Added ${addedAmount} ml!\n\n` +
    `Today's progress:\n\n` +
    `${totalConsumed} / ${goal} ml\n` +
    `${percentage}%\n\n` +
    `Remaining: ${remaining} ml`
  );
};

module.exports = {
  createProgressBar,
  formatProgressReport,
  formatWaterAddedResponse
};
