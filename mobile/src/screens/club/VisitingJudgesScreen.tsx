import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, BORDER_RADIUS } from "../../lib/theme";

const JUDGES = [
  {
    name: "Lothar Quoll",
    country: "Germany",
    flag: "🇩🇪",
    affiliation: "SV Hauptzuchtschule",
    visits: ["2019 National Sieger Show", "2022 Breed Survey Camp"],
    speciality: "Breed Conformation & Körung",
  },
  {
    name: "Stefan Doering",
    country: "Germany",
    flag: "🇩🇪",
    affiliation: "SV — Bundessieger Judge",
    visits: ["2023 National Sieger Show"],
    speciality: "Breed Conformation",
  },
  {
    name: "Eyal Barak",
    country: "Israel",
    flag: "🇮🇱",
    affiliation: "IKC / SV Affiliated",
    visits: ["2018 Regional Show, Karachi"],
    speciality: "Working Dogs & IPO",
  },
  {
    name: "Yvan Baerts",
    country: "Belgium",
    flag: "🇧🇪",
    affiliation: "FCI International Judge",
    visits: ["2016 GSDCP Championship Show"],
    speciality: "FCI & SV Breed Standard",
  },
];

export default function VisitingJudgesScreen() {
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
          <Ionicons name="airplane" size={34} color="#E11D48" />
        </View>
        <Text style={styles.headerTitle}>Visiting Judges</Text>
        <Text style={styles.headerSub}>International judges & specialists</Text>
      </LinearGradient>

      <View style={styles.infoCard}>
        <Ionicons name="globe-outline" size={18} color="#E11D48" />
        <Text style={styles.infoText}>
          GSDCP regularly invites SV and FCI-licensed judges from Germany and
          abroad to officiate at national shows and breed survey camps.
        </Text>
      </View>

      <View style={styles.cardsWrap}>
        {JUDGES.map((judge, i) => (
          <View key={i} style={styles.card}>
            <View style={styles.flagWrap}>
              <Text style={styles.flag}>{judge.flag}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{judge.name}</Text>
              <View style={styles.countryRow}>
                <Text style={styles.country}>{judge.country}</Text>
                <Text style={styles.dot}>·</Text>
                <Text style={styles.affiliation}>{judge.affiliation}</Text>
              </View>
              <Text style={styles.speciality}>{judge.speciality}</Text>
              <View style={styles.visitsWrap}>
                <Text style={styles.visitsLabel}>Visits:</Text>
                {judge.visits.map((v, vi) => (
                  <View key={vi} style={styles.visitRow}>
                    <View style={styles.visitDot} />
                    <Text style={styles.visitText}>{v}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 20, paddingBottom: 28, alignItems: "center" },
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
    backgroundColor: "rgba(225,29,72,0.05)",
    borderRadius: BORDER_RADIUS.md, padding: 14,
    borderWidth: 1, borderColor: "rgba(225,29,72,0.15)",
    alignItems: "flex-start",
  },
  infoText: { flex: 1, fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
  cardsWrap: { paddingHorizontal: 16, marginTop: 16, gap: 10 },
  card: {
    flexDirection: "row", alignItems: "flex-start",
    backgroundColor: "#fff", borderRadius: BORDER_RADIUS.lg,
    padding: 16, borderWidth: 1, borderColor: COLORS.border, gap: 14,
  },
  flagWrap: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: COLORS.background,
    justifyContent: "center", alignItems: "center",
  },
  flag: { fontSize: 28 },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: "700", color: COLORS.text, marginBottom: 3 },
  countryRow: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 3 },
  country: { fontSize: 12, fontWeight: "600", color: "#E11D48" },
  dot: { fontSize: 12, color: COLORS.textMuted },
  affiliation: { fontSize: 12, color: COLORS.textMuted, flex: 1 },
  speciality: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 8 },
  visitsWrap: { gap: 4 },
  visitsLabel: { fontSize: 11, fontWeight: "700", color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 2 },
  visitRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  visitDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: COLORS.accent },
  visitText: { fontSize: 12, color: COLORS.textSecondary },
});
