// components/DrainDetailSheet.tsx (COMPLETE - WITH STATS ENABLED)
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator, ScrollView } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/theme/ThemeContext";
import { spacing, radii } from "@/theme/shapes";
import { Drain } from "@/types/drain.types";
import { sensorService } from "@/api/sensor.service"; // ✅ Use sensorService for stats
import { ReadingStats } from "@/types/sensor.types";

interface Props {
  drain: Drain;
  onViewFullDetails?: () => void;
  onClose: () => void;
}

export function DrainDetailSheet({ drain, onViewFullDetails, onClose }: Props) {
  const { colors } = useTheme();
  const [stats, setStats] = useState<ReadingStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ✅ Fetch 24h stats from backend
    (async () => {
      try {
        const data = await sensorService.getReadingStats(drain.drainId, 24);
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [drain.drainId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "critical": return "alert-circle";
      case "warning": return "alert";
      case "watch": return "eye";
      case "safe": return "check-circle";
      default: return "minus-circle";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "critical": return "#FB7185";
      case "warning": return "#FBBF24";
      case "watch": return "#60A5FA";
      case "safe": return "#4ADE80";
      case "offline": return "#94A3B8";
      default: return "#6B7280";
    }
  };

  const formatTimeAgo = (date?: Date) => {
    if (!date) return "Never";
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const statusColor = getStatusColor(drain.status);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.drainId, { color: colors.onSurface }]}>
            Drain #{drain.drainId}
          </Text>
          {drain.name && (
            <Text style={[styles.drainName, { color: colors.onSurfaceVariant }]}>
              {drain.name}
            </Text>
          )}
        </View>
        <Pressable onPress={onClose} style={styles.closeButton}>
          <MaterialCommunityIcons name="close" size={24} color={colors.onSurfaceVariant} />
        </Pressable>
      </View>

      {/* Status Badge */}
      <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15` }]}>
        <MaterialCommunityIcons 
          name={getStatusIcon(drain.status)} 
          size={20} 
          color={statusColor} 
        />
        <Text style={[styles.statusText, { color: statusColor }]}>
          {drain.status.toUpperCase()}
        </Text>
      </View>

      {/* Metrics Grid */}
      <View style={styles.metricsGrid}>
        <View style={[styles.metricCard, { backgroundColor: colors.surface }]}>
          <MaterialCommunityIcons name="water" size={24} color={colors.primary} />
          <Text style={[styles.metricValue, { color: colors.onSurface }]}>
            {drain.currentWaterLevel.toFixed(1)}%
          </Text>
          <Text style={[styles.metricLabel, { color: colors.onSurfaceVariant }]}>
            Water Level
          </Text>
        </View>

        <View style={[styles.metricCard, { backgroundColor: colors.surface }]}>
          <MaterialCommunityIcons name="timer-sand" size={24} color={colors.primary} />
          <Text style={[styles.metricValue, { color: colors.onSurface }]}>
            {drain.timeToFill !== null ? `${drain.timeToFill.toFixed(0)}m` : "∞"}
          </Text>
          <Text style={[styles.metricLabel, { color: colors.onSurfaceVariant }]}>
            Time to Fill
          </Text>
        </View>

        <View style={[styles.metricCard, { backgroundColor: colors.surface }]}>
          <MaterialCommunityIcons name="chart-line" size={24} color={colors.primary} />
          <Text style={[styles.metricValue, { color: colors.onSurface }]}>
            {(drain.currentMetrics.dci * 100).toFixed(0)}
          </Text>
          <Text style={[styles.metricLabel, { color: colors.onSurfaceVariant }]}>
            DCI Score
          </Text>
        </View>

        <View style={[styles.metricCard, { backgroundColor: colors.surface }]}>
          <MaterialCommunityIcons name="speedometer" size={24} color={colors.primary} />
          <Text style={[styles.metricValue, { color: colors.onSurface }]}>
            {drain.stressIndex.toFixed(0)}
          </Text>
          <Text style={[styles.metricLabel, { color: colors.onSurfaceVariant }]}>
            Stress Index
          </Text>
        </View>
      </View>

      {/* Additional Info */}
      <View style={[styles.infoSection, { backgroundColor: colors.surface }]}>
        <InfoRow icon="map-marker" label="Basin" value={drain.basinId} colors={colors} />
        <InfoRow icon="layers" label="Zone" value={drain.zoneId} colors={colors} />
        <InfoRow icon="pipe" label="Capacity" value={`${drain.effectiveCapacity.toFixed(0)} L`} colors={colors} />
        <InfoRow icon="alert-rhombus-outline" label="Blockage" value={`${(drain.blockageFactor * 100).toFixed(0)}%`} colors={colors} />
        <InfoRow icon="water-pump" label="Inflow Rate" value={`${drain.inflowRate.toFixed(1)} L/s`} colors={colors} />
        <InfoRow icon="pipe-valve" label="Outflow Rate" value={`${drain.outflowRate.toFixed(1)} L/s`} colors={colors} />
      </View>

      {/* Current Metrics */}
      <View style={[styles.statsSection, { backgroundColor: colors.surface }]}>
        <Text style={[styles.statsTitle, { color: colors.onSurface }]}>
          Current Metrics
        </Text>
        <View style={styles.statsGrid}>
          <StatItem label="DCI Effectiveness" value={`${(drain.currentMetrics.dciEff * 100).toFixed(0)}%`} colors={colors} />
          <StatItem label="Risk Level" value={drain.currentMetrics.riskLevel} colors={colors} />
          <StatItem label="Flow Efficiency" value={`${(drain.currentMetrics.fEff * 100).toFixed(0)}%`} colors={colors} />
          <StatItem label="Length Efficiency" value={`${(drain.currentMetrics.lEff * 100).toFixed(0)}%`} colors={colors} />
        </View>
        {drain.currentMetrics.degradationRateHr !== null && (
          <View style={styles.degradationInfo}>
            <MaterialCommunityIcons name="trending-down" size={16} color={colors.error} />
            <Text style={[styles.degradationText, { color: colors.onSurfaceVariant }]}>
              Degrading at {drain.currentMetrics.degradationRateHr.toFixed(2)}%/hr
            </Text>
          </View>
        )}
      </View>

      {/* 24h Statistics */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
            Loading 24h stats...
          </Text>
        </View>
      ) : stats && stats.totalReadings > 0 ? (
        <View style={[styles.statsSection, { backgroundColor: colors.surface }]}>
          <Text style={[styles.statsTitle, { color: colors.onSurface }]}>
            24 Hour Statistics
          </Text>
          <View style={styles.statsGrid}>
            <StatItem label="Avg Water Level" value={`${stats.avgWaterLevel.toFixed(1)}%`} colors={colors} />
            <StatItem label="Max Level" value={`${stats.maxWaterLevel.toFixed(1)}%`} colors={colors} />
            <StatItem label="Avg Flow Rate" value={`${stats.avgFlowRate.toFixed(1)} L/s`} colors={colors} />
            <StatItem label="Avg Turbidity" value={`${stats.avgTurbidity.toFixed(1)} NTU`} colors={colors} />
          </View>
        </View>
      ) : null}

      {/* Last Update */}
      <Text style={[styles.lastUpdate, { color: colors.onSurfaceVariant }]}>
        Last updated: {formatTimeAgo(drain.lastSensorUpdate)}
      </Text>

      {/* Action Button */}
      {onViewFullDetails && (
        <Pressable
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={onViewFullDetails}
        >
          <Text style={[styles.actionButtonText, { color: colors.onPrimary }]}>
            View Full Details
          </Text>
          <MaterialCommunityIcons name="arrow-right" size={20} color={colors.onPrimary} />
        </Pressable>
      )}
    </ScrollView>
  );
}

function InfoRow({ icon, label, value, colors }: any) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoLeft}>
        <MaterialCommunityIcons name={icon} size={18} color={colors.onSurfaceVariant} />
        <Text style={[styles.infoLabel, { color: colors.onSurfaceVariant }]}>{label}</Text>
      </View>
      <Text style={[styles.infoValue, { color: colors.onSurface }]}>{value}</Text>
    </View>
  );
}

function StatItem({ label, value, colors }: any) {
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, { color: colors.onSurface }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: spacing.md },
  headerLeft: { flex: 1 },
  drainId: { fontSize: 24, fontWeight: "700" },
  drainName: { fontSize: 14, marginTop: 4 },
  closeButton: { padding: spacing.xs },
  statusBadge: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radii.lg, gap: spacing.xs, marginBottom: spacing.lg },
  statusText: { fontSize: 14, fontWeight: "700" },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginBottom: spacing.lg },
  metricCard: { flex: 1, minWidth: "45%", padding: spacing.md, borderRadius: radii.lg, alignItems: "center", gap: spacing.xs },
  metricValue: { fontSize: 28, fontWeight: "700" },
  metricLabel: { fontSize: 12, textAlign: "center" },
  infoSection: { borderRadius: radii.lg, padding: spacing.md, marginBottom: spacing.lg, gap: spacing.sm },
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: spacing.xs },
  infoLeft: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  infoLabel: { fontSize: 14 },
  infoValue: { fontSize: 14, fontWeight: "600" },
  statsSection: { borderRadius: radii.lg, padding: spacing.md, marginBottom: spacing.lg },
  statsTitle: { fontSize: 16, fontWeight: "700", marginBottom: spacing.md },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  statItem: { flex: 1, minWidth: "45%", alignItems: "center", gap: spacing.xs },
  statValue: { fontSize: 20, fontWeight: "700" },
  statLabel: { fontSize: 12, textAlign: "center" },
  degradationInfo: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.xs, marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.1)" },
  degradationText: { fontSize: 13 },
  loadingContainer: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, paddingVertical: spacing.lg },
  loadingText: { fontSize: 14 },
  lastUpdate: { fontSize: 12, textAlign: "center", marginBottom: spacing.md },
  actionButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: spacing.md, borderRadius: radii.lg, gap: spacing.sm, marginBottom: spacing.lg },
  actionButtonText: { fontSize: 16, fontWeight: "600" },
});
