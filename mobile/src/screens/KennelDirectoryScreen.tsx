import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Dimensions,
} from "react-native";
import { useState, useMemo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { COLORS, BORDER_RADIUS, SPACING } from "../lib/theme";
import { fetchKennels, Kennel } from "../lib/api";

const SCREEN_WIDTH = Dimensions.get("window").width;
const DEFAULT_IMAGE = "user-not-found.png";

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function getActiveSinceYear(dateStr: string): string {
  return dateStr ? new Date(dateStr).getFullYear().toString() : "";
}

function isDefaultImage(url: string): boolean {
  return !url || url.includes(DEFAULT_IMAGE);
}

function KennelCard({ kennel }: { kennel: Kennel }) {
  const [imgError, setImgError] = useState(false);
  const showAvatar = isDefaultImage(kennel.imageUrl) || imgError;
  const initials = getInitials(kennel.kennelName);
  const year = getActiveSinceYear(kennel.activeSince);

  return (
    <View style={styles.card} data-testid={`card-kennel-${kennel.id}`}>
      {showAvatar ? (
        <View style={styles.avatarWrap}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
      ) : (
        <Image
          source={{ uri: kennel.imageUrl }}
          style={styles.avatarImg}
          onError={() => setImgError(true)}
        />
      )}

      <View style={styles.cardBody}>
        <Text style={styles.kennelName} numberOfLines={1}>
          {kennel.kennelName}
        </Text>

        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={12} color={COLORS.textMuted} />
          <Text style={styles.metaText} numberOfLines={1}>
            {kennel.city}, {kennel.country}
          </Text>
        </View>

        <View style={styles.tagsRow}>
          {year ? (
            <View style={styles.tag}>
              <Ionicons name="calendar-outline" size={10} color={COLORS.primary} />
              <Text style={styles.tagText}>Since {year}</Text>
            </View>
          ) : null}
          {kennel.phone ? (
            <View style={styles.tag}>
              <Ionicons name="call-outline" size={10} color={COLORS.primary} />
              <Text style={styles.tagText} numberOfLines={1}>
                {kennel.phone}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <Ionicons name="chevron-forward" size={16} color={COLORS.border} />
    </View>
  );
}

export default function KennelDirectoryScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");

  const { data: kennels, isLoading, isError, refetch } = useQuery<Kennel[]>({
    queryKey: ["kennels"],
    queryFn: fetchKennels,
  });

  const filtered = useMemo(() => {
    if (!kennels) return [];
    const q = search.trim().toLowerCase();
    if (!q) return kennels;
    return kennels.filter(
      (k) =>
        k.kennelName.toLowerCase().includes(q) ||
        k.city.toLowerCase().includes(q) ||
        k.location.toLowerCase().includes(q),
    );
  }, [kennels, search]);

  const uniqueFiltered = useMemo(() => {
    const seen = new Set<string>();
    return filtered.filter((k) => {
      if (seen.has(k.id)) return false;
      seen.add(k.id);
      return true;
    });
  }, [filtered]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Kennel Directory</Text>
        <Text style={styles.subtitle}>
          {kennels ? `${kennels.length} registered kennels` : "Browse GSDCP kennels"}
        </Text>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={16} color={COLORS.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by kennel name or city..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
          data-testid="input-kennel-search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")} data-testid="button-clear-search">
            <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading kennels...</Text>
        </View>
      ) : isError ? (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color={COLORS.error} />
          <Text style={styles.errorText}>Failed to load kennels</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => refetch()}
            data-testid="button-retry-kennels"
          >
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : uniqueFiltered.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="home-outline" size={48} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>
            {search ? "No kennels found" : "No kennels available"}
          </Text>
          <Text style={styles.emptyDesc}>
            {search
              ? `No results for "${search}"`
              : "Check back later for registered kennels."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={uniqueFiltered}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          renderItem={({ item }) => <KennelCard kennel={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListHeaderComponent={
            search && uniqueFiltered.length > 0 ? (
              <Text style={styles.resultsCount}>
                {uniqueFiltered.length} result{uniqueFiltered.length !== 1 ? "s" : ""}
              </Text>
            ) : null
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.primaryDark,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 10,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  searchIcon: {
    flexShrink: 0,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    padding: 0,
    margin: 0,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  resultsCount: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: "500",
    paddingVertical: 6,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: 72,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  avatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(15,92,58,0.10)",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.primary,
  },
  avatarImg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    flexShrink: 0,
  },
  cardBody: {
    flex: 1,
    gap: 3,
  },
  kennelName: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.textMuted,
    flex: 1,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 2,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15,92,58,0.07)",
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: 7,
    paddingVertical: 3,
    gap: 3,
  },
  tagText: {
    fontSize: 11,
    fontWeight: "500",
    color: COLORS.primary,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 8,
  },
  errorText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    textAlign: "center",
  },
  retryBtn: {
    marginTop: 4,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
  },
  retryText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
  },
  emptyDesc: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 19,
  },
});
