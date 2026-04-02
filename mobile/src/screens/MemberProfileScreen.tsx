import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
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
import { fetchMemberDetail, Member, MemberDetail, MemberOwnedDog, MemberKennel, Dog } from "../lib/api";
import { DogListItem } from "../components/DogListItem";
import { useAuth } from "../contexts/AuthContext";
import LazyImage from "../components/LazyImage";

const heroBg = require("../../assets/hero-bg.jpg");

type TabId = "detail" | "kennel" | "dogs";

const TABS: { id: TabId; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: "detail", label: "Detail",  icon: "person-outline" },
  { id: "kennel", label: "Kennel",  icon: "home-outline"   },
  { id: "dogs",   label: "Dogs",    icon: "paw-outline"    },
];

/* ── helpers ──────────────────────────────────────── */
function getInitials(name: string): string {
  const t = name.trim();
  if (!t) return "?";
  return t.split(" ").filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function isValidImage(url: string | null | undefined): boolean {
  if (!url) return false;
  if (url.includes("user-not-found") || url.includes("dog_not_found")) return false;
  if (url.startsWith("https::")) return false;
  return url.startsWith("http");
}

function getMembershipType(no: string): { label: string; color: string; bg: string } {
  if (no.startsWith("T-")) return { label: "Temporary Member", color: "#92400E", bg: "#FEF3C7" };
  if (no.startsWith("P-")) return { label: "Permanent Member", color: "#fff",    bg: COLORS.primary };
  return { label: "Member", color: COLORS.textMuted, bg: COLORS.border };
}

function toListDog(d: MemberOwnedDog): Dog {
  return {
    id: d.id,
    dog_name: d.dog_name,
    KP: d.KP || null,
    breed: d.breed,
    sex: d.sex,
    dob: d.dob,
    color: d.color || null,
    imageUrl: d.imageUrl,
    owner: d.owner || null,
    breeder: d.breeder || null,
    sire: d.sire || null,
    sire_id: null,
    dam: d.dam || null,
    dam_id: null,
    titles: d.titles,
    microchip: d.microchip,
    foreign_reg_no: d.foreign_reg_no || null,
    hair: d.hair || null,
    hd: null, ed: null, working_title: null, dna_status: null,
    breed_survey_period: null, show_rating: null,
  };
}

/* ── DetailItem — matches DogProfileScreen ─────────── */
function DetailItem({
  icon,
  label,
  value,
  valueColor,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.detailItem}>
      <View style={styles.detailIconWrap}>
        <Ionicons name={icon} size={18} color={COLORS.primary} />
      </View>
      <View style={styles.detailTextWrap}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={[styles.detailValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
      </View>
    </View>
  );
}

/* ── LockedDetailItem ──────────────────────────────── */
function LockedDetailItem({
  icon,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  return (
    <View style={styles.detailItem}>
      <View style={styles.detailIconWrap}>
        <Ionicons name={icon} size={18} color={COLORS.primary} />
      </View>
      <View style={styles.detailTextWrap}>
        <Text style={styles.detailLabel}>{label}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 1 }}>
          <Ionicons name="lock-closed" size={13} color="#94A3B8" />
          <Text style={{ fontSize: 13, color: "#94A3B8", fontStyle: "italic" }}>Hidden by member</Text>
        </View>
      </View>
    </View>
  );
}

/* ── Tab: Detail ───────────────────────────────────── */
function DetailTab({ detail, passedMember }: { detail: MemberDetail | undefined; passedMember?: Member }) {
  const member = detail?.member ?? passedMember;
  if (!member) return null;

  const dm = detail?.member;
  const checkPhone   = dm?.check_phone   ?? "Hide";
  const checkEmail   = dm?.check_email   ?? "Hide";
  const checkAddress = dm?.check_address ?? "Hide";

  const statusLabel = member.membership_no.startsWith("P-") ? "Active" : "Temporary";
  const statusColor = member.membership_no.startsWith("P-") ? COLORS.primary : "#F59E0B";

  return (
    <View style={styles.card}>
      <Text style={styles.cardHeading}>Membership Status</Text>
      <View style={styles.detailsGrid}>
        <DetailItem icon="card"             label="Membership Number" value={member.membership_no} />
        <DetailItem icon="checkmark-circle" label="Status"            value={statusLabel} valueColor={statusColor} />
        {member.city    ? <DetailItem icon="location" label="City"    value={member.city!}    /> : null}
        {member.country ? <DetailItem icon="flag"     label="Country" value={member.country!} /> : null}

        {checkPhone === "Show" && dm?.phone
          ? <DetailItem icon="call" label="Phone" value={dm.phone} />
          : checkPhone === "Hide"
          ? <LockedDetailItem icon="call" label="Phone" />
          : null}

        {checkEmail === "Show" && dm?.email
          ? <DetailItem icon="mail" label="Email" value={dm.email} />
          : checkEmail === "Hide"
          ? <LockedDetailItem icon="mail" label="Email" />
          : null}

        {checkAddress === "Show" && dm?.address
          ? <DetailItem icon="home" label="Address" value={dm.address} />
          : checkAddress === "Hide"
          ? <LockedDetailItem icon="home" label="Address" />
          : null}
      </View>
    </View>
  );
}

/* ── Tab: Kennel ───────────────────────────────────── */
function KennelTab({ kennel, navigation }: { kennel: MemberKennel | null | undefined; navigation: any }) {
  if (!kennel) {
    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIconWrap}>
          <Ionicons name="home-outline" size={32} color={COLORS.primary} />
        </View>
        <Text style={styles.emptyTitle}>No Kennel Registered</Text>
        <Text style={styles.emptyDesc}>This member has not registered a kennel with GSDCP.</Text>
      </View>
    );
  }

  const hasImage =
    kennel.imageUrl &&
    !kennel.imageUrl.includes("user-not-found") &&
    !kennel.imageUrl.startsWith("https::");

  const initials = kennel.kennelName
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const phone =
    kennel.phone && kennel.phone !== "+00-000-000-0000" ? kennel.phone : null;

  const activeSince = kennel.active_since
    ? new Date(kennel.active_since).getFullYear().toString()
    : null;

  return (
    <View style={styles.card}>
      {/* Kennel identity row */}
      <View style={styles.kennelHeader}>
        {hasImage ? (
          <LazyImage source={{ uri: kennel.imageUrl! }} style={styles.kennelAvatar} />
        ) : (
          <View style={[styles.kennelAvatar, styles.kennelAvatarPlaceholder]}>
            <Text style={styles.kennelAvatarInitials}>{initials}</Text>
          </View>
        )}
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={styles.kennelName}>{kennel.kennelName}</Text>
          {kennel.suffix ? (
            <Text style={styles.kennelSuffix}>"{kennel.suffix}"</Text>
          ) : null}
          {kennel.city ? (
            <Text style={styles.kennelCity}>
              {kennel.city}{kennel.country ? `, ${kennel.country}` : ""}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.divider} />

      <Text style={styles.cardHeading}>Kennel Details</Text>
      <View style={styles.detailsGrid}>
        {kennel.prefix ? (
          <DetailItem icon="text-outline" label="Prefix" value={kennel.prefix} />
        ) : null}
        {phone ? (
          <DetailItem icon="call-outline" label="Phone" value={phone} />
        ) : null}
        {kennel.email ? (
          <DetailItem icon="mail-outline" label="Email" value={kennel.email} />
        ) : null}
        {kennel.location ? (
          <DetailItem icon="location-outline" label="Location" value={kennel.location} />
        ) : null}
        {activeSince ? (
          <DetailItem icon="calendar-outline" label="Active Since" value={activeSince} />
        ) : null}
      </View>

      <TouchableOpacity
        style={styles.kennelViewBtn}
        activeOpacity={0.8}
        onPress={() =>
          navigation.push("KennelProfile", {
            id: kennel.kennel_id,
            name: kennel.kennelName,
          })
        }
        data-testid="btn-view-kennel"
      >
        <Ionicons name="home" size={16} color="#fff" style={{ marginRight: 6 }} />
        <Text style={styles.kennelViewBtnText}>View Full Kennel Profile</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ── Tab: Dogs ─────────────────────────────────────── */
function DogsTab({ dogs, onDogPress }: { dogs: MemberOwnedDog[]; onDogPress: (d: MemberOwnedDog) => void }) {
  if (dogs.length === 0) {
    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIconWrap}>
          <Ionicons name="paw-outline" size={32} color={COLORS.primary} />
        </View>
        <Text style={styles.emptyTitle}>No Dogs Registered</Text>
        <Text style={styles.emptyDesc}>No dogs are registered under this member.</Text>
      </View>
    );
  }

  return (
    <View>
      {dogs.map((dog) => (
        <DogListItem
          key={dog.id}
          dog={toListDog(dog)}
          onPress={() => onDogPress(dog)}
        />
      ))}
    </View>
  );
}

/* ── Screen ────────────────────────────────────────── */
export default function MemberProfileScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
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
  const isOwnProfile = !!user && user.member_id === id;

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.primary} colors={[COLORS.primary]} />
      }
    >
      {/* ── Hero ── */}
      <ImageBackground source={heroBg} style={styles.heroBanner} resizeMode="cover">
        <LinearGradient
          colors={["rgba(246,248,247,0)", "rgba(246,248,247,0.6)", "#f6f8f7"]}
          style={styles.heroGradient}
          pointerEvents="none"
        />
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          data-testid="btn-back"
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
      </ImageBackground>

      {/* ── Avatar & Name ── */}
      <View style={styles.profileSection}>
        <View style={styles.avatarOuter}>
          {hasPhoto ? (
            <LazyImage source={{ uri: member.imageUrl! }} style={styles.avatarImage} resizeMode="cover" />
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
        <Text style={styles.memberNo}>Membership No: {member.membership_no}</Text>

        {isOwnProfile && (
          <View style={styles.ownerActions}>
            <TouchableOpacity style={styles.ownerActionBtn} activeOpacity={0.8} data-testid="btn-edit-profile">
              <Ionicons name="pencil-outline" size={15} color="#fff" />
              <Text style={styles.ownerActionBtnText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ownerActionBtnOutline} activeOpacity={0.8} data-testid="btn-edit-kennel">
              <Ionicons name="home-outline" size={15} color={COLORS.primary} />
              <Text style={styles.ownerActionBtnOutlineText}>Edit Kennel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ownerActionBtnOutline} activeOpacity={0.8} onPress={logout} data-testid="btn-logout">
              <Ionicons name="log-out-outline" size={15} color={COLORS.error} />
              <Text style={[styles.ownerActionBtnOutlineText, { color: COLORS.error }]}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ── Pill Tab Bar — matches DogProfileScreen ── */}
      <View style={styles.tabBar}>
        {TABS.map((t) => {
          const active = t.id === activeTab;
          const count  = t.id === "dogs" && !isLoading ? ownedDogs.length : null;
          return (
            <TouchableOpacity
              key={t.id}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => setActiveTab(t.id)}
              activeOpacity={0.75}
              data-testid={`tab-${t.id}`}
            >
              <Ionicons name={t.icon} size={15} color={active ? "#fff" : COLORS.textMuted} style={{ marginRight: 5 }} />
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {t.label}
              </Text>
              {count !== null && count > 0 && (
                <View style={[styles.tabBadge, active && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeText, active && styles.tabBadgeTextActive]}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Tab Content ── */}
      <View style={styles.contentArea}>
        {isLoading && activeTab !== "detail" ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color={COLORS.primary} />
          </View>
        ) : activeTab === "detail" ? (
          <DetailTab detail={detail} passedMember={passedMember} />
        ) : activeTab === "kennel" ? (
          <KennelTab kennel={detail?.kennel} navigation={navigation} />
        ) : (
          <DogsTab
            dogs={ownedDogs}
            onDogPress={(dog) => navigation.push("DogProfile", { id: dog.id, name: dog.dog_name })}
          />
        )}
      </View>

      <View style={{ height: 48 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f8f7" },

  /* Hero — matches DogProfileScreen / KennelProfileScreen / BreederProfileScreen */
  heroBanner: { width: "100%", height: 256 },
  heroGradient: {
    position: "absolute", left: 0, right: 0, bottom: 0, height: 256,
  },
  backButton: {
    position: "absolute", top: 48, left: 16,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center", alignItems: "center", zIndex: 10,
  },

  /* Profile section — matches DogProfileScreen */
  profileSection: { alignItems: "center", marginTop: -80, paddingHorizontal: 16, marginBottom: 24 },
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
    fontSize: 24, fontWeight: "800", color: "#0F172A",
    textAlign: "center", paddingHorizontal: SPACING.lg,
    marginTop: 12, marginBottom: 8, lineHeight: 32,
  },
  typeBadge: {
    paddingHorizontal: 14, paddingVertical: 5,
    borderRadius: BORDER_RADIUS.full, marginBottom: 6,
  },
  typeBadgeText: { fontSize: 12, fontWeight: "700", letterSpacing: 0.3 },
  memberNo: { fontSize: 14, fontWeight: "500", color: "#64748B" },

  ownerActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
  },
  ownerActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
  },
  ownerActionBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },
  ownerActionBtnOutline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: "#fff",
  },
  ownerActionBtnOutlineText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primary,
  },

  /* Pill tabs — matches DogProfileScreen */
  tabBar: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 20,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    height: 38,
    borderRadius: 9999,
    backgroundColor: "rgba(15,92,59,0.07)",
  },
  tabActive: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 5,
    elevation: 3,
  },
  tabText: { fontSize: 13, fontWeight: "600", color: COLORS.textMuted },
  tabTextActive: { color: "#fff" },
  tabBadge: {
    marginLeft: 6,
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: "rgba(15,92,59,0.15)",
    alignItems: "center", justifyContent: "center", paddingHorizontal: 4,
  },
  tabBadgeActive: { backgroundColor: "rgba(255,255,255,0.25)" },
  tabBadgeText: { fontSize: 10, fontWeight: "700", color: COLORS.primary },
  tabBadgeTextActive: { color: "#fff" },

  /* Content area + card — matches DogProfileScreen */
  contentArea: { paddingHorizontal: 16, minHeight: 320 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(15,92,59,0.05)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeading: {
    fontSize: 18, fontWeight: "700", color: "#0F172A", marginBottom: 20,
  },

  /* DetailItem — matches DogProfileScreen */
  detailsGrid: { gap: 20 },
  detailItem: { flexDirection: "row", alignItems: "center", gap: 16 },
  detailIconWrap: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: "rgba(15,92,59,0.08)",
    justifyContent: "center", alignItems: "center",
  },
  detailTextWrap: { flex: 1 },
  detailLabel: { fontSize: 12, fontWeight: "500", color: "#94A3B8", marginBottom: 2 },
  detailValue: { fontSize: 16, fontWeight: "600", color: "#0F172A" },

  /* Kennel tab */
  divider: {
    height: 1, backgroundColor: "rgba(15,92,59,0.06)", marginVertical: 20,
  },
  kennelHeader: { flexDirection: "row", alignItems: "center" },
  kennelAvatar: {
    width: 64, height: 64, borderRadius: 12, overflow: "hidden",
  },
  kennelAvatarPlaceholder: {
    backgroundColor: "rgba(15,92,59,0.1)",
    justifyContent: "center", alignItems: "center",
  },
  kennelAvatarInitials: {
    fontSize: 20, fontWeight: "700", color: COLORS.primary,
  },
  kennelName: { fontSize: 17, fontWeight: "700", color: "#0F172A", marginBottom: 2 },
  kennelSuffix: { fontSize: 13, fontStyle: "italic", color: COLORS.textMuted, marginBottom: 2 },
  kennelCity: { fontSize: 13, color: COLORS.textMuted },
  kennelViewBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
  },
  kennelViewBtnText: { fontSize: 14, fontWeight: "700", color: "#fff" },

  /* Empty states */
  emptyState: {
    alignItems: "center", paddingVertical: 56, paddingHorizontal: SPACING.xl, gap: 10,
  },
  emptyIconWrap: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: "rgba(15,92,59,0.08)",
    justifyContent: "center", alignItems: "center",
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
  emptyDesc: { fontSize: 13, color: COLORS.textMuted, textAlign: "center", lineHeight: 20 },

  loadingWrap: { padding: SPACING.xl, alignItems: "center" },

  /* Error / not found */
  centered: { flex: 1, justifyContent: "center", alignItems: "center", gap: SPACING.md },
  errorText: { fontSize: FONT_SIZES.md, color: COLORS.textMuted },
  goBackBtn: {
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full, backgroundColor: COLORS.primary,
  },
  goBackBtnText: { fontSize: FONT_SIZES.sm, fontWeight: "700", color: "#fff" },
});
