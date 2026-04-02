import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, BORDER_RADIUS } from "../../lib/theme";

const TEAM = [
  {
    role: "President",
    name: "Maj. (Retd.) Tariq Mehmood",
    city: "Lahore",
    since: "2022",
    icon: "shield-checkmark" as const,
    color: COLORS.primary,
  },
  {
    role: "Vice President",
    name: "Dr. Asim Nawaz",
    city: "Islamabad",
    since: "2022",
    icon: "shield-half" as const,
    color: COLORS.primary,
  },
  {
    role: "Secretary General",
    name: "Khalid Hussain",
    city: "Lahore",
    since: "2022",
    icon: "create" as const,
    color: "#3B82F6",
  },
  {
    role: "Treasurer",
    name: "Imran Sheikh",
    city: "Karachi",
    since: "2022",
    icon: "wallet" as const,
    color: COLORS.accent,
  },
  {
    role: "Chief Breed Warden",
    name: "Mian Nadeem Akhtar",
    city: "Lahore",
    since: "2020",
    icon: "ribbon" as const,
    color: "#8B5CF6",
  },
  {
    role: "Technical Director",
    name: "Zulfiqar Ali",
    city: "Rawalpindi",
    since: "2022",
    icon: "settings" as const,
    color: "#64748B",
  },
  {
    role: "Committee Member",
    name: "Faheem Asghar",
    city: "Sialkot",
    since: "2022",
    icon: "person" as const,
    color: COLORS.textSecondary,
  },
  {
    role: "Committee Member",
    name: "Arif Butt",
    city: "Lahore",
    since: "2022",
    icon: "person" as const,
    color: COLORS.textSecondary,
  },
];

export default function TheTeamScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <LinearGradient colors={["#0F5C3A", "#083A24"]} style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          data-testid="button-back"
        >
          <Ionicons name="chevron-back" size={20} color="rgba(255,255,255,0.85)" />
          <Text style={styles.backText}>The Club</Text>
        </TouchableOpacity>
        <View style={styles.heroCenter}>
          <View style={styles.heroIconWrap}>
            <Ionicons name="people" size={34} color="#fff" />
          </View>
          <Text style={styles.heroTitle}>The GSDCP Team</Text>
          <Text style={styles.heroSub}>Executive committee & officials</Text>
        </View>
      </LinearGradient>

      <View style={styles.termNote}>
        <Ionicons name="time-outline" size={16} color={COLORS.textMuted} />
        <Text style={styles.termText}>Current term: 2022 – 2024</Text>
      </View>

      <View style={styles.cardsWrap}>
        {TEAM.map((member, i) => {
          const initials = member.name
            .split(" ")
            .filter((w) => /^[A-Z]/.test(w))
            .slice(0, 2)
            .map((w) => w[0])
            .join("");
          return (
            <View key={i} style={styles.card}>
              <View style={[styles.avatar, { backgroundColor: `${member.color}18` }]}>
                <Text style={[styles.avatarText, { color: member.color }]}>{initials}</Text>
              </View>
              <View style={styles.cardBody}>
                <View style={[styles.roleBadge, { backgroundColor: `${member.color}12` }]}>
                  <Ionicons name={member.icon} size={11} color={member.color} />
                  <Text style={[styles.roleText, { color: member.color }]}>{member.role}</Text>
                </View>
                <Text style={styles.name}>{member.name}</Text>
                <View style={styles.meta}>
                  <Ionicons name="location-outline" size={12} color={COLORS.textMuted} />
                  <Text style={styles.metaText}>{member.city}</Text>
                  <Text style={styles.metaDot}>·</Text>
                  <Text style={styles.metaText}>Since {member.since}</Text>
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
  header: { paddingHorizontal: 20, paddingBottom: 32 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 20 },
  backText: { fontSize: 15, color: "rgba(255,255,255,0.85)", fontWeight: "600" },
  heroCenter: { alignItems: "center" },
  heroIconWrap: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center", alignItems: "center", marginBottom: 14,
  },
  heroTitle: { fontSize: 24, fontWeight: "800", color: "#fff", textAlign: "center" },
  heroSub: { fontSize: 13, color: "rgba(255,255,255,0.65)", textAlign: "center", marginTop: 6 },
  termNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 4,
  },
  termText: { fontSize: 13, color: COLORS.textMuted },
  cardsWrap: { paddingHorizontal: 16, marginTop: 12, gap: 10 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: BORDER_RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { fontSize: 16, fontWeight: "800" },
  cardBody: { flex: 1 },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 4,
  },
  roleText: { fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.3 },
  name: { fontSize: 15, fontWeight: "700", color: COLORS.text },
  meta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  metaText: { fontSize: 12, color: COLORS.textMuted },
  metaDot: { fontSize: 12, color: COLORS.textMuted },
});
