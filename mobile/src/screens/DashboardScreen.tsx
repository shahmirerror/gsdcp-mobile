import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from "../lib/theme";

const logoSquare = require("../../assets/logo-square.png");
const { width: SCREEN_WIDTH } = Dimensions.get("window");

const quickActions = [
  {
    icon: "search" as const,
    label: "Search Dogs",
    tab: "DogsTab",
    color: COLORS.primary,
    bg: "rgba(15,92,58,0.1)",
  },
  {
    icon: "people" as const,
    label: "Breeders",
    tab: "BreedersTab",
    color: "#3B82F6",
    bg: "rgba(59,130,246,0.1)",
  },
  {
    icon: "trophy" as const,
    label: "Shows",
    tab: "ShowsTab",
    color: COLORS.accent,
    bg: "rgba(199,164,92,0.15)",
  },
  {
    icon: "person" as const,
    label: "Profile",
    tab: "ProfileTab",
    color: "#8B5CF6",
    bg: "rgba(139,92,246,0.1)",
  },
];

const statCards = [
  { label: "Registered Dogs", value: "5,200+", icon: "paw" as const },
  { label: "Active Breeders", value: "120+", icon: "people" as const },
  { label: "Shows This Year", value: "8", icon: "trophy" as const },
];

const latestActivity = [
  { text: "32 New Puppies Registered (Lahore)", time: "2h ago" },
  { text: "Stud Service: VA1 'Hero' updated", time: "5h ago" },
  { text: "HD/ED Results: 14 New clearances", time: "1d ago" },
];

const upcomingEvents = [
  {
    day: "24",
    month: "NOV",
    badge: "Championship",
    badgeType: "gold" as const,
    location: "Lahore",
    title: "Sieger Show 2024",
  },
  {
    day: "12",
    month: "DEC",
    badge: "Seminar",
    badgeType: "green" as const,
    location: "Islamabad",
    title: "Breeding Ethics Seminar",
  },
];

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 24 }}
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

      <View style={styles.quickActionsSection}>
        <View style={styles.quickActionsGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={styles.quickActionCard}
              activeOpacity={0.7}
              onPress={() => navigation.navigate(action.tab)}
              data-testid={`button-quick-${action.label.toLowerCase().replace(/\s/g, "-")}`}
            >
              <View
                style={[styles.quickActionIcon, { backgroundColor: action.bg }]}
              >
                <Ionicons name={action.icon} size={22} color={action.color} />
              </View>
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.statsSection}>
        {statCards.map((stat) => (
          <View key={stat.label} style={styles.statCard}>
            <View style={styles.statIconWrap}>
              <Ionicons name={stat.icon} size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Latest Activity</Text>
          <View style={styles.liveDot} />
        </View>
        <View style={styles.activityCard}>
          {latestActivity.map((item, i) => (
            <View
              key={i}
              style={[
                styles.activityItem,
                i < latestActivity.length - 1 && styles.activityItemBorder,
              ]}
            >
              <View style={styles.activityDot} />
              <View style={styles.activityTextWrap}>
                <Text style={styles.activityText}>{item.text}</Text>
                <Text style={styles.activityTime}>{item.time}</Text>
              </View>
            </View>
          ))}
        </View>
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
        {upcomingEvents.map((event) => (
          <TouchableOpacity
            key={event.title}
            style={styles.eventCard}
            activeOpacity={0.7}
            onPress={() => navigation.navigate("ShowsTab")}
            data-testid={`card-event-${event.title.toLowerCase().replace(/\s/g, "-")}`}
          >
            <View style={styles.eventDateBox}>
              <Text style={styles.eventDay}>{event.day}</Text>
              <Text style={styles.eventMonth}>{event.month}</Text>
            </View>
            <View style={styles.eventInfo}>
              <View style={styles.eventMeta}>
                <View
                  style={[
                    styles.eventBadge,
                    event.badgeType === "gold"
                      ? styles.eventBadgeGold
                      : styles.eventBadgeGreen,
                  ]}
                >
                  <Text
                    style={[
                      styles.eventBadgeText,
                      event.badgeType === "gold"
                        ? styles.eventBadgeTextGold
                        : styles.eventBadgeTextGreen,
                    ]}
                  >
                    {event.badge}
                  </Text>
                </View>
              </View>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <View style={styles.eventLocationRow}>
                <Ionicons
                  name="location-outline"
                  size={12}
                  color={COLORS.textMuted}
                />
                <Text style={styles.eventLocation}>{event.location}</Text>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={COLORS.textMuted}
            />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.ctaCard}
          activeOpacity={0.8}
          onPress={() => navigation.navigate("ProfileTab")}
          data-testid="button-join-community"
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            style={styles.ctaGradient}
          >
            <View style={styles.ctaContent}>
              <Ionicons
                name="shield-checkmark"
                size={32}
                color={COLORS.accent}
              />
              <Text style={styles.ctaTitle}>Join GSDCP</Text>
              <Text style={styles.ctaDesc}>
                Register your litter, enter shows, and access full ancestry
                tools.
              </Text>
              <View style={styles.ctaButton}>
                <Text style={styles.ctaButtonText}>Get Started</Text>
                <Ionicons
                  name="arrow-forward"
                  size={16}
                  color={COLORS.primaryDark}
                />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
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
  headerLogo: {
    width: 40,
    height: 40,
    marginRight: 12,
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
  activityItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 10,
    gap: 12,
  },
  activityItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
    marginTop: 5,
  },
  activityTextWrap: {
    flex: 1,
  },
  activityText: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.text,
    lineHeight: 18,
  },
  activityTime: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
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
  },
  eventBadgeGold: {
    backgroundColor: "rgba(199,164,92,0.15)",
  },
  eventBadgeGreen: {
    backgroundColor: "rgba(15,92,59,0.08)",
  },
  eventBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  eventBadgeTextGold: {
    color: COLORS.accent,
  },
  eventBadgeTextGreen: {
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
  ctaCard: {
    borderRadius: 20,
    overflow: "hidden",
  },
  ctaGradient: {
    borderRadius: 20,
  },
  ctaContent: {
    padding: 24,
    alignItems: "center",
  },
  ctaTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 12,
    marginBottom: 8,
  },
  ctaDesc: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 16,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  ctaButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primaryDark,
  },
});
