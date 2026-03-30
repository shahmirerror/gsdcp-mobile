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
import { fetchBreeders, Breeder } from "../lib/api";
import type { BreedersStackParamList } from "../navigation/AppNavigator";

type Nav = NativeStackNavigationProp<BreedersStackParamList, "BreederDirectory">;

function formatYear(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const year = new Date(dateStr).getFullYear();
  return isNaN(year) ? null : String(year);
}

function BreederListItem({ breeder, onPress }: { breeder: Breeder; onPress: () => void }) {
  const hasImage =
    breeder.imageUrl &&
    !breeder.imageUrl.includes("user-not-found");
  const initials = (breeder.name || "?")
    .split(" ")
    .map((w) => w[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";
  const year = formatYear(breeder.activeSince);

  return (
    <TouchableOpacity style={styles.listItem} onPress={onPress} activeOpacity={0.7} data-testid={`card-breeder-${breeder.id}`}>
      {hasImage ? (
        <Image source={{ uri: breeder.imageUrl }} style={styles.avatarImage} resizeMode="cover" />
      ) : (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
      )}
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={1}>{breeder.name}</Text>
        <Text style={styles.itemSub} numberOfLines={1}>{breeder.kennelName}</Text>
        <View style={styles.badges}>
          {breeder.totalLitters > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{breeder.totalLitters} litters</Text>
            </View>
          )}
          {breeder.location ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{breeder.location}</Text>
            </View>
          ) : null}
          {breeder.breederType ? (
            <View style={[styles.badge, styles.badgeTier]}>
              <Text style={[styles.badgeText, styles.badgeTierText]}>{breeder.breederType}</Text>
            </View>
          ) : null}
          {year ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Since {year}</Text>
            </View>
          ) : null}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
}

export default function BreederDirectoryScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState<string>("All");
  const [countryFilter, setCountryFilter] = useState<string>("All");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [tempCity, setTempCity] = useState<string>("All");
  const [tempCountry, setTempCountry] = useState<string>("All");
  const [selectedBreeder, setSelectedBreeder] = useState<Breeder | null>(null);

  const activeFilterCount =
    (cityFilter !== "All" ? 1 : 0) + (countryFilter !== "All" ? 1 : 0);

  const openFilters = () => {
    setTempCity(cityFilter);
    setTempCountry(countryFilter);
    setShowFilterModal(true);
  };

  const applyFilters = () => {
    setCityFilter(tempCity);
    setCountryFilter(tempCountry);
    setShowFilterModal(false);
  };

  const resetFilters = () => {
    setTempCity("All");
    setTempCountry("All");
  };

  const { data: breeders, isLoading, isError, refetch, isRefetching } = useQuery<Breeder[]>({
    queryKey: ["breeders"],
    queryFn: fetchBreeders,
  });

  const { countries, cities } = useMemo(() => {
    if (!breeders) return { countries: [] as string[], cities: [] as string[] };
    const countrySet = new Set<string>();
    const citySet = new Set<string>();
    breeders.forEach((b) => {
      if (b.country) countrySet.add(b.country);
      if (b.city) citySet.add(b.city);
    });
    return {
      countries: [...countrySet].sort(),
      cities: [...citySet].sort(),
    };
  }, [breeders]);

  const filteredCities = useMemo(() => {
    if (tempCountry === "All") return cities;
    if (!breeders) return [];
    const citySet = new Set<string>();
    breeders.forEach((b) => {
      if (b.country === tempCountry && b.city) citySet.add(b.city);
    });
    return [...citySet].sort();
  }, [breeders, cities, tempCountry]);

  const filtered = useMemo(() => {
    if (!breeders) return [];
    let results = breeders;

    const q = search.trim().toLowerCase();
    if (q) {
      results = results.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.kennelName.toLowerCase().includes(q) ||
          (b.location && b.location.toLowerCase().includes(q)),
      );
    }

    if (countryFilter !== "All") {
      results = results.filter((b) => b.country === countryFilter);
    }

    if (cityFilter !== "All") {
      results = results.filter((b) => b.city === cityFilter);
    }

    return results;
  }, [breeders, search, countryFilter, cityFilter]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name, kennel, location..."
            placeholderTextColor={COLORS.textMuted}
            autoCorrect={false}
            data-testid="input-search-breeders"
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
          {countryFilter !== "All" && (
            <View style={styles.activeChip}>
              <Text style={styles.activeChipText}>{countryFilter}</Text>
              <TouchableOpacity onPress={() => setCountryFilter("All")} data-testid="btn-remove-country-filter">
                <Ionicons name="close" size={14} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          )}
          {cityFilter !== "All" && (
            <View style={styles.activeChip}>
              <Text style={styles.activeChipText}>{cityFilter}</Text>
              <TouchableOpacity onPress={() => setCityFilter("All")} data-testid="btn-remove-city-filter">
                <Ionicons name="close" size={14} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          )}
          <TouchableOpacity
            onPress={() => { setCityFilter("All"); setCountryFilter("All"); }}
            data-testid="btn-clear-all-filters"
          >
            <Text style={styles.clearAllText}>Clear all</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.countRow}>
        <Text style={styles.count} data-testid="text-breeder-count">
          {filtered.length} {filtered.length === 1 ? "breeder" : "breeders"}
        </Text>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: SPACING.xxl }} data-testid="loading-breeders" />
      ) : isError ? (
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={48} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>Failed to load breeders</Text>
          <Text style={styles.emptyDesc}>Could not connect to the server. Please try again.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()} data-testid="btn-retry">
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.primary} colors={[COLORS.primary]} />
          }
          renderItem={({ item }) => (
            <BreederListItem
              breeder={item}
              onPress={() => setSelectedBreeder(item)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>No breeders found</Text>
              <Text style={styles.emptyDesc}>Try adjusting your search or filters.</Text>
            </View>
          }
        />
      )}

      {/* Breeder Quick-View Popup */}
      <Modal
        visible={!!selectedBreeder}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedBreeder(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setSelectedBreeder(null)} />
          {selectedBreeder && (() => {
            const b = selectedBreeder;
            const hasImg = b.imageUrl && !b.imageUrl.includes("user-not-found");
            const hasKennelImg = b.kennelImage && !b.kennelImage.includes("user-not-found");
            const popupInitials = (b.name || "?")
              .split(" ")
              .map((w) => w[0] ?? "")
              .join("")
              .slice(0, 2)
              .toUpperCase() || "?";
            return (
              <View style={styles.popupContent}>
                <View style={styles.modalHandle} />

                {/* Kennel Row — tappable link to profile */}
                <Text style={styles.popupRowLabel}>Kennel</Text>
                <TouchableOpacity
                  style={styles.popupRow}
                  activeOpacity={0.7}
                  onPress={() => {
                    setSelectedBreeder(null);
                    navigation.navigate("BreederProfile", { id: b.memberId, name: b.kennelName || b.name, breederData: b });
                  }}
                >
                  {hasKennelImg ? (
                    <Image source={{ uri: b.kennelImage }} style={styles.popupAvatar} resizeMode="cover" />
                  ) : (
                    <View style={styles.popupAvatarFallback}>
                      <Ionicons name="home-outline" size={28} color={COLORS.primary} />
                    </View>
                  )}
                  <View style={styles.popupHeaderInfo}>
                    <Text style={[styles.popupName, styles.popupLink]}>{b.kennelName || "—"}</Text>
                    {b.city ? <Text style={styles.popupKennel}>{b.city}</Text> : null}
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={COLORS.primary} />
                </TouchableOpacity>

                <View style={styles.popupDivider} />

                {/* Breeder Row — tappable link to member profile */}
                <Text style={styles.popupRowLabel}>Breeder</Text>
                <TouchableOpacity
                  style={styles.popupRow}
                  activeOpacity={0.7}
                  onPress={() => {
                    setSelectedBreeder(null);
                    navigation.navigate("BreederProfile", { id: b.memberId, name: b.name, breederData: b });
                  }}
                >
                  {hasImg ? (
                    <Image source={{ uri: b.imageUrl }} style={styles.popupAvatar} resizeMode="cover" />
                  ) : (
                    <View style={styles.popupAvatarFallback}>
                      <Text style={styles.popupAvatarText}>{popupInitials}</Text>
                    </View>
                  )}
                  <View style={styles.popupHeaderInfo}>
                    <Text style={[styles.popupName, styles.popupLink]}>{b.name || "—"}</Text>
                    <View style={styles.popupBreederMeta}>
                      {b.totalLitters > 0 ? (
                        <Text style={styles.popupKennel}>{b.totalLitters} litters</Text>
                      ) : null}
                      {b.breederType ? (
                        <View style={[styles.badge, styles.badgeTier]}>
                          <Text style={[styles.badgeText, styles.badgeTierText]}>{b.breederType}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={COLORS.primary} />
                </TouchableOpacity>

                <View style={styles.popupDivider} />

                {/* Extra contact info */}
                {(b.phone || b.email) ? (
                  <View style={styles.popupInfoGrid}>
                    {b.phone ? (
                      <View style={styles.popupInfoRow}>
                        <Ionicons name="call-outline" size={16} color={COLORS.primary} />
                        <Text style={styles.popupInfoText}>{b.phone}</Text>
                      </View>
                    ) : null}
                    {b.email ? (
                      <View style={styles.popupInfoRow}>
                        <Ionicons name="mail-outline" size={16} color={COLORS.primary} />
                        <Text style={styles.popupInfoText}>{b.email}</Text>
                      </View>
                    ) : null}
                  </View>
                ) : null}

                {/* Actions */}
                <View style={styles.popupActions}>
                  <TouchableOpacity
                    style={styles.popupBtnOutline}
                    onPress={() => setSelectedBreeder(null)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.popupBtnOutlineText}>Close</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.popupBtnPrimary}
                    activeOpacity={0.8}
                    onPress={() => {
                      setSelectedBreeder(null);
                      navigation.navigate("BreederProfile", { id: b.memberId, name: b.name, breederData: b });
                    }}
                  >
                    <Text style={styles.popupBtnPrimaryText}>View Full Profile</Text>
                    <Ionicons name="arrow-forward" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
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
          <Pressable style={styles.modalBackdrop} onPress={() => setShowFilterModal(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity onPress={resetFilters} data-testid="btn-reset-filters">
                <Text style={styles.resetText}>Reset</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.filterSectionTitle}>Country</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterOptionsRow}>
              <TouchableOpacity
                style={[styles.filterOption, tempCountry === "All" && styles.filterOptionActive]}
                onPress={() => { setTempCountry("All"); setTempCity("All"); }}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterOptionText, tempCountry === "All" && styles.filterOptionTextActive]}>All</Text>
              </TouchableOpacity>
              {countries.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.filterOption, tempCountry === opt && styles.filterOptionActive]}
                  onPress={() => { setTempCountry(opt); setTempCity("All"); }}
                  activeOpacity={0.7}
                  data-testid={`filter-country-${opt}`}
                >
                  <Text style={[styles.filterOptionText, tempCountry === opt && styles.filterOptionTextActive]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.filterSectionTitle}>City</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterOptionsRow}>
              <TouchableOpacity
                style={[styles.filterOption, tempCity === "All" && styles.filterOptionActive]}
                onPress={() => setTempCity("All")}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterOptionText, tempCity === "All" && styles.filterOptionTextActive]}>All</Text>
              </TouchableOpacity>
              {filteredCities.map((opt) => (
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
  badgeTier: {
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FCD34D",
  },
  badgeTierText: {
    color: "#92400E",
    fontWeight: "700",
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
  popupLink: {
    color: COLORS.primary,
    textDecorationLine: "underline",
  },
  popupBreederMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    flexWrap: "wrap",
  },
  popupRowLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  popupRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },
  popupDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  popupContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 12,
  },
  popupHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  popupAvatar: {
    width: 72,
    height: 72,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: "#E8F5E9",
  },
  popupAvatarFallback: {
    width: 72,
    height: 72,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
  },
  popupAvatarText: {
    fontSize: 26,
    fontWeight: "700",
    color: COLORS.primary,
  },
  popupHeaderInfo: {
    flex: 1,
    justifyContent: "center",
  },
  popupName: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
  },
  popupKennel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  popupKennelImage: {
    width: "100%",
    height: 140,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    backgroundColor: "#F3F4F6",
  },
  popupInfoGrid: {
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  popupInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  popupInfoText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    flex: 1,
  },
  popupActions: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  popupBtnOutline: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  popupBtnOutlineText: {
    fontSize: FONT_SIZES.md,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  popupBtnPrimary: {
    flex: 2,
    flexDirection: "row",
    paddingVertical: 13,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  popupBtnPrimaryText: {
    fontSize: FONT_SIZES.md,
    fontWeight: "700",
    color: "#fff",
  },
});
