import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, BORDER_RADIUS } from "../../lib/theme";
import type { TheClubStackParamList } from "../../navigation/AppNavigator";

type Nav = NativeStackNavigationProp<TheClubStackParamList, "TheClubHome">;

const SECTIONS = [
  {
    route: "AboutGSDCP" as const,
    title: "About GSDCP",
    desc: "Our history, mission and objectives",
    icon: "information-circle" as keyof typeof Ionicons.glyphMap,
    color: COLORS.primary,
    bg: "rgba(15,92,58,0.08)",
  },
  {
    route: "Subscription" as const,
    title: "Subscription & Fee Structure",
    desc: "Membership types and annual fee schedule",
    icon: "card" as keyof typeof Ionicons.glyphMap,
    color: COLORS.accent,
    bg: "rgba(199,164,92,0.12)",
  },
  {
    route: "RulesRegulations" as const,
    title: "Rules & Regulations",
    desc: "Club constitution and bylaws",
    icon: "document-text" as keyof typeof Ionicons.glyphMap,
    color: "#3B82F6",
    bg: "rgba(59,130,246,0.08)",
  },
  {
    route: "TheTeam" as const,
    title: "The GSDCP Team",
    desc: "Executive committee and officials",
    icon: "people" as keyof typeof Ionicons.glyphMap,
    color: "#8B5CF6",
    bg: "rgba(139,92,246,0.08)",
  },
  {
    route: "GSDCPJudges" as const,
    title: "GSDCP Judges",
    desc: "Certified local breed judges",
    icon: "ribbon" as keyof typeof Ionicons.glyphMap,
    color: COLORS.primary,
    bg: "rgba(15,92,58,0.08)",
  },
  {
    route: "VisitingJudges" as const,
    title: "Visiting Judges",
    desc: "International judges and specialists",
    icon: "airplane" as keyof typeof Ionicons.glyphMap,
    color: "#E11D48",
    bg: "rgba(225,29,72,0.08)",
  },
  {
    route: "NewsUpdates" as const,
    title: "News & Updates",
    desc: "Latest announcements from GSDCP",
    icon: "newspaper" as keyof typeof Ionicons.glyphMap,
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.08)",
  },
];

export default function TheClubScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 32 }}
    >
      <LinearGradient colors={["#0F5C3A", "#083A24"]} style={[styles.header, { paddingTop: insets.top + 28 }]}>
        <View style={styles.heroCenter}>
          <View style={styles.heroIconWrap}>
            <Ionicons name="shield-checkmark" size={34} color="#fff" />
          </View>
          <Text style={styles.heroTitle}>The Club</Text>
          <Text style={styles.heroSub}>German Shepherd Dog Club of Pakistan</Text>
        </View>
      </LinearGradient>

      <View style={styles.listWrap}>
        {SECTIONS.map((section, index) => (
          <TouchableOpacity
            key={section.route}
            style={[styles.card, index === SECTIONS.length - 1 && styles.cardLast]}
            onPress={() => navigation.navigate(section.route)}
            activeOpacity={0.7}
            data-testid={`card-club-${section.route.toLowerCase()}`}
          >
            <View style={[styles.iconWrap, { backgroundColor: section.bg }]}>
              <Ionicons name={section.icon} size={22} color={section.color} />
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{section.title}</Text>
              <Text style={styles.cardDesc}>{section.desc}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: { paddingHorizontal: 20, paddingBottom: 36 },
  heroCenter: { alignItems: "center" },
  heroIconWrap: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center", alignItems: "center", marginBottom: 14,
  },
  heroTitle: { fontSize: 28, fontWeight: "800", color: "#fff", textAlign: "center" },
  heroSub: { fontSize: 14, color: "rgba(255,255,255,0.7)", textAlign: "center", marginTop: 6 },
  listWrap: {
    marginHorizontal: 16,
    marginTop: -1,
    paddingTop: 20,
    gap: 10,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: BORDER_RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 14,
  },
  cardLast: {
    marginBottom: 0,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 2,
  },
  cardDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 17,
  },
});
