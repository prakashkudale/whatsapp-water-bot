import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, StatusBar, Animated, Modal, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../../store/appStore';
import { ProgressRing } from '../../components/ProgressRing';
import { QuickLogSheet } from '../../components/QuickLogSheet';
import { Colors, Gradients, Fonts, Spacing, Radius, Shadows, CONTAINERS } from '../../constants/theme';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// =================== Goal Complete Modal ===================
function GoalCompleteModal({ visible, goal, name, onDismiss }: {
  visible: boolean; goal: number; name: string; onDismiss: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const trophyAnim = useRef(new Animated.Value(0)).current;
  const confettis = useRef(
    Array.from({ length: 18 }, () => ({
      x: new Animated.Value(Math.random() * SCREEN_W),
      y: new Animated.Value(-20),
      opacity: new Animated.Value(1),
      color: ['#00D4FF', '#7B2FBE', '#FFD700', '#FF6B6B', '#00FF88'][Math.floor(Math.random() * 5)],
      size: 6 + Math.random() * 8,
    }))
  ).current;

  useEffect(() => {
    if (visible) {
      // Background fade in
      Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      // Card scale in
      Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }).start();
      // Trophy bounce
      Animated.sequence([
        Animated.delay(300),
        Animated.spring(trophyAnim, { toValue: 1, tension: 40, friction: 5, useNativeDriver: true }),
      ]).start();
      // Confetti drop
      confettis.forEach((c, i) => {
        c.x.setValue(Math.random() * SCREEN_W);
        c.y.setValue(-20);
        c.opacity.setValue(1);
        Animated.sequence([
          Animated.delay(i * 60),
          Animated.parallel([
            Animated.timing(c.y, { toValue: SCREEN_H + 20, duration: 1800 + Math.random() * 600, useNativeDriver: true }),
            Animated.timing(c.opacity, { toValue: 0, duration: 1800, useNativeDriver: true }),
          ]),
        ]).start();
      });
    } else {
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
      trophyAnim.setValue(0);
    }
  }, [visible]);

  const trophyScale = trophyAnim.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 1.3, 1] });

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onDismiss}>
      <Animated.View style={[styles.modalOverlay, { opacity: opacityAnim }]}>
        {/* Confetti */}
        {confettis.map((c, i) => (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              width: c.size,
              height: c.size,
              borderRadius: c.size / 2,
              backgroundColor: c.color,
              left: c.x,
              transform: [{ translateY: c.y }],
              opacity: c.opacity,
            }}
          />
        ))}

        {/* Card */}
        <Animated.View style={[styles.modalCard, { transform: [{ scale: scaleAnim }] }]}>
          <LinearGradient
            colors={['#0D2137', '#1A0A2E']}
            style={styles.modalInner}
          >
            {/* Glow ring */}
            <View style={styles.trophyRing}>
              <LinearGradient colors={['#FFD700', '#FFA500']} style={styles.trophyGradient}>
                <Animated.View style={{ transform: [{ scale: trophyScale }] }}>
                  <Ionicons name="trophy" size={52} color="#0A1628" />
                </Animated.View>
              </LinearGradient>
            </View>

            <Text style={styles.modalTitle}>GOAL COMPLETE! 🎉</Text>
            <Text style={styles.modalSubtitle}>
              {name || 'Champion'}, tu aaj ka{'\n'}
              <Text style={styles.modalHighlight}>Hydration King</Text> hai!
            </Text>

            <View style={styles.modalStat}>
              <Ionicons name="water" size={18} color={Colors.primary} />
              <Text style={styles.modalStatText}>{goal}ml ka target tod diya!</Text>
            </View>

            <View style={styles.modalStat}>
              <Ionicons name="flame" size={18} color="#C084FC" />
              <Text style={styles.modalStatText}>Kal bhi aisi dedication chahiye!</Text>
            </View>

            <TouchableOpacity onPress={onDismiss} activeOpacity={0.85} style={styles.modalBtn}>
              <LinearGradient colors={['#FFD700', '#FFA500']} style={styles.modalBtnInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Ionicons name="checkmark-circle" size={20} color="#0A1628" />
                <Text style={styles.modalBtnText}>Champion! 👑</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

// =================== Home Screen ===================
export default function HomeScreen() {
  const { user, todayLog, streak, fetchProgress, fetchStreak, logWater } = useAppStore();
  const [refreshing, setRefreshing] = useState(false);
  const [showLogSheet, setShowLogSheet] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);

  useEffect(() => {
    fetchProgress();
    fetchStreak();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProgress();
    await fetchStreak();
    setRefreshing(false);
  }, []);

  const handleQuickLog = async (amount: number, label: string) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const result = await logWater(amount, label);
      if (result.justCompletedGoal) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setShowGoalModal(true);
      }
    } catch (err: any) {
      // silent fail — user sees existing UI state
    }
  };

  const percentage = todayLog?.percentage ?? 0;
  const consumed = todayLog?.totalConsumed ?? 0;
  const goal = todayLog?.goal ?? (user?.dailyGoal ?? 2000);
  const remaining = todayLog?.remaining ?? goal;
  const entriesCount = todayLog?.entriesCount ?? (todayLog?.entries?.length ?? 0);

  const getUrgencyColor = () => {
    if (percentage >= 100) return Colors.success;
    if (percentage >= 70) return Colors.primary;
    if (percentage >= 40) return Colors.warning;
    return Colors.danger;
  };

  const getStatusText = () => {
    if (percentage >= 100) return 'Goal complete ho gaya! Champion!';
    if (percentage >= 70) return 'Bahut badhiya! Keep going!';
    if (percentage >= 40) return 'Accha chal raha hai, thoda aur!';
    return 'Arre dost, kuch piya? Paani lo!';
  };

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      <LinearGradient colors={Gradients.bg as any} style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>{greeting} 👋</Text>
              <Text style={styles.name}>{user?.name || 'Dost'}</Text>
            </View>
            <View style={styles.streakBadge}>
              <Ionicons name="flame" size={16} color="#C084FC" />
              <Text style={styles.streakText}>{streak}</Text>
            </View>
          </View>

          {/* Progress Ring */}
          <View style={styles.ringContainer}>
            <ProgressRing percentage={percentage} consumed={consumed} goal={goal} size={230} />
          </View>

          {/* Status text */}
          <View style={styles.statusCard}>
            <Ionicons
              name={percentage >= 100 ? 'trophy' : percentage >= 70 ? 'trending-up' : percentage >= 40 ? 'water' : 'alert-circle'}
              size={18}
              color={getUrgencyColor()}
              style={{ marginBottom: 4 }}
            />
            <Text style={[styles.statusText, { color: getUrgencyColor() }]}>
              {getStatusText()}
            </Text>
            {remaining > 0 && (
              <Text style={styles.remainingText}>
                {remaining} ml aur peena hai ({Math.round(remaining / 250)} glasses)
              </Text>
            )}
          </View>

          {/* Quick Log Buttons */}
          <Text style={styles.sectionTitle}>
            ⚡ Quick Log
          </Text>
          <View style={styles.quickLogGrid}>
            {CONTAINERS.slice(0, 4).map((c) => (
              <TouchableOpacity
                key={c.id}
                style={styles.quickLogBtn}
                onPress={() => handleQuickLog(c.ml, c.label)}
                activeOpacity={0.75}
              >
                <LinearGradient colors={Gradients.card as any} style={styles.quickLogInner}>
                  <Ionicons name={c.iconName as any} size={28} color={Colors.primary} style={styles.quickLogIcon} />
                  <Text style={styles.quickLogMl}>{c.ml}ml</Text>
                  <Text style={styles.quickLogLabel}>{c.label}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom Log Button */}
          <TouchableOpacity
            style={styles.customLogBtn}
            onPress={() => setShowLogSheet(true)}
            activeOpacity={0.85}
          >
            <LinearGradient colors={Gradients.primary as any} style={styles.customLogInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Ionicons name="water" size={18} color={Colors.bg} />
              <Text style={styles.customLogText}> Custom Amount Log Karo</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Today's entries count */}
          {entriesCount > 0 && (
            <View style={styles.entriesCard}>
              <Ionicons name="list" size={14} color={Colors.textMuted} />
              <Text style={styles.entriesText}> Aaj {entriesCount} baar piya hai!</Text>
            </View>
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      </LinearGradient>

      {/* Goal Complete Modal */}
      <GoalCompleteModal
        visible={showGoalModal}
        goal={goal}
        name={user?.name || ''}
        onDismiss={() => setShowGoalModal(false)}
      />

      {/* Quick Log Bottom Sheet */}
      <QuickLogSheet
        visible={showLogSheet}
        onClose={() => setShowLogSheet(false)}
        onLog={handleQuickLog}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  greeting: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textMuted },
  name: { fontFamily: Fonts.extrabold, fontSize: 22, color: Colors.text },
  streakBadge: {
    backgroundColor: 'rgba(123, 47, 190, 0.25)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(123, 47, 190, 0.5)',
  },
  streakText: { fontFamily: Fonts.bold, fontSize: 15, color: '#C084FC' },
  ringContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  statusCard: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.glass,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    padding: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  statusText: { fontFamily: Fonts.bold, fontSize: 15, textAlign: 'center' },
  remainingText: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  sectionTitle: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    color: Colors.textMuted,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    letterSpacing: 0.5,
  },
  quickLogGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  quickLogBtn: {
    width: '22%',
    aspectRatio: 0.85,
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    ...Shadows.card,
  },
  quickLogInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.sm,
  },
  quickLogIcon: { marginBottom: 4 },
  quickLogMl: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.primary },
  quickLogLabel: { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted, textAlign: 'center' },
  customLogBtn: {
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    ...Shadows.cyan,
  },
  customLogInner: {
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  customLogText: { fontFamily: Fonts.bold, fontSize: 16, color: Colors.bg },
  entriesCard: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.glass,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  entriesText: { fontFamily: Fonts.medium, fontSize: 13, color: Colors.textMuted },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCard: {
    width: SCREEN_W * 0.88,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 20,
  },
  modalInner: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  trophyRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
    elevation: 12,
  },
  trophyGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontFamily: Fonts.extrabold,
    fontSize: 26,
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: Spacing.sm,
    letterSpacing: 1,
  },
  modalSubtitle: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 24,
  },
  modalHighlight: {
    fontFamily: Fonts.extrabold,
    color: '#FFD700',
    fontSize: 18,
  },
  modalStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    width: '100%',
  },
  modalStatText: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: Colors.text,
  },
  modalBtn: {
    marginTop: Spacing.lg,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    width: '100%',
  },
  modalBtnInner: {
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  modalBtnText: {
    fontFamily: Fonts.bold,
    fontSize: 17,
    color: '#0A1628',
  },
});
