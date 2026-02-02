// components/FloodAlertsPanel.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { MaterialSymbol } from './MaterialSymbol';
import { useTheme } from '@/theme/ThemeContext';
import { radii, spacing } from '@/theme/shapes';
import { floodPredictionService, type FloodAlert as FloodAlertData } from '@/api/floodPrediction.service';

interface FloodAlertsPanelProps {
  onClose: () => void;
}

interface DisplayAlert {
  id: string;
  type: 'CRITICAL' | 'WARNING' | 'WATCH' | 'NORMAL';
  title: string;
  message: string;
  location: string;
  timeToFlood: string;
  timestamp: string;
}

export const FloodAlertsPanel: React.FC<FloodAlertsPanelProps> = ({ onClose }) => {
  const { colors } = useTheme();
  const [floodData, setFloodData] = useState<FloodAlertData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFloodAlerts = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      
      const data = await floodPredictionService.getFloodAlerts();
      setFloodData(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch flood alerts:', err);
      setError('Failed to load flood alerts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFloodAlerts();
    
    // Auto-refresh every 2 minutes
    const interval = setInterval(() => fetchFloodAlerts(true), 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Transform API data into display format
  const getDisplayAlerts = (): DisplayAlert[] => {
    if (!floodData) return [];

    const alerts: DisplayAlert[] = [];

    // Add critical zones as alerts
    floodData.zones
      .filter(z => z.riskLevel === 'CRITICAL' || z.riskLevel === 'WARNING')
      .forEach((zone, idx) => {
        alerts.push({
          id: `zone-${zone.zoneId}-${idx}`,
          type: zone.riskLevel,
          title: `${zone.riskLevel === 'CRITICAL' ? 'Critical' : 'Warning'} - Zone ${zone.zoneId}`,
          message: `${zone.affectedDrains} drains affected. ${Math.round(zone.totalCapacityLoss * 100)}% capacity loss detected.`,
          location: `${zone.basinId}, Zone ${zone.zoneId}`,
          timeToFlood: `${zone.zoneFloodTimeHr.toFixed(1)} hours`,
          timestamp: getRelativeTime(zone.timestamp),
        });
      });

    // Add critical basins as alerts
    floodData.basins
      .filter(b => b.riskLevel === 'CRITICAL' || b.riskLevel === 'WARNING')
      .forEach((basin, idx) => {
        alerts.push({
          id: `basin-${basin.basinId}-${idx}`,
          type: basin.riskLevel,
          title: `${basin.riskLevel === 'CRITICAL' ? 'Emergency' : 'Warning'} - ${basin.basinId}`,
          message: basin.riskLevel === 'CRITICAL' 
            ? `Immediate evacuation recommended. Critical zones: ${basin.criticalZones.join(', ')}`
            : `Monitoring drainage system. Average water level: ${basin.avgWaterLevel}cm`,
          location: `${basin.basinId}, Multiple zones`,
          timeToFlood: `${basin.basinFloodTimeHr.toFixed(1)} hours`,
          timestamp: getRelativeTime(basin.timestamp),
        });
      });

    // Add WATCH level zones if no critical/warning alerts
    if (alerts.length === 0) {
      floodData.zones
        .filter(z => z.riskLevel === 'WATCH')
        .slice(0, 3)
        .forEach((zone, idx) => {
          alerts.push({
            id: `watch-${zone.zoneId}-${idx}`,
            type: 'WATCH',
            title: `Flood Watch - Zone ${zone.zoneId}`,
            message: `Water level increasing. ${zone.affectedDrains} drains being monitored.`,
            location: `${zone.basinId}, Zone ${zone.zoneId}`,
            timeToFlood: `${zone.zoneFloodTimeHr.toFixed(1)} hours`,
            timestamp: getRelativeTime(zone.timestamp),
          });
        });
    }

    return alerts.sort((a, b) => parseFloat(a.timeToFlood) - parseFloat(b.timeToFlood));
  };

  const getRelativeTime = (timestamp: Date): string => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - new Date(timestamp).getTime()) / 1000);
    
    if (diff < 60) return `${diff} seconds ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    return `${Math.floor(diff / 3600)} hours ago`;
  };

  const getAlertColor = (type: 'CRITICAL' | 'WARNING' | 'WATCH' | 'NORMAL') => {
    switch (type) {
      case 'CRITICAL':
        return '#DC2626';
      case 'WARNING':
        return '#F59E0B';
      case 'WATCH':
        return '#3B82F6';
      case 'NORMAL':
      default:
        return '#10B981';
    }
  };

  const getAlertIcon = (type: 'CRITICAL' | 'WARNING' | 'WATCH' | 'NORMAL') => {
    switch (type) {
      case 'CRITICAL':
        return 'warning';
      case 'WARNING':
        return 'error';
      case 'WATCH':
        return 'info';
      case 'NORMAL':
      default:
        return 'check_circle';
    }
  };

  const displayAlerts = getDisplayAlerts();
  const criticalCount = displayAlerts.filter(a => a.type === 'CRITICAL').length;
  const warningCount = displayAlerts.filter(a => a.type === 'WARNING').length;

  if (loading && !floodData) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
          Loading flood predictions...
        </Text>
      </View>
    );
  }

  if (error && !floodData) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <MaterialSymbol name="error" size={48} color={colors.error} />
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        <Pressable 
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={() => fetchFloodAlerts()}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialSymbol name="warning" size={24} color={colors.error} />
          <Text style={[styles.title, { color: colors.onSurface }]}>
            Flood Alerts
          </Text>
        </View>
        <Pressable onPress={onClose} style={styles.closeButton}>
          <MaterialSymbol name="close" size={20} color={colors.onSurfaceVariant} />
        </Pressable>
      </View>

      {floodData && (
        <View style={[styles.summary, { backgroundColor: criticalCount > 0 ? '#FEE2E2' : '#FEF3C7' }]}>
          <Text style={[styles.summaryText, { color: criticalCount > 0 ? '#DC2626' : '#F59E0B' }]}>
            {criticalCount > 0 && `🚨 ${criticalCount} Critical`}
            {criticalCount > 0 && warningCount > 0 && ' • '}
            {warningCount > 0 && `⚠️ ${warningCount} Warning`}
            {criticalCount === 0 && warningCount === 0 && '✅ No Critical Alerts'}
          </Text>
          <Text style={[styles.summarySubtext, { color: colors.onSurfaceVariant }]}>
            {floodData.summary.totalZonesAtRisk} zones monitored • {floodData.summary.activeEvacuationRoutes} evacuation routes active
          </Text>
        </View>
      )}

      <ScrollView 
        style={styles.alertsList} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchFloodAlerts(true)}
            colors={[colors.primary]}
          />
        }
      >
        {displayAlerts.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialSymbol name="check_circle" size={64} color={colors.primary} />
            <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>
              All Clear
            </Text>
            <Text style={[styles.emptyMessage, { color: colors.onSurfaceVariant }]}>
              No flood alerts at this time. System is monitoring all drainage basins.
            </Text>
          </View>
        ) : (
          displayAlerts.map((alert) => (
            <View
              key={alert.id}
              style={[
                styles.alertCard,
                {
                  backgroundColor: colors.surface,
                  borderLeftColor: getAlertColor(alert.type),
                },
              ]}
            >
              <View style={styles.alertHeader}>
                <View
                  style={[
                    styles.alertBadge,
                    { backgroundColor: getAlertColor(alert.type) },
                  ]}
                >
                  <MaterialSymbol name={getAlertIcon(alert.type)} size={16} color="#FFFFFF" />
                  <Text style={styles.alertBadgeText}>{alert.type}</Text>
                </View>
                <Text style={[styles.timestamp, { color: colors.onSurfaceVariant }]}>
                  {alert.timestamp}
                </Text>
              </View>

              <Text style={[styles.alertTitle, { color: colors.onSurface }]}>
                {alert.title}
              </Text>
              <Text style={[styles.alertMessage, { color: colors.onSurfaceVariant }]}>
                {alert.message}
              </Text>

              <View style={styles.alertFooter}>
                <View style={styles.footerItem}>
                  <MaterialSymbol name="location_on" size={14} color={colors.onSurfaceVariant} />
                  <Text style={[styles.footerText, { color: colors.onSurfaceVariant }]}>
                    {alert.location}
                  </Text>
                </View>
                <View style={styles.footerItem}>
                  <MaterialSymbol name="history" size={14} color={getAlertColor(alert.type)} />
                  <Text style={[styles.footerText, { color: getAlertColor(alert.type), fontWeight: '700' }]}>
                    {alert.timeToFlood}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.surface }]}>
        <MaterialSymbol name="info" size={16} color={colors.onSurfaceVariant} />
        <Text style={[styles.footerNote, { color: colors.onSurfaceVariant }]}>
          Alerts updated every 2 minutes • AI-powered predictions
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContent: { justifyContent: 'center', alignItems: 'center', gap: spacing.md },
  loadingText: { fontSize: 14, fontWeight: '600' },
  errorText: { fontSize: 16, fontWeight: '600', textAlign: 'center', marginBottom: spacing.md },
  retryButton: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radii.md },
  retryButtonText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { fontSize: 22, fontWeight: '700' },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summary: {
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.md,
  },
  summaryText: { fontSize: 14, fontWeight: '700', textAlign: 'center' },
  summarySubtext: { fontSize: 12, textAlign: 'center', marginTop: 4 },
  alertsList: { flex: 1 },
  emptyState: { alignItems: 'center', paddingVertical: spacing.xl * 2 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: spacing.md },
  emptyMessage: { fontSize: 14, textAlign: 'center', marginTop: spacing.sm, paddingHorizontal: spacing.lg },
  alertCard: {
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    elevation: 2,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.sm,
  },
  alertBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
  timestamp: { fontSize: 11 },
  alertTitle: { fontSize: 15, fontWeight: '700', marginBottom: spacing.xs },
  alertMessage: { fontSize: 13, lineHeight: 18, marginBottom: spacing.sm },
  alertFooter: { gap: spacing.xs },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { fontSize: 12 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radii.md,
    marginTop: spacing.md,
  },
  footerNote: { fontSize: 11, flex: 1 },
});
