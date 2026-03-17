import { View, Text, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, BORDER_RADIUS } from "../lib/theme";
import { fetchDashboard, RecentMating } from "../lib/api";

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function MatingCard({ mating }: { mating: RecentMating }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.heartWrap}>
          <Ionicons name="heart" size={16} color="#E11D48" />
        </View>
        <Text style={styles.kennelName}>{mating.kennel_name}</Text>
        {mating.city ? (
          <View style={styles.cityBadge}>
            <Ionicons name="location-outline" size={11} color={COLORS.textMuted} />
            <Text style={styles.cityText}>{mating.city}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.pairingRow}>
        <View style={styles.dogBlock}>
          <View style={[styles.sexDot, { backgroundColor: "#3B82F6" }]} />
          <Text style={styles.dogName} numberOfLines={2}>{mating.sire_name.trim()}</Text>
          <Text style={styles.sexLabel}>Sire</Text>
        </View>
        <View style={styles.timesWrap}>
          <Text style={styles.timesSign}>×</Text>
        </View>
        <View style={styles.dogBlock}>
          <View style={[styles.sexDot, { backgroundColor: "#E11D48" }]} />
          <Text style={styles.dogName} numberOfLines={2}>{mating.dam_name.trim()}</Text>
          <Text style={styles.sexLabel}>Dam</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Ionicons name="calendar-outline" size={13} color={COLORS.textMuted} />
        <Text style={styles.footerText}>{formatDate(mating.mating_date)}</Text>
      </View>
    </View>
  );
}

export default function RecentMatingsScreen() {
  const insets = useSafeAreaInsets();

  const { data: dashboard, isLoading, isError } = useQuery({
    queryKey: ["/api/mobile/dashboard"],
    queryFn: fetchDashboard,
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Recent Matings</Text>
        <Text style={styles.subtitle}>Latest recorded GSDCP matings</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
          style={{ marginTop: 60 }}
        />
      ) : isError ? (
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={48} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>Failed to load matings</Text>
          <Text style={styles.emptyDesc}>Could not connect to the server. Please try again.</Text>
        </View>
      ) : (
        <FlatList
          data={dashboard?.recentMatings ?? []}
          keyExtractor={(item) => item.friendly_URl}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <MatingCard mating={item} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="heart-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>No recent matings</Text>
              <Text style={styles.emptyDesc}>No matings have been recorded recently.</Text>
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: "#fff",
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
  list: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: BORDER_RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  heartWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "rgba(225,29,72,0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  kennelName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },
  cityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: COLORS.background,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.full,
  },
  cityText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: "500",
  },
  pairingRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },
  dogBlock: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: 10,
    gap: 4,
  },
  sexDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 2,
  },
  dogName: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
    lineHeight: 18,
  },
  sexLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 2,
  },
  timesWrap: {
    justifyContent: "center",
    paddingTop: 14,
  },
  timesSign: {
    fontSize: 20,
    fontWeight: "300",
    color: COLORS.textMuted,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    gap: 12,
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
  },
  emptyDesc: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
});
