import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, Alert, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../store/appStore';
import { Colors, Gradients, Fonts, Spacing, Radius, Shadows } from '../../constants/theme';

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

export default function ProfileScreen() {
  const { user, logout, updateSetup } = useAppStore();
  const [remindersEnabled, setRemindersEnabled] = useState(user?.remindersEnabled ?? true);

  const handleRemindersToggle = async (val: boolean) => {
    setRemindersEnabled(val);
    try {
      await updateSetup({ remindersEnabled: val });
    } catch (err) {
      setRemindersEnabled(!val);
      Alert.alert('Error', 'Settings save nahi hui, try again karo!');
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Pakka logout karna hai?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Haan', style: 'destructive', onPress: logout },
    ]);
  };

  const initials = user?.name?.charAt(0).toUpperCase() || '?';

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
            <Text style={styles.userPhone}>📱 +{user?.phoneNumber}</Text>
          </View>

          {/* Settings Cards */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>⚙️ App Settings</Text>
            <SettingRow
              icon="water-outline"
              label="Daily Goal"
              value={`${user?.dailyGoal ?? 2000} ml`}
              onPress={() => Alert.alert('Coming Soon!', 'Yeh feature jald aa raha hai!')}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="sunny-outline"
              label="Wake Up Time"
              value={user?.wakeUpTime || '8:00 AM'}
              onPress={() => Alert.alert('Coming Soon!', 'Yeh feature jald aa raha hai!')}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="moon-outline"
              label="Sleep Time"
              value={user?.sleepTime || '11:00 PM'}
              onPress={() => Alert.alert('Coming Soon!', 'Yeh feature jald aa raha hai!')}
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

          {/* Notification Style Preview */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🔔 Notification Style</Text>
            <View style={styles.notifPreview}>
              <View style={styles.notifHeader}>
                <Text style={styles.notifApp}>💧 HydroSmart</Text>
                <Text style={styles.notifTime}>now</Text>
              </View>
              <Text style={styles.notifTitle}>🌵 Cactus Alert!</Text>
              <Text style={styles.notifBody}>Cactus bhi paani maangta hai — aur tum? Utho, gatak lo!</Text>
            </View>
            <Text style={styles.notifHint}>Pace ke hisaab se automatically alag alag funny Hinglish notifications aayenge!</Text>
          </View>

          {/* App info */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>ℹ️ App Info</Text>
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
});
