import { useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
  ImageBackground,
  RefreshControl,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from "../lib/theme";
import { fetchBreeder, BreederDetail, BreederDog } from "../lib/api";

const heroBg = require("../../assets/hero-bg.jpg");

function formatYear(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const year = new Date(dateStr).getFullYear();
  return isNaN(year) ? null : String(year);
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

function BreederDogItem({
  dog,
  onPress,
}: {
  dog: BreederDog;
  onPress: () => void;
}) {
  const initials = dog.name
    .trim()
    .split(" ")
    .filter((w) => w.length > 0)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const hasImg = dog.imageUrl && !dog.imageUrl.includes("dog-not-found") && dog.imageUrl.length > 0;

  return (
    <TouchableOpacity
      style={styles.dogCard}
      onPress={onPress}
      activeOpacity={0.7}
      data-testid={`card-dog-${dog.id}`}
    >
      {hasImg ? (
        <Image source={{ uri: dog.imageUrl }} style={styles.dogAvatar} resizeMode="cover" />
      ) : (
        <View style={styles.dogAvatarFallback}>
          <Text style={styles.dogAvatarText}>{initials}</Text>
        </View>
      )}
      <View style={styles.dogInfo}>
        <Text style={styles.dogName} numberOfLines={1}>
          {dog.name.trim()}
        </Text>
        <Text style={styles.dogMeta}>
          {dog.KP && dog.KP !== "0" ? `KP ${dog.KP}` : dog.foreign_reg_no || "-"}
        </Text>
        <View style={styles.dogBadges}>
          <View style={styles.dogBadge}>
            <Text style={styles.dogBadgeText}>{dog.sex}</Text>
          </View>
          {dog.color ? (
            <View style={styles.dogBadge}>
              <Text style={styles.dogBadgeText}>{dog.color}</Text>
            </View>
          ) : null}
        </View>
      </View>
      {dog.titles.length > 0 && (
        <View style={styles.titleCol}>
          {dog.titles.slice(0, 2).map((t) => (
            <View
              key={t}
              style={[
                styles.titleBadge,
                t.startsWith("VA") || t.startsWith("V ")
                  ? styles.titleBadgeGold
                  : styles.titleBadgeGreen,
              ]}
            >
              <Text style={styles.titleBadgeText}>{t}</Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

type TabKey = "info" | "bred" | "owned";

export default function BreederProfileScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { id, name } = route.params as { id: string; name?: string };
  const [activeTab, setActiveTab] = useState<TabKey>("info");

  const { data, isLoading, isError, refetch, isRefetching } = useQuery<BreederDetail>({
    queryKey: ["breeders", id],
    queryFn: () => fetchBreeder(id),
  });

  const breeder = data?.breeder;
  const dogsBred = data?.dogsBred || [];
  const dogsOwned = data?.dogsOwned || [];

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (isError || !breeder) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color={COLORS.textMuted} />
        <Text style={styles.errorText}>
          {isError ? "Failed to load breeder details." : "Breeder not found."}
        </Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()} data-testid="btn-retry">
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const hasImage =
    breeder.imageUrl &&
    !breeder.imageUrl.includes("user-not-found");
  const year = formatYear(breeder.activeSince ?? null);

  const initials = breeder.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleDogPress = (dog: BreederDog) => {
    const dogsNav = navigation.getParent?.();
    if (dogsNav) {
      dogsNav.navigate("DogsTab", {
        screen: "DogProfile",
        params: { id: dog.id, name: dog.name.trim() },
      });
    }
  };

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: "info", label: "Info" },
    { key: "bred", label: "Bred", count: dogsBred.length },
    { key: "owned", label: "Owned", count: dogsOwned.length },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      bounces={true}
      overScrollMode="always"
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
          style={styles.backButton}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate("BreederDirectory");
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
            <Image source={{ uri: breeder.imageUrl }} style={styles.avatarPhoto} resizeMode="cover" />
          ) : (
            <View style={styles.avatarInner}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}
        </View>

        <Text style={styles.breederName}>{breeder.name}</Text>
        <Text style={styles.kennelText}>{breeder.kennelName}</Text>
      </View>

      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
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
              <Text style={styles.cardHeading}>Details</Text>
              <View style={styles.detailsGrid}>
                <DetailItem icon="person" label="Name" value={breeder.name} />
                <DetailItem icon="home" label="Kennel" value={breeder.kennelName} />
                {breeder.membership_no ? (
                  <DetailItem icon="card" label="Membership No." value={breeder.membership_no} />
                ) : null}
                {breeder.city ? (
                  <DetailItem icon="business" label="City" value={breeder.city} />
                ) : null}
                {breeder.country ? (
                  <DetailItem icon="globe" label="Country" value={breeder.country} />
                ) : null}
                {!breeder.city && !breeder.country && breeder.location ? (
                  <DetailItem icon="location" label="Location" value={breeder.location} />
                ) : null}
                {year ? (
                  <DetailItem icon="calendar" label="Active Since" value={year} />
                ) : null}
                <DetailItem icon="paw" label="Total Dogs" value={String(breeder.totalDogs)} />
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardHeading}>Contact</Text>
              <View style={styles.contactRow}>
                {breeder.phone && breeder.phone !== "+00-000-000-0000" ? (
                  <TouchableOpacity
                    style={styles.contactBtn}
                    onPress={() => Linking.openURL(`tel:${breeder.phone}`)}
                    activeOpacity={0.7}
                    data-testid="btn-call"
                  >
                    <Ionicons name="call" size={18} color="#fff" />
                    <Text style={styles.contactBtnText}>Call</Text>
                  </TouchableOpacity>
                ) : null}
                {breeder.email ? (
                  <TouchableOpacity
                    style={[styles.contactBtn, styles.contactBtnSecondary]}
                    onPress={() => Linking.openURL(`mailto:${breeder.email}`)}
                    activeOpacity={0.7}
                    data-testid="btn-email"
                  >
                    <Ionicons name="mail" size={18} color={COLORS.primary} />
                    <Text style={[styles.contactBtnText, styles.contactBtnTextSecondary]}>Email</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              {breeder.phone && breeder.phone !== "+00-000-000-0000" ? (
                <View style={styles.detailsGrid}>
                  <DetailItem icon="call" label="Phone" value={breeder.phone} />
                </View>
              ) : null}
              {breeder.email ? (
                <View style={[styles.detailsGrid, { marginTop: breeder.phone && breeder.phone !== "+00-000-000-0000" ? 20 : 0 }]}>
                  <DetailItem icon="mail" label="Email" value={breeder.email} />
                </View>
              ) : null}
            </View>
          </>
        )}

        {activeTab === "bred" &&
          (dogsBred.length > 0 ? (
            <View>
              {dogsBred.map((dog) => (
                <BreederDogItem
                  key={dog.id}
                  dog={dog}
                  onPress={() => handleDogPress(dog)}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="paw-outline" size={32} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyTitle}>No Dogs Bred</Text>
              <Text style={styles.emptyDesc}>
                No dogs have been bred by this breeder yet.
              </Text>
            </View>
          ))}

        {activeTab === "owned" &&
          (dogsOwned.length > 0 ? (
            <View>
              {dogsOwned.map((dog) => (
                <BreederDogItem
                  key={dog.id}
                  dog={dog}
                  onPress={() => handleDogPress(dog)}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="paw-outline" size={32} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyTitle}>No Dogs Owned</Text>
              <Text style={styles.emptyDesc}>
                No dogs are currently owned by this breeder.
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
  avatarPhoto: {
    flex: 1,
    borderRadius: 9999,
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
  breederName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    marginTop: 12,
    lineHeight: 32,
  },
  kennelText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748B",
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
  dogCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dogAvatar: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.full,
    marginRight: SPACING.md,
    backgroundColor: "#E8F5E9",
  },
  dogAvatarFallback: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.md,
  },
  dogAvatarText: {
    color: COLORS.primary,
    fontWeight: "600",
    fontSize: FONT_SIZES.sm,
  },
  dogInfo: {
    flex: 1,
  },
  dogName: {
    fontSize: FONT_SIZES.md,
    fontWeight: "600",
    color: COLORS.text,
  },
  dogMeta: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  dogBadges: {
    flexDirection: "row",
    gap: 6,
    marginTop: 4,
    flexWrap: "wrap",
  },
  dogBadge: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  dogBadgeText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  titleCol: {
    alignItems: "flex-end",
    gap: 4,
  },
  titleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  titleBadgeGold: {
    backgroundColor: COLORS.accent,
  },
  titleBadgeGreen: {
    backgroundColor: COLORS.primary,
  },
  titleBadgeText: {
    fontSize: FONT_SIZES.xs,
    color: "#fff",
    fontWeight: "500",
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
