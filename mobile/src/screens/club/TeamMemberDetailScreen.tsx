import {
  ScrollView,
  View,
  Text,
  Image,
  ImageBackground,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from "react-native";
import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery } from "@tanstack/react-query";
import { COLORS, BORDER_RADIUS } from "../../lib/theme";
import { fetchTeamMember, stripHtml, TeamMember } from "../../lib/api";
import { TheClubStackParamList } from "../../navigation/AppNavigator";

const heroBg = require("../../../assets/hero-bg.png");

const openLink = (url: string) => Linking.openURL(url).catch(() => {});

function committeeColor(name: string): string {
  if (name.includes("Managing")) return COLORS.primary;
  if (name.includes("Breed Council")) return "#8B5CF6";
  if (name.includes("Show Committee")) return "#3B82F6";
  if (name.includes("Group Breed")) return COLORS.accent;
  if (name.includes("Show Team")) return "#F59E0B";
  if (name.includes("Breed Warden")) return "#0891B2";
  return COLORS.textSecondary;
}

type SocialLink = {
  key: keyof Pick<TeamMember, "facebook_url" | "instagram_url" | "twitter_url" | "youtube_url">;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  color: string;
};

const SOCIAL_LINKS: SocialLink[] = [
  { key: "facebook_url", label: "Facebook", icon: "logo-facebook", color: "#1877F2" },
  { key: "instagram_url", label: "Instagram", icon: "logo-instagram", color: "#E1306C" },
  { key: "twitter_url", label: "Twitter", icon: "logo-twitter", color: "#1DA1F2" },
  { key: "youtube_url", label: "YouTube", icon: "logo-youtube", color: "#FF0000" },
];

export default function TeamMemberDetailScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const route = useRoute<RouteProp<TheClubStackParamList, "TeamMemberDetail">>();
  const { id } = route.params;

  const [imgError, setImgError] = useState(false);

  const { data: member, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["/api/mobile/team", id],
    queryFn: () => fetchTeamMember(id),
  });

  const initials = member
    ? member.full_name.split(" ").filter(Boolean).slice(0, 2).map((w: string) => w[0].toUpperCase()).join("")
    : "";

  const bio = member?.description ? stripHtml(member.description) : "";
  const accentColor = member ? committeeColor(member.committee_name) : COLORS.primary;

  const activeSocials = member
    ? SOCIAL_LINKS.filter((s) => !!member[s.key])
    : [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.primary} colors={[COLORS.primary]} />
      }
    >
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
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
      </ImageBackground>

      {isLoading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : member ? (
        <>
          <View style={styles.profileSection}>
            <View style={[styles.avatarOuter, { borderColor: accentColor }]}>
              {!imgError && member.imageUrl ? (
                <Image
                  source={{ uri: member.imageUrl }}
                  style={styles.avatarPhoto}
                  resizeMode="cover"
                  onError={() => setImgError(true)}
                />
              ) : (
                <View style={[styles.avatarInner, { backgroundColor: `${accentColor}18` }]}>
                  <Text style={[styles.avatarInitials, { color: accentColor }]}>{initials}</Text>
                </View>
              )}
            </View>

            <Text style={styles.name}>{member.full_name}</Text>
            <Text style={styles.position}>{member.position_name}</Text>

            <View style={[styles.committeeBadge, { backgroundColor: `${accentColor}12`, borderColor: `${accentColor}30` }]}>
              <Ionicons name="shield-checkmark-outline" size={13} color={accentColor} />
              <Text style={[styles.committeeText, { color: accentColor }]}>{member.committee_name}</Text>
            </View>

            {activeSocials.length > 0 && (
              <View style={styles.socialRow}>
                {activeSocials.map((s) => (
                  <TouchableOpacity
                    key={s.key}
                    style={[styles.socialBtn, { backgroundColor: `${s.color}12`, borderColor: `${s.color}30` }]}
                    onPress={() => openLink(member[s.key] as string)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name={s.icon} size={20} color={s.color} />
                    <Text style={[styles.socialLabel, { color: s.color }]}>{s.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {bio.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="document-text-outline" size={18} color={COLORS.accent} />
                <Text style={styles.sectionTitle}>Biography</Text>
              </View>
              <View style={styles.bioCard}>
                {bio
                  .split("\n\n")
                  .map((para) => para.replace(/\n/g, " ").trim())
                  .filter((para) => para.length > 0)
                  .map((para, i, arr) => (
                    <Text key={i} style={[styles.bioText, i < arr.length - 1 && styles.bioPara]}>
                      {para}
                    </Text>
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
    marginBottom: 8,
  },
  avatarOuter: {
    width: 144, height: 144, borderRadius: 72,
    borderWidth: 4,
    backgroundColor: "#fff",
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.1,
    shadowRadius: 25,
    elevation: 8,
  },
  avatarPhoto: { flex: 1, borderRadius: 9999 },
  avatarInner: {
    flex: 1, borderRadius: 9999,
    justifyContent: "center", alignItems: "center",
  },
  avatarInitials: { fontSize: 36, fontWeight: "800" },

  name: {
    fontSize: 24, fontWeight: "800", color: "#0F172A",
    textAlign: "center", marginTop: 16, lineHeight: 32,
  },
  position: {
    fontSize: 14, color: COLORS.textSecondary,
    textAlign: "center", marginTop: 4,
  },
  committeeBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderWidth: 1,
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7,
    marginTop: 12,
  },
  committeeText: { fontSize: 13, fontWeight: "600" },

  socialRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    marginTop: 16,
  },
  socialBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  socialLabel: { fontSize: 13, fontWeight: "600" },

  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: COLORS.text },

  bioCard: {
    backgroundColor: "#fff",
    borderRadius: BORDER_RADIUS.md,
    padding: 16, borderWidth: 1, borderColor: "#E8E8E4",
  },
  bioText: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22 },
  bioPara: { marginBottom: 12 },
});
