import { ScrollView, View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, BORDER_RADIUS } from "../../lib/theme";

const HIGHLIGHTS = [
  { icon: "calendar" as const, label: "Founded", value: "1967" },
  { icon: "location" as const, label: "Headquartered", value: "Lahore, Pakistan" },
  { icon: "paw" as const, label: "Registered Dogs", value: "8,000+" },
  { icon: "people" as const, label: "Active Members", value: "500+" },
];

export default function AboutGSDCPScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <LinearGradient
        colors={[COLORS.primaryDark, COLORS.primary]}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          data-testid="button-back"
        >
          <Ionicons name="chevron-back" size={22} color="#fff" />
          <Text style={styles.backText}>The Club</Text>
        </TouchableOpacity>
        <View style={styles.headerIconWrap}>
          <Ionicons name="information-circle" size={34} color={COLORS.accent} />
        </View>
        <Text style={styles.headerTitle}>About GSDCP</Text>
        <Text style={styles.headerSub}>Our history, mission and objectives</Text>
      </LinearGradient>

      <View style={styles.statsRow}>
        {HIGHLIGHTS.map((item) => (
          <View key={item.label} style={styles.statCard}>
            <Ionicons name={item.icon} size={18} color={COLORS.primary} />
            <Text style={styles.statValue}>{item.value}</Text>
            <Text style={styles.statLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Who We Are</Text>
        <Text style={styles.body}>
          The German Shepherd Dog Club of Pakistan (GSDCP) is the premier
          registry and governing body for German Shepherd Dogs in Pakistan. We
          are dedicated to the preservation, improvement, and promotion of the
          German Shepherd Dog breed according to the standards set by the
          Verein für Deutsche Schäferhunde (SV).
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Our Mission</Text>
        <Text style={styles.body}>
          To promote responsible breeding, ownership, and training of German
          Shepherd Dogs in Pakistan, while maintaining the integrity of the
          breed through rigorous health testing, pedigree registration, and
          breed surveys.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Our Objectives</Text>
        {[
          "Maintain an accurate pedigree registry for all registered German Shepherds in Pakistan",
          "Organise national sieger shows, breed surveys, and endurance trials",
          "Educate members on responsible breeding practices and the SV breed standard",
          "Foster international relationships with SV-affiliated clubs worldwide",
          "Promote the working ability and temperament of the German Shepherd Dog",
        ].map((obj, i) => (
          <View key={i} style={styles.bulletRow}>
            <View style={styles.bullet} />
            <Text style={styles.bulletText}>{obj}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Affiliation</Text>
        <Text style={styles.body}>
          The GSDCP is affiliated with the Verein für Deutsche Schäferhunde
          (SV), the world's largest single-breed dog club, based in Augsburg,
          Germany. All pedigrees and breed surveys conducted by GSDCP are
          recognised internationally through this affiliation.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    alignItems: "center",
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginBottom: 20,
    gap: 4,
  },
  backText: { fontSize: 15, color: "#fff", fontWeight: "600" },
  headerIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#fff" },
  headerSub: { fontSize: 13, color: "rgba(255,255,255,0.65)", marginTop: 4 },
  statsRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 20,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: BORDER_RADIUS.lg,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
  },
  statValue: { fontSize: 14, fontWeight: "800", color: COLORS.primaryDark },
  statLabel: { fontSize: 9, fontWeight: "600", color: COLORS.textMuted, textAlign: "center", textTransform: "uppercase", letterSpacing: 0.3 },
  section: {
    marginHorizontal: 16,
    marginTop: 24,
    backgroundColor: "#fff",
    borderRadius: BORDER_RADIUS.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.primaryDark,
    marginBottom: 10,
  },
  body: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 8,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accent,
    marginTop: 8,
  },
  bulletText: { flex: 1, fontSize: 14, color: COLORS.textSecondary, lineHeight: 21 },
});
