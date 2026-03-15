import { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from "../lib/theme";
import { fetchBreeders, Breeder } from "../lib/api";
import type { BreedersStackParamList } from "../navigation/AppNavigator";

type Nav = NativeStackNavigationProp<BreedersStackParamList, "BreederDirectory">;

function formatYear(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const year = new Date(dateStr).getFullYear();
  return isNaN(year) ? null : String(year);
}

function BreederCard({ breeder, onPress }: { breeder: Breeder; onPress: () => void }) {
  const year = formatYear(breeder.activeSince);
  const hasImage =
    breeder.imageUrl &&
    !breeder.imageUrl.includes("user-not-found");
  const initials = breeder.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7} data-testid={`card-breeder-${breeder.id}`}>
      <View style={styles.cardTop}>
        {hasImage ? (
          <Image
            source={{ uri: breeder.imageUrl }}
            style={styles.avatarImage}
          />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        )}
        <View style={styles.cardInfo}>
          <Text style={styles.breederName} numberOfLines={1}>
            {breeder.name}
          </Text>
          <Text style={styles.kennelName} numberOfLines={1}>
            {breeder.kennelName}
          </Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        {breeder.location ? (
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={13} color={COLORS.textMuted} />
            <Text style={styles.metaText} numberOfLines={1}>
              {breeder.location}
            </Text>
          </View>
        ) : null}
        <View style={styles.metaItem}>
          <Ionicons name="paw-outline" size={13} color={COLORS.textMuted} />
          <Text style={styles.metaText}>
            {breeder.totalDogs} {breeder.totalDogs === 1 ? "dog" : "dogs"}
          </Text>
        </View>
        {year ? (
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={13} color={COLORS.textMuted} />
            <Text style={styles.metaText}>Since {year}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.actions}>
        {breeder.phone && breeder.phone !== "+00-000-000-0000" ? (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => Linking.openURL(`tel:${breeder.phone}`)}
            activeOpacity={0.7}
            data-testid={`btn-call-${breeder.id}`}
          >
            <Ionicons name="call-outline" size={16} color={COLORS.primary} />
            <Text style={styles.actionText}>Call</Text>
          </TouchableOpacity>
        ) : null}
        {breeder.email ? (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => Linking.openURL(`mailto:${breeder.email}`)}
            activeOpacity={0.7}
            data-testid={`btn-email-${breeder.id}`}
          >
            <Ionicons name="mail-outline" size={16} color={COLORS.primary} />
            <Text style={styles.actionText}>Email</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

export default function BreederDirectoryScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");

  const { data: breeders, isLoading, isError, refetch } = useQuery<Breeder[]>({
    queryKey: ["breeders"],
    queryFn: fetchBreeders,
  });

  const filtered = useMemo(() => {
    if (!breeders) return [];
    const q = search.trim().toLowerCase();
    if (!q) return breeders;
    return breeders.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.kennelName.toLowerCase().includes(q) ||
        (b.location && b.location.toLowerCase().includes(q)),
    );
  }, [breeders, search]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Breeders</Text>
        {breeders ? (
          <Text style={styles.countBadge} data-testid="text-breeder-count">
            {filtered.length}
          </Text>
        ) : null}
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name, kennel, location..."
            placeholderTextColor={COLORS.textMuted}
            autoCorrect={false}
            data-testid="input-search-breeders"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")} data-testid="btn-clear-search">
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
          style={{ marginTop: SPACING.xxl }}
          data-testid="loading-breeders"
        />
      ) : isError ? (
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={48} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>Failed to load breeders</Text>
          <Text style={styles.emptyDesc}>Could not connect to the server.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()} data-testid="btn-retry">
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <BreederCard
              breeder={item}
              onPress={() =>
                navigation.navigate("BreederProfile", { id: item.id, name: item.name })
              }
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>No breeders found</Text>
              <Text style={styles.emptyDesc}>Try adjusting your search.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    gap: SPACING.sm,
  },
  header: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.text,
  },
  countBadge: {
    fontSize: FONT_SIZES.xs,
    fontWeight: "700",
    color: COLORS.primary,
    backgroundColor: "rgba(15,92,58,0.08)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
    overflow: "hidden",
  },
  searchRow: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  list: {
    padding: SPACING.lg,
    paddingTop: SPACING.xs,
    gap: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(15,92,58,0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  avatarText: {
    fontSize: FONT_SIZES.md,
    fontWeight: "700",
    color: COLORS.primary,
  },
  cardInfo: {
    flex: 1,
  },
  breederName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: "700",
    color: COLORS.text,
  },
  kennelName: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  actions: {
    flexDirection: "row",
    gap: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.md,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: "rgba(15,92,58,0.06)",
  },
  actionText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "600",
    color: COLORS.primary,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 60,
    gap: SPACING.sm,
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
  retryBtn: {
    marginTop: SPACING.md,
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
});
