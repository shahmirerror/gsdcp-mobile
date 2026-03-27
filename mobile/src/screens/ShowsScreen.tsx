import { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  RefreshControl,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from "../lib/theme";
import { fetchShows, Show, ShowJudge } from "../lib/api";

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

const STATUS_COLORS: Record<string, string> = {
  Upcoming: "#3B82F6",
  Current: "#22C55E",
  Past: "#9CA3AF",
};

function PreviewJudgeRow({ judge, onPress }: { judge: ShowJudge; onPress: () => void }) {
  const [imgError, setImgError] = useState(false);
  const initials = judge.full_name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("");
  const hasImg = !!judge.imageUrl && !imgError;
  return (
    <TouchableOpacity style={styles.judgeRow} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.judgeAvatarWrap}>
        {hasImg ? (
          <Image source={{ uri: judge.imageUrl! }} style={styles.judgeAvatarImg} onError={() => setImgError(true)} />
        ) : (
          <Text style={styles.judgeAvatarInitials}>{initials}</Text>
        )}
      </View>
      <View style={styles.judgeLabelWrap}>
        <Text style={styles.judgeLabel}>JUDGE</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.judgeName} numberOfLines={1}>{judge.full_name}</Text>
        {judge.credentials ? <Text style={styles.judgeCredentials}>{judge.credentials}</Text> : null}
      </View>
      <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
    </TouchableOpacity>
  );
}

function ShowListItem({ show, onPress }: { show: Show; onPress: () => void }) {
  const statusColor = STATUS_COLORS[show.status] || COLORS.textMuted;

  return (
    <TouchableOpacity style={styles.listItem} onPress={onPress} activeOpacity={0.7} data-testid={`card-show-${show.id}`}>
      <View style={styles.dateBlock}>
        {show.dates.length > 0 ? (
          <>
            <Text style={styles.dateDay}>
              {parseInt(show.dates[0].split("-")[2], 10)}
            </Text>
            <Text style={styles.dateMonth}>
              {MONTHS[parseInt(show.dates[0].split("-")[1], 10) - 1]}
            </Text>
            <Text style={styles.dateYear}>
              {show.dates[0].split("-")[0]}
            </Text>
          </>
        ) : (
          <Text style={styles.dateMonth}>TBA</Text>
        )}
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={1} data-testid={`text-show-name-${show.id}`}>
          {show.name}
        </Text>
        <Text style={styles.itemSub} numberOfLines={1}>{show.event_type}</Text>
        <View style={styles.badges}>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}18` }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusBadgeText, { color: statusColor }]}>{show.status}</Text>
          </View>
          {show.location && (
            <View style={styles.badge}>
              <Text style={styles.badgeText} numberOfLines={1}>{show.location}</Text>
            </View>
          )}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{show.entryCount} entries</Text>
          </View>
        </View>
        {show.status === "Upcoming" && show.last_date_of_entry ? (
          <Text style={styles.entryDeadline}>
            Entries close: {formatDate(show.last_date_of_entry)}
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
}

export default function ShowsScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [tempStatus, setTempStatus] = useState<string>("All");
  const [tempType, setTempType] = useState<string>("All");
  const [previewShow, setPreviewShow] = useState<Show | null>(null);

  const activeFilterCount =
    (statusFilter !== "All" ? 1 : 0) + (typeFilter !== "All" ? 1 : 0);

  const openFilters = () => {
    setTempStatus(statusFilter);
    setTempType(typeFilter);
    setShowFilterModal(true);
  };

  const applyFilters = () => {
    setStatusFilter(tempStatus);
    setTypeFilter(tempType);
    setShowFilterModal(false);
  };

  const resetFilters = () => {
    setTempStatus("All");
    setTempType("All");
  };

  const { data: shows, isLoading, isError, refetch, isRefetching } = useQuery<Show[]>({
    queryKey: ["shows"],
    queryFn: fetchShows,
  });

  const eventTypes = useMemo(() => {
    if (!shows) return [];
    return [...new Set(shows.map((s) => s.event_type))].sort();
  }, [shows]);

  const statuses = useMemo(() => {
    if (!shows) return [];
    return [...new Set(shows.map((s) => s.status))];
  }, [shows]);

  const filtered = useMemo(() => {
    if (!shows) return [];
    let results = shows;

    const q = search.trim().toLowerCase();
    if (q) {
      results = results.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.location && s.location.toLowerCase().includes(q)) ||
          s.judges.some((j) => j.full_name.toLowerCase().includes(q)),
      );
    }

    if (statusFilter !== "All") {
      results = results.filter((s) => s.status === statusFilter);
    }

    if (typeFilter !== "All") {
      results = results.filter((s) => s.event_type === typeFilter);
    }

    return results;
  }, [shows, search, statusFilter, typeFilter]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search shows, location, judge..."
            placeholderTextColor={COLORS.textMuted}
            autoCorrect={false}
            data-testid="input-search-shows"
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
          {statusFilter !== "All" && (
            <View style={styles.activeChip}>
              <Text style={styles.activeChipText}>{statusFilter}</Text>
              <TouchableOpacity onPress={() => setStatusFilter("All")} data-testid="btn-remove-status-filter">
                <Ionicons name="close" size={14} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          )}
          {typeFilter !== "All" && (
            <View style={styles.activeChip}>
              <Text style={styles.activeChipText}>{typeFilter}</Text>
              <TouchableOpacity onPress={() => setTypeFilter("All")} data-testid="btn-remove-type-filter">
                <Ionicons name="close" size={14} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          )}
          <TouchableOpacity
            onPress={() => { setStatusFilter("All"); setTypeFilter("All"); }}
            data-testid="btn-clear-all-filters"
          >
            <Text style={styles.clearAllText}>Clear all</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.countRow}>
        <Text style={styles.count} data-testid="text-show-count">
          {filtered.length} {filtered.length === 1 ? "show" : "shows"}
        </Text>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: SPACING.xxl }} data-testid="loading-shows" />
      ) : isError ? (
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={48} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>Failed to load shows</Text>
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
            <ShowListItem
              show={item}
              onPress={() => setPreviewShow(item)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>No shows found</Text>
              <Text style={styles.emptyDesc}>Try adjusting your search or filters.</Text>
            </View>
          }
        />
      )}

      <Modal
        visible={!!previewShow}
        animationType="slide"
        transparent
        onRequestClose={() => setPreviewShow(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setPreviewShow(null)} />
          {previewShow && (() => {
            const statusColor = STATUS_COLORS[previewShow.status] || COLORS.textMuted;
            const dateRange = formatDateRange(previewShow.dates);
            return (
              <View style={styles.modalContent}>
                <View style={styles.modalHandle} />
                <View style={styles.previewHeader}>
                  <View style={styles.previewDateBlock}>
                    {previewShow.dates.length > 0 ? (
                      <>
                        <Text style={styles.previewDateDay}>{parseInt(previewShow.dates[0].split("-")[2], 10)}</Text>
                        <Text style={styles.previewDateMonth}>{MONTHS[parseInt(previewShow.dates[0].split("-")[1], 10) - 1]}</Text>
                      </>
                    ) : (
                      <Text style={styles.previewDateMonth}>TBA</Text>
                    )}
                  </View>
                  <View style={styles.previewHeadInfo}>
                    <Text style={styles.previewName} numberOfLines={2}>{previewShow.name}</Text>
                    <Text style={styles.previewSub}>{previewShow.event_type}</Text>
                    <View style={styles.previewBadgeRow}>
                      <View style={[styles.statusBadge, { backgroundColor: `${statusColor}18` }]}>
                        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                        <Text style={[styles.statusBadgeText, { color: statusColor }]}>{previewShow.status}</Text>
                      </View>
                    </View>
                  </View>
                </View>
                <View style={styles.previewDivider} />
                <View style={styles.previewGrid}>
                  {[
                    { label: "Date(s)", value: dateRange !== "TBA" ? dateRange : null },
                    { label: "Location", value: previewShow.location },
                    { label: "Entries", value: String(previewShow.entryCount) },
                    { label: "Last Entry", value: previewShow.last_date_of_entry ? formatDate(previewShow.last_date_of_entry) : null },
                  ].filter(r => r.value).map(r => (
                    <View key={r.label} style={styles.previewRow}>
                      <Text style={styles.previewRowLabel}>{r.label}</Text>
                      <Text style={styles.previewRowValue} numberOfLines={2}>{r.value}</Text>
                    </View>
                  ))}
                </View>
                {previewShow.judges.length > 0 && (
                  <>
                    <View style={styles.previewDivider} />
                    {previewShow.judges.map((judge, i) => (
                      <View key={judge.id}>
                        <PreviewJudgeRow
                          judge={judge}
                          onPress={() => { setPreviewShow(null); navigation.push("JudgeDetail", { id: judge.id, backLabel: previewShow.name }); }}
                        />
                        {i < previewShow.judges.length - 1 && <View style={styles.judgeRowDivider} />}
                      </View>
                    ))}
                    <View style={styles.previewDivider} />
                  </>
                )}
                <TouchableOpacity
                  style={styles.viewProfileBtn}
                  activeOpacity={0.8}
                  onPress={() => { setPreviewShow(null); navigation.navigate("ShowDetail", { id: previewShow.id, name: previewShow.name }); }}
                >
                  <Ionicons name="ribbon" size={16} color="#fff" />
                  <Text style={styles.viewProfileBtnText}>View Show Details</Text>
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
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterOptionsRow}>
              <TouchableOpacity
                style={[styles.filterOption, tempStatus === "All" && styles.filterOptionActive]}
                onPress={() => setTempStatus("All")}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterOptionText, tempStatus === "All" && styles.filterOptionTextActive]}>All</Text>
              </TouchableOpacity>
              {statuses.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.filterOption, tempStatus === opt && styles.filterOptionActive]}
                  onPress={() => setTempStatus(opt)}
                  activeOpacity={0.7}
                  data-testid={`filter-status-${opt.toLowerCase()}`}
                >
                  <Text style={[styles.filterOptionText, tempStatus === opt && styles.filterOptionTextActive]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.filterSectionTitle}>Event Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterOptionsRow}>
              <TouchableOpacity
                style={[styles.filterOption, tempType === "All" && styles.filterOptionActive]}
                onPress={() => setTempType("All")}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterOptionText, tempType === "All" && styles.filterOptionTextActive]}>All</Text>
              </TouchableOpacity>
              {eventTypes.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.filterOption, tempType === opt && styles.filterOptionActive]}
                  onPress={() => setTempType(opt)}
                  activeOpacity={0.7}
                  data-testid={`filter-type-${opt.toLowerCase().replace(/\s/g, "-")}`}
                >
                  <Text style={[styles.filterOptionText, tempType === opt && styles.filterOptionTextActive]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.applyButton} onPress={applyFilters} data-testid="btn-apply-filters">
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
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    height: 44,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    height: "100%",
    outlineStyle: "none",
  } as any,
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
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
  dateBlock: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: `${COLORS.primary}10`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.md,
  },
  dateDay: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.primary,
    lineHeight: 22,
  },
  dateMonth: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.primary,
    textTransform: "uppercase",
  },
  dateYear: {
    fontSize: 10,
    fontWeight: "600",
    color: COLORS.textMuted,
  },
  entryDeadline: {
    fontSize: 11,
    color: "#D97706",
    fontWeight: "600",
    marginTop: 4,
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
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: "700",
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
  previewDateBlock: {
    width: 72,
    height: 72,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: `${COLORS.primary}10`,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  previewDateDay: {
    fontSize: 26,
    fontWeight: "800",
    color: COLORS.primary,
    lineHeight: 30,
  },
  previewDateMonth: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.primary,
    textTransform: "uppercase",
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
  judgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  judgeAvatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${COLORS.primary}12`,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
    overflow: "hidden",
  },
  judgeAvatarImg: { width: 48, height: 48, borderRadius: 24 },
  judgeAvatarInitials: { fontSize: 16, fontWeight: "800", color: COLORS.primary },
  judgeLabelWrap: {
    width: 38,
    height: 26,
    backgroundColor: `${COLORS.primary}12`,
    borderRadius: BORDER_RADIUS.sm,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  judgeLabel: { fontSize: 10, fontWeight: "800", color: COLORS.primary, letterSpacing: 0.6 },
  judgeName: { fontSize: FONT_SIZES.md, fontWeight: "600", color: COLORS.text },
  judgeCredentials: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted, marginTop: 1 },
  judgeRowDivider: { height: 1, backgroundColor: COLORS.border, marginHorizontal: 4 },

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
