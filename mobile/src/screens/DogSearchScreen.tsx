import { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from "../lib/theme";
import { formatDate } from "../lib/dateUtils";
import { fetchDogsPage, Dog, DogsPage } from "../lib/api";
import { DogListItem } from "../components/DogListItem";
import ErrorView from "../components/ErrorView";
import type { DogsStackParamList } from "../navigation/AppNavigator";
import BottomSheetModal from "../components/BottomSheetModal";
import LazyImage from "../components/LazyImage";

type Nav = NativeStackNavigationProp<DogsStackParamList, "DogSearch">;

const GENDER_OPTIONS = ["All", "Male", "Female"] as const;
const HAIR_OPTIONS   = ["All", "Stock Hair", "Long Stock Hair"] as const;
const TITLED_OPTIONS = ["Yes", "No"] as const;

export default function DogSearchScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery]         = useState<string>(route.params?.searchQuery || "");
  const [debouncedSearch, setDebouncedSearch] = useState<string>(route.params?.searchQuery || "");
  const [genderFilter, setGenderFilter]       = useState<string>("All");
  const [hairFilter,   setHairFilter]         = useState<string>("All");
  const [titledFilter, setTitledFilter]       = useState<string>("All");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [tempGender, setTempGender]           = useState<string>("All");
  const [tempHair,   setTempHair]             = useState<string>("All");
  const [tempTitled, setTempTitled]           = useState<string>("All");
  const [previewDog, setPreviewDog]           = useState<Dog | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const activeFilterCount =
    (genderFilter !== "All" ? 1 : 0) +
    (hairFilter !== "All" ? 1 : 0) +
    (titledFilter !== "All" ? 1 : 0);

  const openFilters = () => {
    setTempGender(genderFilter);
    setTempHair(hairFilter);
    setTempTitled(titledFilter);
    setShowFilterModal(true);
  };

  const applyFilters = () => {
    setGenderFilter(tempGender);
    setHairFilter(tempHair);
    setTitledFilter(tempTitled);
    setShowFilterModal(false);
  };

  const resetFilters = () => {
    setTempGender("All");
    setTempHair("All");
    setTempTitled("All");
  };

  const {
    data,
    isLoading,
    isError,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<DogsPage>({
    queryKey: ["dogs", debouncedSearch, genderFilter, hairFilter, titledFilter],
    queryFn: ({ pageParam }) =>
      fetchDogsPage(pageParam as number, {
        search: debouncedSearch || undefined,
        gender: genderFilter,
        hair:   hairFilter,
        titled: titledFilter,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMorePages
        ? lastPage.pagination.currentPage + 1
        : undefined,
  });

  const allDogs = useMemo(
    () => (data ? data.pages.flatMap((p) => p.data) : []),
    [data],
  );

  const hasMore = data?.pages[data.pages.length - 1]?.pagination.hasMorePages ?? false;

  const handleEndReached = () => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Search + Filter Row ── */}
      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by name, KP, owner…"
            placeholderTextColor={COLORS.textMuted}
            autoCorrect={false}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.filterButton, activeFilterCount > 0 && styles.filterButtonActive]}
          onPress={openFilters}
          activeOpacity={0.7}
        >
          <Ionicons
            name="options-outline"
            size={20}
            color={activeFilterCount > 0 ? "#fff" : COLORS.textSecondary}
          />
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Active filter chips ── */}
      {activeFilterCount > 0 && (
        <View style={styles.activeFiltersRow}>
          {genderFilter !== "All" && (
            <View style={styles.activeChip}>
              <Text style={styles.activeChipText}>{genderFilter}</Text>
              <TouchableOpacity onPress={() => setGenderFilter("All")} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                <Ionicons name="close" size={13} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          )}
          {hairFilter !== "All" && (
            <View style={styles.activeChip}>
              <Text style={styles.activeChipText}>{hairFilter}</Text>
              <TouchableOpacity onPress={() => setHairFilter("All")} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                <Ionicons name="close" size={13} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          )}
          {titledFilter !== "All" && (
            <View style={styles.activeChip}>
              <Text style={styles.activeChipText}>Titled: {titledFilter}</Text>
              <TouchableOpacity onPress={() => setTitledFilter("All")} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                <Ionicons name="close" size={13} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          )}
          <TouchableOpacity onPress={() => { setGenderFilter("All"); setHairFilter("All"); setTitledFilter("All"); }}>
            <Text style={styles.clearAllText}>Clear all</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Count row ── */}
      <View style={styles.countRow}>
        {isLoading ? null : (
          <Text style={styles.count}>
            {allDogs.length} {allDogs.length === 1 ? "dog" : "dogs"}
            {hasMore ? "+" : ""} loaded
          </Text>
        )}
      </View>

      {/* ── List ── */}
      {isLoading ? (
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
          style={{ marginTop: SPACING.xxl }}
        />
      ) : isError ? (
        <ErrorView
          message="Could not load dogs."
          onRetry={refetch}
          style={{ marginTop: SPACING.xxl }}
        />
      ) : (
        <FlatList
          data={allDogs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          renderItem={({ item }) => (
            <DogListItem dog={item} onPress={() => setPreviewDog(item)} />
          )}
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator
                size="small"
                color={COLORS.primary}
                style={{ paddingVertical: 20 }}
              />
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>No dogs found</Text>
              <Text style={styles.emptyDesc}>
                Try adjusting your search or filters.
              </Text>
            </View>
          }
        />
      )}

      {/* ── Dog preview sheet ── */}
      <BottomSheetModal
        visible={!!previewDog}
        onClose={() => setPreviewDog(null)}
      >
        {previewDog && (
          <View style={styles.modalContent}>
            <View style={styles.dogPreviewHeader}>
              {previewDog.imageUrl ? (
                <LazyImage
                  source={{ uri: previewDog.imageUrl }}
                  style={styles.dogPreviewImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.dogPreviewAvatar}>
                  <Text style={styles.dogPreviewAvatarText}>
                    {(previewDog.dog_name || "")
                      .trim()
                      .split(" ")
                      .filter((w) => w.length > 0)
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase() || "?"}
                  </Text>
                </View>
              )}
              <View style={styles.dogPreviewHeadInfo}>
                <Text style={styles.dogPreviewName} numberOfLines={2}>
                  {previewDog.dog_name}
                </Text>
                <Text style={styles.dogPreviewKP}>
                  {previewDog.KP && previewDog.KP !== "0"
                    ? `KP ${previewDog.KP}`
                    : previewDog.foreign_reg_no || "—"}
                </Text>
                {previewDog.titles && previewDog.titles.length > 0 && (
                  <View style={styles.dogPreviewTitlesRow}>
                    {previewDog.titles.slice(0, 3).map((t) => (
                      <View key={t} style={styles.dogPreviewTitleBadge}>
                        <Text style={styles.dogPreviewTitleBadgeText}>{t}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>

            <View style={styles.dogPreviewDivider} />

            <View style={styles.dogPreviewGrid}>
              {[
                { label: "Sex",          value: previewDog.sex },
                { label: "Color",        value: previewDog.color },
                { label: "Hair",         value: previewDog.hair },
                { label: "Date of Birth",value: formatDate(previewDog.dob) },
                { label: "Sire",         value: previewDog.sire },
                { label: "Dam",          value: previewDog.dam },
                { label: "Breeder",      value: previewDog.breeder },
                {
                  label: "Owner",
                  value:
                    previewDog.owner && previewDog.owner.length > 0
                      ? previewDog.owner.map((o) => o.name).join(", ")
                      : null,
                },
              ]
                .filter((row) => row.value)
                .map((row) => (
                  <View key={row.label} style={styles.dogPreviewRow}>
                    <Text style={styles.dogPreviewRowLabel}>{row.label}</Text>
                    <Text style={styles.dogPreviewRowValue} numberOfLines={2}>
                      {row.value}
                    </Text>
                  </View>
                ))}
            </View>

            <TouchableOpacity
              style={styles.viewProfileBtn}
              activeOpacity={0.8}
              onPress={() => {
                setPreviewDog(null);
                navigation.navigate("DogProfile", {
                  id: previewDog.id,
                  name: previewDog.dog_name,
                });
              }}
            >
              <Ionicons name="paw" size={16} color="#fff" />
              <Text style={styles.viewProfileBtnText}>View Full Profile</Text>
            </TouchableOpacity>
          </View>
        )}
      </BottomSheetModal>

      {/* ── Filter sheet ── */}
      <BottomSheetModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filters</Text>
            <TouchableOpacity onPress={resetFilters}>
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.filterSectionTitle}>Gender</Text>
          <View style={styles.filterOptionsRow}>
            {GENDER_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.filterOption,
                  tempGender === opt && styles.filterOptionActive,
                ]}
                onPress={() => setTempGender(opt)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterOptionText,
                    tempGender === opt && styles.filterOptionTextActive,
                  ]}
                >
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.filterSectionTitle}>Hair Type</Text>
          <View style={styles.filterOptionsRow}>
            {HAIR_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.filterOption,
                  tempHair === opt && styles.filterOptionActive,
                ]}
                onPress={() => setTempHair(opt)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterOptionText,
                    tempHair === opt && styles.filterOptionTextActive,
                  ]}
                >
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.filterSectionTitle}>Titled</Text>
          <View style={styles.filterOptionsRow}>
            {TITLED_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.filterOption,
                  tempTitled === opt && styles.filterOptionActive,
                ]}
                onPress={() => setTempTitled(opt)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterOptionText,
                    tempTitled === opt && styles.filterOptionTextActive,
                  ]}
                >
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.applyButton}
            onPress={applyFilters}
            activeOpacity={0.8}
          >
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </BottomSheetModal>
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
  filterBadge: {
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
  filterBadgeText: {
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
    minHeight: 20,
  },
  count: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  list: {
    padding: SPACING.lg,
    paddingTop: SPACING.sm,
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
  modalContent: { paddingHorizontal: 24 },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
  },
  resetText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "600",
    color: COLORS.textMuted,
  },
  filterSectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  filterOptionsRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 24,
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
    color: COLORS.text,
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
  dogPreviewHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
    gap: 14,
  },
  dogPreviewImage: {
    width: 72,
    height: 72,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: "#E8F5E9",
  },
  dogPreviewAvatar: {
    width: 72,
    height: 72,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  dogPreviewAvatarText: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 22,
  },
  dogPreviewHeadInfo: {
    flex: 1,
    justifyContent: "center",
  },
  dogPreviewName: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 3,
  },
  dogPreviewKP: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  dogPreviewTitlesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  dogPreviewTitleBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  dogPreviewTitleBadgeText: {
    fontSize: FONT_SIZES.xs,
    color: "#fff",
    fontWeight: "600",
  },
  dogPreviewDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: 14,
  },
  dogPreviewGrid: {
    marginBottom: 20,
    gap: 10,
  },
  dogPreviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  dogPreviewRowLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    fontWeight: "500",
    width: 100,
    flexShrink: 0,
  },
  dogPreviewRowValue: {
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
