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
import { fetchMemberDetail, Member, MemberDetail, MemberOwnedDog } from "../lib/api";

const heroBg = require("../../assets/hero-bg.jpg");

function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  return trimmed
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
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
  return { label: "Member", color: COLORS.textMuted, bg: COLORS.background };
}

function InfoRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconWrap}>
        <Ionicons name={icon} size={18} color={COLORS.primary} />
      </View>
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function DogCard({ dog, onPress }: { dog: MemberOwnedDog; onPress: () => void }) {
  const hasPhoto = isValidImage(dog.imageUrl);
  const initials = getInitials(dog.dog_name);
  const sexColor = dog.sex === "Male" ? "#1D4ED8" : "#BE185D";
  const sexBg = dog.sex === "Male" ? "#EFF6FF" : "#FDF2F8";
  return (
    <TouchableOpacity style={styles.dogCard} onPress={onPress} activeOpacity={0.7} data-testid={`card-dog-${dog.id}`}>
      <View style={styles.dogAvatarWrap}>
        {hasPhoto ? (
          <Image source={{ uri: dog.imageUrl! }} style={styles.dogAvatar} resizeMode="cover" />
        ) : (
          <View style={styles.dogAvatarPlaceholder}>
            <Text style={styles.dogAvatarInitials}>{initials}</Text>
          </View>
        )}
      </View>
      <View style={styles.dogInfo}>
        <Text style={styles.dogName} numberOfLines={1}>{dog.dog_name}</Text>
        <Text style={styles.dogKP} numberOfLines={1}>KP {dog.KP || dog.foreign_reg_no}</Text>
        <View style={styles.dogTags}>
          <View style={[styles.dogTag, { backgroundColor: sexBg, borderColor: sexColor }]}>
            <Text style={[styles.dogTagText, { color: sexColor }]}>{dog.sex}</Text>
          </View>
          {dog.color ? (
            <View style={styles.dogTagGrey}>
              <Text style={styles.dogTagGreyText}>{dog.color}</Text>
            </View>
          ) : null}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
    </TouchableOpacity>
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
        <TouchableOpacity style={styles.backBtn2} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn2Text}>Go back</Text>
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
      {/* Hero */}
      <ImageBackground source={heroBg} style={styles.hero} resizeMode="cover">
        <LinearGradient
          colors={["rgba(8,58,36,0.55)", "rgba(15,92,58,0.85)"]}
          style={StyleSheet.absoluteFillObject}
        />
        <TouchableOpacity
          style={[styles.backButton, { top: insets.top + 12 }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
          data-testid="btn-back"
        >
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
      </ImageBackground>

      {/* Profile section */}
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
        <View style={[styles.typeBadge, { backgroundColor: membershipType.bg }]}>
          <Text style={[styles.typeBadgeText, { color: membershipType.color }]}>{membershipType.label}</Text>
        </View>
        <Text style={styles.memberName}>{memberName}</Text>
        <Text style={styles.memberNo}>{member.membership_no}</Text>
      </View>

      {/* Details card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Member Information</Text>
        {member.membership_no ? (
          <InfoRow icon="card-outline" label="Membership No" value={member.membership_no} />
        ) : null}
        {member.city ? (
          <InfoRow icon="location-outline" label="City" value={member.city} />
        ) : null}
        {member.country ? (
          <InfoRow icon="flag-outline" label="Country" value={member.country} />
        ) : null}
        {showAddress ? (
          <InfoRow icon="home-outline" label="Address" value={(detail?.member as any).address} />
        ) : null}
        <InfoRow icon="shield-checkmark-outline" label="Membership Type" value={membershipType.label} />
      </View>

      {/* Owned dogs */}
      {isLoading ? (
        <View style={styles.dogsLoadingWrap}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.dogsLoadingText}>Loading dogs…</Text>
        </View>
      ) : ownedDogs.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Registered Dogs ({ownedDogs.length})</Text>
          {ownedDogs.map((dog) => (
            <DogCard
              key={dog.id}
              dog={dog}
              onPress={() => navigation.push("DogProfile", { id: dog.id, name: dog.dog_name })}
            />
          ))}
        </View>
      ) : null}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  hero: { height: 220, justifyContent: "flex-end" },
  backButton: {
    position: "absolute", left: 16,
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center", alignItems: "center",
  },

  profileSection: {
    alignItems: "center",
    marginTop: -72,
    paddingBottom: SPACING.lg,
  },
  avatarOuter: {
    width: 144, height: 144, borderRadius: 72,
    borderWidth: 4, borderColor: COLORS.accent,
    backgroundColor: "#fff",
    overflow: "hidden",
    marginBottom: SPACING.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarInner: {
    flex: 1,
    backgroundColor: "rgba(15,92,59,0.1)",
    justifyContent: "center", alignItems: "center",
  },
  avatarImage: { width: "100%", height: "100%" },
  avatarInitials: { fontSize: 44, fontWeight: "800", color: COLORS.primary },

  typeBadge: {
    paddingHorizontal: 14, paddingVertical: 5,
    borderRadius: BORDER_RADIUS.full,
    marginBottom: 10,
  },
  typeBadgeText: { fontSize: 12, fontWeight: "700", letterSpacing: 0.3 },

  memberName: { fontSize: 22, fontWeight: "800", color: COLORS.text, textAlign: "center", paddingHorizontal: SPACING.lg },
  memberNo: { fontSize: 14, color: COLORS.textMuted, fontWeight: "600", marginTop: 4 },

  card: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    backgroundColor: "#fff",
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1, borderColor: COLORS.border,
  },
  cardTitle: {
    fontSize: 11, fontWeight: "700", color: COLORS.textMuted,
    textTransform: "uppercase", letterSpacing: 0.8,
    marginBottom: SPACING.md,
  },

  infoRow: {
    flexDirection: "row", alignItems: "center", gap: SPACING.md,
    paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  infoIconWrap: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(15,92,59,0.08)",
    justifyContent: "center", alignItems: "center",
  },
  infoText: { flex: 1 },
  infoLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.4 },
  infoValue: { fontSize: 15, color: COLORS.text, fontWeight: "600", marginTop: 1 },

  dogsLoadingWrap: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: SPACING.sm, padding: SPACING.lg,
  },
  dogsLoadingText: { fontSize: FONT_SIZES.sm, color: COLORS.textMuted },

  dogCard: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: SPACING.sm, gap: SPACING.sm,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  dogAvatarWrap: {
    width: 52, height: 52, borderRadius: 10,
    overflow: "hidden", backgroundColor: "rgba(15,92,59,0.07)",
  },
  dogAvatar: { width: "100%", height: "100%" },
  dogAvatarPlaceholder: {
    flex: 1, justifyContent: "center", alignItems: "center",
  },
  dogAvatarInitials: { fontSize: 18, fontWeight: "800", color: COLORS.primary },

  dogInfo: { flex: 1 },
  dogName: { fontSize: 15, fontWeight: "700", color: COLORS.text },
  dogKP: { fontSize: 12, color: COLORS.textMuted, marginTop: 1 },
  dogTags: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 4 },
  dogTag: {
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full, borderWidth: 1,
  },
  dogTagText: { fontSize: 10, fontWeight: "700" },
  dogTagGrey: {
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.border,
  },
  dogTagGreyText: { fontSize: 10, fontWeight: "600", color: COLORS.textMuted },

  centered: { flex: 1, justifyContent: "center", alignItems: "center", gap: SPACING.md },
  errorText: { fontSize: FONT_SIZES.md, color: COLORS.textMuted },
  backBtn2: {
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full, backgroundColor: COLORS.primary,
  },
  backBtn2Text: { fontSize: FONT_SIZES.sm, fontWeight: "700", color: "#fff" },
});
