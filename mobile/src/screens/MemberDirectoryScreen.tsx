import { useState, useMemo, useCallback, useEffect, useRef, memo } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from "../lib/theme";
import { fetchMembersPage, Member, MembersPage } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import BottomSheetModal from "../components/BottomSheetModal";
import LazyImage from "../components/LazyImage";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function isValidImage(url: string | null): boolean {
  if (!url) return false;
  if (url.includes("user-not-found")) return false;
  if (url.startsWith("https::")) return false;
  return url.startsWith("http");
}

const Separator = memo(() => <View style={styles.separator} />);

const MemberListItem = memo(function MemberListItem({ member, onPress }: { member: Member; onPress: () => void }) {
  const initials = getInitials(member.member_name);
  const hasImage = isValidImage(member.imageUrl);
  return (
    <TouchableOpacity style={styles.listItem} onPress={onPress} activeOpacity={0.7} data-testid={`card-member-${member.id}`}>
      {hasImage ? (
        <LazyImage source={{ uri: member.imageUrl! }} style={styles.avatarImage} resizeMode="cover" />
      ) : (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
      )}

      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={1}>{member.member_name}</Text>
        <Text style={styles.itemSub} numberOfLines={1}>{member.membership_no}</Text>
        <View style={styles.badges}>
          {member.city ? (
            <View style={styles.badge}>
              <Ionicons name="location-outline" size={10} color={COLORS.textMuted} />
              <Text style={styles.badgeText}>{member.city}</Text>
            </View>
          ) : null}
          {member.country ? (
            <View style={styles.badge}>
              <Ionicons name="flag-outline" size={10} color={COLORS.textMuted} />
              <Text style={styles.badgeText}>{member.country}</Text>
            </View>
          ) : null}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
});

const keyExtractor = (item: Member) => item.id;

export default function MemberDirectoryScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [cityFilter, setCityFilter] = useState<string>("All");
  const [countryFilter, setCountryFilter] = useState<string>("All");
  const [typeFilter, setTypeFilter] = useState<"All" | "T-" | "P-">("All");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [tempCity, setTempCity] = useState<string>("All");
  const [tempCountry, setTempCountry] = useState<string>("All");
  const [tempTypeFilter, setTempTypeFilter] = useState<"All" | "T-" | "P-">("All");
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = (text: string) => {
    setSearch(text);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedSearch(text.trim()), 400);
  };

  const clearSearch = () => {
    setSearch("");
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    setDebouncedSearch("");
  };

  useEffect(() => {
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, []);

  const activeFilterCount =
    (cityFilter !== "All" ? 1 : 0) + (countryFilter !== "All" ? 1 : 0) + (typeFilter !== "All" ? 1 : 0);

  const openFilters = () => {
    setTempCity(cityFilter);
    setTempCountry(countryFilter);
    setTempTypeFilter(typeFilter);
    setShowFilterModal(true);
  };

  const applyFilters = () => {
    setCityFilter(tempCity);
    setCountryFilter(tempCountry);
    setTypeFilter(tempTypeFilter);
    setShowFilterModal(false);
  };

  const resetFilters = () => {
    setTempCity("All");
    setTempCountry("All");
    setTempTypeFilter("All");
  };

  const memberType =
    typeFilter === "T-" ? "Temporary" : typeFilter === "P-" ? "Permanent" : undefined;

  const {
    data,
    isLoading,
    isError,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<MembersPage>({
    queryKey: ["members-pages", debouncedSearch, typeFilter],
    queryFn: ({ pageParam }) =>
      fetchMembersPage(pageParam as number, {
        q: debouncedSearch || undefined,
        type: memberType,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage?.pagination?.hasMorePages
        ? lastPage.pagination.currentPage + 1
        : undefined,
  });

  const allMembers = useMemo(() => {
    if (!data) return [];
    return data.pages.flatMap((page) => page.data);
  }, [data]);

  const { countries, cities } = useMemo(() => {
    const countrySet = new Set<string>();
    const citySet = new Set<string>();
    allMembers.forEach((m) => {
      if (m.country) countrySet.add(m.country);
      if (m.city) citySet.add(m.city);
    });
    return { countries: [...countrySet].sort(), cities: [...citySet].sort() };
  }, [allMembers]);

  const filteredCities = useMemo(() => {
    if (tempCountry === "All") return cities;
    const citySet = new Set<string>();
    allMembers.forEach((m) => {
      if (m.country === tempCountry && m.city) citySet.add(m.city);
    });
    return [...citySet].sort();
  }, [allMembers, cities, tempCountry]);

  const filtered = useMemo(() => {
    let results = allMembers;
    if (countryFilter !== "All") {
      results = results.filter((m) => m.country === countryFilter);
    }
    if (cityFilter !== "All") {
      results = results.filter((m) => m.city === cityFilter);
    }
    return results;
  }, [allMembers, countryFilter, cityFilter]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const totalLoaded = allMembers.length;

  const renderItem = useCallback(({ item }: { item: Member }) => (
    <MemberListItem
      member={item}
      onPress={() => {
        if (user && item.id === user.member_id) {
          navigation.navigate("ProfileTab");
        } else {
          navigation.push("MemberProfile", { id: item.id, member: item });
        }
      }}
    />
  ), [user, navigation]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Search + Filter row */}
      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={handleSearchChange}
            placeholder="Search by name, membership no, city..."
            placeholderTextColor={COLORS.textMuted}
            autoCorrect={false}
            data-testid="input-search-members"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={clearSearch} data-testid="btn-clear-search">
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.filterBtn, activeFilterCount > 0 && styles.filterBtnActive]}
          onPress={openFilters}
          activeOpacity={0.7}
          data-testid="btn-filter"
        >
          <Ionicons
            name="options-outline"
            size={18}
            color={activeFilterCount > 0 ? "#fff" : COLORS.textMuted}
          />
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {activeFilterCount > 0 && (
        <View style={styles.activeFiltersRow}>
          {typeFilter !== "All" && (
            <View style={styles.activeChip}>
              <Text style={styles.activeChipText}>
                {typeFilter === "T-" ? "Temporary" : "Permanent"}
              </Text>
              <TouchableOpacity onPress={() => setTypeFilter("All")} data-testid="btn-remove-type-filter">
                <Ionicons name="close" size={14} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          )}
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
            onPress={() => { setTypeFilter("All"); setCountryFilter("All"); setCityFilter("All"); }}
            data-testid="btn-clear-all-filters"
          >
            <Text style={styles.clearAllText}>Clear all</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Results meta */}
      {!isLoading && !isError && (
        <View style={styles.countRow}>
          <Text style={styles.count}>
            {filtered.length} member{filtered.length !== 1 ? "s" : ""}
            {hasNextPage ? ` (${totalLoaded} loaded)` : ""}
          </Text>
        </View>
      )}

      {/* List */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : isError ? (
        <View style={styles.centered}>
          <Ionicons name="cloud-offline-outline" size={40} color={COLORS.textMuted} />
          <Text style={styles.errorText}>Could not load members</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={Separator}
          showsVerticalScrollIndicator={false}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          renderItem={renderItem}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.footerLoaderText}>Loading more members...</Text>
              </View>
            ) : hasNextPage ? (
              <TouchableOpacity style={styles.loadMoreBtn} onPress={() => fetchNextPage()} data-testid="btn-load-more">
                <Text style={styles.loadMoreText}>Load more</Text>
              </TouchableOpacity>
            ) : totalLoaded > 0 ? (
              <Text style={styles.endText}>All {totalLoaded} members loaded</Text>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>No members found</Text>
              <Text style={styles.emptyDesc}>Try adjusting your search or filters</Text>
            </View>
          }
        />
      )}

      {/* Filter Modal */}
      <BottomSheetModal visible={showFilterModal} onClose={() => setShowFilterModal(false)}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filters</Text>
            <TouchableOpacity onPress={resetFilters} data-testid="btn-reset-filters">
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.filterLabel}>Membership Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsContent}>
              {(["All", "T-", "P-"] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.filterChip, tempTypeFilter === t && styles.filterChipActive]}
                  onPress={() => setTempTypeFilter(t)}
                  data-testid={`chip-type-${t}`}
                >
                  <Text style={[styles.filterChipText, tempTypeFilter === t && styles.filterChipTextActive]}>
                    {t === "All" ? "All" : t === "T-" ? "Temporary" : "Permanent"}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.filterLabel, { marginTop: SPACING.md }]}>Country</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsContent}>
              {["All", ...countries].map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.filterChip, tempCountry === c && styles.filterChipActive]}
                  onPress={() => { setTempCountry(c); if (c !== tempCountry) setTempCity("All"); }}
                  data-testid={`chip-country-${c}`}
                >
                  <Text style={[styles.filterChipText, tempCountry === c && styles.filterChipTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.filterLabel, { marginTop: SPACING.md }]}>City</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsContent}>
              {["All", ...filteredCities].map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.filterChip, tempCity === c && styles.filterChipActive]}
                  onPress={() => setTempCity(c)}
                  data-testid={`chip-city-${c}`}
                >
                  <Text style={[styles.filterChipText, tempCity === c && styles.filterChipTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </ScrollView>

          <TouchableOpacity style={styles.applyBtn} onPress={applyFilters} data-testid="btn-apply-filters">
            <Text style={styles.applyBtnText}>Apply Filters</Text>
          </TouchableOpacity>
      </BottomSheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: { flex: 1, height: 44, fontSize: FONT_SIZES.md, color: COLORS.text },
  filterBtn: {
    width: 44, height: 44,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1, borderColor: COLORS.border,
    justifyContent: "center", alignItems: "center",
  },
  filterBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  filterBadge: {
    position: "absolute", top: -4, right: -4,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: COLORS.accent,
    justifyContent: "center", alignItems: "center",
  },
  filterBadgeText: { fontSize: 9, fontWeight: "700", color: "#fff" },
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

  chipsContent: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, gap: SPACING.sm, flexDirection: "row", alignItems: "center" },

  countRow: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xs,
  },
  count: { fontSize: FONT_SIZES.sm, color: COLORS.textMuted },

  list: { paddingTop: SPACING.sm, paddingBottom: SPACING.lg },
  separator: { height: 1, backgroundColor: COLORS.border, marginLeft: 72 },

  listItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    backgroundColor: "#fff",
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "rgba(15,92,59,0.1)",
    justifyContent: "center", alignItems: "center",
    borderWidth: 1.5, borderColor: "rgba(15,92,59,0.15)",
  },
  avatarImage: { width: 44, height: 44, borderRadius: 22 },
  avatarText: { fontSize: 14, fontWeight: "800", color: COLORS.primary },

  itemInfo: { flex: 1 },
  itemName: { fontSize: FONT_SIZES.md, fontWeight: "700", color: COLORS.text },
  itemSub: { fontSize: FONT_SIZES.sm, color: COLORS.textMuted, marginTop: 1 },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 5 },
  badge: {
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: COLORS.background,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1, borderColor: COLORS.border,
  },
  badgeText: { fontSize: 11, color: COLORS.textMuted, fontWeight: "500" },

  footerLoader: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, paddingVertical: 20 },
  footerLoaderText: { fontSize: FONT_SIZES.sm, color: COLORS.textMuted },
  loadMoreBtn: { alignSelf: "center", marginVertical: 16, paddingHorizontal: 24, paddingVertical: 10, borderRadius: BORDER_RADIUS.full, borderWidth: 1, borderColor: COLORS.primary },
  loadMoreText: { fontSize: FONT_SIZES.sm, fontWeight: "600", color: COLORS.primary },
  endText: { textAlign: "center", fontSize: 12, color: COLORS.textMuted, paddingVertical: 20 },

  centered: { flex: 1, justifyContent: "center", alignItems: "center", gap: SPACING.sm },
  errorText: { fontSize: FONT_SIZES.md, color: COLORS.textMuted },
  retryBtn: {
    marginTop: SPACING.sm, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full, backgroundColor: COLORS.primary,
  },
  retryText: { fontSize: FONT_SIZES.sm, fontWeight: "700", color: "#fff" },

  emptyState: { alignItems: "center", paddingTop: 60, gap: SPACING.sm },
  emptyTitle: { fontSize: FONT_SIZES.lg, fontWeight: "600", color: COLORS.text },
  emptyDesc: { fontSize: FONT_SIZES.md, color: COLORS.textMuted, textAlign: "center", paddingHorizontal: SPACING.xxl },

  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.md, paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm },
  modalTitle: { fontSize: FONT_SIZES.lg, fontWeight: "700", color: COLORS.text },
  resetText: { fontSize: FONT_SIZES.sm, color: COLORS.textMuted, fontWeight: "600" },

  filterLabel: { fontSize: 12, fontWeight: "700", color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: SPACING.sm },
  filterChip: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: "#fff",
  },
  filterChipActive: { borderColor: COLORS.primary, backgroundColor: "rgba(15,92,59,0.08)" },
  filterChipText: { fontSize: 13, fontWeight: "500", color: COLORS.textMuted },
  filterChipTextActive: { color: COLORS.primary, fontWeight: "700" },

  applyBtn: {
    marginTop: SPACING.lg,
    marginHorizontal: SPACING.lg,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: 14,
    alignItems: "center",
  },
  applyBtnText: { fontSize: FONT_SIZES.md, fontWeight: "700", color: "#fff" },
});
