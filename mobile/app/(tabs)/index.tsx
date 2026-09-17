import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, StatusBar, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../../store/appStore';
import { ProgressRing } from '../../components/ProgressRing';
import { QuickLogSheet } from '../../components/QuickLogSheet';
import { Colors, Gradients, Fonts, Spacing, Radius, Shadows, CONTAINERS } from '../../constants/theme';

export default function HomeScreen() {
  const { user, todayLog, streak, fetchProgress, fetchStreak, logWater } = useAppStore();
  const [refreshing, setRefreshing] = useState(false);
  const [showLogSheet, setShowLogSheet] = useState(false);

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
        Alert.alert('🏆 GOAL COMPLETE!', 'Aaj ka ${todayLog?.goal}ml target tod diya! Tu Hydration King/Queen hai! 👑');
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Kuch gadbad ho gayi!');
    }
  };

  const percentage = todayLog?.percentage ?? 0;
  const consumed = todayLog?.totalConsumed ?? 0;
  const goal = todayLog?.goal ?? (user?.dailyGoal ?? 2000);
  const remaining = todayLog?.remaining ?? goal;

  const getUrgencyColor = () => {
    if (percentage >= 100) return Colors.success;
    if (percentage >= 70) return Colors.primary;
    if (percentage >= 40) return Colors.warning;
    return Colors.danger;
  };

  const getStatusText = () => {
    if (percentage >= 100) return '🏆 Goal complete ho gaya! Champion!';
    if (percentage >= 70) return '🔥 Bahut badhiya! Keep going!';
    if (percentage >= 40) return '💧 Accha chal raha hai, thoda aur!';
    return '🌵 Arre dost, kuch piya? Paani lo!';
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
            <Ionicons name="flash" size={16} color={Colors.warning} /> Quick Log
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
              <Text style={styles.customLogText}>
                <Ionicons name="water" size={18} color={Colors.bg} /> Custom Amount Log Karo
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Today's entries count */}
          {(todayLog?.entriesCount ?? 0) > 0 && (
            <View style={styles.entriesCard}>
              <Text style={styles.entriesText}>
                <Ionicons name="list" size={14} color={Colors.textMuted} /> Aaj {todayLog?.entriesCount} baar piya hai!
              </Text>
            </View>
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      </LinearGradient>

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
    flexDirection: 'row',
    alignItems: 'center',
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
  },
  entriesText: { fontFamily: Fonts.medium, fontSize: 13, color: Colors.textMuted },
});
