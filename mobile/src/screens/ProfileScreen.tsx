import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from "../lib/theme";
import { useAuth } from "../contexts/AuthContext";

const BASE_PHOTO_URL = "https://gsdcp.org/storage/photos/";

function isValidPhoto(photo: string | null): boolean {
  if (!photo) return false;
  if (photo === "GSDCP_Logo_Head.png") return false;
  return true;
}

function MembershipBadge({ type }: { type: string | null }) {
  const isPermanent = type?.toLowerCase().includes("permanent");
  return (
    <View style={[styles.badge, isPermanent ? styles.badgePermanent : styles.badgeTemporary]}>
      <Text style={[styles.badgeText, isPermanent ? styles.badgeTextPermanent : styles.badgeTextTemporary]}>
        {isPermanent ? "Permanent Member" : "Temporary Member"}
      </Text>
    </View>
  );
}

function MenuItem({
  icon, iconBg, iconColor, label, sublabel, onPress, danger, testId,
}: {
  icon: string; iconBg: string; iconColor: string; label: string;
  sublabel?: string; onPress?: () => void; danger?: boolean; testId?: string;
}) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7} data-testid={testId}>
      <View style={[styles.menuIconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon as any} size={20} color={iconColor} />
      </View>
      <View style={styles.menuTextWrap}>
        <Text style={[styles.menuLabel, danger && { color: "#DC2626" }]}>{label}</Text>
        {sublabel ? <Text style={styles.menuSub}>{sublabel}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={16} color={danger ? "#DC2626" : COLORS.textMuted} />
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  const photoUrl = isValidPhoto(user.photo) ? `${BASE_PHOTO_URL}${user.photo}` : null;
  const initials = [user.first_name?.[0], user.last_name?.[0]].filter(Boolean).join("").toUpperCase() || "?";

  const handleSignOut = async () => {
    await logout();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 48 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <Text style={styles.header}>My Profile</Text>

      {/* ── Avatar + identity ── */}
      <View style={styles.heroCard}>
        <View style={styles.avatarWrap}>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}
        </View>

        <Text style={styles.userName}>{user.name}</Text>
        {user.membership_no && (
          <Text style={styles.membershipNo}>{user.membership_no}</Text>
        )}
        <MembershipBadge type={user.membership_type} />

        <View style={styles.infoRow}>
          {user.city ? (
            <View style={styles.infoChip}>
              <Ionicons name="location-outline" size={13} color={COLORS.textSecondary} />
              <Text style={styles.infoChipText}>{[user.city, user.country].filter(Boolean).join(", ")}</Text>
            </View>
          ) : null}
          {user.role ? (
            <View style={styles.infoChip}>
              <Ionicons name="shield-checkmark-outline" size={13} color={COLORS.textSecondary} />
              <Text style={styles.infoChipText}>{user.role}</Text>
            </View>
          ) : null}
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user.myDogs?.length ?? 0}</Text>
            <Text style={styles.statLabel}>Dogs</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user.myKennel ? 1 : 0}</Text>
            <Text style={styles.statLabel}>Kennel</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user.membership_type?.toLowerCase().includes("permanent") ? "P" : "T"}</Text>
            <Text style={styles.statLabel}>Type</Text>
          </View>
        </View>
      </View>

      {/* ── Account menu ── */}
      <Text style={styles.sectionTitle}>ACCOUNT</Text>
      <View style={styles.menuCard}>
        <MenuItem
          icon="paw-outline" iconBg="rgba(59,130,246,0.08)" iconColor="#3B82F6"
          label="My Dogs"
          sublabel={`${user.myDogs?.length ?? 0} registered`}
          testId="btn-my-dogs"
        />
        <View style={styles.menuDivider} />
        <MenuItem
          icon="home-outline" iconBg="rgba(16,185,129,0.08)" iconColor="#10B981"
          label="My Kennel"
          sublabel={user.myKennel?.kennel_name ?? "No kennel registered"}
          testId="btn-my-kennel"
        />
        <View style={styles.menuDivider} />
        <MenuItem
          icon="create-outline" iconBg="rgba(139,92,246,0.08)" iconColor="#8B5CF6"
          label="Edit Profile"
          testId="btn-edit-profile"
        />
      </View>

      {/* ── Contact info ── */}
      <Text style={styles.sectionTitle}>CONTACT</Text>
      <View style={styles.menuCard}>
        {user.email ? (
          <>
            <View style={styles.contactRow}>
              <Ionicons name="mail-outline" size={16} color={COLORS.textMuted} />
              <Text style={styles.contactText}>{user.email}</Text>
            </View>
            <View style={styles.menuDivider} />
          </>
        ) : null}
        {user.phone ? (
          <View style={styles.contactRow}>
            <Ionicons name="call-outline" size={16} color={COLORS.textMuted} />
            <Text style={styles.contactText}>{user.phone}</Text>
          </View>
        ) : null}
      </View>

      {/* ── Sign out ── */}
      <View style={[styles.menuCard, { marginTop: 8 }]}>
        <MenuItem
          icon="log-out-outline" iconBg="rgba(220,38,38,0.08)" iconColor="#DC2626"
          label="Sign Out"
          danger
          onPress={handleSignOut}
          testId="btn-sign-out"
        />
      </View>

      <Text style={styles.version}>GSDCP Mobile v1.0 · Member ID {user.member_id}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 16 },
  header: {
    fontSize: 24, fontWeight: "800", color: COLORS.text,
    marginBottom: 16,
  },

  heroCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1, borderColor: COLORS.border,
    alignItems: "center",
    paddingVertical: 24, paddingHorizontal: 16,
    marginBottom: 24,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  avatarWrap: { marginBottom: 12 },
  avatarImage: {
    width: 88, height: 88, borderRadius: 44,
    borderWidth: 3, borderColor: COLORS.accent,
  },
  avatarFallback: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: COLORS.primary,
    borderWidth: 3, borderColor: COLORS.accent,
    justifyContent: "center", alignItems: "center",
  },
  avatarInitials: { fontSize: 30, fontWeight: "800", color: "#fff" },
  userName: { fontSize: 20, fontWeight: "800", color: COLORS.text, marginBottom: 2 },
  membershipNo: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, fontWeight: "600", marginBottom: 8 },

  badge: {
    paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 20, marginBottom: 12,
  },
  badgePermanent: { backgroundColor: "rgba(22,163,74,0.12)" },
  badgeTemporary: { backgroundColor: "rgba(217,119,6,0.12)" },
  badgeText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  badgeTextPermanent: { color: "#16A34A" },
  badgeTextTemporary: { color: "#D97706" },

  infoRow: { flexDirection: "row", gap: 8, flexWrap: "wrap", justifyContent: "center", marginBottom: 16 },
  infoChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(0,0,0,0.04)",
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  infoChipText: { fontSize: 11, color: COLORS.textSecondary, fontWeight: "500" },

  statsRow: {
    flexDirection: "row", width: "100%",
    borderTopWidth: 1, borderTopColor: COLORS.border,
    paddingTop: 16,
  },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 20, fontWeight: "800", color: COLORS.primary },
  statLabel: { fontSize: 10, fontWeight: "600", color: COLORS.textMuted, letterSpacing: 0.5, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: COLORS.border },

  sectionTitle: {
    fontSize: 11, fontWeight: "700", color: COLORS.textMuted,
    letterSpacing: 1.2, marginBottom: 8, marginLeft: 4,
  },
  menuCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border,
    overflow: "hidden", marginBottom: 16,
  },
  menuItem: {
    flexDirection: "row", alignItems: "center",
    padding: SPACING.lg, gap: SPACING.md,
  },
  menuIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: "center", alignItems: "center",
  },
  menuTextWrap: { flex: 1 },
  menuLabel: { fontSize: FONT_SIZES.md, fontWeight: "600", color: COLORS.text },
  menuSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 1 },
  menuDivider: { height: 1, backgroundColor: COLORS.border, marginLeft: 68 },

  contactRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: SPACING.lg,
  },
  contactText: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary },

  version: {
    textAlign: "center", fontSize: 10,
    color: COLORS.textMuted, marginTop: 8,
  },
});
