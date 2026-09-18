import React, { useEffect } from 'react';
import { Stack, Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  useFonts,
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { useAppStore } from '../store/appStore';
import { View, ActivityIndicator } from 'react-native';
import { Colors } from '../constants/theme';

// Keep splash screen visible while fonts/auth load
SplashScreen.preventAutoHideAsync();

// Configure notification handler — show alerts even when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request push notification permission and register the device token with the backend.
 * Called automatically after the user successfully logs in.
 */
async function registerForPushNotifications(registerTokenFn: (token: string) => Promise<void>) {
  try {
    if (!Device.isDevice) {
      console.log('[Push] Skipping — not a physical device');
      return;
    }

    // Request permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('[Push] Permission denied by user');
      return;
    }

    // Create Android notification channel
    if (Platform.OS === 'android') {
      try {
        await Notifications.setNotificationChannelAsync('hydrosmart-reminders', {
          name: 'HydroSmart Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#00D4FF',
          sound: 'notification_sound',
        });
      } catch (channelErr) {
        console.log('[Push] Failed to create custom channel, falling back to default:', channelErr);
      }
    }

    // Get the push token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: 'bdda0ae4-b34c-4ada-91cb-c26685959cfa',
    });
    const token = tokenData.data;
    console.log('[Push] Token obtained:', token.slice(-8));

    // Register token with the backend
    await registerTokenFn(token);
    console.log('[Push] Token registered with backend ✅');
  } catch (err) {
    console.log('[Push] Registration error:', err);
  }
}

export default function RootLayout() {
  const { loadStoredAuth, isLoading, isAuthenticated, registerPushToken } = useAppStore();

  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  useEffect(() => {
    loadStoredAuth();
  }, []);

  useEffect(() => {
    if (fontsLoaded && !isLoading) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isLoading]);

  // Register push token whenever the user becomes authenticated
  useEffect(() => {
    if (isAuthenticated) {
      registerForPushNotifications(registerPushToken);
    }
  }, [isAuthenticated]);

  // Show loading screen while fonts and auth state are resolving
  if (!fontsLoaded || isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth" />
      </Stack>
      {/* Redirect is the correct expo-router pattern for auth guards.
          It reacts to isAuthenticated changes on both login AND logout. */}
      {isAuthenticated ? <Redirect href="/(tabs)" /> : <Redirect href="/auth" />}
    </GestureHandlerRootView>
  );
}
