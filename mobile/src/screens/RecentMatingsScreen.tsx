import { useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from "../lib/theme";
import { fetchDashboard, RecentMating } from "../lib/api";

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function MatingCard({ mating }: { mating: RecentMating }) {
  return (
    <View style={styles.card} data-testid={`card-mating-${mating.friendly_URl}`}>
      <View style={styles.cardHeader}>
        <View style={styles.heartWrap}>
          <Ionicons name="heart" size={16} color="#E11D48" />
        </View>
        <Text style={styles.kennelName} numberOfLines={1}>
          {mating.kennel_name}
        </Text>
        {mating.city ? (
          <View style={styles.cityBadge}>
            <Ionicons name="location-outline" size={11} color={COLORS.textMuted} />
            <Text style={styles.cityText}>{mating.city}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.pairingRow}>
        <View style={styles.dogBlock}>
          <View style={[styles.sexDot, { backgroundColor: "#3B82F6" }]} />
          <Text style={styles.dogName} numberOfLines={2}>
            {mating.sire_name.trim()}
          </Text>
          <Text style={styles.sexLabel}>Sire</Text>
        </View>
        <View style={styles.timesWrap}>
          <Text style={styles.timesSign}>×</Text>
        </View>
        <View style={styles.dogBlock}>
          <View style={[styles.sexDot, { backgroundColor: "#E11D48" }]} />
          <Text style={styles.dogName} numberOfLines={2}>
            {mating.dam_name.trim()}
          </Text>
          <Text style={styles.sexLabel}>Dam</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Ionicons name="calendar-outline" size={13} color={COLORS.textMuted} />
        <Text style={styles.footerText}>{formatDate(mating.mating_date)}</Text>
      </View>
    </View>
  );
}

export default function RecentMatingsScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState<string>("All");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [tempCity, setTempCity] = useState<string>("All");

  const activeFilterCount = cityFilter !== "All" ? 1 : 0;

  const openFilters = () => {
    setTempCity(cityFilter);
    setShowFilterModal(true);
  };

  const applyFilters = () => {
    setCityFilter(tempCity);
    setShowFilterModal(false);
  };

  const resetFilters = () => {
    setTempCity("All");
  };

  const {
    data: dashboard,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["/api/mobile/dashboard"],
    queryFn: fetchDashboard,
  });

  const cities = useMemo(() => {
    if (!dashboard?.recentMatings) return [] as string[];
    const citySet = new Set<string>();
    dashboard.recentMatings.forEach((m) => {
      if (m.city) citySet.add(m.city);
    });
    return [...citySet].sort();
  }, [dashboard]);

  const filtered = useMemo(() => {
    if (!dashboard?.recentMatings) return [];
    let results = dashboard.recentMatings;

    const q = search.trim().toLowerCase();
    if (q) {
      results = results.filter(
        (m) =>
          m.kennel_name.toLowerCase().includes(q) ||
          m.sire_name.toLowerCase().includes(q) ||
          m.dam_name.toLowerCase().includes(q) ||
          (m.city && m.city.toLowerCase().includes(q)),
      );
    }

    if (cityFilter !== "All") {
      results = results.filter((m) => m.city === cityFilter);
    }

    return results;
  }, [dashboard, search, cityFilter]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search by kennel, sire or dam..."
            placeholderTextColor={COLORS.textMuted}
            autoCorrect={false}
            data-testid="input-search-matings"
          />
          {search.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearch("")}
              data-testid="btn-clear-search"
            >
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[
            styles.filterButton,
            activeFilterCount > 0 && styles.filterButtonActive,
          ]}
          onPress={openFilters}
          activeOpacity={0.7}
          data-testid="btn-open-filters"
        >
          <Ionicons
            name="options-outline"
            size={20}
            color={activeFilterCount > 0 ? "#fff" : COLORS.textSecondary}
          />
          {activeFilterCount > 0 && (
            <View style={styles.filterBadgeCount}>
              <Text style={styles.filterBadgeCountText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {activeFilterCount > 0 && (
        <View style={styles.activeFiltersRow}>
          {cityFilter !== "All" && (
            <View style={styles.activeChip}>
              <Text style={styles.activeChipText}>{cityFilter}</Text>
              <TouchableOpacity
                onPress={() => setCityFilter("All")}
                data-testid="btn-remove-city-filter"
              >
                <Ionicons name="close" size={14} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          )}
          <TouchableOpacity
            onPress={() => setCityFilter("All")}
            data-testid="btn-clear-all-filters"
          >
            <Text style={styles.clearAllText}>Clear all</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.countRow}>
        <Text style={styles.count} data-testid="text-mating-count">
          {filtered.length} {filtered.length === 1 ? "mating" : "matings"}
        </Text>
      </View>

      {isLoading ? (
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
          style={{ marginTop: SPACING.xxl }}
          data-testid="loading-matings"
        />
      ) : isError ? (
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={48} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>Failed to load matings</Text>
          <Text style={styles.emptyDesc}>
            Could not connect to the server. Please try again.
          </Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => refetch()}
            data-testid="btn-retry"
          >
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.friendly_URl}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          renderItem={({ item }) => <MatingCard mating={item} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="heart-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>No matings found</Text>
              <Text style={styles.emptyDesc}>
                {search || cityFilter !== "All"
                  ? "Try adjusting your search or filters."
                  : "No matings have been recorded recently."}
              </Text>
            </View>
          }
        />
      )}

      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setShowFilterModal(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity
                onPress={resetFilters}
                data-testid="btn-reset-filters"
              >
                <Text style={styles.resetText}>Reset</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.filterSectionTitle}>City</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterScroll}
              contentContainerStyle={styles.filterOptionsRow}
            >
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  tempCity === "All" && styles.filterOptionActive,
                ]}
                onPress={() => setTempCity("All")}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterOptionText,
                    tempCity === "All" && styles.filterOptionTextActive,
                  ]}
                >
                  All
                </Text>
              </TouchableOpacity>
              {cities.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.filterOption,
                    tempCity === opt && styles.filterOptionActive,
                  ]}
                  onPress={() => setTempCity(opt)}
                  activeOpacity={0.7}
                  data-testid={`filter-city-${opt}`}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      tempCity === opt && styles.filterOptionTextActive,
                    ]}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.applyButton}
              onPress={applyFilters}
              activeOpacity={0.8}
              data-testid="btn-apply-filters"
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterBadgeCount: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  filterBadgeCountText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#fff",
  },
  activeFiltersRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    gap: 8,
    marginBottom: 4,
    flexWrap: "wrap",
  },
  activeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(15,92,58,0.08)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: "rgba(15,92,58,0.15)",
  },
  activeChipText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: "600",
    color: COLORS.primary,
  },
  clearAllText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: "600",
    color: COLORS.textMuted,
    marginLeft: 4,
  },
  countRow: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xs,
  },
  count: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  list: {
    padding: SPACING.lg,
    paddingTop: SPACING.sm,
    gap: 12,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  heartWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "rgba(225,29,72,0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  kennelName: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    fontWeight: "700",
    color: COLORS.text,
  },
  cityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: COLORS.background,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.full,
  },
  cityText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    fontWeight: "500",
  },
  pairingRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },
  dogBlock: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: 10,
    gap: 4,
  },
  sexDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 2,
  },
  dogName: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "600",
    color: COLORS.text,
    lineHeight: 18,
  },
  sexLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: "700",
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 2,
  },
  timesWrap: {
    justifyContent: "center",
    paddingTop: 14,
  },
  timesSign: {
    fontSize: 20,
    fontWeight: "300",
    color: COLORS.textMuted,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  footerText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 60,
    gap: SPACING.sm,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: "600",
    color: COLORS.text,
  },
  emptyDesc: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
    textAlign: "center",
    paddingHorizontal: SPACING.xxl,
  },
  retryBtn: {
    marginTop: SPACING.md,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
  },
  retryText: {
    color: "#fff",
    fontSize: FONT_SIZES.md,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 36,
    paddingTop: 12,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1D5DB",
    alignSelf: "center",
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
  },
  resetText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "600",
    color: COLORS.textMuted,
  },
  filterSectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  filterScroll: {
    marginBottom: 24,
  },
  filterOptionsRow: {
    flexDirection: "row",
    gap: 8,
    paddingRight: 8,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterOptionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterOptionText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  filterOptionTextActive: {
    color: "#fff",
  },
  applyButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  applyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
