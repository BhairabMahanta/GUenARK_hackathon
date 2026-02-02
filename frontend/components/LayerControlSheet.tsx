// components/LayerControlSheet.tsx (ADD SCROLL TRACKING)
import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { MaterialSymbol, MaterialSymbolName } from "@/components/MaterialSymbol";
import { useTheme } from "@/theme/ThemeContext";
import { spacing, radii } from "@/theme/shapes";

interface SubLayer {
  id: string;
  name: string;
  color: string;
  enabled: boolean;
  parentId: string;
}

interface Layer {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category?: string;
  enabled: boolean;
  subLayers?: SubLayer[];
}

interface LayerControlSheetProps {
  layers: Layer[];
  onToggleLayer: (layerId: string) => void;
  onToggleSubLayer?: (layerId: string, subLayerId: string) => void;
  onClose: () => void;
  onScrollOffsetChange?: (offset: number) => void; // ✅ ADD THIS
}

export const LayerControlSheet: React.FC<LayerControlSheetProps> = ({
  layers,
  onToggleLayer,
  onToggleSubLayer,
  onClose,
  onScrollOffsetChange, // ✅ ADD THIS
}) => {
  const { colors } = useTheme();
  const [expandedLayers, setExpandedLayers] = useState<Set<string>>(new Set());

  const toggleExpanded = (layerId: string) => {
    setExpandedLayers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(layerId)) {
        newSet.delete(layerId);
      } else {
        newSet.add(layerId);
      }
      return newSet;
    });
  };

  const renderSubLayers = (layer: Layer) => {
    if (!layer.subLayers || layer.subLayers.length === 0) return null;
    if (!layer.enabled) return null;
    if (!expandedLayers.has(layer.id)) return null;

    return (
      <View style={styles.subLayersContainer}>
        {layer.subLayers.map((subLayer) => (
          <Pressable
            key={subLayer.id}
            style={[
              styles.subLayerItem,
              {
                backgroundColor: subLayer.enabled
                  ? `${subLayer.color}10`
                  : colors.surface,
                borderLeftColor: subLayer.color,
                borderLeftWidth: 3,
              },
            ]}
            onPress={() => onToggleSubLayer?.(layer.id, subLayer.id)}
          >
            <View
              style={[
                styles.colorDot,
                {
                  backgroundColor: subLayer.enabled
                    ? subLayer.color
                    : colors.outline,
                },
              ]}
            />
            <Text
              style={[
                styles.subLayerName,
                {
                  color: subLayer.enabled
                    ? colors.onSurface
                    : colors.onSurfaceVariant,
                  fontWeight: subLayer.enabled ? "600" : "500",
                },
              ]}
            >
              {subLayer.name}
            </Text>
            <View
              style={[
                styles.subToggle,
                {
                  backgroundColor: subLayer.enabled
                    ? subLayer.color
                    : colors.outline,
                },
              ]}
            >
              {subLayer.enabled && (
                <MaterialSymbol name="check" size={14} color="#FFFFFF" />
              )}
            </View>
          </Pressable>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.onSurface }]}>
          Map Layers
        </Text>
        <Pressable
          onPress={onClose}
          style={[
            styles.closeButton,
            { backgroundColor: `${colors.primary}15` },
          ]}
        >
          <MaterialSymbol name="close" size={20} color={colors.primary} />
        </Pressable>
      </View>

      <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
        Toggle layers to customize your map view
      </Text>

      {/* ✅ TRACK SCROLL POSITION */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.layerList}
        onScroll={(event) => {
          onScrollOffsetChange?.(event.nativeEvent.contentOffset.y);
        }}
        scrollEventThrottle={16}
      >
        {layers.map((layer) => (
          <View key={layer.id}>
            <Pressable
              style={[
                styles.layerItem,
                {
                  backgroundColor: layer.enabled
                    ? `${layer.color}15`
                    : colors.surface,
                  borderColor: layer.enabled ? layer.color : colors.outline,
                  borderWidth: 1.5,
                },
              ]}
              onPress={() => onToggleLayer(layer.id)}
            >
              <View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor: layer.enabled
                      ? layer.color
                      : colors.onSurfaceVariant,
                  },
                ]}
              >
                <MaterialSymbol name={layer.icon as MaterialSymbolName} size={24} color="#FFFFFF" />
              </View>

              <View style={styles.layerInfo}>
                <View style={styles.layerHeader}>
                  <Text
                    style={[
                      styles.layerName,
                      {
                        color: layer.enabled
                          ? colors.onSurface
                          : colors.onSurfaceVariant,
                        fontWeight: layer.enabled ? "700" : "600",
                      },
                    ]}
                  >
                    {layer.name}
                  </Text>
                  
                  {layer.subLayers && layer.subLayers.length > 0 && layer.enabled && (
                    <Pressable
                      style={styles.expandButtonInline}
                      onPress={(e) => {
                        e.stopPropagation();
                        toggleExpanded(layer.id);
                      }}
                      hitSlop={8}
                    >
                      <Text style={{ fontSize: 16, color: colors.onSurfaceVariant }}>
                        {expandedLayers.has(layer.id) ? "▲" : "▼"}
                      </Text>
                    </Pressable>
                  )}
                </View>
                
                <Text
                  style={[
                    styles.layerDescription,
                    { color: colors.onSurfaceVariant },
                  ]}
                >
                  {layer.description}
                </Text>
                
                {layer.subLayers && layer.subLayers.length > 0 && (
                  <Text
                    style={[
                      styles.subLayerBadge,
                      { color: layer.enabled ? layer.color : colors.onSurfaceVariant },
                    ]}
                  >
                    {layer.subLayers.filter(s => s.enabled).length}/{layer.subLayers.length} active
                  </Text>
                )}
              </View>

              <View
                style={[
                  styles.toggle,
                  {
                    backgroundColor: layer.enabled ? layer.color : colors.outline,
                  },
                ]}
              >
                {layer.enabled && (
                  <MaterialSymbol name="check" size={18} color="#FFFFFF" />
                )}
              </View>
            </Pressable>

            {renderSubLayers(layer)}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

// ... rest of styles remain the same
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  title: { fontSize: 24, fontWeight: "700", letterSpacing: 0.5 },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  subtitle: { fontSize: 14, marginBottom: spacing.lg },
  scrollView: { flex: 1 },
  layerList: { gap: spacing.md, paddingBottom: spacing.xl },
  layerItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: radii.lg,
    gap: spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  layerInfo: { flex: 1 },
  layerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  layerName: { fontSize: 16, marginBottom: 2 },
  layerDescription: { fontSize: 12 },
  subLayerBadge: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 4,
  },
  expandButtonInline: {
    padding: 2,
    marginLeft: 4,
  },
  toggle: {
    width: 28,
    height: 28,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  subLayersContainer: {
    marginTop: spacing.sm,
    marginLeft: spacing.xl + spacing.md,
    gap: spacing.xs,
    paddingBottom: spacing.xs,
  },
  subLayerItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.sm,
    paddingLeft: spacing.md,
    borderRadius: radii.md,
    gap: spacing.sm,
  },
  colorDot: { width: 12, height: 12, borderRadius: 6 },
  subLayerName: { flex: 1, fontSize: 14 },
  subToggle: {
    width: 22,
    height: 22,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
});
