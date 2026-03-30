import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
  ImageBackground,
  RefreshControl,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from "../lib/theme";
import { fetchKennelDetail, KennelDetail, KennelMating } from "../lib/api";
import type { KennelDirectoryStackParamList } from "../navigation/AppNavigator";

type Nav = NativeStackNavigationProp<KennelDirectoryStackParamList, "KennelProfile">;

const heroBg = require("../../assets/hero-bg.jpg");

function formatYear(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const year = new Date(dateStr).getFullYear();
  return isNaN(year) ? null : String(year);
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function DetailItem({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailItem}>
      <View style={styles.detailIconWrap}>
        <Ionicons name={icon} size={18} color={COLORS.primary} />
      </View>
      <View style={styles.detailTextWrap}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

function MatingRow({
  mating,
  onSirePress,
  onDamPress,
}: {
  mating: KennelMating;
  onSirePress: () => void;
  onDamPress: () => void;
}) {
  return (
    <View style={styles.matingCard}>
      <TouchableOpacity
        style={styles.dogRow}
        onPress={onSirePress}
        activeOpacity={0.7}
        data-testid={`btn-sire-${mating.sire_dog_id}`}
      >
        <View style={[styles.sexBadge, styles.sireBadge]}>
          <Text style={styles.sexBadgeText}>♂</Text>
        </View>
        <View style={styles.dogRowInfo}>
          <Text style={styles.dogRowLabel}>Sire</Text>
          <Text style={styles.dogRowName} numberOfLines={1}>
            {mating.sire_name.trim()}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
      </TouchableOpacity>

      <View style={styles.dogRowDivider} />

      <TouchableOpacity
        style={styles.dogRow}
        onPress={onDamPress}
        activeOpacity={0.7}
        data-testid={`btn-dam-${mating.dam_dog_id}`}
      >
        <View style={[styles.sexBadge, styles.damBadge]}>
          <Text style={styles.sexBadgeText}>♀</Text>
        </View>
        <View style={styles.dogRowInfo}>
          <Text style={styles.dogRowLabel}>Dam</Text>
          <Text style={styles.dogRowName} numberOfLines={1}>
            {mating.dam_name.trim()}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
      </TouchableOpacity>

      <View style={styles.matingFooter}>
        <Ionicons name="calendar-outline" size={13} color={COLORS.textMuted} />
        <Text style={styles.matingDate}>{formatDate(mating.mating_date)}</Text>
        {mating.puppies ? (
          <>
            <View style={styles.matingFooterDot} />
            <Ionicons name="paw-outline" size={13} color={COLORS.textMuted} />
            <Text style={styles.matingDate}>{mating.puppies} {Number(mating.puppies) === 1 ? "Puppy" : "Puppies"}</Text>
          </>
        ) : null}
      </View>
    </View>
  );
}

type TabKey = "info" | "matings";

export default function KennelProfileScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<Nav>();
  const { id } = route.params as { id: string; name?: string };
  const [activeTab, setActiveTab] = useState<TabKey>("info");

  const { data, isLoading, isError, refetch, isRefetching } =
    useQuery<KennelDetail>({
      queryKey: ["kennels", id],
      queryFn: () => fetchKennelDetail(id),
    });

  const kennel = data?.kennels;
  const matings = data?.matings || [];
  const owners = data?.kennelOwners || [];

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (isError || !kennel) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color={COLORS.textMuted} />
        <Text style={styles.errorText}>
          {isError ? "Failed to load kennel details." : "Kennel not found."}
        </Text>
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={() => refetch()}
          data-testid="btn-retry"
        >
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const hasImage =
    kennel.imageUrl && !kennel.imageUrl.includes("user-not-found");
  const year = formatYear(kennel.activeSince ?? null);
  const initials = kennel.kennelName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const primaryOwner = owners[0];
  const showPhone =
    kennel.phone && kennel.phone !== "+00-000-000-0000"
      ? kennel.phone
      : primaryOwner?.phone && primaryOwner.phone !== "+00-000-000-0000"
        ? primaryOwner.phone
        : null;
  const showEmail = kennel.email || primaryOwner?.email || null;

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: "info", label: "Info" },
    { key: "matings", label: "Matings", count: matings.length },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          tintColor={COLORS.primary}
          colors={[COLORS.primary]}
        />
      }
    >
      <ImageBackground source={heroBg} style={styles.heroBanner} resizeMode="cover">
        <LinearGradient
          colors={["rgba(246,248,247,0)", "rgba(246,248,247,0.6)", "#f6f8f7"]}
          style={styles.heroGradient}
          pointerEvents="none"
        />
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate("KennelDirectory");
            }
          }}
          activeOpacity={0.7}
          data-testid="btn-back"
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
      </ImageBackground>

      <View style={styles.profileSection}>
        <View style={styles.avatarOuter}>
          {hasImage ? (
            <View style={styles.avatarInner}>
              <Ionicons name="home" size={36} color={COLORS.primary} />
            </View>
          ) : (
            <View style={styles.avatarInner}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}
        </View>

        <Text style={styles.kennelName}>{kennel.kennelName}</Text>
        {kennel.suffix ? (
          <Text style={styles.kennelSuffix}>{kennel.suffix}</Text>
        ) : null}
        <Text style={styles.kennelLocation}>
          {kennel.city}, {kennel.country}
        </Text>
      </View>

      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.tabTextActive,
              ]}
            >
              {tab.label}
              {tab.count != null ? ` (${tab.count})` : ""}
            </Text>
            {activeTab === tab.key && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.contentArea}>
        {activeTab === "info" && (
          <>
            <View style={styles.card}>
              <Text style={styles.cardHeading}>Kennel Details</Text>
              <View style={styles.detailsGrid}>
                <DetailItem icon="home" label="Kennel Name" value={kennel.kennelName} />
                {kennel.suffix ? (
                  <DetailItem icon="text" label="Suffix" value={kennel.suffix} />
                ) : null}
                {kennel.prefix ? (
                  <DetailItem icon="text" label="Prefix" value={kennel.prefix} />
                ) : null}
                {kennel.city ? (
                  <DetailItem icon="business" label="City" value={kennel.city} />
                ) : null}
                {kennel.country ? (
                  <DetailItem icon="globe" label="Country" value={kennel.country} />
                ) : null}
                {year ? (
                  <DetailItem icon="calendar" label="Active Since" value={year} />
                ) : null}
                <DetailItem
                  icon="heart"
                  label="Total Matings"
                  value={String(matings.length)}
                />
              </View>
            </View>

            {(showPhone || showEmail) && (
              <View style={styles.card}>
                <Text style={styles.cardHeading}>Contact</Text>
                <View style={styles.contactRow}>
                  {showPhone ? (
                    <TouchableOpacity
                      style={styles.contactBtn}
                      onPress={() => Linking.openURL(`tel:${showPhone}`)}
                      activeOpacity={0.7}
                      data-testid="btn-call"
                    >
                      <Ionicons name="call" size={18} color="#fff" />
                      <Text style={styles.contactBtnText}>Call</Text>
                    </TouchableOpacity>
                  ) : null}
                  {showEmail ? (
                    <TouchableOpacity
                      style={[styles.contactBtn, styles.contactBtnSecondary]}
                      onPress={() => Linking.openURL(`mailto:${showEmail}`)}
                      activeOpacity={0.7}
                      data-testid="btn-email"
                    >
                      <Ionicons name="mail" size={18} color={COLORS.primary} />
                      <Text
                        style={[
                          styles.contactBtnText,
                          styles.contactBtnTextSecondary,
                        ]}
                      >
                        Email
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
                <View style={styles.detailsGrid}>
                  {showPhone ? (
                    <DetailItem icon="call" label="Phone" value={showPhone} />
                  ) : null}
                  {showEmail ? (
                    <DetailItem icon="mail" label="Email" value={showEmail} />
                  ) : null}
                </View>
              </View>
            )}

            {owners.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardHeading}>
                  {owners.length === 1 ? "Owner" : "Owners"}
                </Text>
                <View style={styles.detailsGrid}>
                  {owners.map((owner, i) => (
                    <View
                      key={i}
                      style={[
                        styles.ownerRow,
                        i < owners.length - 1 && styles.ownerRowBorder,
                      ]}
                    >
                      <View style={styles.ownerAvatar}>
                        <Text style={styles.ownerInitial}>
                          {owner.name[0]?.toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.ownerInfo}>
                        <Text style={styles.ownerName}>{owner.name}</Text>
                        {owner.membership_no ? (
                          <Text style={styles.ownerMeta}>
                            Membership: {owner.membership_no}
                          </Text>
                        ) : null}
                        {owner.phone ? (
                          <Text style={styles.ownerMeta}>{owner.phone}</Text>
                        ) : null}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        )}

        {activeTab === "matings" &&
          (matings.length > 0 ? (
            <View style={{ gap: 12 }}>
              {matings.map((m, i) => (
                <MatingRow
                  key={i}
                  mating={m}
                  onSirePress={() =>
                    navigation.navigate("DogProfile", {
                      id: m.sire_dog_id,
                      name: m.sire_name.trim(),
                    })
                  }
                  onDamPress={() =>
                    navigation.navigate("DogProfile", {
                      id: m.dam_dog_id,
                      name: m.dam_name.trim(),
                    })
                  }
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="heart-outline" size={32} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyTitle}>No Matings Recorded</Text>
              <Text style={styles.emptyDesc}>
                No matings have been recorded for this kennel yet.
              </Text>
            </View>
          ))}
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6f8f7",
  },
  scrollContent: {
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f6f8f7",
    gap: SPACING.md,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
  },
  retryText: {
    color: "#fff",
    fontSize: FONT_SIZES.md,
    fontWeight: "600",
  },
  heroBanner: {
    width: "100%",
    height: 256,
  },
  heroGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 256,
  },
  backButton: {
    position: "absolute",
    top: 48,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  profileSection: {
    alignItems: "center",
    marginTop: -80,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  avatarOuter: {
    width: 144,
    height: 144,
    borderRadius: 72,
    borderWidth: 4,
    borderColor: COLORS.accent,
    backgroundColor: "#fff",
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.1,
    shadowRadius: 25,
    elevation: 8,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 9999,
    backgroundColor: "rgba(15,92,59,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitials: {
    fontSize: 36,
    fontWeight: "800",
    color: COLORS.primary,
  },
  kennelName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    marginTop: 12,
    lineHeight: 32,
  },
  kennelSuffix: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.textSecondary,
    marginTop: 2,
    textAlign: "center",
  },
  kennelLocation: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(15,92,59,0.1)",
    marginHorizontal: 16,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    position: "relative",
  },
  tabActive: {},
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#94A3B8",
  },
  tabTextActive: {
    color: COLORS.primary,
  },
  tabIndicator: {
    position: "absolute",
    bottom: -1,
    left: 16,
    right: 16,
    height: 3,
    borderRadius: 9999,
    backgroundColor: COLORS.accent,
  },
  contentArea: {
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
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
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 20,
  },
  detailsGrid: {
    gap: 20,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  detailIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(15,92,59,0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  detailTextWrap: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#94A3B8",
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0F172A",
  },
  contactRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginBottom: 20,
  },
  contactBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
  },
  contactBtnSecondary: {
    backgroundColor: "rgba(15,92,58,0.08)",
  },
  contactBtnText: {
    fontSize: FONT_SIZES.md,
    fontWeight: "700",
    color: "#fff",
  },
  contactBtnTextSecondary: {
    color: COLORS.primary,
  },
  ownerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingBottom: 16,
  },
  ownerRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 16,
  },
  ownerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(15,92,59,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  ownerInitial: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.primary,
  },
  ownerInfo: {
    flex: 1,
  },
  ownerName: {
    fontSize: FONT_SIZES.md,
    fontWeight: "600",
    color: COLORS.text,
  },
  ownerMeta: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  matingCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dogRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  dogRowDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 14,
  },
  sexBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  sireBadge: {
    backgroundColor: "#DBEAFE",
  },
  damBadge: {
    backgroundColor: "#FCE7F3",
  },
  sexBadgeText: {
    fontSize: 16,
    lineHeight: 20,
  },
  dogRowInfo: {
    flex: 1,
    gap: 1,
  },
  dogRowLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: "700",
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dogRowName: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "600",
    color: COLORS.text,
  },
  matingFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  matingDate: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  matingFooterDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: COLORS.textMuted,
    marginHorizontal: 2,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 40,
    gap: SPACING.sm,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(15,92,59,0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: "600",
    color: COLORS.text,
  },
  emptyDesc: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
    textAlign: "center",
    paddingHorizontal: SPACING.xxl,
  },
});
