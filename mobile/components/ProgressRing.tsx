import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors, Fonts } from '../constants/theme';

interface ProgressRingProps {
  percentage: number;
  consumed: number;
  goal: number;
  size?: number;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function ProgressRing({ percentage, consumed, goal, size = 220 }: ProgressRingProps) {
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const animatedValue = useRef(new Animated.Value(0)).current;
  const prevPercentage = useRef(0);

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: percentage,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    prevPercentage.current = percentage;
  }, [percentage]);

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  const remaining = Math.max(0, goal - consumed);
  const glasses = (consumed / 250).toFixed(1);

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        {/* Track circle (background) */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          strokeWidth={strokeWidth}
          stroke="rgba(255,255,255,0.06)"
          fill="none"
          strokeLinecap="round"
        />
        {/* Progress circle */}
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          strokeWidth={strokeWidth}
          stroke="#00D4FF"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          rotation="-90"
          origin={`${center}, ${center}`}
        />
      </Svg>

      {/* Center content */}
      <View style={styles.centerContent}>
        <Text style={styles.percentage}>{Math.round(percentage)}%</Text>
        <Text style={styles.consumed}>{consumed} ml</Text>
        <Text style={styles.goal}>/ {goal} ml</Text>
        <View style={styles.divider} />
        <Text style={styles.glasses}>🥛 {glasses} glasses</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentage: {
    fontFamily: Fonts.extrabold,
    fontSize: 36,
    color: '#00D4FF',
    lineHeight: 40,
  },
  consumed: {
    fontFamily: Fonts.bold,
    fontSize: 22,
    color: Colors.text,
    lineHeight: 28,
  },
  goal: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.textMuted,
  },
  divider: {
    width: 40,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginVertical: 6,
  },
  glasses: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Colors.textMuted,
  },
});
