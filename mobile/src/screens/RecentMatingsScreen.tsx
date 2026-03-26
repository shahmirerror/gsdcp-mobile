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
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from "../lib/theme";
import { fetchRecentMatings, RecentMating } from "../lib/api";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function parseMatingDate(dateStr: string): { day: string; month: string; year: string; full: string } {
  const parts = dateStr.split("-");
  if (parts.length !== 3) return { day: "?", month: "???", year: "?", full: dateStr };
  const day = parseInt(parts[2], 10);
  const monthIdx = parseInt(parts[1], 10) - 1;
  const year = parts[0];
  return {
    day: String(day),
    month: MONTHS[monthIdx] ?? "???",
    year,
    full: `${day} ${MONTHS[monthIdx]} ${year}`,
  };
}

function MatingRow({ mating, onPress }: {
  mating: RecentMating;
  onPress: () => void;
}) {
  const date = parseMatingDate(mating.mating_date);
  return (
    <TouchableOpacity style={styles.listItem} onPress={onPress} activeOpacity={0.7} data-testid={`card-mating-${mating.id}`}>
      <View style={styles.dateBlock}>
        <Text style={styles.dateDay}>{date.day}</Text>
        <Text style={styles.dateMonth}>{date.month}</Text>
        <Text style={styles.dateYear}>{date.year}</Text>
      </View>

      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={1}>{mating.kennel_name}</Text>

        <View style={styles.dogRow}>
          <Text style={styles.dogLabel}>S</Text>
          <Text style={styles.dogName} numberOfLines={1}>{mating.sire_name.trim()}</Text>
        </View>

        <View style={styles.dogRow}>
          <Text style={styles.dogLabel}>D</Text>
          <Text style={styles.dogName} numberOfLines={1}>{mating.dam_name.trim()}</Text>
        </View>

        <View style={styles.badges}>
          {mating.city ? (
            <View style={styles.badge}>
              <Ionicons name="location-outline" size={10} color={COLORS.textMuted} />
              <Text style={styles.badgeText}>{mating.city}</Text>
            </View>
          ) : null}
          {mating.litter_on_ground && (
            <View style={[styles.badge, styles.litterBadge]}>
              <Ionicons name="paw" size={10} color="#fff" />
              <Text style={styles.litterBadgeText}>Litter on Ground</Text>
            </View>
          )}
        </View>
      </View>

      <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
}

export default function RecentMatingsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState<string>("All");
  const [litterFilter, setLitterFilter] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [tempCity, setTempCity] = useState<string>("All");
  const [tempLitter, setTempLitter] = useState(false);
  const [previewMating, setPreviewMating] = useState<RecentMating | null>(null);

  const activeFilterCount = (cityFilter !== "All" ? 1 : 0) + (litterFilter ? 1 : 0);

  const openFilters = () => {
    setTempCity(cityFilter);
    setTempLitter(litterFilter);
    setShowFilterModal(true);
  };

  const applyFilters = () => {
    setCityFilter(tempCity);
    setLitterFilter(tempLitter);
    setShowFilterModal(false);
  };

  const resetFilters = () => {
    setTempCity("All");
    setTempLitter(false);
  };

  const { data: matings, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["/api/mobile/recent-matings"],
    queryFn: fetchRecentMatings,
  });

  const cities = useMemo(() => {
    if (!matings) return [] as string[];
    const citySet = new Set<string>();
    matings.forEach((m) => { if (m.city) citySet.add(m.city); });
    return [...citySet].sort();
  }, [matings]);

  const filtered = useMemo(() => {
    if (!matings) return [];
    let results = matings;
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
    if (cityFilter !== "All") results = results.filter((m) => m.city === cityFilter);
    if (litterFilter) results = results.filter((m) => m.litter_on_ground === true);
    return results;
  }, [matings, search, cityFilter, litterFilter]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Search + filter row */}
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
            <TouchableOpacity onPress={() => setSearch("")} data-testid="btn-clear-search">
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.filterButton, activeFilterCount > 0 && styles.filterButtonActive]}
          onPress={openFilters}
          activeOpacity={0.7}
          data-testid="btn-open-filters"
        >
          <Ionicons name="options-outline" size={20} color={activeFilterCount > 0 ? "#fff" : COLORS.textSecondary} />
          {activeFilterCount > 0 && (
            <View style={styles.filterBadgeCount}>
              <Text style={styles.filterBadgeCountText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <View style={styles.activeFiltersRow}>
          {cityFilter !== "All" && (
            <View style={styles.activeChip}>
              <Text style={styles.activeChipText}>{cityFilter}</Text>
              <TouchableOpacity onPress={() => setCityFilter("All")} data-testid="btn-remove-city-filter">
                <Ionicons name="close" size={14} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          )}
          {litterFilter && (
            <View style={[styles.activeChip, styles.activeChipGreen]}>
              <Ionicons name="paw" size={11} color="#fff" />
              <Text style={styles.activeChipTextWhite}>Litter on Ground</Text>
              <TouchableOpacity onPress={() => setLitterFilter(false)} data-testid="btn-remove-litter-filter">
                <Ionicons name="close" size={14} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
          <TouchableOpacity
            onPress={() => { setCityFilter("All"); setLitterFilter(false); }}
            data-testid="btn-clear-all-filters"
          >
            <Text style={styles.clearAllText}>Clear all</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Count row */}
      <View style={styles.countRow}>
        <Text style={styles.count} data-testid="text-mating-count">
          {filtered.length} {filtered.length === 1 ? "mating" : "matings"}
        </Text>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: SPACING.xxl }} data-testid="loading-matings" />
      ) : isError ? (
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={48} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>Failed to load matings</Text>
          <Text style={styles.emptyDesc}>Could not connect to the server. Please try again.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()} data-testid="btn-retry">
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.primary} colors={[COLORS.primary]} />
          }
          renderItem={({ item }) => (
            <MatingRow
              mating={item}
              onPress={() => setPreviewMating(item)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="heart-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>No matings found</Text>
              <Text style={styles.emptyDesc}>
                {search || cityFilter !== "All" || litterFilter
                  ? "Try adjusting your search or filters."
                  : "No matings have been recorded recently."}
              </Text>
            </View>
          }
        />
      )}

      {/* Mating preview modal */}
      <Modal visible={!!previewMating} animationType="slide" transparent onRequestClose={() => setPreviewMating(null)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setPreviewMating(null)} />
          {previewMating && (() => {
            const date = parseMatingDate(previewMating.mating_date);
            return (
              <View style={styles.modalContent}>
                <View style={styles.modalHandle} />

                {/* Header */}
                <View style={styles.previewHeader}>
                  <View style={styles.previewDateBlock}>
                    <Text style={styles.previewDateDay}>{date.day}</Text>
                    <Text style={styles.previewDateMonth}>{date.month}</Text>
                    <Text style={styles.previewDateYear}>{date.year}</Text>
                  </View>
                  <View style={styles.previewHeadInfo}>
                    <Text style={styles.previewName} numberOfLines={2}>{previewMating.kennel_name}</Text>
                    {previewMating.city ? (
                      <View style={styles.previewCityRow}>
                        <Ionicons name="location-outline" size={12} color={COLORS.textMuted} />
                        <Text style={styles.previewCity}>{previewMating.city}</Text>
                      </View>
                    ) : null}
                    {previewMating.litter_on_ground && (
                      <View style={styles.previewLitterBadge}>
                        <Ionicons name="paw" size={11} color="#fff" />
                        <Text style={styles.previewLitterText}>Litter on Ground</Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.previewDivider} />

                {/* Sire row */}
                <TouchableOpacity
                  style={styles.previewDogRow}
                  activeOpacity={0.7}
                  onPress={() => { setPreviewMating(null); navigation.push("DogProfile", { id: previewMating.sire_dog_id, name: previewMating.sire_name.trim() }); }}
                >
                  <View style={styles.previewDogLabelWrap}>
                    <Text style={styles.previewDogLabel}>SIRE</Text>
                  </View>
                  <Text style={styles.previewDogName} numberOfLines={1}>{previewMating.sire_name.trim()}</Text>
                  <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
                </TouchableOpacity>

                <View style={styles.previewRowDivider} />

                {/* Dam row */}
                <TouchableOpacity
                  style={styles.previewDogRow}
                  activeOpacity={0.7}
                  onPress={() => { setPreviewMating(null); navigation.push("DogProfile", { id: previewMating.dam_dog_id, name: previewMating.dam_name.trim() }); }}
                >
                  <View style={styles.previewDogLabelWrap}>
                    <Text style={styles.previewDogLabel}>DAM</Text>
                  </View>
                  <Text style={styles.previewDogName} numberOfLines={1}>{previewMating.dam_name.trim()}</Text>
                  <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
                </TouchableOpacity>

                <View style={[styles.previewDivider, { marginTop: 16 }]} />

                {/* Kennel button */}
                <TouchableOpacity
                  style={styles.viewProfileBtn}
                  activeOpacity={0.8}
                  onPress={() => { setPreviewMating(null); navigation.push("KennelProfile", { id: previewMating.kennel_id, name: previewMating.kennel_name }); }}
                >
                  <Ionicons name="home" size={16} color="#fff" />
                  <Text style={styles.viewProfileBtnText}>View Kennel Profile</Text>
                </TouchableOpacity>
              </View>
            );
          })()}
        </View>
      </Modal>

      {/* Filter modal */}
      <Modal visible={showFilterModal} animationType="slide" transparent onRequestClose={() => setShowFilterModal(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowFilterModal(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity onPress={resetFilters} data-testid="btn-reset-filters">
                <Text style={styles.resetText}>Reset</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.filterSectionTitle}>Status</Text>
            <TouchableOpacity
              style={[styles.litterToggle, tempLitter && styles.litterToggleActive]}
              onPress={() => setTempLitter(!tempLitter)}
              activeOpacity={0.7}
              data-testid="filter-litter-toggle"
            >
              <Ionicons name="paw" size={16} color={tempLitter ? "#fff" : COLORS.primary} />
              <Text style={[styles.litterToggleText, tempLitter && styles.litterToggleTextActive]}>Litter on Ground</Text>
              <View style={[styles.toggleSwitch, tempLitter && styles.toggleSwitchActive]}>
                <View style={[styles.toggleThumb, tempLitter && styles.toggleThumbActive]} />
              </View>
            </TouchableOpacity>

            <Text style={[styles.filterSectionTitle, { marginTop: 20 }]}>City</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterOptionsRow}>
              <TouchableOpacity
                style={[styles.filterOption, tempCity === "All" && styles.filterOptionActive]}
                onPress={() => setTempCity("All")}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterOptionText, tempCity === "All" && styles.filterOptionTextActive]}>All</Text>
              </TouchableOpacity>
              {cities.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.filterOption, tempCity === opt && styles.filterOptionActive]}
                  onPress={() => setTempCity(opt)}
                  activeOpacity={0.7}
                  data-testid={`filter-city-${opt}`}
                >
                  <Text style={[styles.filterOptionText, tempCity === opt && styles.filterOptionTextActive]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.applyButton} onPress={applyFilters} activeOpacity={0.8} data-testid="btn-apply-filters">
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

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
  searchInput: { flex: 1, height: 44, fontSize: FONT_SIZES.md, color: COLORS.text },
  filterButton: {
    width: 44, height: 44, borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    justifyContent: "center", alignItems: "center",
  },
  filterButtonActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterBadgeCount: {
    position: "absolute", top: -4, right: -4,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: COLORS.accent, justifyContent: "center", alignItems: "center",
  },
  filterBadgeCountText: { fontSize: 10, fontWeight: "700", color: "#fff" },

  activeFiltersRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: SPACING.lg, gap: 8, marginBottom: 4, flexWrap: "wrap",
  },
  activeChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(15,92,58,0.08)", paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: BORDER_RADIUS.full, borderWidth: 1, borderColor: "rgba(15,92,58,0.15)",
  },
  activeChipGreen: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  activeChipText: { fontSize: FONT_SIZES.xs, fontWeight: "600", color: COLORS.primary },
  activeChipTextWhite: { fontSize: FONT_SIZES.xs, fontWeight: "600", color: "#fff" },
  clearAllText: { fontSize: FONT_SIZES.xs, fontWeight: "600", color: COLORS.textMuted, marginLeft: 4 },

  countRow: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xs },
  count: { fontSize: FONT_SIZES.sm, color: COLORS.textMuted },

  list: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.xs, paddingBottom: 32, gap: 10 },

  listItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 14,
  },
  dateBlock: {
    width: 44, alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: 8,
    borderWidth: 1, borderColor: COLORS.border,
  },
  dateDay: { fontSize: 18, fontWeight: "800", color: COLORS.primary, lineHeight: 22 },
  dateMonth: { fontSize: 10, fontWeight: "700", color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.4 },
  dateYear: { fontSize: 9, fontWeight: "600", color: COLORS.textMuted, letterSpacing: 0.3, marginTop: 1 },

  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: "700", color: COLORS.text, marginBottom: 2 },

  dogRow: {
    flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6,
  },
  dogLabel: {
    fontSize: 10, fontWeight: "800", color: COLORS.textMuted,
    width: 12, textTransform: "uppercase", letterSpacing: 0.5,
  },

  badges: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  badge: {
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: COLORS.background,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1, borderColor: COLORS.border,
  },
  badgeText: { fontSize: 11, color: COLORS.textMuted, fontWeight: "500" },
  litterBadge: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  litterBadgeText: { fontSize: 11, fontWeight: "700", color: "#fff" },

  emptyState: { alignItems: "center", paddingTop: 60, gap: SPACING.sm },
  emptyTitle: { fontSize: FONT_SIZES.lg, fontWeight: "600", color: COLORS.text },
  emptyDesc: { fontSize: FONT_SIZES.md, color: COLORS.textMuted, textAlign: "center", paddingHorizontal: SPACING.xxl },
  retryBtn: { marginTop: SPACING.md, paddingHorizontal: 20, paddingVertical: 10, borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.primary },
  retryText: { color: "#fff", fontSize: FONT_SIZES.md, fontWeight: "600" },

  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)" },
  modalContent: {
    backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 24, paddingBottom: 36, paddingTop: 12,
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#D1D5DB", alignSelf: "center", marginBottom: 16 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: "700", color: "#0F172A" },
  resetText: { fontSize: FONT_SIZES.sm, fontWeight: "600", color: COLORS.textMuted },
  filterSectionTitle: { fontSize: 13, fontWeight: "700", color: "#64748B", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 },

  litterToggle: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 4, backgroundColor: "#fff",
  },
  litterToggleActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  litterToggleText: { flex: 1, fontSize: FONT_SIZES.md, fontWeight: "600", color: COLORS.primary },
  litterToggleTextActive: { color: "#fff" },
  toggleSwitch: { width: 40, height: 22, borderRadius: 11, backgroundColor: "#D1D5DB", justifyContent: "center", paddingHorizontal: 2 },
  toggleSwitchActive: { backgroundColor: "rgba(255,255,255,0.35)" },
  toggleThumb: { width: 18, height: 18, borderRadius: 9, backgroundColor: "#fff" },
  toggleThumbActive: { alignSelf: "flex-end" },

  filterScroll: { marginBottom: 24 },
  filterOptionsRow: { flexDirection: "row", gap: 8, paddingRight: 8 },
  filterOption: {
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: BORDER_RADIUS.full, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
  },
  filterOptionActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterOptionText: { fontSize: FONT_SIZES.sm, fontWeight: "600", color: COLORS.textSecondary },
  filterOptionTextActive: { color: "#fff" },
  applyButton: { backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md, paddingVertical: 14, alignItems: "center", marginTop: 8 },
  applyButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  previewHeader: { flexDirection: "row", alignItems: "flex-start", marginBottom: 16, gap: 14 },
  previewDateBlock: {
    width: 68, alignItems: "center",
    backgroundColor: `${COLORS.primary}10`,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: 12,
    flexShrink: 0,
  },
  previewDateDay: { fontSize: 24, fontWeight: "800", color: COLORS.primary, lineHeight: 28 },
  previewDateMonth: { fontSize: 11, fontWeight: "700", color: COLORS.primary, textTransform: "uppercase", letterSpacing: 0.4 },
  previewDateYear: { fontSize: 10, fontWeight: "600", color: COLORS.primary, letterSpacing: 0.3, marginTop: 2 },
  previewHeadInfo: { flex: 1, justifyContent: "center" },
  previewName: { fontSize: 17, fontWeight: "700", color: COLORS.text, marginBottom: 4 },
  previewCityRow: { flexDirection: "row", alignItems: "center", gap: 3, marginBottom: 6 },
  previewCity: { fontSize: FONT_SIZES.sm, color: COLORS.textMuted },
  previewLitterBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: COLORS.primary, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: BORDER_RADIUS.full, alignSelf: "flex-start",
  },
  previewLitterText: { fontSize: 11, fontWeight: "700", color: "#fff" },

  previewDivider: { height: 1, backgroundColor: COLORS.border, marginBottom: 4 },
  previewRowDivider: { height: 1, backgroundColor: COLORS.border, marginHorizontal: 4 },

  previewDogRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 14, paddingHorizontal: 4,
  },
  previewDogLabelWrap: {
    width: 38, height: 26,
    backgroundColor: `${COLORS.primary}12`,
    borderRadius: BORDER_RADIUS.sm,
    justifyContent: "center", alignItems: "center",
    flexShrink: 0,
  },
  previewDogLabel: { fontSize: 10, fontWeight: "800", color: COLORS.primary, letterSpacing: 0.6 },
  previewDogName: { flex: 1, fontSize: FONT_SIZES.md, fontWeight: "600", color: COLORS.text },

  viewProfileBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md, paddingVertical: 14,
  },
  viewProfileBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },

  dogName: { flex: 1, fontSize: FONT_SIZES.sm, fontWeight: "500", color: COLORS.text },
});
