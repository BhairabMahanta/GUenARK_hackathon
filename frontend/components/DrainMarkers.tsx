// components/DrainMarkers.tsx (COMPLETE - WITH ZOOM-BASED SIZING)
import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Mapbox from "@rnmapbox/maps";
import { Drain } from "@/types/drain.types";

interface DrainMarkersProps {
  drains: Drain[];
  selectedDrainId?: number;
  onDrainPress: (drain: Drain) => void;
  getDrainStatusColor: (status: string) => string;
  zoomLevel: number; // ✅ Add zoom level prop
}

const DRAIN_STATUS_COLORS: Record<Drain['status'], string> = {
  safe: "#4ADE80",
  watch: "#60A5FA",
  warning: "#FBBF24",
  critical: "#FB7185",
  offline: "#94A3B8",
};

export const DrainMarkers: React.FC<DrainMarkersProps> = ({
  drains,
  selectedDrainId,
  onDrainPress,
  getDrainStatusColor,
  zoomLevel = 12,
}) => {
  const getDrainIcon = (status: Drain['status']): keyof typeof MaterialCommunityIcons.glyphMap => {
    switch (status) {
      case "critical": return "pipe-leak";
      case "warning": return "pipe-wrench";
      case "watch": return "water-alert";
      case "offline": return "power-plug-off";
      case "safe": return "water-pump";
      default: return "water-pump";
    }
  };

  // ✅ Calculate marker size based on zoom level
  const getMarkerSize = (status: Drain['status'], isSelected: boolean) => {
    // Base size calculation
    let baseSize = 32;
    
    // Zoom-based scaling
    if (zoomLevel < 11) {
      baseSize = 24; // Small when zoomed out
    } else if (zoomLevel < 13) {
      baseSize = 32; // Medium
    } else {
      baseSize = 38; // Large when zoomed in
    }

    // Priority boost for critical/warning
    if (status === "critical" || status === "warning") {
      baseSize += 4;
    }

    // Selected boost
    if (isSelected) {
      baseSize += 6;
    }

    return baseSize;
  };

  // ✅ Filter drains based on zoom level and status priority
  const getVisibleDrains = () => {
    if (zoomLevel < 11) {
      // When zoomed out, only show critical and warning
      return drains.filter(d => 
        d.status === "critical" || 
        d.status === "warning" || 
        d.drainId === selectedDrainId
      );
    }
    // When zoomed in, show all
    return drains;
  };

  const visibleDrains = getVisibleDrains();

  return (
    <>
      {visibleDrains.map((drain) => {
        const statusColor = getDrainStatusColor(drain.status);
        const isSelected = selectedDrainId === drain.drainId;
        const shouldPulse = drain.status === "critical" || drain.status === "warning";
        const iconName = getDrainIcon(drain.status);
        const markerSize = getMarkerSize(drain.status, isSelected);
        const iconSize = Math.floor(markerSize * 0.5);

        return (
          <Mapbox.MarkerView
            key={drain._id}
            id={drain._id}
            coordinate={[
              drain.location.coordinates[0],
              drain.location.coordinates[1],
            ]}
          >
            <Pressable
              style={[
                styles.marker,
                {
                  width: markerSize,
                  height: markerSize,
                  borderRadius: markerSize / 2,
                  backgroundColor: statusColor,
                  borderColor: isSelected ? "#FFFFFF" : "rgba(255,255,255,0.95)",
                  borderWidth: isSelected ? 3 : 2,
                  opacity: zoomLevel < 11 && !shouldPulse ? 0.85 : 1,
                },
                shouldPulse && styles.markerGlow,
              ]}
              onPress={() => onDrainPress(drain)}
            >
              {/* Pulse ring for critical/warning */}
              {shouldPulse && zoomLevel >= 11 && (
                <View style={[
                  styles.pulseRing,
                  {
                    width: markerSize + 12,
                    height: markerSize + 12,
                    borderRadius: (markerSize + 12) / 2,
                    borderColor: statusColor,
                  }
                ]} />
              )}
              
              <MaterialCommunityIcons
                name={iconName}
                size={iconSize}
                color="white"
                style={styles.icon}
              />
              
              {/* Status dot for critical/warning */}
              {shouldPulse && zoomLevel >= 12 && (
                <View style={[
                  styles.statusDot,
                  { backgroundColor: statusColor }
                ]} />
              )}
            </Pressable>
          </Mapbox.MarkerView>
        );
      })}
    </>
  );
};

const styles = StyleSheet.create({
  marker: {
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  markerGlow: {
    shadowColor: "#EF4444",
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 10,
  },
  pulseRing: {
    position: "absolute",
    borderWidth: 2,
    opacity: 0.3,
  },
  icon: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  statusDot: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 4,
  },
});

export { DRAIN_STATUS_COLORS };
