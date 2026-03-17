import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, BORDER_RADIUS } from "../../lib/theme";

type NewsItem = {
  id: string;
  date: string;
  category: string;
  categoryColor: string;
  title: string;
  body: string;
};

const NEWS: NewsItem[] = [
  {
    id: "1",
    date: "15 Mar 2026",
    category: "Announcement",
    categoryColor: COLORS.primary,
    title: "GSDCP Breed Survey & Endurance Trial — Sialkot (March 29)",
    body: "The upcoming Breed Survey and Endurance Trial will be held on March 29, 2026 in Sialkot. Judge: Faheem Asghar. Last date of entry: March 28. All interested members should register their dogs through the GSDCP office.",
  },
  {
    id: "2",
    date: "10 Mar 2026",
    category: "Registration",
    categoryColor: "#3B82F6",
    title: "Online Dog Registration Now Available",
    body: "GSDCP members can now register their dogs online through the GSDCP portal. Litter registrations, transfers, and pedigree requests can be submitted digitally. Contact the secretariat for login credentials.",
  },
  {
    id: "3",
    date: "02 Feb 2026",
    category: "Results",
    categoryColor: COLORS.accent,
    title: "2025 National Sieger Show — Final Results Published",
    body: "The full results of the 2025 GSDCP National Sieger Show have been published on the website. Congratulations to all participants. VA1 and SG titles have been forwarded to the SV for international recognition.",
  },
  {
    id: "4",
    date: "20 Jan 2026",
    category: "Committee",
    categoryColor: "#8B5CF6",
    title: "Executive Committee Meeting — January 2026",
    body: "The executive committee convened on January 20 to discuss the 2026 show calendar, fee revisions, and the upcoming international judge invitation programme. Minutes will be circulated to all members shortly.",
  },
  {
    id: "5",
    date: "05 Jan 2026",
    category: "Announcement",
    categoryColor: COLORS.primary,
    title: "2026 Show Calendar Released",
    body: "The GSDCP 2026 show and events calendar has been finalised. Major events include the Spring Breed Survey (March), Regional Shows (May, August), and the National Sieger Show (November). Full details available from the secretariat.",
  },
];

export default function NewsUpdatesScreen() {
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
          <Ionicons name="newspaper" size={34} color="#F59E0B" />
        </View>
        <Text style={styles.headerTitle}>News & Updates</Text>
        <Text style={styles.headerSub}>Latest announcements from GSDCP</Text>
      </LinearGradient>

      <View style={styles.cardsWrap}>
        {NEWS.map((item) => (
          <View key={item.id} style={styles.card} data-testid={`card-news-${item.id}`}>
            <View style={styles.cardTop}>
              <View style={[styles.categoryBadge, { backgroundColor: `${item.categoryColor}14` }]}>
                <Text style={[styles.categoryText, { color: item.categoryColor }]}>{item.category}</Text>
              </View>
              <Text style={styles.date}>{item.date}</Text>
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>
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
  cardsWrap: { paddingHorizontal: 16, marginTop: 20, gap: 12 },
  card: {
    backgroundColor: "#fff",
    borderRadius: BORDER_RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryText: { fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.3 },
  date: { fontSize: 12, color: COLORS.textMuted },
  title: { fontSize: 15, fontWeight: "700", color: COLORS.text, marginBottom: 8, lineHeight: 21 },
  body: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 },
});
