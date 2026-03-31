import {
  ScrollView,
  View,
  Text,
  Image,
  ImageBackground,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery } from "@tanstack/react-query";
import { COLORS, BORDER_RADIUS } from "../../lib/theme";
import { fetchJudgeDetail, stripHtml, JudgeShow } from "../../lib/api";
import { TheClubStackParamList } from "../../navigation/AppNavigator";
import { formatDate } from "../../lib/dateUtils";

const heroBg = require("../../../assets/hero-bg.jpg");

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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero banner — same pattern as Dog/Breeder/Kennel profiles */}
      <ImageBackground source={heroBg} style={styles.heroBanner} resizeMode="cover">
        <LinearGradient
          colors={["rgba(246,248,247,0)", "rgba(246,248,247,0.6)", "#f6f8f7"]}
          style={styles.heroGradient}
          pointerEvents="none"
        />
        <TouchableOpacity
          style={[styles.backButton, { top: insets.top + 12 }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          data-testid="btn-back"
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
      </ImageBackground>

      {/* Profile section */}
      {isLoading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : judge ? (
        <>
          <View style={styles.profileSection}>
            {/* Avatar with gold ring + credential badge */}
            <View style={styles.avatarOuter}>
              {!imgError ? (
                <Image
                  source={{ uri: judge.imageUrl }}
                  style={styles.avatarPhoto}
                  resizeMode="cover"
                  onError={() => setImgError(true)}
                />
              ) : (
                <View style={styles.avatarInner}>
                  <Text style={styles.avatarInitials}>{initials}</Text>
                </View>
              )}
              <View style={styles.badgePill}>
                <Text style={styles.badgePillText}>{shortBadge}</Text>
              </View>
            </View>

            <Text style={styles.name}>{judge.full_name}</Text>
            <Text style={styles.credentials}>{judge.credentials}</Text>
          </View>

          {/* Shows judged count — only rendered when shows array is present */}
          {judge.shows && judge.shows.length > 0 && (
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{judge.shows.length}</Text>
                <Text style={styles.statLabel}>SHOWS JUDGED</Text>
              </View>
            </View>
          )}

          {/* Certification badges */}
          <View style={styles.section}>
            <View style={styles.badgesRow}>
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

          {/* Notable Appointments */}
          {judge.shows && judge.shows.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="calendar-outline" size={18} color={COLORS.accent} />
                <Text style={styles.sectionTitle}>Recorded Appointments</Text>
              </View>
              <View style={styles.appointmentsCard}>
                {judge.shows.map((show: JudgeShow, i: number) => (
                  <TouchableOpacity
                    key={show.id}
                    style={[styles.appointmentRow, i < judge.shows!.length - 1 && styles.appointmentRowBorder]}
                    onPress={() => (navigation as any).push("ShowDetail", { id: show.id, name: show.title })}
                    activeOpacity={0.7}
                    data-testid={`show-appt-${show.id}`}
                  >
                    <View style={styles.appointmentLeft}>
                      <View style={[styles.apptDot, i === 0 ? styles.apptDotActive : styles.apptDotInactive]} />
                      {i < judge.shows!.length - 1 && <View style={styles.apptLine} />}
                    </View>
                    <View style={styles.appointmentContent}>
                      <Text style={styles.apptDate}>{formatDate(show.start_date)}</Text>
                      <Text style={styles.apptName}>{show.title}</Text>
                      {(show.venue || show.city) && (
                        <Text style={styles.apptMeta}>
                          {[show.venue, show.city].filter(Boolean).join(", ")}
                        </Text>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={15} color={COLORS.textMuted} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f8f7" },
  scrollContent: { paddingBottom: 48 },

  heroBanner: { width: "100%", height: 256 },
  heroGradient: { position: "absolute", left: 0, right: 0, bottom: 0, height: 256 },
  backButton: {
    position: "absolute",
    left: 16,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center", alignItems: "center",
    zIndex: 10,
  },

  profileSection: {
    alignItems: "center",
    marginTop: -80,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  avatarOuter: {
    width: 144, height: 144, borderRadius: 72,
    borderWidth: 4, borderColor: COLORS.accent,
    backgroundColor: "#fff",
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.1,
    shadowRadius: 25,
    elevation: 8,
    position: "relative",
  },
  avatarPhoto: { flex: 1, borderRadius: 9999 },
  avatarInner: {
    flex: 1, borderRadius: 9999,
    backgroundColor: "rgba(15,92,59,0.1)",
    justifyContent: "center", alignItems: "center",
  },
  avatarInitials: { fontSize: 36, fontWeight: "800", color: COLORS.primary },

  badgePill: {
    position: "absolute",
    bottom: -2,
    alignSelf: "center",
    left: "50%",
    transform: [{ translateX: -26 }],
    backgroundColor: COLORS.accent,
    borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3,
    minWidth: 52, alignItems: "center",
    borderWidth: 2, borderColor: "#fff",
  },
  badgePillText: {
    fontSize: 8, fontWeight: "800", color: "#fff",
    textAlign: "center", textTransform: "uppercase", letterSpacing: 0.4, lineHeight: 11,
  },

  name: {
    fontSize: 24, fontWeight: "800", color: "#0F172A",
    textAlign: "center", marginTop: 16, lineHeight: 32,
  },
  credentials: {
    fontSize: 13, color: COLORS.textSecondary,
    textAlign: "center", lineHeight: 19, marginTop: 4,
  },

  statsRow: {
    flexDirection: "row", justifyContent: "center",
    marginHorizontal: 16, marginBottom: 4,
    gap: 12,
  },
  statBox: {
    flex: 1, maxWidth: 160,
    backgroundColor: "#fff", borderRadius: BORDER_RADIUS.md,
    borderWidth: 1, borderColor: "#E8E8E4",
    alignItems: "center", paddingVertical: 14,
  },
  statValue: { fontSize: 22, fontWeight: "800", color: COLORS.accent },
  statLabel: { fontSize: 10, fontWeight: "700", color: COLORS.textMuted, letterSpacing: 0.5, marginTop: 2 },

  section: { paddingHorizontal: 16, marginTop: 16 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: COLORS.text },

  badgesRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  certBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderWidth: 1.5, borderColor: COLORS.primary,
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7,
    backgroundColor: "#fff",
  },
  certBadgeText: { fontSize: 13, fontWeight: "600", color: COLORS.primary },

  bioCard: {
    backgroundColor: "#fff",
    borderRadius: BORDER_RADIUS.md,
    padding: 16, borderWidth: 1, borderColor: "#E8E8E4",
  },
  bioText: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22 },

  appointmentsCard: {
    backgroundColor: "#fff",
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1, borderColor: "#E8E8E4",
    overflow: "hidden",
  },
  appointmentRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  appointmentRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0EE",
  },
  appointmentLeft: {
    alignItems: "center",
    width: 14,
    paddingTop: 3,
  },
  apptDot: {
    width: 12, height: 12, borderRadius: 6,
  },
  apptDotActive: { backgroundColor: "#F97316" },
  apptDotInactive: { backgroundColor: "#D1D5DB" },
  apptLine: {
    flex: 1,
    width: 2,
    backgroundColor: "#E8E8E4",
    marginTop: 4,
    minHeight: 20,
  },
  appointmentContent: { flex: 1 },
  apptDate: {
    fontSize: 10, fontWeight: "700",
    color: COLORS.textMuted,
    textTransform: "uppercase", letterSpacing: 0.6,
    marginBottom: 3,
  },
  apptName: {
    fontSize: 14, fontWeight: "700",
    color: COLORS.text,
    marginBottom: 3,
  },
  apptMeta: {
    fontSize: 12, color: COLORS.textMuted, lineHeight: 17,
  },
});
