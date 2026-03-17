import { useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from "../lib/theme";
import { fetchShows, Show } from "../lib/api";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatDate(dateStr: string): string {
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const day = parseInt(parts[2], 10);
  const monthIndex = parseInt(parts[1], 10) - 1;
  const year = parts[0];
  if (monthIndex < 0 || monthIndex > 11) return dateStr;
  return `${day} ${MONTHS[monthIndex]} ${year}`;
}

function formatDateRange(dates: string[]): string {
  if (!dates || dates.length === 0) return "TBA";
  if (dates.length === 1) return formatDate(dates[0]);
  return `${formatDate(dates[0])} - ${formatDate(dates[dates.length - 1])}`;
}

const EVENT_TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Show: "trophy",
  "Endurance Test": "fitness",
  "Breed Survey": "clipboard",
  Meeting: "people",
};

const EVENT_TYPE_COLORS: Record<string, string> = {
  Show: COLORS.accent,
  "Endurance Test": "#3B82F6",
  "Breed Survey": "#8B5CF6",
  Meeting: "#10B981",
};

const STATUS_TABS = ["All", "Upcoming", "Current", "Past"] as const;

export default function ShowsScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [typeFilter, setTypeFilter] = useState<string>("All");

  const { data: shows, isLoading, isError, refetch, isRefetching } = useQuery<Show[]>({
    queryKey: ["shows"],
    queryFn: fetchShows,
  });

  const eventTypes = useMemo(() => {
    if (!shows) return [];
    return ["All", ...new Set(shows.map((s) => s.event_type))];
  }, [shows]);

  const filtered = useMemo(() => {
    if (!shows) return [];
    return shows.filter((s) => {
      if (statusFilter !== "All" && s.status !== statusFilter) return false;
      if (typeFilter !== "All" && s.event_type !== typeFilter) return false;
      return true;
    });
  }, [shows, statusFilter, typeFilter]);

  const renderItem = ({ item }: { item: Show }) => {
    const color = EVENT_TYPE_COLORS[item.event_type] || COLORS.accent;
    const icon = EVENT_TYPE_ICONS[item.event_type] || "calendar";
    const isActive = item.status === "Current" || item.status === "Upcoming";

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => navigation.navigate("ShowDetail", { id: item.id, name: item.name })}
        data-testid={`card-show-${item.id}`}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconWrap, { backgroundColor: `${color}18` }]}>
            <Ionicons name={icon} size={20} color={color} />
          </View>
          <View style={styles.cardHeaderText}>
            <Text style={styles.showName} numberOfLines={2} data-testid={`text-show-name-${item.id}`}>
              {item.name}
            </Text>
            <View style={styles.typeBadge}>
              <Text style={[styles.typeBadgeText, { color }]}>{item.event_type}</Text>
            </View>
          </View>
          <View style={[styles.statusDot, { backgroundColor: isActive ? "#22C55E" : "#9CA3AF" }]} />
        </View>

        <View style={styles.cardBody}>
          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={14} color={COLORS.textMuted} />
            <Text style={styles.metaText}>{formatDateRange(item.dates)}</Text>
          </View>
          {item.location && (
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={14} color={COLORS.textMuted} />
              <Text style={styles.metaText} numberOfLines={1}>{item.location}</Text>
            </View>
          )}
          <View style={styles.cardFooter}>
            {item.judges.length > 0 && (
              <View style={styles.metaRow}>
                <Ionicons name="person-outline" size={14} color={COLORS.textMuted} />
                <Text style={styles.metaText} numberOfLines={1}>
                  {item.judges.map((j) => j.full_name).join(", ")}
                </Text>
              </View>
            )}
            <View style={styles.entryBadge}>
              <Ionicons name="paw" size={12} color={COLORS.primary} />
              <Text style={styles.entryText}>{item.entryCount}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Failed to load shows</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()} data-testid="btn-retry">
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.header} data-testid="text-shows-header">Shows & Events</Text>

      <View style={styles.filterRow}>
        {STATUS_TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.filterPill, statusFilter === tab && styles.filterPillActive]}
            onPress={() => setStatusFilter(tab)}
            data-testid={`btn-filter-${tab.toLowerCase()}`}
          >
            <Text style={[styles.filterPillText, statusFilter === tab && styles.filterPillTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.typeFilterRow}>
        <FlatList
          data={eventTypes}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.typePill, typeFilter === item && styles.typePillActive]}
              onPress={() => setTypeFilter(item)}
              data-testid={`btn-type-${item.toLowerCase().replace(/\s/g, "-")}`}
            >
              <Text style={[styles.typePillText, typeFilter === item && styles.typePillTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.primary} colors={[COLORS.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="trophy-outline" size={32} color={COLORS.primary} />
            </View>
            <Text style={styles.emptyTitle}>No Shows Found</Text>
            <Text style={styles.emptyDesc}>No shows match your current filters.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
    gap: SPACING.md,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
  },
  retryText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  header: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  filterPillTextActive: {
    color: "#fff",
  },
  typeFilterRow: {
    paddingLeft: SPACING.lg,
    marginBottom: SPACING.md,
  },
  typePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: "transparent",
    marginRight: SPACING.sm,
  },
  typePillActive: {
    backgroundColor: `${COLORS.accent}20`,
  },
  typePillText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textMuted,
  },
  typePillTextActive: {
    color: COLORS.accent,
  },
  list: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
    gap: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: SPACING.lg,
    paddingBottom: SPACING.sm,
    gap: SPACING.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  cardHeaderText: {
    flex: 1,
    gap: 4,
  },
  showName: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
    lineHeight: 20,
  },
  typeBadge: {
    alignSelf: "flex-start",
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  cardBody: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    gap: 6,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    flex: 1,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  entryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: `${COLORS.primary}10`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
  },
  entryText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 64,
    gap: 8,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: `${COLORS.primary}12`,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },
  emptyDesc: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: "center",
  },
});
