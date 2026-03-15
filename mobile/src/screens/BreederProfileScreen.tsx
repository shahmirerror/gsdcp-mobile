import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
  FlatList,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from "../lib/theme";
import { fetchBreeder, BreederDetail, BreederDog } from "../lib/api";

function formatYear(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const year = new Date(dateStr).getFullYear();
  return isNaN(year) ? null : String(year);
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
        <Image source={{ uri: dog.imageUrl }} style={styles.dogAvatar} />
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
            <View key={t} style={styles.titleBadge}>
              <Text style={styles.titleBadgeText}>{t}</Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function BreederProfileScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { id, name } = route.params as { id: string; name?: string };

  const { data, isLoading, isError, refetch } = useQuery<BreederDetail>({
    queryKey: ["breeders", id],
    queryFn: () => fetchBreeder(id),
  });

  const breeder = data?.breeder;
  const dogs = data?.dogs || [];

  const hasImage =
    breeder?.imageUrl &&
    !breeder.imageUrl.includes("user-not-found");
  const year = formatYear(breeder?.activeSince ?? null);

  const handleDogPress = (dog: BreederDog) => {
    const dogsNav = navigation.getParent?.();
    if (dogsNav) {
      dogsNav.navigate("DogsTab", {
        screen: "DogProfile",
        params: { id: dog.id, name: dog.name.trim() },
      });
    }
  };

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
        <Text style={styles.errorTitle}>Failed to load breeder</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()} data-testid="btn-retry">
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          data-testid="btn-back"
        >
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle} numberOfLines={1}>
          {name || breeder.kennelName}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={dogs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <View style={styles.profileHeader}>
              {hasImage ? (
                <Image source={{ uri: breeder.imageUrl }} style={styles.profileImage} />
              ) : (
                <View style={styles.profileImageFallback}>
                  <Ionicons name="people" size={36} color={COLORS.primary} />
                </View>
              )}
              <Text style={styles.breederName}>{breeder.name}</Text>
              <Text style={styles.kennelName}>{breeder.kennelName}</Text>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{breeder.totalDogs}</Text>
                <Text style={styles.statLabel}>Dogs</Text>
              </View>
              {year ? (
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{year}</Text>
                  <Text style={styles.statLabel}>Since</Text>
                </View>
              ) : null}
              {breeder.location ? (
                <View style={styles.statItem}>
                  <Ionicons name="location" size={16} color={COLORS.primary} />
                  <Text style={styles.statLabel}>{breeder.location}</Text>
                </View>
              ) : null}
            </View>

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
                  <Text style={[styles.contactBtnText, styles.contactBtnTextSecondary]}>
                    Email
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Registered Dogs</Text>
              <Text style={styles.sectionCount}>{dogs.length}</Text>
            </View>
          </>
        }
        renderItem={({ item }) => (
          <BreederDogItem dog={item} onPress={() => handleDogPress(item)} />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="paw-outline" size={40} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No dogs registered</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    gap: SPACING.md,
  },
  errorTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: "600",
    color: COLORS.text,
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
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
  },
  topBarTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: FONT_SIZES.lg,
    fontWeight: "700",
    color: COLORS.text,
  },
  listContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 20,
    marginBottom: SPACING.md,
  },
  profileImageFallback: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: "rgba(15,92,58,0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  breederName: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.text,
    textAlign: "center",
  },
  kennelName: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: SPACING.xl,
    marginBottom: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statItem: {
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: "800",
    color: COLORS.text,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    fontWeight: "600",
  },
  contactRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: "700",
    color: COLORS.text,
  },
  sectionCount: {
    fontSize: FONT_SIZES.xs,
    fontWeight: "700",
    color: COLORS.primary,
    backgroundColor: "rgba(15,92,58,0.08)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
    overflow: "hidden",
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
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
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
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
  },
});
