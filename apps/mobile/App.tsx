import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ScrollView, Alert, Text, TouchableOpacity } from 'react-native';
import ChatScreen from './screens/ChatScreen';

// Simple mobile-specific components
const Card = ({ children, style = {} }: { children: React.ReactNode; style?: any }) => (
  <View style={[styles.card, style]}>
    {children}
  </View>
);

const Button = ({ title, onPress, variant = 'primary' }: { 
  title: string; 
  onPress: () => void; 
  variant?: 'primary' | 'secondary' 
}) => (
  <TouchableOpacity 
    style={[styles.button, variant === 'primary' ? styles.buttonPrimary : styles.buttonSecondary]}
    onPress={onPress}
  >
    <Text style={[styles.buttonText, variant === 'primary' ? styles.buttonTextPrimary : styles.buttonTextSecondary]}>
      {title}
    </Text>
  </TouchableOpacity>
);

export default function App() {
  const [showChat, setShowChat] = useState(false);
  const sampleTemp = 24;
  const sampleHumidity = 65;

  // Show chat screen if enabled
  if (showChat) {
    return (
      <View style={styles.container}>
        <ChatScreen />
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setShowChat(false)}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Simple date formatting
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Temperature conversion
  const celsiusToFahrenheit = (celsius: number): number => (celsius * 9/5) + 32;

  const handleGetStarted = () => {
    Alert.alert('Welcome!', 'Welcome to ClimaGuard! 🛡️\n\nStart monitoring your environment with real-time alerts and insights.');
  };

  const handleViewSensors = () => {
    Alert.alert('Sensors', 'Sensor management coming soon!\n\nYou\'ll be able to add and configure multiple sensors for comprehensive monitoring.');
  };

  const handleViewAlerts = () => {
    Alert.alert('Alerts', 'No active alerts\n\nTemperature: Normal (24°C)\nHumidity: Optimal (65%)');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            🛡️ ClimaGuard
          </Text>
          <Text style={styles.subtitle}>
            Mobile Climate Monitor
          </Text>
          <Text style={styles.dateText}>
            {formatDate(new Date())}
          </Text>
        </View>

        {/* Current Reading Card */}
        <Card>
          <Text style={styles.cardTitle}>
            Current Conditions
          </Text>
          <View style={styles.readingGrid}>
            <View style={styles.readingItem}>
              <Text style={styles.emoji}>🌡️</Text>
              <Text style={styles.readingValue}>{sampleTemp}°C</Text>
              <Text style={styles.readingUnit}>({celsiusToFahrenheit(sampleTemp).toFixed(1)}°F)</Text>
              <Text style={styles.readingLabel}>Temperature</Text>
            </View>
            <View style={styles.readingItem}>
              <Text style={styles.emoji}>💧</Text>
              <Text style={styles.readingValue}>{sampleHumidity}%</Text>
              <Text style={styles.readingUnit}>Relative</Text>
              <Text style={styles.readingLabel}>Humidity</Text>
            </View>
          </View>
        </Card>

        {/* Feature Cards */}
        <Card>
          <Text style={styles.cardTitle}>
            📱 Mobile Features
          </Text>
          <Text style={styles.featureText}>
            • Real-time sensor monitoring
          </Text>
          <Text style={styles.featureText}>
            • Push notifications for alerts
          </Text>
          <Text style={styles.featureText}>
            • Offline data caching
          </Text>
          <Text style={styles.featureText}>
            • GPS-based location tracking
          </Text>
        </Card>

        {/* Thresholds */}
        <Card>
          <Text style={styles.cardTitle}>
            Alert Thresholds
          </Text>
          <View style={styles.thresholdGrid}>
            <View style={styles.thresholdItem}>
              <Text style={styles.thresholdEmoji}>🔥</Text>
              <Text style={styles.thresholdLabel}>Critical Hot</Text>
              <Text style={styles.thresholdValue}>40°C</Text>
            </View>
            <View style={styles.thresholdItem}>
              <Text style={styles.thresholdEmoji}>☀️</Text>
              <Text style={styles.thresholdLabel}>Hot</Text>
              <Text style={styles.thresholdValue}>30°C</Text>
            </View>
            <View style={styles.thresholdItem}>
              <Text style={styles.thresholdEmoji}>❄️</Text>
              <Text style={styles.thresholdLabel}>Cold</Text>
              <Text style={styles.thresholdValue}>5°C</Text>
            </View>
            <View style={styles.thresholdItem}>
              <Text style={styles.thresholdEmoji}>🧊</Text>
              <Text style={styles.thresholdLabel}>Critical Cold</Text>
              <Text style={styles.thresholdValue}>-10°C</Text>
            </View>
          </View>
        </Card>

        {/* Action Buttons */}
        <Card>
          <View style={styles.buttonContainer}>
            <Button
              title="Start Monitoring"
              onPress={handleGetStarted}
              variant="primary"
            />
            <Button
              title="Manage Sensors"
              onPress={handleViewSensors}
              variant="secondary"
            />
            <Button
              title="View Alerts"
              onPress={handleViewAlerts}
              variant="secondary"
            />
            <Button
              title="💬 AI Chat Assistant"
              onPress={() => setShowChat(true)}
              variant="primary"
            />
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#007AFF',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  dateText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  readingGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  readingItem: {
    alignItems: 'center',
    flex: 1,
  },
  emoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  readingValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  readingUnit: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  readingLabel: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  featureText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 6,
    paddingLeft: 8,
  },
  thresholdGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  thresholdItem: {
    alignItems: 'center',
    width: '48%',
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  thresholdEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  thresholdLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  thresholdValue: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#007AFF',
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextPrimary: {
    color: '#FFFFFF',
  },
  buttonTextSecondary: {
    color: '#007AFF',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
