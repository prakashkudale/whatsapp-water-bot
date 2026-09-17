import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, RefreshControl, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../../store/appStore';
import { Colors, Gradients, Fonts, Spacing, Radius } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const BAR_MAX_HEIGHT = 160;

function WeekBarChart({ stats }: { stats: any[] }) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const maxConsumed = Math.max(...stats.map(s => s.totalConsumed), 1);

  return (
    <View style={chartStyles.container}>
      {stats.map((s, i) => {
        const date = new Date(s.date);
        const day = days[date.getDay()];
        const height = Math.max(8, (s.totalConsumed / maxConsumed) * BAR_MAX_HEIGHT);
        const isToday = i === stats.length - 1;
        const pct = s.percentage;
        const barColor = pct >= 100 ? Colors.success : pct >= 60 ? Colors.primary : Colors.warning;

        return (
          <View key={i} style={chartStyles.barWrapper}>
            <Text style={chartStyles.pctLabel}>{pct}%</Text>
            <View style={chartStyles.barTrack}>
              <LinearGradient
                colors={[barColor, barColor + '80']}
                style={[chartStyles.bar, { height }]}
              />
            </View>
            <Text style={[chartStyles.dayLabel, isToday && chartStyles.todayLabel]}>{isToday ? 'Today' : day}</Text>
          </View>
        );
      })}
    </View>
  );
}

const chartStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.sm,
    height: BAR_MAX_HEIGHT + 60,
    paddingTop: 24,
  },
  barWrapper: { alignItems: 'center', flex: 1 },
  pctLabel: { fontFamily: Fonts.regular, fontSize: 9, color: Colors.textMuted, marginBottom: 4 },
  barTrack: { width: 22, height: BAR_MAX_HEIGHT, justifyContent: 'flex-end', borderRadius: 8, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.05)' },
  bar: { width: '100%', borderRadius: 8 },
  dayLabel: { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textDim, marginTop: 6 },
  todayLabel: { fontFamily: Fonts.bold, color: Colors.primary },
});

export default function StatsScreen() {
  const { weeklyStats, streak, nutritionTip, fetchWeeklyStats, fetchStreak, fetchNutritionTip } = useAppStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchWeeklyStats();
    fetchStreak();
    fetchNutritionTip();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchWeeklyStats(), fetchStreak(), fetchNutritionTip()]);
    setRefreshing(false);
  };

  const totalThisWeek = weeklyStats.reduce((acc, s) => acc + s.totalConsumed, 0);
  const goalsHit = weeklyStats.filter(s => s.goalCompleted).length;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      <LinearGradient colors={Gradients.bg as any} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Aaj Ka Report <Ionicons name="bar-chart" size={22} color={Colors.text} /></Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        >
          {/* Summary Cards */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Ionicons name="flame" size={24} color="#C084FC" style={styles.summaryIcon} />
              <Text style={styles.summaryValue}>{streak}</Text>
              <Text style={styles.summaryLabel}>Day Streak</Text>
            </View>
            <View style={styles.summaryCard}>
              <Ionicons name="trophy" size={24} color={Colors.warning} style={styles.summaryIcon} />
              <Text style={styles.summaryValue}>{goalsHit}</Text>
              <Text style={styles.summaryLabel}>Goals Hit (7d)</Text>
            </View>
            <View style={styles.summaryCard}>
              <Ionicons name="water" size={24} color={Colors.primary} style={styles.summaryIcon} />
              <Text style={styles.summaryValue}>{(totalThisWeek / 1000).toFixed(1)}L</Text>
              <Text style={styles.summaryLabel}>This Week</Text>
            </View>
          </View>

          {/* Weekly Chart */}
          <View style={styles.chartCard}>
            <Text style={styles.cardTitle}>Weekly Progress</Text>
            {weeklyStats.length > 0 ? (
              <WeekBarChart stats={weeklyStats} />
            ) : (
              <Text style={styles.emptyText}>Pehle kuch pao, tab chart dikhega! 😄</Text>
            )}
          </View>

          {/* Nutrition Tip */}
          <View style={styles.tipCard}>
            <LinearGradient colors={['rgba(0,212,255,0.1)', 'rgba(123,47,190,0.08)']} style={styles.tipGradient}>
              <View style={styles.tipHeader}>
                <Ionicons name="barbell" size={20} color={Colors.primary} />
                <Text style={styles.tipTitle}>Aaj Ka Nutrition Tip</Text>
              </View>
              <Text style={styles.tipText}>{nutritionTip}</Text>
            </LinearGradient>
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            {[
              { color: Colors.success, label: '100% Goal Hit' },
              { color: Colors.primary, label: '60%+ Done' },
              { color: Colors.warning, label: 'Kuch Kum' },
            ].map(({ color, label }) => (
              <View key={label} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: color }]} />
                <Text style={styles.legendLabel}>{label}</Text>
              </View>
            ))}
          </View>

          <View style={{ height: 32 }} />
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  container: { flex: 1 },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  title: { fontFamily: Fonts.extrabold, fontSize: 24, color: Colors.text },
  summaryRow: { flexDirection: 'row', paddingHorizontal: Spacing.lg, gap: Spacing.sm, marginBottom: Spacing.md },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.glass,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    padding: Spacing.md,
    alignItems: 'center',
  },
  summaryIcon: { marginBottom: 6 },
  summaryValue: { fontFamily: Fonts.extrabold, fontSize: 20, color: Colors.text },
  summaryLabel: { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted, textAlign: 'center' },
  chartCard: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.glass,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  cardTitle: { fontFamily: Fonts.bold, fontSize: 15, color: Colors.text, marginBottom: Spacing.sm },
  emptyText: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, textAlign: 'center', paddingVertical: Spacing.lg },
  tipCard: { marginHorizontal: Spacing.lg, borderRadius: Radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: Colors.glassBorder, marginBottom: Spacing.md },
  tipGradient: { padding: Spacing.md },
  tipHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  tipTitle: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.primary },
  tipText: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, lineHeight: 20 },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.lg, paddingHorizontal: Spacing.lg },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted },
});
