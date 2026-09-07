// DOM Elements
const messagesContainer = document.getElementById('messagesContainer');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const quickPills = document.getElementById('quickPills');
const resetStateBtn = document.getElementById('resetStateBtn');
const triggerReminderBtn = document.getElementById('triggerReminderBtn');
const triggerMorningBtn = document.getElementById('triggerMorningBtn');
const triggerBedtimeBtn = document.getElementById('triggerBedtimeBtn');
const simulateSeenBtn = document.getElementById('simulateSeenBtn');
const simulateNudgeBtn = document.getElementById('simulateNudgeBtn');
const botStatus = document.getElementById('botStatus');

// Stats Elements
const waterFill = document.getElementById('waterFill');
const bottlePercentage = document.getElementById('bottlePercentage');
const bottleConsumedText = document.getElementById('bottleConsumedText');
const bottleGoalText = document.getElementById('bottleGoalText');
const statConsumed = document.getElementById('statConsumed');
const statRemaining = document.getElementById('statRemaining');
const statGoal = document.getElementById('statGoal');
const subStatusBadge = document.getElementById('subStatusBadge');
const statePhone = document.getElementById('statePhone');
const stateStep = document.getElementById('stateStep');
const stateWindow = document.getElementById('stateWindow');
const stateInterval = document.getElementById('stateInterval');
const stateReminderStatus = document.getElementById('stateReminderStatus');
const stateLastDrink = document.getElementById('stateLastDrink');

const SIMULATOR_PHONE = '919638767233';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  fetchStatus();

  // Send on enter key
  messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      sendMessage(messageInput.value);
    }
  });

  // Send on button click
  sendBtn.addEventListener('click', () => {
    sendMessage(messageInput.value);
  });

  // Quick Prompt Pills
  if (quickPills) {
    quickPills.addEventListener('click', (e) => {
      const pill = e.target.closest('.pill-btn');
      if (pill) {
        const msg = pill.getAttribute('data-msg');
        sendMessage(msg);
      }
    });
  }

  // Reset State Button
  if (resetStateBtn) {
    resetStateBtn.addEventListener('click', async () => {
      if (!confirm('Are you sure you want to reset the simulator database state?')) return;
      try {
        const res = await fetch('/api/simulator/reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: SIMULATOR_PHONE })
        });
        const data = await res.json();
        if (data.success) {
          messagesContainer.innerHTML = `
            <div class="wa-date-divider"><span>TODAY</span></div>
            <div class="wa-system-message">
              <span>🔄 State reset! Send <b>/setup</b> to start your subscription.</span>
            </div>
          `;
          fetchStatus();
        }
      } catch (e) {
        alert('Error resetting state: ' + e.message);
      }
    });
  }

  // Trigger Good Morning Kickoff
  if (triggerMorningBtn) {
    triggerMorningBtn.addEventListener('click', async () => {
      try {
        botStatus.innerText = 'typing...';
        const res = await fetch('/api/simulator/trigger-morning', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: SIMULATOR_PHONE })
        });
        const data = await res.json();
        botStatus.innerText = 'online';

        if (data.success && data.kickoffText) {
          appendMessage(data.kickoffText, 'incoming', data.timestamp);
          updateDashboard(data.userState, data.waterLog);
        } else {
          alert(data.error || 'User must complete /setup first.');
        }
      } catch (e) {
        botStatus.innerText = 'online';
        alert('Error triggering morning kickoff: ' + e.message);
      }
    });
  }

  // Trigger Scheduled Reminder Button
  if (triggerReminderBtn) {
    triggerReminderBtn.addEventListener('click', async () => {
      try {
        botStatus.innerText = 'typing...';
        const res = await fetch('/api/simulator/trigger-reminder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: SIMULATOR_PHONE })
        });
        const data = await res.json();
        botStatus.innerText = 'online';

        if (data.success && data.reminderText) {
          appendMessage(data.reminderText, 'incoming', data.timestamp);
          updateDashboard(data.userState, data.waterLog);
        } else {
          alert(data.error || 'User must complete /setup and be subscribed first.');
        }
      } catch (e) {
        botStatus.innerText = 'online';
        alert('Error triggering reminder: ' + e.message);
      }
    });
  }

  // Simulate Message Seen (Blue Tick) Button
  if (simulateSeenBtn) {
    simulateSeenBtn.addEventListener('click', async () => {
      try {
        const res = await fetch('/api/simulator/simulate-seen', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: SIMULATOR_PHONE })
        });
        const data = await res.json();
        if (data.success) {
          updateDashboard(data.userState, data.waterLog);
          document.querySelectorAll('.wa-bubble.outgoing .ticks').forEach(el => {
            el.style.color = '#53bdeb';
          });
        } else {
          alert(data.error || 'Please send /setup and a reminder first.');
        }
      } catch (e) {
        alert('Error simulating seen receipt: ' + e.message);
      }
    });
  }

  // Simulate 25-Min Gentle Nudge Button
  if (simulateNudgeBtn) {
    simulateNudgeBtn.addEventListener('click', async () => {
      try {
        botStatus.innerText = 'typing...';
        const res = await fetch('/api/simulator/simulate-nudge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: SIMULATOR_PHONE })
        });
        const data = await res.json();
        botStatus.innerText = 'online';

        if (data.success && data.nudgeText) {
          appendMessage(data.nudgeText, 'incoming', data.timestamp);
          updateDashboard(data.userState, data.waterLog);
        } else {
          alert(data.error || 'User must be subscribed.');
        }
      } catch (e) {
        botStatus.innerText = 'online';
        alert('Error simulating nudge: ' + e.message);
      }
    });
  }

  // Trigger Bedtime Recap Button
  if (triggerBedtimeBtn) {
    triggerBedtimeBtn.addEventListener('click', async () => {
      try {
        botStatus.innerText = 'typing...';
        const res = await fetch('/api/simulator/trigger-bedtime', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: SIMULATOR_PHONE })
        });
        const data = await res.json();
        botStatus.innerText = 'online';

        if (data.success && data.recapText) {
          appendMessage(data.recapText, 'incoming', data.timestamp);
          updateDashboard(data.userState, data.waterLog);
        } else {
          alert(data.error || 'User must complete /setup first.');
        }
      } catch (e) {
        botStatus.innerText = 'online';
        alert('Error triggering bedtime recap: ' + e.message);
      }
    });
  }
});

// Send Message function
async function sendMessage(text) {
  if (!text || !text.trim()) return;
  const cleanText = text.trim();
  messageInput.value = '';

  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  appendMessage(cleanText, 'outgoing', timeStr);

  botStatus.innerText = 'typing...';

  try {
    const res = await fetch('/api/simulator/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: cleanText,
        phoneNumber: SIMULATOR_PHONE,
        name: 'Prakash'
      })
    });

    const data = await res.json();
    botStatus.innerText = 'online';

    if (data.success) {
      if (data.reply) {
        appendMessage(data.reply, 'incoming', data.timestamp);
      }
      updateDashboard(data.userState, data.waterLog);
    }
  } catch (err) {
    botStatus.innerText = 'online';
    appendMessage('⚠️ Error contacting bot server. Make sure `npm start` is running.', 'incoming', timeStr);
  }
}

// Append message bubble to chat container
function appendMessage(text, direction, timeStr) {
  const bubble = document.createElement('div');
  bubble.className = `wa-bubble ${direction}`;

  // Format bold and italics: *bold* -> <b>bold</b>, _italic_ -> <i>italic</i>
  const formattedContent = String(text)
    .replace(/\*(.*?)\*/g, '<b>$1</b>')
    .replace(/_(.*?)_/g, '<i>$1</i>')
    .replace(/\n/g, '<br/>');

  bubble.innerHTML = `
    <div class="wa-bubble-content">${formattedContent}</div>
    <div class="wa-bubble-meta">
      <span>${timeStr || 'now'}</span>
      ${direction === 'outgoing' ? '<span class="ticks">✓✓</span>' : ''}
    </div>
  `;

  messagesContainer.appendChild(bubble);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Fetch live database status
async function fetchStatus() {
  try {
    const res = await fetch(`/api/simulator/status?phone=${SIMULATOR_PHONE}`);
    const data = await res.json();
    if (data.success) {
      updateDashboard(data.user, data.log);
    }
  } catch (e) {}
}

// Update the right-side dashboard and bottle animation
function updateDashboard(user, log) {
  const goal = user ? (user.dailyGoal || 2000) : 2000;
  const consumed = log ? (log.totalConsumed || 0) : 0;
  const remaining = Math.max(0, goal - consumed);
  const percentage = Math.min(100, Math.round((consumed / goal) * 100));

  // Bottle visualizer
  if (waterFill) waterFill.style.height = `${percentage}%`;
  if (bottlePercentage) bottlePercentage.innerText = `${percentage}%`;
  if (bottleConsumedText) bottleConsumedText.innerText = consumed;
  if (bottleGoalText) bottleGoalText.innerText = goal;

  if (statConsumed) statConsumed.innerText = `${consumed} ml`;
  if (statRemaining) statRemaining.innerText = `${remaining} ml`;
  if (statGoal) statGoal.innerText = `${goal} ml`;

  // State Inspector
  if (user) {
    if (statePhone) statePhone.innerText = user.phoneNumber;
    if (stateStep) stateStep.innerText = user.setupStep || 'NONE';
    if (stateWindow) stateWindow.innerText = `${user.wakeUpTime || '8:00 AM'} – ${user.sleepTime || '11:00 PM'}`;
    if (stateInterval) stateInterval.innerText = `Every ${user.reminderInterval || 1} hr${(user.reminderInterval || 1) > 1 ? 's' : ''}`;

    if (stateReminderStatus) {
      const statusMap = {
        'SENT': 'Delivered ✉️',
        'SEEN': 'Seen (Blue Tick) 👀',
        'REPLIED': 'Water Logged 💧',
        'NONE': 'Idle ⏳'
      };
      stateReminderStatus.innerText = statusMap[user.lastReminderStatus] || user.lastReminderStatus || 'Idle';
    }

    if (stateLastDrink) {
      stateLastDrink.innerText = user.lastDrinkTime
        ? new Date(user.lastDrinkTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : 'None yet';
    }

    if (subStatusBadge) {
      if (user.isSubscribed) {
        subStatusBadge.className = 'status-tag subscribed';
        subStatusBadge.innerText = 'Subscribed & Active';
      } else {
        subStatusBadge.className = 'status-tag not-subscribed';
        subStatusBadge.innerText = 'Not Subscribed';
      }
    }
  } else {
    if (subStatusBadge) {
      subStatusBadge.className = 'status-tag not-subscribed';
      subStatusBadge.innerText = 'Not Subscribed';
    }
    if (stateStep) stateStep.innerText = 'NONE';
  }
}
