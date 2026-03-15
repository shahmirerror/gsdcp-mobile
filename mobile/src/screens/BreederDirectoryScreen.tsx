import { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
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

function BreederListItem({ breeder, onPress }: { breeder: Breeder; onPress: () => void }) {
  const hasImage =
    breeder.imageUrl &&
    !breeder.imageUrl.includes("user-not-found");
  const initials = breeder.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const year = formatYear(breeder.activeSince);

  return (
    <TouchableOpacity style={styles.listItem} onPress={onPress} activeOpacity={0.7} data-testid={`card-breeder-${breeder.id}`}>
      {hasImage ? (
        <Image source={{ uri: breeder.imageUrl }} style={styles.avatarImage} resizeMode="cover" />
      ) : (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
      )}
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={1}>{breeder.name}</Text>
        <Text style={styles.itemSub} numberOfLines={1}>{breeder.kennelName}</Text>
        <View style={styles.badges}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{breeder.totalDogs} dogs</Text>
          </View>
          {breeder.location ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{breeder.location}</Text>
            </View>
          ) : null}
          {year ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Since {year}</Text>
            </View>
          ) : null}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
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

      <View style={styles.countRow}>
        <Text style={styles.count} data-testid="text-breeder-count">
          {filtered.length} {filtered.length === 1 ? "breeder" : "breeders"}
        </Text>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: SPACING.xxl }} data-testid="loading-breeders" />
      ) : isError ? (
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={48} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>Failed to load breeders</Text>
          <Text style={styles.emptyDesc}>Could not connect to the server. Please try again.</Text>
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
            <BreederListItem
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
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  searchContainer: {
    flex: 1,
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
  countRow: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xs,
  },
  count: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  list: {
    padding: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.md,
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.full,
    marginRight: SPACING.md,
    backgroundColor: "#E8F5E9",
  },
  avatarText: {
    color: COLORS.primary,
    fontWeight: "600",
    fontSize: FONT_SIZES.sm,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: FONT_SIZES.md,
    fontWeight: "600",
    color: COLORS.text,
  },
  itemSub: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  badges: {
    flexDirection: "row",
    gap: 6,
    marginTop: 4,
    flexWrap: "wrap",
  },
  badge: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  badgeText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
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
