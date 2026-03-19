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
  Dimensions,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from "../lib/theme";
import { fetchMemberDetail, Member, MemberDetail, MemberOwnedDog } from "../lib/api";

const heroBg = require("../../assets/hero-bg.jpg");
const SCREEN_W = Dimensions.get("window").width;
const DOG_CARD_W = 140;

function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  return trimmed.split(" ").filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function isValidImage(url: string | null | undefined): boolean {
  if (!url) return false;
  if (url.includes("user-not-found")) return false;
  if (url.includes("dog_not_found")) return false;
  if (url.startsWith("https::")) return false;
  return url.startsWith("http");
}

function getMembershipType(no: string): { label: string; color: string } {
  if (no.startsWith("T-")) return { label: "Temporary Member", color: "#F59E0B" };
  if (no.startsWith("P-")) return { label: "Permanent Member", color: COLORS.primary };
  return { label: "Member", color: COLORS.textMuted };
}

function calcAge(dob: string | null): string | null {
  if (!dob) return null;
  const diff = Date.now() - new Date(dob).getTime();
  const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  if (years < 1) return "< 1 Year";
  return `${years} Year${years !== 1 ? "s" : ""}`;
}

function DogCard({ dog, onPress }: { dog: MemberOwnedDog; onPress: () => void }) {
  const hasPhoto = isValidImage(dog.imageUrl);
  const initials = getInitials(dog.dog_name);
  const age = calcAge(dog.dob);
  const sexColor = dog.sex === "Male" ? "#1D4ED8" : "#BE185D";
  const sexBg = dog.sex === "Male" ? "#EFF6FF" : "#FDF2F8";

  return (
    <TouchableOpacity style={styles.dogCard} onPress={onPress} activeOpacity={0.75} data-testid={`card-dog-${dog.id}`}>
      <View style={styles.dogPhotoWrap}>
        {hasPhoto ? (
          <Image source={{ uri: dog.imageUrl! }} style={styles.dogPhoto} resizeMode="cover" />
        ) : (
          <View style={styles.dogPhotoPlaceholder}>
            <Ionicons name="paw" size={28} color={COLORS.primary} style={{ opacity: 0.3 }} />
          </View>
        )}
      </View>
      <View style={styles.dogCardBody}>
        <Text style={styles.dogCardName} numberOfLines={1}>{dog.dog_name}</Text>
        <View style={styles.dogCardMeta}>
          <View style={[styles.sexPill, { backgroundColor: sexBg }]}>
            <Text style={[styles.sexPillText, { color: sexColor }]}>{dog.sex}</Text>
          </View>
          {age ? <Text style={styles.dogCardAge}>{age}</Text> : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function StatusRow({
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
    <View style={styles.statusRow}>
      <View style={styles.statusLeft}>
        <Ionicons name={icon} size={18} color={COLORS.textMuted} style={{ marginRight: 10 }} />
        <Text style={styles.statusLabel}>{label}</Text>
      </View>
      <Text style={[styles.statusValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
    </View>
  );
}

export default function MemberProfileScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  const { id, member: passedMember } = route.params as { id: string; member?: Member };

  const { data: detail, isLoading, isError, refetch, isRefetching } = useQuery<MemberDetail>({
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
  const membershipType = getMembershipType(member.membership_no);
  const showAddress = (detail?.member as any)?.check_address === "Show" && (detail?.member as any)?.address;

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
        {/* back button */}
        <TouchableOpacity
          style={[styles.backButton, { top: insets.top + 12 }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
          data-testid="btn-back"
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        {/* title centered in hero */}
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
        <Text style={[styles.memberSub, { color: membershipType.color }]}>
          {membershipType.label}
          <Text style={styles.memberSubDot}>  ·  </Text>
          <Text style={styles.memberSubId}>GSDCP ID: #{member.membership_no}</Text>
        </Text>
      </View>

      {/* ── Membership Status card ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Membership Status</Text>
        <View style={styles.card}>
          <StatusRow
            icon="card-outline"
            label="Membership No"
            value={member.membership_no}
          />
          <StatusRow
            icon="checkmark-circle-outline"
            label="Status"
            value={member.membership_no.startsWith("P-") ? "Active" : "Temporary"}
            valueColor={member.membership_no.startsWith("P-") ? COLORS.primary : "#F59E0B"}
          />
          {member.city ? (
            <StatusRow icon="location-outline" label="City" value={member.city} />
          ) : null}
          {member.country ? (
            <StatusRow icon="flag-outline" label="Country" value={member.country} />
          ) : null}
          {showAddress ? (
            <StatusRow icon="home-outline" label="Address" value={(detail?.member as any).address} />
          ) : null}
        </View>
      </View>

      {/* ── My Dogs ── */}
      {isLoading ? (
        <View style={styles.dogsLoadingRow}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.dogsLoadingText}>Loading dogs…</Text>
        </View>
      ) : ownedDogs.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Dogs ({ownedDogs.length})</Text>
            {ownedDogs.length > 3 && (
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.viewAll}>View All</Text>
              </TouchableOpacity>
            )}
          </View>
          <FlatList
            data={ownedDogs}
            keyExtractor={(d) => d.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dogsList}
            renderItem={({ item }) => (
              <DogCard
                dog={item}
                onPress={() => navigation.push("DogProfile", { id: item.id, name: item.dog_name })}
              />
            )}
          />
        </View>
      ) : null}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F2" },

  /* Hero */
  heroBanner: { width: "100%", height: 220 },
  backButton: {
    position: "absolute",
    left: 16,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.32)",
    justifyContent: "center", alignItems: "center",
    zIndex: 10,
  },
  heroTitleWrap: {
    position: "absolute",
    left: 0, right: 0,
    alignItems: "center",
    zIndex: 5,
  },
  heroTitle: {
    fontSize: 17, fontWeight: "700", color: "#fff",
    textShadowColor: "rgba(0,0,0,0.25)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  /* Profile section */
  profileSection: {
    alignItems: "center",
    marginTop: -72,
    paddingBottom: SPACING.md,
  },
  avatarOuter: {
    width: 136, height: 136, borderRadius: 68,
    borderWidth: 4, borderColor: COLORS.accent,
    backgroundColor: "#fff",
    overflow: "hidden",
    marginBottom: SPACING.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 10,
    elevation: 8,
  },
  avatarInner: {
    flex: 1, backgroundColor: "rgba(15,92,59,0.08)",
    justifyContent: "center", alignItems: "center",
  },
  avatarImage: { width: "100%", height: "100%" },
  avatarInitials: { fontSize: 42, fontWeight: "800", color: COLORS.primary },

  memberName: {
    fontSize: 22, fontWeight: "800", color: COLORS.text,
    textAlign: "center", paddingHorizontal: SPACING.lg,
    marginBottom: 4,
  },
  memberSub: {
    fontSize: 13, fontWeight: "600", textAlign: "center",
  },
  memberSubDot: { color: COLORS.textMuted, fontWeight: "400" },
  memberSubId: { color: COLORS.textMuted, fontWeight: "500" },

  /* Sections */
  section: { paddingHorizontal: SPACING.md, marginTop: SPACING.sm },
  sectionHeader: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 12, fontWeight: "700", color: COLORS.textMuted,
    textTransform: "uppercase", letterSpacing: 0.9,
  },
  viewAll: { fontSize: 13, fontWeight: "600", color: COLORS.primary },

  /* Status card */
  card: {
    backgroundColor: "#fff",
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1, borderColor: COLORS.border,
    overflow: "hidden",
  },
  statusRow: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.md, paddingVertical: 13,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  statusLeft: { flexDirection: "row", alignItems: "center" },
  statusLabel: { fontSize: 14, color: COLORS.text, fontWeight: "500" },
  statusValue: { fontSize: 14, fontWeight: "700", color: COLORS.text },

  /* Dogs horizontal list */
  dogsList: { paddingRight: SPACING.md },
  dogCard: {
    width: DOG_CARD_W,
    marginRight: SPACING.sm,
    backgroundColor: "#fff",
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border,
    overflow: "hidden",
  },
  dogPhotoWrap: {
    width: DOG_CARD_W, height: 100,
    backgroundColor: "rgba(15,92,59,0.06)",
  },
  dogPhoto: { width: "100%", height: "100%" },
  dogPhotoPlaceholder: {
    flex: 1, justifyContent: "center", alignItems: "center",
  },
  dogCardBody: { padding: SPACING.sm },
  dogCardName: {
    fontSize: 13, fontWeight: "700", color: COLORS.text, marginBottom: 4,
  },
  dogCardMeta: { flexDirection: "row", alignItems: "center", gap: 6 },
  sexPill: {
    paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
  sexPillText: { fontSize: 10, fontWeight: "700" },
  dogCardAge: { fontSize: 11, color: COLORS.textMuted, fontWeight: "500" },

  /* Loading / error */
  dogsLoadingRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: SPACING.sm, padding: SPACING.lg,
  },
  dogsLoadingText: { fontSize: FONT_SIZES.sm, color: COLORS.textMuted },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", gap: SPACING.md },
  errorText: { fontSize: FONT_SIZES.md, color: COLORS.textMuted },
  goBackBtn: {
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full, backgroundColor: COLORS.primary,
  },
  goBackBtnText: { fontSize: FONT_SIZES.sm, fontWeight: "700", color: "#fff" },
});
