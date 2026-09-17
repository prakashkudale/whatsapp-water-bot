import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, Alert, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '../store/appStore';
import { Colors, Gradients, Fonts, Spacing, Radius, Shadows } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAppStore();

  const handleSubmit = async () => {
    if (!phoneNumber || !password) {
      Alert.alert('Arey!', 'Phone number aur password toh daalo dost!');
      return;
    }
    if (!isLogin && !name) {
      Alert.alert('Arey!', 'Naam bhi daalo bhai!');
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
        await login(phoneNumber, password);
      } else {
        await register(phoneNumber, name, password);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Kuch gadbad ho gayi! Try again karo.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={Gradients.bg as any} style={styles.container}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.kav}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Logo */}
          <View style={styles.logoSection}>
            <LinearGradient colors={Gradients.primary as any} style={styles.logo}>
              <Ionicons name="water" size={44} color={Colors.bg} />
            </LinearGradient>
            <Text style={styles.appName}>HydroSmart</Text>
            <Text style={styles.tagline}>
              Paani piyo, fit raho! <Ionicons name="barbell" size={14} color={Colors.textMuted} />
            </Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            {/* Toggle */}
            <View style={styles.toggle}>
              <TouchableOpacity
                style={[styles.toggleBtn, isLogin && styles.toggleActive]}
                onPress={() => setIsLogin(true)}
              >
                <Text style={[styles.toggleText, isLogin && styles.toggleTextActive]}>Login</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, !isLogin && styles.toggleActive]}
                onPress={() => setIsLogin(false)}
              >
                <Text style={[styles.toggleText, !isLogin && styles.toggleTextActive]}>Register</Text>
              </TouchableOpacity>
            </View>

            {/* Fields */}
            {!isLogin && (
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>
                  <Ionicons name="person" size={14} color={Colors.textMuted} /> Aapka Naam
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Prakash"
                  placeholderTextColor={Colors.textDim}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            )}

            <View style={styles.inputWrapper}>
              <Text style={styles.label}>
                <Ionicons name="call" size={14} color={Colors.textMuted} /> Phone Number
              </Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 9978241539"
                placeholderTextColor={Colors.textDim}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                maxLength={15}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.label}>
                <Ionicons name="lock-closed" size={14} color={Colors.textMuted} /> Password
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Min 6 characters"
                placeholderTextColor={Colors.textDim}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            {/* Submit */}
            <TouchableOpacity onPress={handleSubmit} disabled={loading} activeOpacity={0.85} style={styles.submitBtnWrapper}>
              <LinearGradient colors={Gradients.primary as any} style={styles.submitBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name={loading ? "hourglass-outline" : isLogin ? "log-in-outline" : "person-add-outline"} size={20} color={Colors.bg} />
                  <Text style={styles.submitText}>
                    {loading ? 'Wait karo...' : isLogin ? 'Login Karo!' : 'Register Karo!'}
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>
            Made with <Ionicons name="water" size={12} color={Colors.primary} /> for healthy India!
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  kav: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: Spacing.lg },
  logoSection: { alignItems: 'center', marginBottom: Spacing.xl },
  logo: {
    width: 90, height: 90, borderRadius: 30,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.md, ...Shadows.cyan,
  },
  appName: { fontFamily: Fonts.extrabold, fontSize: 34, color: Colors.text },
  tagline: { fontFamily: Fonts.regular, fontSize: 15, color: Colors.textMuted, marginTop: 4 },
  card: {
    backgroundColor: Colors.glass,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: Radius.lg,
    padding: 4,
    marginBottom: Spacing.lg,
  },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: Radius.md },
  toggleActive: { backgroundColor: Colors.primary },
  toggleText: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.textMuted },
  toggleTextActive: { color: Colors.bg },
  inputWrapper: { marginBottom: Spacing.md },
  label: { fontFamily: Fonts.medium, fontSize: 13, color: Colors.textMuted, marginBottom: 8 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    fontFamily: Fonts.regular,
    fontSize: 16,
    color: Colors.text,
  },
  submitBtnWrapper: { borderRadius: Radius.lg, overflow: 'hidden', marginTop: Spacing.sm },
  submitBtn: { paddingVertical: 16, alignItems: 'center' },
  submitText: { fontFamily: Fonts.bold, fontSize: 16, color: Colors.bg },
  footer: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textDim, textAlign: 'center' },
});
