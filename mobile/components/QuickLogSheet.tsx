import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  TextInput, ScrollView, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Gradients, Fonts, Spacing, Radius, CONTAINERS } from '../constants/theme';

interface QuickLogSheetProps {
  visible: boolean;
  onClose: () => void;
  onLog: (amount: number, label: string) => Promise<void>;
}

export function QuickLogSheet({ visible, onClose, onLog }: QuickLogSheetProps) {
  const [customAmount, setCustomAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLog = async (amount: number, label: string) => {
    if (loading) return;
    setLoading(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await onLog(amount, label);
      onClose();
      setCustomAmount('');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Log failed!');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomLog = () => {
    const ml = parseInt(customAmount, 10);
    if (!ml || ml < 1 || ml > 5000) {
      Alert.alert('Arey!', '1 se 5000 ml ke beech valid amount daalo dost!');
      return;
    }
    handleLog(ml, `${ml}ml custom`);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.sheetWrapper}
      >
        <View style={styles.sheet}>
          {/* Handle bar */}
          <View style={styles.handle} />

          <Text style={styles.title}>
            Kya Piya? <Ionicons name="water" size={22} color={Colors.primary} />
          </Text>
          <Text style={styles.subtitle}>Ek tap me log karo!</Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Container grid */}
            <View style={styles.grid}>
              {CONTAINERS.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={styles.containerCard}
                  onPress={() => handleLog(c.ml, c.label)}
                  activeOpacity={0.75}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={['rgba(0,212,255,0.1)', 'rgba(0,180,216,0.05)']}
                    style={styles.containerInner}
                  >
                    <Ionicons name={c.iconName as any} size={30} color={Colors.primary} style={styles.containerIcon} />
                    <Text style={styles.containerMl}>{c.ml} ml</Text>
                    <Text style={styles.containerLabel}>{c.label}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom amount */}
            <View style={styles.customSection}>
              <Text style={styles.customTitle}>Ya Custom Amount:</Text>
              <View style={styles.customRow}>
                <TextInput
                  style={styles.customInput}
                  placeholder="e.g. 350"
                  placeholderTextColor={Colors.textDim}
                  keyboardType="numeric"
                  value={customAmount}
                  onChangeText={setCustomAmount}
                  returnKeyType="done"
                  onSubmitEditing={handleCustomLog}
                />
                <Text style={styles.mlLabel}>ml</Text>
              </View>
              <TouchableOpacity
                style={styles.logBtn}
                onPress={handleCustomLog}
                activeOpacity={0.85}
                disabled={loading}
              >
                <LinearGradient
                  colors={Gradients.primary as any}
                  style={styles.logBtnInner}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name={loading ? "hourglass-outline" : "checkmark-circle"} size={20} color={Colors.bg} />
                    <Text style={styles.logBtnText}>
                      {loading ? 'Log ho raha hai...' : 'Log Karo!'}
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheetWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheet: {
    backgroundColor: '#0D2137',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: Spacing.lg,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderColor: 'rgba(0,212,255,0.2)',
    maxHeight: '85%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  title: { fontFamily: Fonts.extrabold, fontSize: 22, color: Colors.text, textAlign: 'center' },
  subtitle: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, textAlign: 'center', marginBottom: Spacing.lg },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  containerCard: {
    width: '30%',
    aspectRatio: 0.9,
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  containerInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.sm,
  },
  containerIcon: { marginBottom: 4 },
  containerMl: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.primary },
  containerLabel: { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted, textAlign: 'center' },
  customSection: { marginBottom: Spacing.md },
  customTitle: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.textMuted, marginBottom: Spacing.sm },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.glass,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  customInput: {
    flex: 1,
    fontFamily: Fonts.bold,
    fontSize: 18,
    color: Colors.text,
    paddingVertical: 14,
  },
  mlLabel: { fontFamily: Fonts.regular, fontSize: 15, color: Colors.textMuted },
  logBtn: { borderRadius: Radius.lg, overflow: 'hidden' },
  logBtnInner: { paddingVertical: 16, alignItems: 'center' },
  logBtnText: { fontFamily: Fonts.bold, fontSize: 17, color: Colors.bg },
  cancelBtn: { alignItems: 'center', paddingTop: Spacing.sm },
  cancelText: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textMuted },
});
