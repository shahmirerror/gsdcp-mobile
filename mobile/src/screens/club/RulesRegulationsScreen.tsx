import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, BORDER_RADIUS } from "../../lib/theme";

const CHAPTERS = [
  {
    number: "I",
    title: "Name, Seat & Objectives",
    content: "The club shall be named the German Shepherd Dog Club of Pakistan (GSDCP). Its registered seat is in Lahore. The club aims to promote the breeding, training, and exhibition of German Shepherd Dogs according to the standards of the Verein für Deutsche Schäferhunde (SV), Germany.",
  },
  {
    number: "II",
    title: "Membership",
    content: "Membership is open to all persons above the age of 18 who subscribe to the objectives of the club. Junior membership is available for those under 18 with parental consent. All members must abide by the club's code of ethics and pay annual dues as determined by the executive committee.",
  },
  {
    number: "III",
    title: "Executive Committee",
    content: "The club is governed by an executive committee consisting of a President, Vice President, Secretary General, Treasurer, and not fewer than three additional committee members. The committee is elected by ordinary members at the Annual General Meeting and holds office for two years.",
  },
  {
    number: "IV",
    title: "Registration & Pedigrees",
    content: "All German Shepherd Dogs bred by GSDCP members must be registered with the club. Litter registration must be applied for within three months of whelping. Pedigrees will only be issued for dogs whose parentage has been verified through DNA testing where required by the committee.",
  },
  {
    number: "V",
    title: "Breed Surveys (Körung)",
    content: "The GSDCP conducts official breed surveys following SV guidelines. Dogs must meet minimum working title, age, and health requirements before being presented for survey. Surveyed dogs receive a Körung certificate valid for life or for the period specified by the examining judge.",
  },
  {
    number: "VI",
    title: "Shows & Trials",
    content: "The club organises an annual National Sieger Show and other sanctioned events. Entry is open to all registered dogs whose owners are in good standing with the club. Show results are recorded in the club's registry and submitted to the SV.",
  },
  {
    number: "VII",
    title: "Discipline & Misconduct",
    content: "Any member found to have engaged in fraudulent registration, unethical breeding, or conduct unbecoming of a club member may be suspended or expelled by a two-thirds majority vote of the executive committee. The affected member has the right to appeal to the full membership at a general meeting.",
  },
];

export default function RulesRegulationsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [expanded, setExpanded] = useState<string | null>("I");

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
          <Ionicons name="document-text" size={34} color="#3B82F6" />
        </View>
        <Text style={styles.headerTitle}>Rules & Regulations</Text>
        <Text style={styles.headerSub}>Club constitution and bylaws</Text>
      </LinearGradient>

      <View style={styles.noteCard}>
        <Ionicons name="information-circle-outline" size={18} color="#3B82F6" />
        <Text style={styles.noteText}>
          This is an abridged version of the GSDCP constitution. Tap any chapter to expand.
        </Text>
      </View>

      <View style={styles.chaptersWrap}>
        {CHAPTERS.map((chapter) => {
          const isOpen = expanded === chapter.number;
          return (
            <TouchableOpacity
              key={chapter.number}
              style={[styles.chapterCard, isOpen && styles.chapterCardOpen]}
              onPress={() => setExpanded(isOpen ? null : chapter.number)}
              activeOpacity={0.8}
              data-testid={`chapter-${chapter.number}`}
            >
              <View style={styles.chapterHeader}>
                <View style={styles.chapterNumWrap}>
                  <Text style={styles.chapterNum}>{chapter.number}</Text>
                </View>
                <Text style={styles.chapterTitle} numberOfLines={isOpen ? undefined : 1}>
                  {chapter.title}
                </Text>
                <Ionicons
                  name={isOpen ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={COLORS.textMuted}
                />
              </View>
              {isOpen && (
                <Text style={styles.chapterBody}>{chapter.content}</Text>
              )}
            </TouchableOpacity>
          );
        })}
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
  backBtn: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", marginBottom: 20, gap: 4 },
  backText: { fontSize: 15, color: "#fff", fontWeight: "600" },
  headerIconWrap: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center", alignItems: "center", marginBottom: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#fff" },
  headerSub: { fontSize: 13, color: "rgba(255,255,255,0.65)", marginTop: 4 },
  noteCard: {
    marginHorizontal: 16,
    marginTop: 20,
    flexDirection: "row",
    gap: 10,
    backgroundColor: "rgba(59,130,246,0.06)",
    borderRadius: BORDER_RADIUS.md,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.15)",
    alignItems: "flex-start",
  },
  noteText: { flex: 1, fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
  chaptersWrap: { paddingHorizontal: 16, marginTop: 16, gap: 8 },
  chapterCard: {
    backgroundColor: "#fff",
    borderRadius: BORDER_RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chapterCardOpen: {
    borderColor: "rgba(15,92,58,0.3)",
  },
  chapterHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  chapterNumWrap: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: "rgba(15,92,58,0.08)",
    justifyContent: "center", alignItems: "center",
  },
  chapterNum: { fontSize: 12, fontWeight: "800", color: COLORS.primary },
  chapterTitle: { flex: 1, fontSize: 14, fontWeight: "700", color: COLORS.text },
  chapterBody: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 21,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
});
