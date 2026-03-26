import { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from "../lib/theme";
import { fetchKennels, Kennel } from "../lib/api";
import type { KennelDirectoryStackParamList } from "../navigation/AppNavigator";

type Nav = NativeStackNavigationProp<KennelDirectoryStackParamList, "KennelDirectory">;

function formatYear(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const year = new Date(dateStr).getFullYear();
  return isNaN(year) ? null : String(year);
}

function KennelListItem({
  kennel,
  onPress,
}: {
  kennel: Kennel;
  onPress: () => void;
}) {
  const [imgError, setImgError] = useState(false);
  const hasImage =
    kennel.imageUrl &&
    !kennel.imageUrl.includes("user-not-found") &&
    !imgError;
  const initials = kennel.kennelName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const year = formatYear(kennel.activeSince);

  return (
    <TouchableOpacity
      style={styles.listItem}
      onPress={onPress}
      activeOpacity={0.7}
      data-testid={`card-kennel-${kennel.id}`}
    >
      {hasImage ? (
        <Image
          source={{ uri: kennel.imageUrl }}
          style={styles.avatarImage}
          resizeMode="cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
      )}
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={1}>
          {kennel.kennelName}
        </Text>
        <Text style={styles.itemSub} numberOfLines={1}>
          {kennel.city}, {kennel.country}
        </Text>
        <View style={styles.badges}>
          {year ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Since {year}</Text>
            </View>
          ) : null}
          {kennel.phone ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{kennel.phone}</Text>
            </View>
          ) : null}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
}

export default function KennelDirectoryScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState<string>("All");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [tempCity, setTempCity] = useState<string>("All");
  const [previewKennel, setPreviewKennel] = useState<Kennel | null>(null);
  const [previewImgErr, setPreviewImgErr] = useState(false);

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

  const { data: kennels, isLoading, isError, refetch, isRefetching } =
    useQuery<Kennel[]>({
      queryKey: ["kennels"],
      queryFn: fetchKennels,
    });

  const cities = useMemo(() => {
    if (!kennels) return [] as string[];
    const citySet = new Set<string>();
    kennels.forEach((k) => {
      if (k.city) citySet.add(k.city);
    });
    return [...citySet].sort();
  }, [kennels]);

  const filtered = useMemo(() => {
    if (!kennels) return [];
    const seen = new Set<string>();
    let results = kennels.filter((k) => {
      if (seen.has(k.id)) return false;
      seen.add(k.id);
      return true;
    });

    const q = search.trim().toLowerCase();
    if (q) {
      results = results.filter(
        (k) =>
          k.kennelName.toLowerCase().includes(q) ||
          k.city.toLowerCase().includes(q) ||
          k.location.toLowerCase().includes(q),
      );
    }

    if (cityFilter !== "All") {
      results = results.filter((k) => k.city === cityFilter);
    }

    return results;
  }, [kennels, search, cityFilter]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search by kennel name or city..."
            placeholderTextColor={COLORS.textMuted}
            autoCorrect={false}
            data-testid="input-search-kennels"
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
        <Text style={styles.count} data-testid="text-kennel-count">
          {filtered.length} {filtered.length === 1 ? "kennel" : "kennels"}
        </Text>
      </View>

      {isLoading ? (
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
          style={{ marginTop: SPACING.xxl }}
          data-testid="loading-kennels"
        />
      ) : isError ? (
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={48} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>Failed to load kennels</Text>
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
          keyExtractor={(item, index) => `${item.id}-${index}`}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          renderItem={({ item }) => (
            <KennelListItem
              kennel={item}
              onPress={() => { setPreviewImgErr(false); setPreviewKennel(item); }}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>No kennels found</Text>
              <Text style={styles.emptyDesc}>
                Try adjusting your search or filters.
              </Text>
            </View>
          }
        />
      )}

      <Modal
        visible={!!previewKennel}
        animationType="slide"
        transparent
        onRequestClose={() => setPreviewKennel(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setPreviewKennel(null)} />
          {previewKennel && (() => {
            const hasImg = previewKennel.imageUrl && !previewKennel.imageUrl.includes("user-not-found") && !previewImgErr;
            const initials = previewKennel.kennelName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
            const year = formatYear(previewKennel.activeSince);
            return (
              <View style={styles.modalContent}>
                <View style={styles.modalHandle} />
                <View style={styles.previewHeader}>
                  {hasImg ? (
                    <Image source={{ uri: previewKennel.imageUrl }} style={styles.previewImage} resizeMode="cover" onError={() => setPreviewImgErr(true)} />
                  ) : (
                    <View style={styles.previewAvatar}>
                      <Text style={styles.previewAvatarText}>{initials}</Text>
                    </View>
                  )}
                  <View style={styles.previewHeadInfo}>
                    <Text style={styles.previewName} numberOfLines={2}>{previewKennel.kennelName}</Text>
                    <Text style={styles.previewSub}>{previewKennel.city}, {previewKennel.country}</Text>
                    {year ? (
                      <View style={styles.previewBadgeRow}>
                        <View style={styles.previewBadge}><Text style={styles.previewBadgeText}>Since {year}</Text></View>
                      </View>
                    ) : null}
                  </View>
                </View>
                <View style={styles.previewDivider} />
                <View style={styles.previewGrid}>
                  {[
                    { label: "Location", value: previewKennel.location || null },
                    { label: "Phone", value: previewKennel.phone },
                    { label: "Email", value: previewKennel.email },
                    { label: "Description", value: previewKennel.description },
                  ].filter(r => r.value).map(r => (
                    <View key={r.label} style={styles.previewRow}>
                      <Text style={styles.previewRowLabel}>{r.label}</Text>
                      <Text style={styles.previewRowValue} numberOfLines={3}>{r.value}</Text>
                    </View>
                  ))}
                </View>
                <TouchableOpacity
                  style={styles.viewProfileBtn}
                  activeOpacity={0.8}
                  onPress={() => { setPreviewKennel(null); navigation.navigate("KennelProfile", { id: previewKennel.id, name: previewKennel.kennelName }); }}
                >
                  <Ionicons name="home" size={16} color="#fff" />
                  <Text style={styles.viewProfileBtnText}>View Kennel Profile</Text>
                </TouchableOpacity>
              </View>
            );
          })()}
        </View>
      </Modal>

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
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.md,
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.full,
    marginRight: SPACING.md,
    backgroundColor: "#E8F5E9",
  },
  avatarText: {
    color: COLORS.primary,
    fontWeight: "600",
    fontSize: FONT_SIZES.sm,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: FONT_SIZES.md,
    fontWeight: "600",
    color: COLORS.text,
  },
  itemSub: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  badges: {
    flexDirection: "row",
    gap: 6,
    marginTop: 4,
    flexWrap: "wrap",
  },
  badge: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  badgeText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
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
  previewHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
    gap: 14,
  },
  previewImage: {
    width: 72,
    height: 72,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: "#E8F5E9",
    flexShrink: 0,
  },
  previewAvatar: {
    width: 72,
    height: 72,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  previewAvatarText: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 22,
  },
  previewHeadInfo: {
    flex: 1,
    justifyContent: "center",
  },
  previewName: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 3,
  },
  previewSub: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  previewBadgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  previewBadge: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  previewBadgeText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  previewDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: 14,
  },
  previewGrid: {
    marginBottom: 20,
    gap: 10,
  },
  previewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  previewRowLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    fontWeight: "500",
    width: 90,
    flexShrink: 0,
  },
  previewRowValue: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
  },
  viewProfileBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: 14,
  },
  viewProfileBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});
