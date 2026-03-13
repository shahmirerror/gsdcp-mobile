import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from "../lib/theme";

const heroBg = require("../../assets/hero-bg.jpg");
const { width: SCREEN_WIDTH } = Dimensions.get("window");

const registryCards = [
  {
    icon: "document-text" as const,
    title: "Verified Pedigrees",
    description:
      "Access the most comprehensive database of GSD lineages in Pakistan. Every entry is cross-checked for accuracy and KCP compliance.",
  },
  {
    icon: "calendar" as const,
    title: "Upcoming Shows",
    description:
      "Stay updated with the WUSV-standard breed surveys and championship shows organized across major cities in Pakistan.",
  },
  {
    icon: "people" as const,
    title: "Breeder Directory",
    description:
      "Connect with ethical, GSDCP-affiliated breeders who prioritize health testing (HD/ED) and stable temperaments.",
  },
];

const latestActivity = [
  "32 New Puppies Registered (Lahore)",
  "Stud Service: VA1 'Hero' updated",
  "HD/ED Results: 14 New clearances",
];

const events = [
  {
    day: "24",
    month: "NOV",
    badge: "Championship",
    badgeType: "gold" as const,
    location: "Lahore, Pakistan",
    title: "Sieger Show 2024",
    description:
      "The most prestigious event of the year featuring international SV judges.",
  },
  {
    day: "12",
    month: "DEC",
    badge: "Seminar",
    badgeType: "green" as const,
    location: "Islamabad, Pakistan",
    title: "Breeding Ethics Seminar",
    description:
      "A workshop for new breeders on genetics and health certification standards.",
  },
];

export default function DashboardScreen() {
  const navigation = useNavigation<any>();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <ImageBackground source={heroBg} style={styles.heroBg} resizeMode="cover">
        <LinearGradient
          colors={["rgba(8,58,36,0.8)", "rgba(8,58,36,0.4)", "rgba(8,58,36,0)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.heroGradient}
        >
          <View style={styles.heroContent}>
            <Text style={styles.heroEstd}>EST. 1978</Text>
            <Text style={styles.heroTitle}>
              Preserving the German Shepherd Heritage in Pakistan
            </Text>
            <Text style={styles.heroSubtitle}>
              The official national registry for pedigrees, dog shows, and breeding
              standards. Dedicated to the health and excellence of the breed.
            </Text>
            <TouchableOpacity
              style={styles.heroButton}
              activeOpacity={0.8}
              onPress={() => navigation.navigate("DogsTab")}
            >
              <Text style={styles.heroButtonText}>Explore Pedigrees</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </ImageBackground>

      <View style={styles.sectionPadding}>
        <View style={styles.sectionHeaderCenter}>
          <Text style={styles.sectionHeading}>Registry Services</Text>
          <View style={styles.goldBar} />
        </View>

        {registryCards.map((card) => (
          <View key={card.title} style={styles.featureCard}>
            <View style={styles.featureIconWrap}>
              <Ionicons name={card.icon} size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.featureTitle}>{card.title}</Text>
            <Text style={styles.featureDesc}>{card.description}</Text>
          </View>
        ))}
      </View>

      <View style={styles.sectionPadding}>
        <View style={styles.ctaCard}>
          <View style={styles.ctaCircle} />
          <Text style={styles.ctaHeading}>Join the GSDCP Community</Text>
          <Text style={styles.ctaDesc}>
            Become a member today to register your litter, enter shows, and gain
            full access to the ancestry search tools.
          </Text>
          <TouchableOpacity
            style={styles.ctaButton}
            activeOpacity={0.8}
            onPress={() => navigation.navigate("ProfileTab")}
          >
            <Text style={styles.ctaButtonText}>Create Member Account</Text>
          </TouchableOpacity>

          <View style={styles.activityBox}>
            <View style={styles.activityHeader}>
              <Ionicons name="pulse" size={18} color="#fff" />
              <Text style={styles.activityTitle}>Latest Activity</Text>
            </View>
            {latestActivity.map((item, i) => (
              <View key={i} style={styles.activityItem}>
                <View style={styles.activityDot} />
                <Text style={styles.activityText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.sectionPadding}>
        <View style={styles.eventsHeader}>
          <View>
            <Text style={styles.sectionHeadingLeft}>Major Events</Text>
            <Text style={styles.eventsSubtitle}>
              Don't miss the upcoming championship shows
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate("ShowsTab")}
            style={styles.viewCalendarLink}
          >
            <Text style={styles.viewCalendarText}>View Calendar</Text>
            <Ionicons name="chevron-forward" size={12} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {events.map((event) => (
          <TouchableOpacity
            key={event.title}
            style={styles.eventCard}
            activeOpacity={0.7}
            onPress={() => navigation.navigate("ShowsTab")}
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
                <Text style={styles.eventLocation}>{event.location}</Text>
              </View>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <Text style={styles.eventDesc}>{event.description}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  heroBg: {
    width: "100%",
    height: 500,
  },
  heroGradient: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  heroContent: {
    maxWidth: 672,
  },
  heroEstd: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.accent,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: "800",
    color: "#FFFFFF",
    lineHeight: 45,
    marginBottom: 24,
  },
  heroSubtitle: {
    fontSize: 18,
    fontWeight: "400",
    color: "#E2E8F0",
    lineHeight: 29,
    marginBottom: 32,
  },
  heroButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: COLORS.accent,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },
  heroButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  sectionPadding: {
    paddingHorizontal: 24,
    marginTop: 48,
  },
  sectionHeaderCenter: {
    alignItems: "center",
    marginBottom: 32,
  },
  sectionHeading: {
    fontSize: 30,
    fontWeight: "700",
    color: COLORS.primaryDark,
    textAlign: "center",
    marginBottom: 8,
  },
  sectionHeadingLeft: {
    fontSize: 30,
    fontWeight: "700",
    color: COLORS.primaryDark,
  },
  goldBar: {
    width: 80,
    height: 4,
    borderRadius: 9999,
    backgroundColor: COLORS.accent,
  },
  featureCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 32,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: "rgba(15,92,59,0.05)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  featureIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: "rgba(15,92,59,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 12,
  },
  featureDesc: {
    fontSize: 16,
    fontWeight: "400",
    color: "#64748B",
    lineHeight: 26,
  },
  ctaCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    padding: 32,
    overflow: "hidden",
  },
  ctaCircle: {
    position: "absolute",
    top: -128,
    right: -128,
    width: 256,
    height: 256,
    borderRadius: 128,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  ctaHeading: {
    fontSize: 30,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 36,
    marginBottom: 16,
  },
  ctaDesc: {
    fontSize: 18,
    fontWeight: "400",
    color: "#E2E8F0",
    textAlign: "center",
    lineHeight: 28,
    marginBottom: 24,
  },
  ctaButton: {
    alignSelf: "center",
    backgroundColor: COLORS.accent,
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
    marginBottom: 48,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
  },
  activityBox: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    padding: 25,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  activityHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  activityDot: {
    width: 7,
    height: 8,
    borderRadius: 9999,
    backgroundColor: COLORS.accent,
  },
  activityText: {
    fontSize: 14,
    fontWeight: "400",
    color: "rgba(255,255,255,0.8)",
    lineHeight: 20,
    flex: 1,
  },
  eventsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 32,
  },
  eventsSubtitle: {
    fontSize: 16,
    fontWeight: "400",
    color: "#64748B",
    lineHeight: 24,
    marginTop: 8,
  },
  viewCalendarLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewCalendarText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.primary,
  },
  eventCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 25,
    flexDirection: "row",
    gap: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(15,92,59,0.05)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  eventDateBox: {
    width: 96,
    height: 96,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    borderWidth: 2,
    borderColor: "rgba(15,92,59,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  eventDay: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.primary,
  },
  eventMonth: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  eventInfo: {
    flex: 1,
    gap: 4,
  },
  eventMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  eventBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  eventBadgeGold: {
    backgroundColor: "rgba(199,164,92,0.2)",
  },
  eventBadgeGreen: {
    backgroundColor: "rgba(15,92,59,0.1)",
  },
  eventBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  eventBadgeTextGold: {
    color: COLORS.accent,
  },
  eventBadgeTextGreen: {
    color: COLORS.primary,
  },
  eventLocation: {
    fontSize: 12,
    fontWeight: "500",
    color: "#94A3B8",
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    lineHeight: 28,
  },
  eventDesc: {
    fontSize: 14,
    fontWeight: "400",
    color: "#64748B",
    lineHeight: 20,
  },
});
