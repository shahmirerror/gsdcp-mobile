import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, BORDER_RADIUS } from "../../lib/theme";

const JUDGES = [
  { name: "Mian Nadeem Akhtar", city: "Lahore", license: "SV Licensed", speciality: "Breed Conformation & Survey", since: "2005" },
  { name: "Faheem Asghar", city: "Sialkot", license: "GSDCP Licensed", speciality: "Breed Conformation", since: "2012" },
  { name: "Dr. Asim Nawaz", city: "Islamabad", license: "SV Licensed", speciality: "Working Trials & HD Evaluation", since: "2009" },
  { name: "Zulfiqar Ali", city: "Rawalpindi", license: "GSDCP Licensed", speciality: "Breed Conformation", since: "2015" },
  { name: "Col. (Retd.) Saeed Ahmad", city: "Lahore", license: "SV Licensed", speciality: "Schutzhund / IPO Trials", since: "2003" },
];

export default function GSDCPJudgesScreen() {
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
          <Ionicons name="ribbon" size={34} color={COLORS.accent} />
        </View>
        <Text style={styles.headerTitle}>GSDCP Judges</Text>
        <Text style={styles.headerSub}>Certified local breed judges</Text>
      </LinearGradient>

      <View style={styles.infoCard}>
        <Ionicons name="information-circle-outline" size={18} color={COLORS.primary} />
        <Text style={styles.infoText}>
          GSDCP judges are trained and licensed in accordance with SV judging
          standards. Only licensed judges may officiate at GSDCP-sanctioned events.
        </Text>
      </View>

      <View style={styles.cardsWrap}>
        {JUDGES.map((judge, i) => {
          const initials = judge.name.split(" ").filter(w => /^[A-Z]/.test(w)).slice(0, 2).map(w => w[0]).join("");
          const isSV = judge.license.includes("SV");
          return (
            <View key={i} style={styles.card}>
              <View style={styles.avatarWrap}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
                <View style={[styles.licenseDot, { backgroundColor: isSV ? COLORS.accent : COLORS.primary }]} />
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{judge.name}</Text>
                <View style={[styles.licenseBadge, { backgroundColor: isSV ? "rgba(199,164,92,0.12)" : "rgba(15,92,58,0.08)" }]}>
                  <Text style={[styles.licenseText, { color: isSV ? COLORS.accent : COLORS.primary }]}>{judge.license}</Text>
                </View>
                <Text style={styles.speciality}>{judge.speciality}</Text>
                <View style={styles.meta}>
                  <Ionicons name="location-outline" size={12} color={COLORS.textMuted} />
                  <Text style={styles.metaText}>{judge.city}</Text>
                  <Text style={styles.dot}>·</Text>
                  <Text style={styles.metaText}>Since {judge.since}</Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingHorizontal: 20, paddingBottom: 28, alignItems: "center",
  },
  backBtn: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", marginBottom: 20, gap: 4 },
  backText: { fontSize: 15, color: "#fff", fontWeight: "600" },
  headerIconWrap: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center", alignItems: "center", marginBottom: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#fff" },
  headerSub: { fontSize: 13, color: "rgba(255,255,255,0.65)", marginTop: 4 },
  infoCard: {
    marginHorizontal: 16, marginTop: 20,
    flexDirection: "row", gap: 10,
    backgroundColor: "rgba(15,92,58,0.06)",
    borderRadius: BORDER_RADIUS.md, padding: 14,
    borderWidth: 1, borderColor: "rgba(15,92,58,0.15)",
    alignItems: "flex-start",
  },
  infoText: { flex: 1, fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
  cardsWrap: { paddingHorizontal: 16, marginTop: 16, gap: 10 },
  card: {
    flexDirection: "row", alignItems: "flex-start",
    backgroundColor: "#fff", borderRadius: BORDER_RADIUS.lg,
    padding: 14, borderWidth: 1, borderColor: COLORS.border, gap: 14,
  },
  avatarWrap: { position: "relative" },
  avatar: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: "rgba(15,92,58,0.08)",
    justifyContent: "center", alignItems: "center",
  },
  avatarText: { fontSize: 16, fontWeight: "800", color: COLORS.primary },
  licenseDot: {
    position: "absolute", bottom: -2, right: -2,
    width: 14, height: 14, borderRadius: 7,
    borderWidth: 2, borderColor: "#fff",
  },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: "700", color: COLORS.text, marginBottom: 4 },
  licenseBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 6, marginBottom: 4,
  },
  licenseText: { fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.3 },
  speciality: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 },
  meta: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12, color: COLORS.textMuted },
  dot: { fontSize: 12, color: COLORS.textMuted },
});
