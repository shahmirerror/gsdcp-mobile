import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  ImageBackground,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from "../lib/theme";
import { fetchMemberDetail, Member, MemberDetail, MemberOwnedDog } from "../lib/api";

const heroBg = require("../../assets/hero-bg.jpg");

type TabId = "detail" | "kennel" | "dogs";

const TABS: { id: TabId; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: "detail", label: "Detail", icon: "person-outline" },
  { id: "kennel", label: "Kennel", icon: "home-outline" },
  { id: "dogs", label: "Dogs", icon: "paw-outline" },
];

function getInitials(name: string): string {
  const t = name.trim();
  if (!t) return "?";
  return t.split(" ").filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function isValidImage(url: string | null | undefined): boolean {
  if (!url) return false;
  if (url.includes("user-not-found")) return false;
  if (url.includes("dog_not_found")) return false;
  if (url.startsWith("https::")) return false;
  return url.startsWith("http");
}

function getMembershipType(no: string): { label: string; color: string; bg: string } {
  if (no.startsWith("T-")) return { label: "Temporary Member", color: "#92400E", bg: "#FEF3C7" };
  if (no.startsWith("P-")) return { label: "Permanent Member", color: "#fff", bg: COLORS.primary };
  return { label: "Member", color: COLORS.textMuted, bg: COLORS.border };
}

function calcAge(dob: string | null): string | null {
  if (!dob) return null;
  const years = Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
  if (years < 1) return "< 1 Yr";
  return `${years} Yr${years !== 1 ? "s" : ""}`;
}

/* ── Tab: Detail ──────────────────────────────────── */
function DetailTab({ detail, passedMember }: { detail: MemberDetail | undefined; passedMember?: Member }) {
  const member = detail?.member ?? passedMember;
  if (!member) return null;

  const mType = getMembershipType(member.membership_no);
  const showAddress = (detail?.member as any)?.check_address === "Show" && (detail?.member as any)?.address;

  const rows: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; valueColor?: string }[] = [
    { icon: "card-outline", label: "Membership No", value: member.membership_no },
    {
      icon: "checkmark-circle-outline",
      label: "Status",
      value: member.membership_no.startsWith("P-") ? "Active" : "Temporary",
      valueColor: member.membership_no.startsWith("P-") ? COLORS.primary : "#F59E0B",
    },
    ...(member.city ? [{ icon: "location-outline" as keyof typeof Ionicons.glyphMap, label: "City", value: member.city! }] : []),
    ...(member.country ? [{ icon: "flag-outline" as keyof typeof Ionicons.glyphMap, label: "Country", value: member.country! }] : []),
    ...(showAddress ? [{ icon: "home-outline" as keyof typeof Ionicons.glyphMap, label: "Address", value: (detail?.member as any).address }] : []),
  ];

  return (
    <View style={tab.card}>
      <Text style={tab.cardTitle}>Membership Status</Text>
      {rows.map((row, i) => (
        <View key={row.label} style={[tab.row, i === rows.length - 1 && { borderBottomWidth: 0 }]}>
          <View style={tab.rowLeft}>
            <Ionicons name={row.icon} size={17} color={COLORS.textMuted} />
            <Text style={tab.rowLabel}>{row.label}</Text>
          </View>
          <Text style={[tab.rowValue, row.valueColor ? { color: row.valueColor, fontWeight: "700" } : null]}>
            {row.value}
          </Text>
        </View>
      ))}
    </View>
  );
}

/* ── Tab: Kennel ──────────────────────────────────── */
function KennelTab() {
  return (
    <View style={tab.emptyState}>
      <Ionicons name="home-outline" size={52} color={COLORS.border} />
      <Text style={tab.emptyTitle}>No Kennel Registered</Text>
      <Text style={tab.emptyBody}>This member has not registered a kennel with GSDCP.</Text>
    </View>
  );
}

/* ── Tab: Dogs ────────────────────────────────────── */
function DogsTab({ dogs, onDogPress }: { dogs: MemberOwnedDog[]; onDogPress: (dog: MemberOwnedDog) => void }) {
  if (dogs.length === 0) {
    return (
      <View style={tab.emptyState}>
        <Ionicons name="paw-outline" size={52} color={COLORS.border} />
        <Text style={tab.emptyTitle}>No Dogs Registered</Text>
        <Text style={tab.emptyBody}>No dogs are registered under this member.</Text>
      </View>
    );
  }

  return (
    <View style={tab.card}>
      <Text style={tab.cardTitle}>Registered Dogs ({dogs.length})</Text>
      {dogs.map((dog, i) => {
        const hasPhoto = isValidImage(dog.imageUrl);
        const age = calcAge(dog.dob);
        const sexColor = dog.sex === "Male" ? "#1D4ED8" : "#BE185D";
        const sexBg = dog.sex === "Male" ? "#EFF6FF" : "#FDF2F8";

        return (
          <TouchableOpacity
            key={dog.id}
            style={[tab.dogRow, i === dogs.length - 1 && { borderBottomWidth: 0 }]}
            onPress={() => onDogPress(dog)}
            activeOpacity={0.72}
            data-testid={`card-dog-${dog.id}`}
          >
            <View style={tab.dogThumb}>
              {hasPhoto ? (
                <Image source={{ uri: dog.imageUrl! }} style={tab.dogThumbImg} resizeMode="cover" />
              ) : (
                <View style={tab.dogThumbPlaceholder}>
                  <Ionicons name="paw" size={22} color={COLORS.primary} style={{ opacity: 0.25 }} />
                </View>
              )}
            </View>
            <View style={tab.dogInfo}>
              <Text style={tab.dogName} numberOfLines={1}>{dog.dog_name}</Text>
              <Text style={tab.dogKP} numberOfLines={1}>KP {dog.KP || dog.foreign_reg_no}</Text>
              <View style={tab.dogTags}>
                <View style={[tab.sexPill, { backgroundColor: sexBg }]}>
                  <Text style={[tab.sexPillTxt, { color: sexColor }]}>{dog.sex}</Text>
                </View>
                {dog.color ? (
                  <View style={tab.greyPill}>
                    <Text style={tab.greyPillTxt} numberOfLines={1}>{dog.color}</Text>
                  </View>
                ) : null}
                {age ? (
                  <View style={tab.greyPill}>
                    <Text style={tab.greyPillTxt}>{age}</Text>
                  </View>
                ) : null}
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/* ── Screen ───────────────────────────────────────── */
export default function MemberProfileScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabId>("detail");

  const { id, member: passedMember } = route.params as { id: string; member?: Member };

  const { data: detail, isLoading, refetch, isRefetching } = useQuery<MemberDetail>({
    queryKey: ["member-detail", id],
    queryFn: () => fetchMemberDetail(id),
    retry: 1,
  });

  const member = detail?.member ?? passedMember;
  const ownedDogs = detail?.ownedDogs ?? [];

  if (!member && isLoading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!member) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Ionicons name="person-outline" size={48} color={COLORS.textMuted} />
        <Text style={styles.errorText}>Member not found</Text>
        <TouchableOpacity style={styles.goBackBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.goBackBtnText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const hasPhoto = isValidImage(member.imageUrl);
  const memberName = member.member_name.trim() || "GSDCP Member";
  const initials = getInitials(memberName);
  const mType = getMembershipType(member.membership_no);

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.primary} colors={[COLORS.primary]} />}
    >
      {/* ── Hero ── */}
      <ImageBackground source={heroBg} style={styles.heroBanner} resizeMode="cover">
        <LinearGradient
          colors={["rgba(246,248,247,0)", "rgba(246,248,247,0.55)", "#F5F5F2"]}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />
        <TouchableOpacity
          style={[styles.backButton, { top: insets.top + 12 }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
          data-testid="btn-back"
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={[styles.heroTitleWrap, { top: insets.top + 12 }]}>
          <Text style={styles.heroTitle}>Member Profile</Text>
        </View>
      </ImageBackground>

      {/* ── Avatar & Name ── */}
      <View style={styles.profileSection}>
        <View style={styles.avatarOuter}>
          {hasPhoto ? (
            <Image source={{ uri: member.imageUrl! }} style={styles.avatarImage} resizeMode="cover" />
          ) : (
            <View style={styles.avatarInner}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}
        </View>
        <Text style={styles.memberName}>{memberName}</Text>
        <View style={[styles.typeBadge, { backgroundColor: mType.bg }]}>
          <Text style={[styles.typeBadgeText, { color: mType.color }]}>{mType.label}</Text>
        </View>
        <Text style={styles.memberNo}>GSDCP ID: #{member.membership_no}</Text>
      </View>

      {/* ── Tab Bar ── */}
      <View style={styles.tabBar}>
        {TABS.map((t) => {
          const active = t.id === activeTab;
          const count = t.id === "dogs" ? ownedDogs.length : null;
          return (
            <TouchableOpacity
              key={t.id}
              style={[styles.tabItem, active && styles.tabItemActive]}
              onPress={() => setActiveTab(t.id)}
              activeOpacity={0.75}
              data-testid={`tab-${t.id}`}
            >
              <Ionicons
                name={t.icon}
                size={16}
                color={active ? COLORS.primary : COLORS.textMuted}
              />
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                {t.label}{count !== null && !isLoading ? ` (${count})` : ""}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Tab Content ── */}
      <View style={styles.tabContent}>
        {isLoading && activeTab !== "detail" ? (
          <View style={styles.tabLoading}>
            <ActivityIndicator size="small" color={COLORS.primary} />
          </View>
        ) : activeTab === "detail" ? (
          <DetailTab detail={detail} passedMember={passedMember} />
        ) : activeTab === "kennel" ? (
          <KennelTab />
        ) : (
          <DogsTab
            dogs={ownedDogs}
            onDogPress={(dog) => navigation.push("DogProfile", { id: dog.id, name: dog.dog_name })}
          />
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

/* ── Shared tab content styles ────────────────────── */
const tab = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  cardTitle: {
    fontSize: 11, fontWeight: "700", color: COLORS.textMuted,
    textTransform: "uppercase", letterSpacing: 0.9,
    paddingHorizontal: SPACING.md, paddingTop: SPACING.md, paddingBottom: SPACING.sm,
  },
  row: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: SPACING.md, paddingVertical: 13,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  rowLabel: { fontSize: 14, color: COLORS.text, fontWeight: "500" },
  rowValue: { fontSize: 14, fontWeight: "600", color: COLORS.text },

  dogRow: {
    flexDirection: "row", alignItems: "center", gap: SPACING.sm,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  dogThumb: {
    width: 56, height: 56, borderRadius: 10,
    overflow: "hidden", backgroundColor: "rgba(15,92,59,0.06)",
  },
  dogThumbImg: { width: "100%", height: "100%" },
  dogThumbPlaceholder: { flex: 1, justifyContent: "center", alignItems: "center" },
  dogInfo: { flex: 1 },
  dogName: { fontSize: 15, fontWeight: "700", color: COLORS.text },
  dogKP: { fontSize: 12, color: COLORS.textMuted, marginTop: 1 },
  dogTags: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 4 },
  sexPill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: BORDER_RADIUS.full },
  sexPillTxt: { fontSize: 10, fontWeight: "700" },
  greyPill: {
    paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full, backgroundColor: COLORS.border,
  },
  greyPillTxt: { fontSize: 10, fontWeight: "600", color: COLORS.textMuted },

  emptyState: {
    alignItems: "center", justifyContent: "center",
    paddingVertical: 56, paddingHorizontal: SPACING.xl, gap: 12,
  },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  emptyBody: { fontSize: 13, color: COLORS.textMuted, textAlign: "center", lineHeight: 20 },
});

/* ── Screen styles ────────────────────────────────── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F2" },

  heroBanner: { width: "100%", height: 220 },
  backButton: {
    position: "absolute", left: 16,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.32)",
    justifyContent: "center", alignItems: "center", zIndex: 10,
  },
  heroTitleWrap: {
    position: "absolute", left: 0, right: 0,
    alignItems: "center", zIndex: 5,
  },
  heroTitle: {
    fontSize: 17, fontWeight: "700", color: "#fff",
  },

  profileSection: {
    alignItems: "center",
    marginTop: -72,
    paddingBottom: SPACING.md,
  },
  avatarOuter: {
    width: 136, height: 136, borderRadius: 68,
    borderWidth: 4, borderColor: COLORS.accent,
    backgroundColor: "#fff", overflow: "hidden",
    marginBottom: SPACING.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 10, elevation: 8,
  },
  avatarInner: {
    flex: 1, backgroundColor: "rgba(15,92,59,0.08)",
    justifyContent: "center", alignItems: "center",
  },
  avatarImage: { width: "100%", height: "100%" },
  avatarInitials: { fontSize: 42, fontWeight: "800", color: COLORS.primary },
  memberName: {
    fontSize: 22, fontWeight: "800", color: COLORS.text,
    textAlign: "center", paddingHorizontal: SPACING.lg, marginBottom: 6,
  },
  typeBadge: {
    paddingHorizontal: 14, paddingVertical: 5,
    borderRadius: BORDER_RADIUS.full, marginBottom: 6,
  },
  typeBadgeText: { fontSize: 12, fontWeight: "700", letterSpacing: 0.3 },
  memberNo: { fontSize: 13, color: COLORS.textMuted, fontWeight: "500" },

  /* In-screen tab bar */
  tabBar: {
    flexDirection: "row",
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    backgroundColor: "#fff",
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  tabItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 11,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabItemActive: {
    borderBottomColor: COLORS.primary,
    backgroundColor: "rgba(15,92,59,0.05)",
  },
  tabLabel: {
    fontSize: 13, fontWeight: "600", color: COLORS.textMuted,
  },
  tabLabelActive: {
    color: COLORS.primary,
  },

  /* Tab content area */
  tabContent: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
  },
  tabLoading: {
    padding: SPACING.xl, alignItems: "center",
  },

  centered: { flex: 1, justifyContent: "center", alignItems: "center", gap: SPACING.md },
  errorText: { fontSize: FONT_SIZES.md, color: COLORS.textMuted },
  goBackBtn: {
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full, backgroundColor: COLORS.primary,
  },
  goBackBtnText: { fontSize: FONT_SIZES.sm, fontWeight: "700", color: "#fff" },
});
