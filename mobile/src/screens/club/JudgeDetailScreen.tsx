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
import { useQuery } from "@tanstack/react-query";
import { COLORS, BORDER_RADIUS } from "../../lib/theme";
import { fetchJudgeDetail } from "../../lib/api";
import { TheClubStackParamList } from "../../navigation/AppNavigator";
import { stripHtml } from "../../lib/api";

function getShortBadge(credentials: string): string {
  const c = credentials.toLowerCase();
  if (c.includes("wusv")) return "WUSV\nJUDGE";
  if (c.includes("fci")) return "FCI\nJUDGE";
  if (c.includes("sv")) return "SV\nJUDGE";
  if (c.includes("gsdcp")) return "GSDCP\nJUDGE";
  return "JUDGE";
}

function getCertBadges(credentials: string): string[] {
  const c = credentials.toLowerCase();
  const badges: string[] = [];
  if (c.includes("gsdcp")) badges.push("GSDCP Official");
  if (c.includes("wusv")) badges.push("WUSV Certified");
  if (c.includes("fci")) badges.push("FCI Certified");
  if (c.includes("sv") && !c.includes("wusv") && !c.includes("fci")) badges.push("SV Licensed");
  if (c.includes("körmeister")) badges.push("Körmeister");
  if (badges.length === 0) badges.push("Licensed Judge");
  return badges;
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

  const bio = judge ? stripHtml(judge.description) : "";
  const shortBadge = judge ? getShortBadge(judge.credentials) : "";
  const certBadges = judge ? getCertBadges(judge.credentials) : [];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Top navigation bar */}
      <View style={styles.navbar}>
        <TouchableOpacity style={styles.navBtn} onPress={() => navigation.goBack()} data-testid="button-back">
          <Ionicons name="chevron-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Judge Profile</Text>
        <View style={styles.navBtn} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>
        {isLoading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 80 }} />
        ) : judge ? (
          <>
            {/* Profile hero */}
            <View style={styles.heroSection}>
              <View style={styles.photoWrap}>
                {!imgError ? (
                  <Image
                    source={{ uri: judge.imageUrl }}
                    style={styles.photo}
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <View style={[styles.photo, styles.photoFallback]}>
                    <Text style={styles.initials}>{initials}</Text>
                  </View>
                )}
                <View style={styles.badgePill}>
                  <Text style={styles.badgeText}>{shortBadge}</Text>
                </View>
              </View>

              <Text style={styles.name}>{judge.full_name}</Text>
              <Text style={styles.credentials}>{judge.credentials}</Text>
            </View>

            {/* Contact CTA */}
            <View style={styles.section}>
              <TouchableOpacity style={styles.contactBtn} activeOpacity={0.85} data-testid="button-contact">
                <Ionicons name="mail-outline" size={18} color="#fff" />
                <Text style={styles.contactBtnText}>Contact for Assignment</Text>
              </TouchableOpacity>
            </View>

            {/* Certification badges */}
            <View style={[styles.section, styles.badgesRow]}>
              {certBadges.map((b, i) => (
                <View key={i} style={styles.certBadge}>
                  <Ionicons
                    name={b.includes("GSDCP") ? "shield-checkmark-outline" : "ribbon-outline"}
                    size={13}
                    color={COLORS.primary}
                  />
                  <Text style={styles.certBadgeText}>{b}</Text>
                </View>
              ))}
            </View>

            {/* Biography */}
            {bio.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="document-text-outline" size={18} color={COLORS.accent} />
                  <Text style={styles.sectionTitle}>Biography</Text>
                </View>
                <View style={styles.bioCard}>
                  <Text style={styles.bioText}>{bio}</Text>
                </View>
              </View>
            )}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff" },

  navbar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: "#F0F0EE",
  },
  navBtn: { width: 36, height: 36, justifyContent: "center", alignItems: "center" },
  navTitle: { fontSize: 16, fontWeight: "700", color: COLORS.text },

  heroSection: { alignItems: "center", paddingTop: 32, paddingBottom: 8, paddingHorizontal: 24 },
  photoWrap: { position: "relative", marginBottom: 20 },
  photo: {
    width: 110, height: 110, borderRadius: 55,
    borderWidth: 3, borderColor: COLORS.accent,
  },
  photoFallback: {
    backgroundColor: "rgba(15,92,58,0.08)",
    justifyContent: "center", alignItems: "center",
  },
  initials: { fontSize: 36, fontWeight: "800", color: COLORS.primary },
  badgePill: {
    position: "absolute", bottom: -4, alignSelf: "center",
    left: "50%",
    transform: [{ translateX: -28 }],
    backgroundColor: COLORS.accent,
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4,
    minWidth: 56, alignItems: "center",
    borderWidth: 2, borderColor: "#fff",
  },
  badgeText: {
    fontSize: 9, fontWeight: "800", color: "#fff",
    textAlign: "center", textTransform: "uppercase", letterSpacing: 0.4, lineHeight: 12,
  },
  name: {
    fontSize: 22, fontWeight: "800", color: COLORS.primaryDark,
    textAlign: "center", marginBottom: 6,
  },
  credentials: {
    fontSize: 13, color: COLORS.textSecondary,
    textAlign: "center", lineHeight: 19, marginBottom: 4,
  },

  section: { paddingHorizontal: 16, marginTop: 16 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: COLORS.text },

  contactBtn: {
    backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.lg,
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 15,
  },
  contactBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },

  badgesRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  certBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderWidth: 1.5, borderColor: COLORS.primary,
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7,
    backgroundColor: "#fff",
  },
  certBadgeText: { fontSize: 13, fontWeight: "600", color: COLORS.primary },

  bioCard: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: 16, borderWidth: 1, borderColor: "#E8E8E4",
  },
  bioText: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22 },
});
