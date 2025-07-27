import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface AxisLabelProps {
  x: number;
  value: number;
}

export default function AxisLabel({ x, value }: AxisLabelProps) {
  return (
    <View style={[styles.container, { left: x - 30 }]}>
      <Text style={styles.label}>
        ${Math.round(value).toLocaleString()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 60,
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 0,
    borderRadius: 4,
  },
});

