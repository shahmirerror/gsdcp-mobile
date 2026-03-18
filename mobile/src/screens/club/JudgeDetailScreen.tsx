import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery } from "@tanstack/react-query";
import { COLORS, BORDER_RADIUS } from "../../lib/theme";
import { fetchJudgeDetail } from "../../lib/api";
import { TheClubStackParamList } from "../../navigation/AppNavigator";
import { stripHtml } from "../../lib/api";

function credentialColor(credentials: string): { bg: string; text: string } {
  const c = credentials.toLowerCase();
  if (c.includes("wusv")) return { bg: "rgba(139,92,246,0.1)", text: "#7C3AED" };
  if (c.includes("fci")) return { bg: "rgba(59,130,246,0.1)", text: "#2563EB" };
  if (c.includes("sv")) return { bg: "rgba(199,164,92,0.12)", text: COLORS.accent };
  if (c.includes("körmeister")) return { bg: "rgba(15,92,58,0.08)", text: COLORS.primary };
  return { bg: "rgba(15,92,58,0.08)", text: COLORS.primary };
}

export default function JudgeDetailScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const route = useRoute<RouteProp<TheClubStackParamList, "JudgeDetail">>();
  const { id, backLabel } = route.params;

  const [imgError, setImgError] = useState(false);

  const { data: judge, isLoading } = useQuery({
    queryKey: ["/api/mobile/all-judges", id],
    queryFn: () => fetchJudgeDetail(id),
  });

  const initials = judge
    ? judge.full_name.split(" ").filter(Boolean).slice(0, 2).map((w: string) => w[0].toUpperCase()).join("")
    : "";

  const colors = judge ? credentialColor(judge.credentials) : { bg: "", text: "" };
  const bio = judge ? stripHtml(judge.description) : "";

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 48 }}
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
          <Text style={styles.backText}>{backLabel ?? "Judges"}</Text>
        </TouchableOpacity>

        {isLoading ? (
          <ActivityIndicator size="large" color="#fff" style={{ marginVertical: 32 }} />
        ) : judge ? (
          <View style={styles.heroWrap}>
            {!imgError ? (
              <Image
                source={{ uri: judge.imageUrl }}
                style={styles.heroImage}
                onError={() => setImgError(true)}
              />
            ) : (
              <View style={[styles.heroImage, styles.heroFallback]}>
                <Text style={styles.heroInitials}>{initials}</Text>
              </View>
            )}
            <Text style={styles.heroName}>{judge.full_name}</Text>
            <View style={[styles.credBadge, { backgroundColor: "rgba(255,255,255,0.18)" }]}>
              <Text style={styles.credText}>{judge.credentials}</Text>
            </View>
          </View>
        ) : null}
      </LinearGradient>

      {!isLoading && judge && bio.length > 0 && (
        <View style={styles.bioSection}>
          <View style={styles.bioHeader}>
            <Ionicons name="person-outline" size={16} color={COLORS.primary} />
            <Text style={styles.bioTitle}>Biography</Text>
          </View>
          <Text style={styles.bioText}>{bio}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 20, paddingBottom: 36, alignItems: "center" },
  backBtn: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", marginBottom: 20, gap: 4 },
  backText: { fontSize: 15, color: "#fff", fontWeight: "600" },
  heroWrap: { alignItems: "center", gap: 12 },
  heroImage: {
    width: 110, height: 110, borderRadius: 24,
    borderWidth: 3, borderColor: "rgba(255,255,255,0.3)",
  },
  heroFallback: {
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center", alignItems: "center",
  },
  heroInitials: { fontSize: 36, fontWeight: "800", color: "#fff" },
  heroName: { fontSize: 22, fontWeight: "800", color: "#fff", textAlign: "center" },
  credBadge: {
    paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 8,
  },
  credText: { fontSize: 12, fontWeight: "700", color: "#fff", letterSpacing: 0.3 },
  bioSection: {
    marginHorizontal: 16, marginTop: 24,
    backgroundColor: "#fff", borderRadius: BORDER_RADIUS.lg,
    padding: 18, borderWidth: 1, borderColor: COLORS.border,
  },
  bioHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  bioTitle: { fontSize: 14, fontWeight: "700", color: COLORS.primary },
  bioText: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22 },
});
