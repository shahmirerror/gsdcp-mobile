import { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ImageBackground,
  RefreshControl,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES } from "../lib/theme";
import { fetchShow, ShowDetail, ShowResultEntry } from "../lib/api";

const heroBg = require("../../assets/hero-bg.jpg");

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
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

const STATUS_COLORS: Record<string, string> = {
  Upcoming: "#3B82F6",
  Current: "#22C55E",
  Past: "#9CA3AF",
};

type TabKey = "info" | "results";

function InfoRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={18} color={COLORS.primary} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function ResultRow({ entry, onPress }: { entry: ShowResultEntry; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.resultRow} onPress={onPress} activeOpacity={0.7} data-testid={`result-${entry.dog_id}`}>
      <View style={styles.seatBadge}>
        <Text style={styles.seatText}>#{entry.placement}</Text>
      </View>
      <View style={styles.resultInfo}>
        <Text style={styles.resultName} numberOfLines={1}>{entry.dog_name.trim()}</Text>
        {entry.KP && (
          <Text style={styles.resultKp}>KP {entry.KP}</Text>
        )}
      </View>
      <View style={styles.gradingBadge}>
        <Text style={styles.gradingText}>{entry.grading}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
}

export default function ShowDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { id, name } = route.params as { id: string; name?: string };
  const [activeTab, setActiveTab] = useState<TabKey>("info");
  const [selectedHair, setSelectedHair] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);

  const { data: show, isLoading, isError, refetch, isRefetching } = useQuery<ShowDetail>({
    queryKey: ["shows", id],
    queryFn: () => fetchShow(id),
  });

  const results = show?.showResults || [];

  const CLASS_ORDER = [
    "Working Female", "Working Male",
    "Adult Female", "Adult Male",
    "Open Female", "Open Male",
    "Youth Female", "Youth Male",
    "Junior Female", "Junior Male",
    "Puppy Female", "Puppy Male",
    "Minor Puppy Female", "Minor Puppy Male",
  ];

  const HAIR_ORDER = ["Stock Hair", "Long-Stock Hair with Undercoat", "Long Stock hair"];

  const normalize = (s: string) => s.replace(/[\r\n]+\s*/g, " ").trim();
  const normalizeHair = (h: string | null | undefined) => {
    if (!h || !h.trim()) return "Other";
    return h.trim();
  };

  const hairGroups = useMemo(() => {
    if (!results.length) return new Map<string, ShowResultEntry[]>();
    const groups = new Map<string, ShowResultEntry[]>();
    results.forEach((entry) => {
      const hair = normalizeHair(entry.hair);
      if (!groups.has(hair)) groups.set(hair, []);
      groups.get(hair)!.push(entry);
    });
    return groups;
  }, [results]);

  const orderedHairTypes = useMemo(() => {
    const ordered = HAIR_ORDER.filter((h) => hairGroups.has(h));
    const remaining = [...hairGroups.keys()].filter((h) => !HAIR_ORDER.includes(h));
    return [...ordered, ...remaining];
  }, [hairGroups]);

  const activeHair = selectedHair && hairGroups.has(selectedHair)
    ? selectedHair
    : orderedHairTypes[0] || null;

  const hairResults = activeHair ? hairGroups.get(activeHair) || [] : [];

  const classGroups = useMemo(() => {
    if (!hairResults.length) return new Map<string, ShowResultEntry[]>();
    const groups = new Map<string, ShowResultEntry[]>();
    hairResults.forEach((entry) => {
      const cls = normalize(entry.class || "Other");
      if (!groups.has(cls)) groups.set(cls, []);
      groups.get(cls)!.push(entry);
    });
    groups.forEach((arr) => arr.sort((a, b) => parseInt(a.placement) - parseInt(b.placement)));
    return groups;
  }, [hairResults]);

  const orderedClassNames = useMemo(() => {
    const ordered = CLASS_ORDER.filter((cls) => classGroups.has(cls));
    const remaining = [...classGroups.keys()].filter((cls) => !CLASS_ORDER.includes(cls));
    return [...ordered, ...remaining];
  }, [classGroups]);

  const activeClass = selectedClass && classGroups.has(selectedClass)
    ? selectedClass
    : orderedClassNames[0] || null;

  const activeClassResults = activeClass ? classGroups.get(activeClass) || [] : [];

  const hasMultipleHairTypes = orderedHairTypes.length > 1;

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: "info", label: "Info" },
    { key: "results", label: "Results", count: results.length },
  ];

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        {name && <Text style={styles.loadingName}>{name}</Text>}
      </View>
    );
  }

  if (isError || !show) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Failed to load show details</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()} data-testid="btn-retry">
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()} data-testid="btn-go-back">
          <Text style={[styles.retryBtnText, { color: COLORS.primary, marginTop: 8 }]}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isActive = show.status === "Current" || show.status === "Upcoming";
  const color = EVENT_TYPE_COLORS[show.event_type] || COLORS.accent;
  const icon = EVENT_TYPE_ICONS[show.event_type] || "calendar";
  const statusColor = STATUS_COLORS[show.status] || COLORS.textMuted;

  const handleDogPress = (entry: ShowResultEntry) => {
    navigation.push("DogProfile", { id: entry.dog_id, name: entry.dog_name.trim() });
  };

  const renderHeader = () => (
    <>
      <ImageBackground source={heroBg} style={styles.heroBanner} resizeMode="cover">
        <LinearGradient
          colors={["rgba(246,248,247,0)", "rgba(246,248,247,0.6)", "#f6f8f7"]}
          style={styles.heroGradient}
          pointerEvents="none"
        />
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (navigation.canGoBack()) navigation.goBack();
          }}
          activeOpacity={0.7}
          data-testid="btn-back"
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
      </ImageBackground>

      <View style={styles.headerSection}>
        <View style={[styles.heroIcon, { backgroundColor: `${color}20` }]}>
          <Ionicons name={icon} size={32} color={color} />
        </View>
        <Text style={styles.showName} data-testid="text-show-name">{show.name}</Text>
        <View style={styles.badgeRow}>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}18` }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>{show.status}</Text>
          </View>
          <View style={[styles.typeBadge, { backgroundColor: `${color}18` }]}>
            <Text style={[styles.typeBadgeText, { color }]}>{show.event_type}</Text>
          </View>
        </View>
      </View>

      <View style={styles.tabRow}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.7}
            data-testid={`tab-${tab.key}`}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
              {tab.count != null ? ` (${tab.count})` : ""}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );

  if (activeTab === "info") {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
        overScrollMode="always"
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.primary} colors={[COLORS.primary]} />
        }
      >
        {renderHeader()}

        <View style={styles.card}>
          <Text style={styles.cardHeading}>Event Details</Text>
          <InfoRow
            icon="calendar"
            label="Date"
            value={show.dates.length > 0 ? show.dates.map(formatDate).join(" — ") : "TBA"}
          />
          {show.location && (
            <InfoRow icon="location" label="Location" value={show.location} />
          )}
          {show.last_date_of_entry && (
            <InfoRow icon="time" label="Last Date of Entry" value={formatDate(show.last_date_of_entry)} />
          )}
          <InfoRow icon="paw" label="Entries" value={String(show.entryCount)} />
        </View>

        {show.judges.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardHeading}>
              {show.judges.length === 1 ? "Judge" : "Judges"}
            </Text>
            {show.judges.map((judge) => (
              <View key={judge.id} style={styles.judgeRow}>
                <View style={styles.judgeAvatar}>
                  <Ionicons name="person" size={18} color={COLORS.primary} />
                </View>
                <Text style={styles.judgeName}>{judge.full_name}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
        overScrollMode="always"
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.primary} colors={[COLORS.primary]} />
        }
        stickyHeaderIndices={orderedClassNames.length > 0 ? [3] : undefined}
      >
        {renderHeader()}

        {orderedClassNames.length > 0 && (
          <View style={styles.filterTabsSticky}>
            {hasMultipleHairTypes && (
              <View style={styles.hairTabsWrapper}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.hairTabsContent}
                >
                  {orderedHairTypes.map((hair) => {
                    const count = hairGroups.get(hair)?.length || 0;
                    const isSelected = hair === activeHair;
                    return (
                      <TouchableOpacity
                        key={hair}
                        style={[styles.hairTab, isSelected && styles.hairTabActive]}
                        onPress={() => { setSelectedHair(hair); setSelectedClass(null); }}
                        activeOpacity={0.7}
                        data-testid={`hair-tab-${hair.toLowerCase().replace(/\s/g, "-")}`}
                      >
                        <Text style={[styles.hairTabText, isSelected && styles.hairTabTextActive]}>
                          {hair}
                        </Text>
                        <View style={[styles.hairTabCount, isSelected && styles.hairTabCountActive]}>
                          <Text style={[styles.hairTabCountText, isSelected && styles.hairTabCountTextActive]}>
                            {count}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            <View style={styles.classTabsWrapper}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.classTabsContent}
              >
                {orderedClassNames.map((cls) => {
                  const count = classGroups.get(cls)?.length || 0;
                  const isSelected = cls === activeClass;
                  return (
                    <TouchableOpacity
                      key={cls}
                      style={[styles.classTab, isSelected && styles.classTabActive]}
                      onPress={() => setSelectedClass(cls)}
                      activeOpacity={0.7}
                      data-testid={`class-tab-${cls.toLowerCase().replace(/\s/g, "-")}`}
                    >
                      <Text style={[styles.classTabText, isSelected && styles.classTabTextActive]}>
                        {cls}
                      </Text>
                      <View style={[styles.classTabCount, isSelected && styles.classTabCountActive]}>
                        <Text style={[styles.classTabCountText, isSelected && styles.classTabCountTextActive]}>
                          {count}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        )}

        {activeClassResults.length > 0 ? (
          <View style={styles.resultsList}>
            {activeClassResults.map((item, index) => (
              <ResultRow key={`${item.dog_id}-${index}`} entry={item} onPress={() => handleDogPress(item)} />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="trophy-outline" size={32} color={COLORS.primary} />
            </View>
            <Text style={styles.emptyTitle}>No Results Yet</Text>
            <Text style={styles.emptyDesc}>Results will appear here once the show is complete.</Text>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6f8f7",
  },
  scrollContent: {
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f6f8f7",
    gap: SPACING.md,
  },
  loadingName: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 8,
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
  retryBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  heroBanner: {
    height: 180,
    justifyContent: "flex-end",
  },
  heroGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 120,
  },
  backButton: {
    position: "absolute",
    top: 48,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerSection: {
    alignItems: "center",
    marginTop: -40,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.md,
    borderWidth: 3,
    borderColor: "#fff",
  },
  showName: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: SPACING.sm,
    lineHeight: 26,
  },
  badgeRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    alignItems: "center",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tabRow: {
    flexDirection: "row",
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: BORDER_RADIUS.sm,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: "#fff",
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeading: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(15,92,59,0.05)",
    gap: SPACING.md,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: `${COLORS.primary}10`,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
    lineHeight: 20,
  },
  judgeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(15,92,59,0.05)",
    gap: SPACING.md,
  },
  judgeAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.primary}10`,
    justifyContent: "center",
    alignItems: "center",
  },
  judgeName: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
  },
  filterTabsSticky: {
    backgroundColor: "#f6f8f7",
  },
  hairTabsWrapper: {
    paddingVertical: SPACING.sm,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  hairTabsContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  hairTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  hairTabActive: {
    backgroundColor: `${COLORS.accent}18`,
    borderColor: COLORS.accent,
  },
  hairTabText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  hairTabTextActive: {
    color: COLORS.accent,
  },
  hairTabCount: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BORDER_RADIUS.full,
    minWidth: 20,
    alignItems: "center",
  },
  hairTabCountActive: {
    backgroundColor: `${COLORS.accent}20`,
  },
  hairTabCountText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.textMuted,
  },
  hairTabCountTextActive: {
    color: COLORS.accent,
  },
  classTabsWrapper: {
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  classTabsContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  classTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  classTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  classTabText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  classTabTextActive: {
    color: "#fff",
  },
  classTabCount: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BORDER_RADIUS.full,
    minWidth: 20,
    alignItems: "center",
  },
  classTabCountActive: {
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  classTabCountText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.textMuted,
  },
  classTabCountTextActive: {
    color: "#fff",
  },
  resultsList: {
    paddingTop: SPACING.sm,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.xs,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  seatBadge: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: `${COLORS.primary}10`,
    justifyContent: "center",
    alignItems: "center",
  },
  seatText: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.primary,
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: FONT_SIZES.md,
    fontWeight: "600",
    color: COLORS.text,
  },
  resultKp: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  gradingBadge: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
  },
  gradingText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
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
