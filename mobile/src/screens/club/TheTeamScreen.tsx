import {
  ScrollView,
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery } from "@tanstack/react-query";
import { COLORS, BORDER_RADIUS } from "../../lib/theme";
import { fetchTeam, TeamMember } from "../../lib/api";

function committeeAccent(name: string): { color: string; bg: string } {
  if (name.includes("Managing")) return { color: COLORS.primary, bg: "rgba(15,92,58,0.1)" };
  if (name.includes("Breed Council")) return { color: "#8B5CF6", bg: "rgba(139,92,246,0.1)" };
  if (name.includes("Show Committee")) return { color: "#3B82F6", bg: "rgba(59,130,246,0.08)" };
  if (name.includes("Group Breed")) return { color: COLORS.accent, bg: "rgba(199,164,92,0.12)" };
  if (name.includes("Show Team")) return { color: "#F59E0B", bg: "rgba(245,158,11,0.08)" };
  if (name.includes("Breed Warden")) return { color: "#0891B2", bg: "rgba(8,145,178,0.08)" };
  return { color: COLORS.textSecondary, bg: "rgba(107,114,128,0.08)" };
}

function MemberCard({ member }: { member: TeamMember }) {
  const [imgError, setImgError] = useState(false);
  const initials = member.full_name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
  const accent = committeeAccent(member.committee_name);

  return (
    <View style={styles.card}>
      <View style={[styles.avatarWrap, { backgroundColor: accent.bg }]}>
        {!imgError && member.imageUrl ? (
          <Image
            source={{ uri: member.imageUrl }}
            style={styles.avatar}
            onError={() => setImgError(true)}
          />
        ) : (
          <Text style={[styles.avatarInitials, { color: accent.color }]}>{initials}</Text>
        )}
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.memberName}>{member.full_name}</Text>
        <View style={[styles.positionBadge, { backgroundColor: accent.bg }]}>
          <Text style={[styles.positionText, { color: accent.color }]}>
            {member.position_name}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function TheTeamScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const { data: members, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["/api/mobile/team"],
    queryFn: fetchTeam,
  });

  const committeeOrder: string[] = [];
  const grouped: Record<string, TeamMember[]> = {};
  (members ?? []).forEach((m) => {
    if (!grouped[m.committee_name]) {
      grouped[m.committee_name] = [];
      committeeOrder.push(m.committee_name);
    }
    grouped[m.committee_name].push(m);
  });

  const orderedKeys = committeeOrder;
  Object.values(grouped).forEach((list) =>
    list.sort((a, b) => {
      const rank = (pos: string) => {
        const l = pos.toLowerCase();
        if (l === "member") return 2;
        if (l.startsWith("member")) return 1;
        return 0;
      };
      const dr = rank(a.position_name) - rank(b.position_name);
      return dr !== 0 ? dr : a.position_name.localeCompare(b.position_name);
    })
  );

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          tintColor={COLORS.primary}
          colors={[COLORS.primary]}
        />
      }
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

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 48 }} size="large" color={COLORS.primary} />
      ) : (
        <View style={styles.content}>
          {orderedKeys.map((committee) => {
            const accent = committeeAccent(committee);
            return (
              <View key={committee} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionDot, { backgroundColor: accent.color }]} />
                  <Text style={styles.sectionTitle}>{committee}</Text>
                </View>
                <View style={styles.cardsWrap}>
                  {grouped[committee].map((member) => (
                    <MemberCard key={member.team_id} member={member} />
                  ))}
                </View>
              </View>
            );
          })}
        </View>
      )}
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
  content: { paddingHorizontal: 16, marginTop: 20, gap: 24 },
  section: { gap: 10 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 },
  sectionDot: { width: 8, height: 8, borderRadius: 4 },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: COLORS.textSecondary, textTransform: "uppercase", letterSpacing: 0.5 },
  cardsWrap: { gap: 8 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: BORDER_RADIUS.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  avatarWrap: {
    width: 52, height: 52, borderRadius: 14,
    justifyContent: "center", alignItems: "center",
    overflow: "hidden",
  },
  avatar: { width: 52, height: 52 },
  avatarInitials: { fontSize: 17, fontWeight: "800" },
  cardBody: { flex: 1, gap: 4 },
  memberName: { fontSize: 15, fontWeight: "700", color: COLORS.text },
  positionBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6,
  },
  positionText: { fontSize: 11, fontWeight: "600" },
});
