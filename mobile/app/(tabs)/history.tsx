import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../../store/appStore';
import { Colors, Gradients, Fonts, Spacing, Radius } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

function DayCell({ log }: { log: any }) {
  const pct = log?.percentage ?? 0;
  const isEmpty = !log;
  const color = isEmpty
    ? 'rgba(255,255,255,0.04)'
    : pct >= 100
    ? Colors.success
    : pct >= 60
    ? Colors.primary
    : pct >= 30
    ? Colors.warning
    : Colors.danger;

  return (
    <View style={[dayCellStyles.cell, { backgroundColor: color + (isEmpty ? '' : '40'), borderColor: color + (isEmpty ? '' : '80') }]}>
      {!isEmpty && <Text style={dayCellStyles.pct}>{pct}%</Text>}
    </View>
  );
}

const dayCellStyles = StyleSheet.create({
  cell: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    margin: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pct: { fontFamily: Fonts.regular, fontSize: 8, color: '#fff' },
});

function PercentBar({ pct }: { pct: number }) {
  const color = pct >= 100 ? Colors.success : pct >= 60 ? Colors.primary : pct >= 30 ? Colors.warning : Colors.danger;
  return (
    <View style={barStyles.track}>
      <View style={[barStyles.fill, { width: `${Math.min(pct, 100)}%` as any, backgroundColor: color }]} />
    </View>
  );
}

const barStyles = StyleSheet.create({
  track: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 4,
    marginTop: 4,
    overflow: 'hidden',
    width: 80,
  },
  fill: { height: '100%', borderRadius: 4 },
});

export default function HistoryScreen() {
  const [history, setHistory] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadHistory = async () => {
    try {
      const { waterAPI } = await import('../../services/api');
      const res = await waterAPI.getHistory(30);
      setHistory(res.data.logs || []);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadHistory(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  // Fix timezone issue: parse date string directly without converting to local Date
  const formatDate = (dateStr: string) => {
    const parts = (dateStr || '').split('T')[0].split('-');
    if (parts.length < 3) return dateStr;
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      <LinearGradient colors={Gradients.bg as any} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>History <Ionicons name="calendar" size={22} color={Colors.text} /></Text>
          <Text style={styles.subtitle}>Last 30 days ka paani log</Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        >
          {/* Empty state */}
          {!loading && history.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="water-outline" size={64} color={Colors.textDim} />
              <Text style={styles.emptyTitle}>Koi history nahi mili!</Text>
              <Text style={styles.emptySubtitle}>Home screen pe paani log karo aur yahan dikhega.</Text>
            </View>
          )}

          {/* Heatmap calendar */}
          {history.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Monthly Heatmap</Text>
              <View style={styles.grid}>
                {history.slice().reverse().map((log, i) => (
                  <DayCell key={i} log={log} />
                ))}
              </View>

              {/* Legend */}
              <View style={styles.legend}>
                {[
                  { color: Colors.success, label: '100%' },
                  { color: Colors.primary, label: '60%+' },
                  { color: Colors.warning, label: '30%+' },
                  { color: Colors.danger, label: '<30%' },
                ].map(({ color, label }) => (
                  <View key={label} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: color + '40', borderColor: color }]} />
                    <Text style={styles.legendLabel}>{label}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Recent log list */}
          {history.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Recent Logs</Text>
              {history.slice(0, 14).map((log, i) => {
                const pct = log.percentage ?? 0;
                return (
                  <View key={i} style={styles.logRow}>
                    <View style={styles.logLeft}>
                      <Text style={styles.logDate}>{formatDate(log.date)}</Text>
                      <PercentBar pct={pct} />
                      <Text style={styles.logEntries}>{(log.entries?.length ?? log.entriesCount ?? 0)} entries</Text>
                    </View>
                    <View style={styles.logRight}>
                      <Text style={[styles.logAmount, { color: log.goalCompleted ? Colors.success : Colors.primary }]}>
                        {log.totalConsumed} ml
                      </Text>
                      <Text style={styles.logGoal}>of {log.goal} ml</Text>
                      <Text style={[styles.logPct, { color: pct >= 100 ? Colors.success : pct >= 60 ? Colors.primary : Colors.warning }]}>
                        {pct}%
                      </Text>
                    </View>
                    {log.goalCompleted && <Ionicons name="trophy" size={20} color={Colors.warning} style={{ marginLeft: 4 }} />}
                  </View>
                );
              })}
            </>
          )}

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
  subtitle: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    fontFamily: Fonts.bold,
    fontSize: 18,
    color: Colors.textMuted,
    marginTop: Spacing.md,
  },
  emptySubtitle: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.textDim,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 20,
  },
  card: {
    margin: Spacing.lg,
    backgroundColor: Colors.glass,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  cardTitle: { fontFamily: Fonts.bold, fontSize: 15, color: Colors.text, marginBottom: Spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  legend: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 10, height: 10, borderRadius: 3, borderWidth: 1 },
  legendLabel: { fontFamily: Fonts.regular, fontSize: 10, color: Colors.textMuted },
  sectionTitle: {
    fontFamily: Fonts.bold, fontSize: 15, color: Colors.textMuted,
    paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm,
  },
  logRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.separator,
  },
  logLeft: { flex: 1 },
  logDate: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.text },
  logEntries: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  logRight: { alignItems: 'flex-end', marginRight: Spacing.sm },
  logAmount: { fontFamily: Fonts.bold, fontSize: 15 },
  logGoal: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted },
  logPct: { fontFamily: Fonts.bold, fontSize: 11, marginTop: 2 },
});
