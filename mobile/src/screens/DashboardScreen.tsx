import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  Modal,
  Pressable,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery } from "@tanstack/react-query";
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from "../lib/theme";
import { fetchDashboard, fetchNews, fetchRecentMatings, stripHtml, NewsItem, RecentMating } from "../lib/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

/** Returns the current GSDCP season label, e.g. "2025/2026".
 *  The new season starts in August — so Aug 1 2026 → "2026/2027". */
function getCurrentSeason(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed: January=0 … July=6, August=7
  return month >= 7 ? `${year}/${year + 1}` : `${year - 1}/${year}`;
}

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

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [previewMating, setPreviewMating] = useState<RecentMating | null>(null);

  const { data: dashboard, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["/api/mobile/dashboard"],
    queryFn: fetchDashboard,
  });

  const { data: newsData, isLoading: newsLoading } = useQuery({
    queryKey: ["/api/mobile/news"],
    queryFn: fetchNews,
  });

  const { data: matingsData, isLoading: matingsLoading } = useQuery({
    queryKey: ["/api/mobile/recent-matings"],
    queryFn: fetchRecentMatings,
  });

  const recentNews = (newsData ?? []).slice(0, 2);

  const season = getCurrentSeason();

  const statCards = [
    {
      label: "Registered Dogs in Club",
      value: dashboard ? `${dashboard.totalDogs.toLocaleString()}` : "—",
      icon: "paw" as const,
    },
    {
      label: "Registered Kennels",
      value: dashboard ? `${dashboard.totalKennels}` : "—",
      icon: "people" as const,
    },
    {
      label: `Events in ${season} season`,
      value: dashboard ? `${dashboard.totalShows}` : "—",
      icon: "trophy" as const,
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 24 }}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.primary} colors={[COLORS.primary]} />
      }
    >
      <LinearGradient
        colors={[COLORS.primaryDark, COLORS.primary]}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.headerTop}>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerGreeting}>Welcome to</Text>
            <Text style={styles.headerTitle}>GSDCP</Text>
          </View>
          <TouchableOpacity
            style={styles.headerAction}
            onPress={() => navigation.navigate("ProfileTab")}
            activeOpacity={0.7}
            data-testid="button-profile-header"
          >
            <Ionicons
              name="person-circle-outline"
              size={28}
              color="rgba(255,255,255,0.8)"
            />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtitle}>
          German Shepherd Dog Club of Pakistan
        </Text>

        <TouchableOpacity
          style={styles.searchBar}
          activeOpacity={0.8}
          onPress={() => navigation.navigate("DogsTab")}
          data-testid="button-search-bar"
        >
          <Ionicons name="search" size={18} color={COLORS.textMuted} />
          <Text style={styles.searchPlaceholder}>
            Search dogs by name, KP, owner...
          </Text>
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.statsSection}>
        {statCards.map((stat) => (
          <View key={stat.label} style={styles.statCard}>
            <View style={styles.statIconWrap}>
              <Ionicons name={stat.icon} size={18} color={COLORS.primary} />
            </View>
            <Text
              style={styles.statValue}
              data-testid={`text-stat-${stat.label.toLowerCase().replace(/\s/g, "-")}`}
            >
              {stat.value}
            </Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Matings</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("RecentMatingsTab")}
            activeOpacity={0.7}
            data-testid="link-view-all-matings"
          >
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {matingsLoading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="small" color={COLORS.primary} />
          </View>
        ) : matingsData && matingsData.length > 0 ? (
          <View style={styles.activityCard}>
            {matingsData.slice(0, 3).map((mating, i) => {
              const date = parseMatingDate(mating.mating_date);
              const displayList = matingsData.slice(0, 3);
              return (
                <TouchableOpacity
                  key={mating.id}
                  style={[
                    styles.litterItem,
                    i < displayList.length - 1 && styles.litterItemBorder,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => setPreviewMating(mating)}
                  data-testid={`card-litter-${i}`}
                >
                  <View style={styles.litterIconWrap}>
                    <Ionicons name="heart" size={14} color={COLORS.accent} />
                  </View>
                  <View style={styles.litterTextWrap}>
                    <Text style={styles.litterKennel}>{mating.kennel_name}</Text>
                    <Text style={styles.litterPairing}>
                      {mating.sire.name.trim()} × {mating.dam.name.trim()}
                    </Text>
                    <View style={styles.litterMeta}>
                      <Ionicons name="calendar-outline" size={11} color={COLORS.textMuted} />
                      <Text style={styles.litterMetaText}>{date.full}</Text>
                      {mating.city ? (
                        <>
                          <Text style={styles.litterMetaDot}>·</Text>
                          <Ionicons name="location-outline" size={11} color={COLORS.textMuted} />
                          <Text style={styles.litterMetaText}>{mating.city}</Text>
                        </>
                      ) : null}
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color={COLORS.textMuted} />
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.activityCard}>
            <Text style={styles.emptyText}>No recent matings found.</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Events</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("ShowsTab")}
            activeOpacity={0.7}
            data-testid="link-view-all-events"
          >
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="small" color={COLORS.primary} />
          </View>
        ) : dashboard?.upcomingShows && dashboard.upcomingShows.length > 0 ? (
          dashboard.upcomingShows.map((show) => {
            const date = new Date(show.dates[0]);
            const day = date.getDate().toString();
            const month = date
              .toLocaleString("en-GB", { month: "short" })
              .toUpperCase();
            return (
              <TouchableOpacity
                key={show.id}
                style={styles.eventCard}
                activeOpacity={0.7}
                onPress={() => navigation.navigate("ShowsTab")}
                data-testid={`card-event-${show.id}`}
              >
                <View style={styles.eventDateBox}>
                  <Text style={styles.eventDay}>{day}</Text>
                  <Text style={styles.eventMonth}>{month}</Text>
                </View>
                <View style={styles.eventInfo}>
                  <View style={styles.eventMeta}>
                    <View style={styles.eventBadge}>
                      <Text style={styles.eventBadgeText}>
                        {show.event_type}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.eventTitle}>{show.name}</Text>
                  {show.location ? (
                    <View style={styles.eventLocationRow}>
                      <Ionicons
                        name="location-outline"
                        size={12}
                        color={COLORS.textMuted}
                      />
                      <Text style={styles.eventLocation}>{show.location}</Text>
                    </View>
                  ) : null}
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={COLORS.textMuted}
                />
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.eventCard}>
            <Text style={styles.emptyText}>No upcoming events.</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>News & Updates</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("TheClubTab")}
            activeOpacity={0.7}
            data-testid="link-view-all-news"
          >
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {newsLoading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="small" color={COLORS.primary} />
          </View>
        ) : recentNews.length > 0 ? (
          <View style={styles.activityCard}>
            {recentNews.map((item: NewsItem, i: number) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.newsItem, i < recentNews.length - 1 && styles.newsItemBorder]}
                activeOpacity={0.7}
                onPress={() => navigation.navigate("TheClubTab")}
                data-testid={`card-news-dash-${item.id}`}
              >
                <View style={styles.newsIconWrap}>
                  <Ionicons name="megaphone-outline" size={14} color={COLORS.accent} />
                </View>
                <View style={styles.newsTextWrap}>
                  <Text style={styles.newsTitle} numberOfLines={2}>{item.title}</Text>
                  <Text style={styles.newsBody} numberOfLines={2}>
                    {stripHtml(item.content)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.activityCard}>
            <Text style={styles.emptyText}>No news at this time.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerGreeting: {
    fontSize: 13,
    fontWeight: "500",
    color: "rgba(255,255,255,0.7)",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  headerAction: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  searchPlaceholder: {
    fontSize: 14,
    color: COLORS.textMuted,
    flex: 1,
  },
  quickActionsSection: {
    paddingHorizontal: 20,
    marginTop: -1,
    paddingTop: 20,
  },
  quickActionsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  quickActionCard: {
    alignItems: "center",
    width: (SCREEN_WIDTH - 40 - 36) / 4,
  },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  statsSection: {
    marginTop: 20,
    flexDirection: "row" as const,
    paddingHorizontal: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center" as const,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(15,92,58,0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.primaryDark,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "500",
    color: COLORS.textMuted,
    textAlign: "center",
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.text,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#22C55E",
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primary,
  },
  activityCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  loadingCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: "center",
    paddingVertical: 8,
  },
  litterItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    gap: 12,
  },
  litterItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  litterIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "rgba(199,164,92,0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  litterTextWrap: {
    flex: 1,
  },
  litterKennel: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 2,
  },
  litterPairing: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  litterMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  litterMetaText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  litterMetaDot: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  eventCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  eventDateBox: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  eventDay: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.primary,
    lineHeight: 24,
  },
  eventMonth: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  eventInfo: {
    flex: 1,
  },
  eventMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  eventBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    backgroundColor: "rgba(15,92,59,0.08)",
  },
  eventBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    color: COLORS.primary,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 2,
  },
  eventLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  eventLocation: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  newsItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    gap: 12,
  },
  newsItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  newsIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: `rgba(199,164,92,0.12)`,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
    flexShrink: 0,
  },
  newsTextWrap: {
    flex: 1,
  },
  newsTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 3,
    lineHeight: 19,
  },
  newsBody: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 17,
  },
});
