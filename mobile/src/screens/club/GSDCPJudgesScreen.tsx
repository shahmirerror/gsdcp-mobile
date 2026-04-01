import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { COLORS, BORDER_RADIUS } from "../../lib/theme";
import { fetchJudges, JudgeItem } from "../../lib/api";
import { TheClubStackParamList } from "../../navigation/AppNavigator";
import LazyImage from "../../components/LazyImage";

function credentialColor(credentials: string): { bg: string; text: string } {
  if (credentials.toLowerCase().includes("fci")) return { bg: "rgba(59,130,246,0.1)", text: "#2563EB" };
  if (credentials.toLowerCase().includes("sv")) return { bg: "rgba(199,164,92,0.12)", text: COLORS.accent };
  return { bg: "rgba(15,92,58,0.08)", text: COLORS.primary };
}

function JudgeCard({ judge, onPress }: { judge: JudgeItem; onPress: () => void }) {
  const [imgError, setImgError] = useState(false);
  const initials = judge.full_name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("");
  const colors = credentialColor(judge.credentials);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75} data-testid={`card-judge-${judge.judge_id}`}>
      <View style={styles.avatarWrap}>
        {!imgError ? (
          <Image
            source={{ uri: judge.imageUrl }}
            style={styles.avatar}
            onError={() => setImgError(true)}
          />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{judge.full_name}</Text>
        <View style={[styles.credBadge, { backgroundColor: colors.bg }]}>
          <Text style={[styles.credText, { color: colors.text }]}>{judge.credentials}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
}

export default function GSDCPJudgesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<TheClubStackParamList>>();
  const insets = useSafeAreaInsets();

  const { data: judges, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["/api/mobile/judges"],
    queryFn: fetchJudges,
  });

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.primary} colors={[COLORS.primary]} />
      }
    >
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          data-testid="button-back"
        >
          <Ionicons name="chevron-back" size={22} color={COLORS.primary} />
          <Text style={styles.backText}>The Club</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.headerIconWrap}>
            <Ionicons name="ribbon" size={26} color={COLORS.accent} />
          </View>
          <View>
            <Text style={styles.headerTitle}>GSDCP Judges</Text>
            <Text style={styles.headerSub}>Certified local breed judges</Text>
          </View>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Ionicons name="information-circle-outline" size={18} color={COLORS.primary} />
        <Text style={styles.infoText}>
          GSDCP judges are trained and licensed in accordance with SV judging
          standards. Only licensed judges may officiate at GSDCP-sanctioned events.
        </Text>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 48 }} size="large" color={COLORS.primary} />
      ) : (
        <View style={styles.cardsWrap}>
          {(judges ?? []).map((judge: JudgeItem) => (
            <JudgeCard
              key={judge.judge_id}
              judge={judge}
              onPress={() => navigation.navigate("JudgeDetail", { id: judge.judge_id, backLabel: "GSDCP Judges" })}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 16 },
  backText: { fontSize: 15, color: COLORS.primary, fontWeight: "600" },
  headerContent: { flexDirection: "row", alignItems: "center", gap: 14 },
  headerIconWrap: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: "rgba(199,164,92,0.12)",
    justifyContent: "center", alignItems: "center",
  },
  headerTitle: { fontSize: 20, fontWeight: "800", color: COLORS.text },
  headerSub: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
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
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#fff", borderRadius: BORDER_RADIUS.lg,
    padding: 14, borderWidth: 1, borderColor: COLORS.border, gap: 14,
  },
  avatarWrap: {},
  avatar: {
    width: 56, height: 56, borderRadius: 16,
  },
  avatarFallback: {
    backgroundColor: "rgba(15,92,58,0.08)",
    justifyContent: "center", alignItems: "center",
  },
  avatarText: { fontSize: 18, fontWeight: "800", color: COLORS.primary },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: "700", color: COLORS.text, marginBottom: 6 },
  credBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6,
  },
  credText: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.3 },
});
