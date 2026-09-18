import React, { useState } from 'react';
import type { DndWindow } from '../../services/api';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, Alert, StatusBar, Modal, TextInput, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../store/appStore';
import { Colors, Gradients, Fonts, Spacing, Radius, Shadows } from '../../constants/theme';

// ===================== Time Picker Modal =====================
function TimePickerModal({
  visible, title, initialHour, initialMinute, onSave, onClose,
}: {
  visible: boolean; title: string; initialHour: number; initialMinute: number;
  onSave: (h: number, m: number) => void; onClose: () => void;
}) {
  const [hour, setHour] = useState(initialHour);
  const [minute, setMinute] = useState(initialMinute);

  const fmt = (n: number) => String(n).padStart(2, '0');
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={pickerStyles.overlay}>
        <View style={pickerStyles.sheet}>
          <Text style={pickerStyles.title}>{title}</Text>

          <View style={pickerStyles.timeRow}>
            {/* Hour */}
            <View style={pickerStyles.spinnerCol}>
              <TouchableOpacity onPress={() => setHour(h => (h + 1) % 24)} style={pickerStyles.arrow}>
                <Ionicons name="chevron-up" size={24} color={Colors.primary} />
              </TouchableOpacity>
              <Text style={pickerStyles.timeValue}>{fmt(displayHour)}</Text>
              <TouchableOpacity onPress={() => setHour(h => (h - 1 + 24) % 24)} style={pickerStyles.arrow}>
                <Ionicons name="chevron-down" size={24} color={Colors.primary} />
              </TouchableOpacity>
            </View>

            <Text style={pickerStyles.colon}>:</Text>

            {/* Minute */}
            <View style={pickerStyles.spinnerCol}>
              <TouchableOpacity onPress={() => setMinute(m => (m + 5) % 60)} style={pickerStyles.arrow}>
                <Ionicons name="chevron-up" size={24} color={Colors.primary} />
              </TouchableOpacity>
              <Text style={pickerStyles.timeValue}>{fmt(minute)}</Text>
              <TouchableOpacity onPress={() => setMinute(m => (m - 5 + 60) % 60)} style={pickerStyles.arrow}>
                <Ionicons name="chevron-down" size={24} color={Colors.primary} />
              </TouchableOpacity>
            </View>

            {/* AM/PM */}
            <TouchableOpacity
              style={pickerStyles.periodBtn}
              onPress={() => setHour(h => h >= 12 ? h - 12 : h + 12)}
            >
              <Text style={pickerStyles.periodText}>{period}</Text>
            </TouchableOpacity>
          </View>

          <View style={pickerStyles.btnRow}>
            <TouchableOpacity style={pickerStyles.cancelBtn} onPress={onClose}>
              <Text style={pickerStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={pickerStyles.saveBtn}
              onPress={() => onSave(hour, minute)}
            >
              <LinearGradient colors={['#00D4FF', '#7B2FBE']} style={pickerStyles.saveBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={pickerStyles.saveText}>Save</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const pickerStyles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#0D1F35',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.xl,
    borderTopWidth: 1,
    borderColor: 'rgba(0,212,255,0.2)',
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 18,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  spinnerCol: { alignItems: 'center', gap: 4 },
  arrow: { padding: 8 },
  timeValue: {
    fontFamily: Fonts.extrabold,
    fontSize: 48,
    color: Colors.primary,
    width: 72,
    textAlign: 'center',
  },
  colon: { fontFamily: Fonts.extrabold, fontSize: 40, color: Colors.text, marginBottom: 8 },
  periodBtn: {
    backgroundColor: 'rgba(0,212,255,0.15)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.primary + '50',
  },
  periodText: { fontFamily: Fonts.bold, fontSize: 18, color: Colors.primary },
  btnRow: { flexDirection: 'row', gap: Spacing.md },
  cancelBtn: {
    flex: 1, paddingVertical: 14,
    borderRadius: Radius.lg, borderWidth: 1,
    borderColor: Colors.glassBorder, alignItems: 'center',
  },
  cancelText: { fontFamily: Fonts.bold, fontSize: 15, color: Colors.textMuted },
  saveBtn: { flex: 1, borderRadius: Radius.lg, overflow: 'hidden' },
  saveBtnGrad: { paddingVertical: 14, alignItems: 'center' },
  saveText: { fontFamily: Fonts.bold, fontSize: 15, color: '#fff' },
});

// ===================== Goal Edit Modal =====================
function GoalModal({
  visible, currentGoal, onSave, onClose,
}: {
  visible: boolean; currentGoal: number; onSave: (g: number) => void; onClose: () => void;
}) {
  const [goal, setGoal] = useState(String(currentGoal));
  const presets = [1500, 2000, 2500, 3000, 3500, 4000];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={goalStyles.overlay}>
        <View style={goalStyles.sheet}>
          <Text style={goalStyles.title}>Daily Paani Goal</Text>
          <Text style={goalStyles.subtitle}>Target kitna paani peena hai? (in ml)</Text>

          {/* Preset options */}
          <View style={goalStyles.presets}>
            {presets.map(p => (
              <TouchableOpacity
                key={p}
                style={[goalStyles.preset, goal === String(p) && goalStyles.presetActive]}
                onPress={() => setGoal(String(p))}
              >
                <Text style={[goalStyles.presetText, goal === String(p) && goalStyles.presetTextActive]}>
                  {p}ml
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom input */}
          <View style={goalStyles.inputWrapper}>
            <Ionicons name="water" size={18} color={Colors.primary} />
            <TextInput
              style={goalStyles.input}
              value={goal}
              onChangeText={setGoal}
              keyboardType="number-pad"
              placeholder="Custom amount..."
              placeholderTextColor={Colors.textDim}
              maxLength={5}
            />
            <Text style={goalStyles.unit}>ml</Text>
          </View>

          <View style={goalStyles.btnRow}>
            <TouchableOpacity style={goalStyles.cancelBtn} onPress={onClose}>
              <Text style={goalStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={goalStyles.saveBtn}
              onPress={() => {
                const g = parseInt(goal, 10);
                if (isNaN(g) || g < 500 || g > 10000) {
                  Alert.alert('Invalid Goal', '500ml se 10000ml ke beech kuch daalo!');
                  return;
                }
                onSave(g);
              }}
            >
              <LinearGradient colors={['#00D4FF', '#7B2FBE']} style={goalStyles.saveBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={goalStyles.saveText}>Save Goal</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const goalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#0D1F35',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.xl,
    borderTopWidth: 1,
    borderColor: 'rgba(0,212,255,0.2)',
  },
  title: { fontFamily: Fonts.bold, fontSize: 18, color: Colors.text, marginBottom: 4 },
  subtitle: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, marginBottom: Spacing.lg },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  preset: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: Radius.full, borderWidth: 1,
    borderColor: Colors.glassBorder, backgroundColor: Colors.glass,
  },
  presetActive: { backgroundColor: Colors.primary + '30', borderColor: Colors.primary },
  presetText: { fontFamily: Fonts.medium, fontSize: 14, color: Colors.textMuted },
  presetTextActive: { color: Colors.primary, fontFamily: Fonts.bold },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.glassBorder,
    paddingHorizontal: Spacing.md, marginBottom: Spacing.lg,
  },
  input: { flex: 1, paddingVertical: 14, fontFamily: Fonts.bold, fontSize: 18, color: Colors.text },
  unit: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textMuted },
  btnRow: { flexDirection: 'row', gap: Spacing.md },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.glassBorder, alignItems: 'center',
  },
  cancelText: { fontFamily: Fonts.bold, fontSize: 15, color: Colors.textMuted },
  saveBtn: { flex: 1, borderRadius: Radius.lg, overflow: 'hidden' },
  saveBtnGrad: { paddingVertical: 14, alignItems: 'center' },
  saveText: { fontFamily: Fonts.bold, fontSize: 15, color: '#fff' },
});

// ===================== Setting Row =====================
function SettingRow({
  icon, label, value, onPress, isSwitch, switchValue, onSwitchChange,
}: {
  icon: any; label: string; value?: string;
  onPress?: () => void; isSwitch?: boolean;
  switchValue?: boolean; onSwitchChange?: (v: boolean) => void;
}) {
  return (
    <TouchableOpacity style={styles.settingRow} onPress={onPress} disabled={isSwitch} activeOpacity={0.7}>
      <View style={styles.settingLeft}>
        <View style={styles.settingIcon}>
          <Ionicons name={icon} size={18} color={Colors.primary} />
        </View>
        <Text style={styles.settingLabel}>{label}</Text>
      </View>
      {isSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: Colors.bgCard, true: Colors.primary + '80' }}
          thumbColor={switchValue ? Colors.primary : Colors.textDim}
        />
      ) : (
        <View style={styles.settingRight}>
          <Text style={styles.settingValue}>{value}</Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.textDim} />
        </View>
      )}
    </TouchableOpacity>
  );
}

// ===================== Profile Screen =====================
export default function ProfileScreen() {
  const { user, logout, updateSetup, setQuickMute, cancelQuickMute, saveDndSchedule } = useAppStore();
  const [remindersEnabled, setRemindersEnabled] = useState(user?.remindersEnabled ?? true);
  const [saving, setSaving] = useState(false);

  // Modal state
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showWakeModal, setShowWakeModal] = useState(false);
  const [showSleepModal, setShowSleepModal] = useState(false);

  // DND state
  const [dndScheduleEnabled, setDndScheduleEnabled] = useState(user?.dndScheduleEnabled ?? false);
  const [dndDays, setDndDays] = useState<number[]>(user?.dndSchedule?.[0]?.days ?? [0, 6]);
  const [dndStartHour, setDndStartHour] = useState(user?.dndSchedule?.[0]?.startHour ?? 22);
  const [dndStartMinute, setDndStartMinute] = useState(user?.dndSchedule?.[0]?.startMinute ?? 0);
  const [dndEndHour, setDndEndHour] = useState(user?.dndSchedule?.[0]?.endHour ?? 8);
  const [dndEndMinute, setDndEndMinute] = useState(user?.dndSchedule?.[0]?.endMinute ?? 0);
  const [showDndScheduleSection, setShowDndScheduleSection] = useState(false);
  const [showDndTimePicker, setShowDndTimePicker] = useState<'start' | 'end' | null>(null);

  const handleRemindersToggle = async (val: boolean) => {
    setRemindersEnabled(val);
    try {
      await updateSetup({ remindersEnabled: val });
    } catch (err) {
      setRemindersEnabled(!val);
      Alert.alert('Error', 'Settings save nahi hui, try again karo!');
    }
  };

  const handleSaveGoal = async (goal: number) => {
    setSaving(true);
    try {
      await updateSetup({ dailyGoal: goal });
      setShowGoalModal(false);
      Alert.alert('Saved!', `Daily goal ${goal}ml set ho gaya! 💪`);
    } catch {
      Alert.alert('Error', 'Goal save nahi hua, try again karo!');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveWakeTime = async (hour: number, minute: number) => {
    setSaving(true);
    try {
      const displayHour = hour % 12 === 0 ? 12 : hour % 12;
      const period = hour >= 12 ? 'PM' : 'AM';
      const timeStr = `${displayHour}:${String(minute).padStart(2, '0')} ${period}`;
      await updateSetup({ wakeUpTime: timeStr, wakeUpHour: hour, wakeUpMinute: minute });
      setShowWakeModal(false);
      Alert.alert('Saved!', `Wake up time ${timeStr} set ho gaya! 🌅`);
    } catch {
      Alert.alert('Error', 'Wake time save nahi hua!');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSleepTime = async (hour: number, minute: number) => {
    setSaving(true);
    try {
      const displayHour = hour % 12 === 0 ? 12 : hour % 12;
      const period = hour >= 12 ? 'PM' : 'AM';
      const timeStr = `${displayHour}:${String(minute).padStart(2, '0')} ${period}`;
      await updateSetup({ sleepTime: timeStr, sleepHour: hour, sleepMinute: minute });
      setShowSleepModal(false);
      Alert.alert('Saved!', `Sleep time ${timeStr} set ho gaya! 🌙`);
    } catch {
      Alert.alert('Error', 'Sleep time save nahi hua!');
    } finally {
      setSaving(false);
    }
  };

  // DND helpers
  const isDndActive = !!(user?.dndUntil && new Date(user.dndUntil) > new Date());
  const dndUntilDate = user?.dndUntil ? new Date(user.dndUntil) : null;
  const dndUntilStr = dndUntilDate
    ? dndUntilDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : null;

  const QUICK_MUTE_OPTIONS = [
    { label: '1 hr', minutes: 60 },
    { label: '2 hrs', minutes: 120 },
    { label: '4 hrs', minutes: 240 },
    { label: 'Morning', minutes: (() => {
      const now = new Date();
      const morning = new Date();
      morning.setHours(8, 0, 0, 0);
      if (morning <= now) morning.setDate(morning.getDate() + 1);
      return Math.round((morning.getTime() - now.getTime()) / 60000);
    })() },
  ];

  const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const fmt = (n: number) => String(n).padStart(2, '0');
  const fmtTime = (h: number, m: number) => {
    const period = h >= 12 ? 'PM' : 'AM';
    const dh = h % 12 === 0 ? 12 : h % 12;
    return `${dh}:${fmt(m)} ${period}`;
  };

  const handleQuickMute = async (minutes: number) => {
    try {
      await setQuickMute(minutes);
      const label = minutes < 60 ? `${minutes} min` : minutes < 120 ? '1 ghante' : minutes < 300 ? `${minutes / 60} ghante` : 'morning tak';
      Alert.alert('🔕 Mute!', `Notifications ${label} ke liye band ho gaye!`);
    } catch {
      Alert.alert('Error', 'Mute set nahi hua, try again karo!');
    }
  };

  const handleCancelMute = async () => {
    try {
      await cancelQuickMute();
      Alert.alert('🔔 Unmuted!', 'Notifications wapas shuru ho gaye!');
    } catch {
      Alert.alert('Error', 'Cancel nahi hua!');
    }
  };

  const handleSaveDndSchedule = async () => {
    try {
      const schedule: DndWindow[] = [{ days: dndDays, startHour: dndStartHour, startMinute: dndStartMinute, endHour: dndEndHour, endMinute: dndEndMinute }];
      await saveDndSchedule(dndScheduleEnabled, schedule);
      Alert.alert('Saved!', 'DND schedule set ho gaya! 📅');
    } catch {
      Alert.alert('Error', 'Schedule save nahi hua!');
    }
  };

  const toggleDndDay = (day: number) => {
    setDndDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Pakka logout karna hai?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Haan', style: 'destructive', onPress: logout },
    ]);
  };

  const initials = user?.name?.charAt(0).toUpperCase() || '?';

  // Parse wake/sleep hours from stored values for picker defaults
  const wakeHour = user?.wakeUpHour ?? 8;
  const wakeMinute = user?.wakeUpMinute ?? 0;
  const sleepHour = user?.sleepHour ?? 23;
  const sleepMinute = user?.sleepMinute ?? 0;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      <LinearGradient colors={Gradients.bg as any} style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* User Avatar */}
          <View style={styles.avatarSection}>
            <LinearGradient colors={Gradients.primary as any} style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </LinearGradient>
            <Text style={styles.userName}>{user?.name || 'Dost'}</Text>
            <Text style={styles.userPhone}>
              <Ionicons name="call" size={12} color={Colors.textMuted} /> +{user?.phoneNumber}
            </Text>
          </View>

          {/* Settings Cards */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              <Ionicons name="settings" size={14} color={Colors.textMuted} /> App Settings
            </Text>
            <SettingRow
              icon="water-outline"
              label="Daily Goal"
              value={`${user?.dailyGoal ?? 2000} ml`}
              onPress={() => setShowGoalModal(true)}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="sunny-outline"
              label="Wake Up Time"
              value={user?.wakeUpTime || '8:00 AM'}
              onPress={() => setShowWakeModal(true)}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="moon-outline"
              label="Sleep Time"
              value={user?.sleepTime || '11:00 PM'}
              onPress={() => setShowSleepModal(true)}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="notifications-outline"
              label="Smart Reminders"
              isSwitch
              switchValue={remindersEnabled}
              onSwitchChange={handleRemindersToggle}
            />
          </View>

          {/* ===== DND CARD ===== */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              <Ionicons name="moon" size={14} color={Colors.textMuted} /> Do Not Disturb (DND)
            </Text>

            {/* Active DND Banner */}
            {isDndActive && (
              <View style={dndStyles.activeBanner}>
                <View style={dndStyles.activeBannerLeft}>
                  <Ionicons name="moon" size={18} color="#C084FC" />
                  <View>
                    <Text style={dndStyles.activeBannerTitle}>🔕 DND Active</Text>
                    <Text style={dndStyles.activeBannerSub}>Muted until {dndUntilStr}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={handleCancelMute} style={dndStyles.cancelMuteBtn}>
                  <Text style={dndStyles.cancelMuteText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Quick Mute Buttons */}
            <Text style={dndStyles.subLabel}>Quick Mute</Text>
            <View style={dndStyles.quickMuteRow}>
              {QUICK_MUTE_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.label}
                  style={[dndStyles.quickBtn, isDndActive && dndStyles.quickBtnActive]}
                  onPress={() => handleQuickMute(opt.minutes)}
                >
                  <Ionicons name="moon-outline" size={12} color={isDndActive ? '#C084FC' : Colors.textMuted} />
                  <Text style={[dndStyles.quickBtnText, isDndActive && dndStyles.quickBtnTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.divider} />

            {/* Weekly Schedule Toggle */}
            <TouchableOpacity
              style={dndStyles.scheduleHeader}
              onPress={() => setShowDndScheduleSection(v => !v)}
              activeOpacity={0.7}
            >
              <View style={dndStyles.scheduleHeaderLeft}>
                <Ionicons name="calendar-outline" size={16} color={Colors.primary} />
                <Text style={dndStyles.scheduleHeaderText}>Weekly Schedule</Text>
                {dndScheduleEnabled && (
                  <View style={dndStyles.scheduleBadge}>
                    <Text style={dndStyles.scheduleBadgeText}>ON</Text>
                  </View>
                )}
              </View>
              <Ionicons
                name={showDndScheduleSection ? 'chevron-up' : 'chevron-down'}
                size={16} color={Colors.textDim}
              />
            </TouchableOpacity>

            {showDndScheduleSection && (
              <View style={dndStyles.scheduleBody}>
                {/* Enable toggle */}
                <View style={dndStyles.scheduleEnableRow}>
                  <Text style={dndStyles.scheduleEnableLabel}>Enable Weekly DND</Text>
                  <Switch
                    value={dndScheduleEnabled}
                    onValueChange={setDndScheduleEnabled}
                    trackColor={{ false: Colors.bgCard, true: '#C084FC80' }}
                    thumbColor={dndScheduleEnabled ? '#C084FC' : Colors.textDim}
                  />
                </View>

                {/* Day Selector */}
                <Text style={dndStyles.scheduleSubLabel}>Select Days</Text>
                <View style={dndStyles.dayRow}>
                  {DAY_LABELS.map((label, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[dndStyles.dayBtn, dndDays.includes(idx) && dndStyles.dayBtnActive]}
                      onPress={() => toggleDndDay(idx)}
                    >
                      <Text style={[dndStyles.dayBtnText, dndDays.includes(idx) && dndStyles.dayBtnTextActive]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Time range */}
                <Text style={dndStyles.scheduleSubLabel}>Mute Time Range</Text>
                <View style={dndStyles.timeRangeRow}>
                  <TouchableOpacity
                    style={dndStyles.timeRangeBtn}
                    onPress={() => setShowDndTimePicker('start')}
                  >
                    <Ionicons name="time-outline" size={14} color={Colors.primary} />
                    <Text style={dndStyles.timeRangeLabel}>From</Text>
                    <Text style={dndStyles.timeRangeValue}>{fmtTime(dndStartHour, dndStartMinute)}</Text>
                  </TouchableOpacity>
                  <Ionicons name="arrow-forward" size={16} color={Colors.textDim} />
                  <TouchableOpacity
                    style={dndStyles.timeRangeBtn}
                    onPress={() => setShowDndTimePicker('end')}
                  >
                    <Ionicons name="time-outline" size={14} color="#C084FC" />
                    <Text style={dndStyles.timeRangeLabel}>Until</Text>
                    <Text style={[dndStyles.timeRangeValue, { color: '#C084FC' }]}>{fmtTime(dndEndHour, dndEndMinute)}</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={dndStyles.saveScheduleBtn} onPress={handleSaveDndSchedule}>
                  <LinearGradient colors={['rgba(192,132,252,0.3)', 'rgba(123,47,190,0.3)']} style={dndStyles.saveScheduleGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Ionicons name="checkmark-circle" size={16} color="#C084FC" />
                    <Text style={dndStyles.saveScheduleText}>Save Schedule</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Notification Style Preview */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              <Ionicons name="notifications" size={14} color={Colors.textMuted} /> Notification Style
            </Text>
            <View style={styles.notifPreview}>
              <View style={styles.notifHeader}>
                <Text style={styles.notifApp}>HydroSmart</Text>
                <Text style={styles.notifTime}>now</Text>
              </View>
              <Text style={styles.notifTitle}>🌵 Cactus Alert!</Text>
              <Text style={styles.notifBody}>Cactus bhi paani maangta hai — aur tum? Utho, gatak lo!</Text>
            </View>
            <Text style={styles.notifHint}>Pace ke hisaab se automatically alag alag funny Hinglish notifications aayenge!</Text>
          </View>

          {/* App info */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              <Ionicons name="information-circle" size={14} color={Colors.textMuted} /> App Info
            </Text>
            <SettingRow icon="code-slash-outline" label="Version" value="1.0.0" />
            <View style={styles.divider} />
            <SettingRow icon="heart-outline" label="Made with ❤️ in India" value="" />
          </View>

          {/* Logout */}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
            <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </LinearGradient>

      {/* Modals */}
      <GoalModal
        visible={showGoalModal}
        currentGoal={user?.dailyGoal ?? 2000}
        onSave={handleSaveGoal}
        onClose={() => setShowGoalModal(false)}
      />
      <TimePickerModal
        visible={showWakeModal}
        title="Wake Up Time"
        initialHour={wakeHour}
        initialMinute={wakeMinute}
        onSave={handleSaveWakeTime}
        onClose={() => setShowWakeModal(false)}
      />
      <TimePickerModal
        visible={showSleepModal}
        title="Sleep Time"
        initialHour={sleepHour}
        initialMinute={sleepMinute}
        onSave={handleSaveSleepTime}
        onClose={() => setShowSleepModal(false)}
      />
      {/* DND Time Pickers */}
      <TimePickerModal
        visible={showDndTimePicker === 'start'}
        title="DND Start Time"
        initialHour={dndStartHour}
        initialMinute={dndStartMinute}
        onSave={(h, m) => { setDndStartHour(h); setDndStartMinute(m); setShowDndTimePicker(null); }}
        onClose={() => setShowDndTimePicker(null)}
      />
      <TimePickerModal
        visible={showDndTimePicker === 'end'}
        title="DND End Time"
        initialHour={dndEndHour}
        initialMinute={dndEndMinute}
        onSave={(h, m) => { setDndEndHour(h); setDndEndMinute(m); setShowDndTimePicker(null); }}
        onClose={() => setShowDndTimePicker(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  container: { flex: 1 },
  avatarSection: { alignItems: 'center', paddingVertical: Spacing.xl },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.sm, ...Shadows.cyan,
  },
  avatarText: { fontFamily: Fonts.extrabold, fontSize: 32, color: Colors.bg },
  userName: { fontFamily: Fonts.extrabold, fontSize: 22, color: Colors.text },
  userPhone: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, marginTop: 4 },
  card: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.glass,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  cardTitle: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.textMuted, marginBottom: Spacing.sm },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  settingIcon: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: 'rgba(0,212,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  settingLabel: { fontFamily: Fonts.medium, fontSize: 14, color: Colors.text },
  settingRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  settingValue: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted },
  divider: { height: 1, backgroundColor: Colors.separator, marginVertical: 2 },
  notifPreview: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  notifHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  notifApp: { fontFamily: Fonts.bold, fontSize: 11, color: Colors.primary },
  notifTime: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textDim },
  notifTitle: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.text },
  notifBody: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  notifHint: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textDim, fontStyle: 'italic' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    paddingVertical: 14,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.danger + '50',
    backgroundColor: Colors.danger + '10',
  },
  logoutText: { fontFamily: Fonts.bold, fontSize: 15, color: Colors.danger },
  bgCard: Colors.glass,
});

// ===== DND Styles =====
const dndStyles = StyleSheet.create({
  activeBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(192,132,252,0.15)',
    borderRadius: Radius.md, padding: Spacing.md,
    borderWidth: 1, borderColor: '#C084FC50',
    marginBottom: Spacing.md,
  },
  activeBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  activeBannerTitle: { fontFamily: Fonts.bold, fontSize: 13, color: '#C084FC' },
  activeBannerSub: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted },
  cancelMuteBtn: {
    backgroundColor: 'rgba(192,132,252,0.2)', paddingHorizontal: 12,
    paddingVertical: 6, borderRadius: Radius.full, borderWidth: 1, borderColor: '#C084FC50',
  },
  cancelMuteText: { fontFamily: Fonts.bold, fontSize: 12, color: '#C084FC' },
  subLabel: { fontFamily: Fonts.bold, fontSize: 12, color: Colors.textMuted, marginBottom: Spacing.sm, letterSpacing: 0.5 },
  quickMuteRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap', marginBottom: Spacing.md },
  quickBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: Radius.full, borderWidth: 1,
    borderColor: Colors.glassBorder, backgroundColor: Colors.glass,
  },
  quickBtnActive: { backgroundColor: 'rgba(192,132,252,0.15)', borderColor: '#C084FC50' },
  quickBtnText: { fontFamily: Fonts.medium, fontSize: 13, color: Colors.textMuted },
  quickBtnTextActive: { color: '#C084FC' },
  scheduleHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  scheduleHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  scheduleHeaderText: { fontFamily: Fonts.medium, fontSize: 14, color: Colors.text },
  scheduleBadge: {
    backgroundColor: 'rgba(192,132,252,0.2)', paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 4, borderWidth: 1, borderColor: '#C084FC50',
  },
  scheduleBadgeText: { fontFamily: Fonts.bold, fontSize: 9, color: '#C084FC' },
  scheduleBody: {
    marginTop: Spacing.sm, paddingTop: Spacing.sm,
    borderTopWidth: 1, borderTopColor: Colors.separator,
  },
  scheduleEnableRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  scheduleEnableLabel: { fontFamily: Fonts.medium, fontSize: 14, color: Colors.text },
  scheduleSubLabel: { fontFamily: Fonts.bold, fontSize: 11, color: Colors.textMuted, marginBottom: Spacing.sm, letterSpacing: 0.5 },
  dayRow: { flexDirection: 'row', gap: Spacing.xs ?? 4, marginBottom: Spacing.md },
  dayBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.glassBorder,
    backgroundColor: Colors.glass,
  },
  dayBtnActive: { backgroundColor: 'rgba(192,132,252,0.25)', borderColor: '#C084FC' },
  dayBtnText: { fontFamily: Fonts.bold, fontSize: 11, color: Colors.textMuted },
  dayBtnTextActive: { color: '#C084FC' },
  timeRangeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  timeRangeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.glass, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.glassBorder,
    paddingHorizontal: Spacing.sm, paddingVertical: 10,
  },
  timeRangeLabel: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, flex: 1 },
  timeRangeValue: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.primary },
  saveScheduleBtn: { borderRadius: Radius.md, overflow: 'hidden' },
  saveScheduleGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12,
    borderWidth: 1, borderColor: '#C084FC30',
  },
  saveScheduleText: { fontFamily: Fonts.bold, fontSize: 14, color: '#C084FC' },
});

