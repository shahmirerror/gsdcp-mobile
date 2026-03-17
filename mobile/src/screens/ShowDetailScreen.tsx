import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ImageBackground,
  RefreshControl,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, SPACING, BORDER_RADIUS } from "../lib/theme";
import { fetchShow, ShowDetail } from "../lib/api";

const heroBg = require("../../assets/hero-bg.jpg");

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatDate(dateStr: string): string {
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const day = parseInt(parts[2], 10);
  const monthIndex = parseInt(parts[1], 10) - 1;
  const year = parts[0];
  if (monthIndex < 0 || monthIndex > 11) return dateStr;
  return `${day} ${MONTHS[monthIndex]} ${year}`;
}

const EVENT_TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Show: "trophy",
  "Endurance Test": "fitness",
  "Breed Survey": "clipboard",
  Meeting: "people",
};

const EVENT_TYPE_COLORS: Record<string, string> = {
  Show: COLORS.accent,
  "Endurance Test": "#3B82F6",
  "Breed Survey": "#8B5CF6",
  Meeting: "#10B981",
};

function InfoRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={18} color={COLORS.primary} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function ShowDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { id, name } = route.params as { id: string; name?: string };

  const { data: show, isLoading, isError, refetch, isRefetching } = useQuery<ShowDetail>({
    queryKey: ["shows", id],
    queryFn: () => fetchShow(id),
  });

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        {name && <Text style={styles.loadingName}>{name}</Text>}
      </View>
    );
  }

  if (isError || !show) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Failed to load show details</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()} data-testid="btn-retry">
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()} data-testid="btn-go-back">
          <Text style={[styles.retryText, { color: COLORS.primary, marginTop: 8 }]}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isActive = show.status === "Current" || show.status === "Upcoming";
  const color = EVENT_TYPE_COLORS[show.event_type] || COLORS.accent;
  const icon = EVENT_TYPE_ICONS[show.event_type] || "calendar";

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
            }
          }}
          activeOpacity={0.7}
          data-testid="btn-back"
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
      </ImageBackground>

      <View style={styles.headerSection}>
        <View style={[styles.heroIcon, { backgroundColor: `${color}20` }]}>
          <Ionicons name={icon} size={32} color={color} />
        </View>
        <Text style={styles.showName} data-testid="text-show-name">{show.name}</Text>
        <View style={styles.badgeRow}>
          <View style={[styles.statusBadge, { backgroundColor: isActive ? "#DCFCE7" : "#F3F4F6" }]}>
            <View style={[styles.statusDot, { backgroundColor: isActive ? "#22C55E" : "#9CA3AF" }]} />
            <Text style={[styles.statusText, { color: isActive ? "#16A34A" : "#6B7280" }]}>
              {show.status}
            </Text>
          </View>
          <View style={[styles.typeBadge, { backgroundColor: `${color}18` }]}>
            <Text style={[styles.typeBadgeText, { color }]}>{show.event_type}</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardHeading}>Event Details</Text>
        <InfoRow
          icon="calendar"
          label="Date"
          value={show.dates.length > 0 ? show.dates.map(formatDate).join(" — ") : "TBA"}
        />
        {show.location && (
          <InfoRow icon="location" label="Location" value={show.location} />
        )}
        {show.last_date_of_entry && (
          <InfoRow icon="time" label="Last Date of Entry" value={formatDate(show.last_date_of_entry)} />
        )}
        <InfoRow icon="paw" label="Entries" value={String(show.entryCount)} />
      </View>

      {show.judges.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardHeading}>
            {show.judges.length === 1 ? "Judge" : "Judges"}
          </Text>
          {show.judges.map((judge) => (
            <View key={judge.id} style={styles.judgeRow}>
              <View style={styles.judgeAvatar}>
                <Ionicons name="person" size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.judgeName}>{judge.full_name}</Text>
            </View>
          ))}
        </View>
      )}

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
  loadingName: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 8,
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
    fontSize: 14,
    fontWeight: "600",
  },
  heroBanner: {
    height: 180,
    justifyContent: "flex-end",
  },
  heroGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 120,
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
  },
  headerSection: {
    alignItems: "center",
    marginTop: -40,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.md,
    borderWidth: 3,
    borderColor: "#fff",
  },
  showName: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: SPACING.sm,
    lineHeight: 26,
  },
  badgeRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    alignItems: "center",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeading: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(15,92,59,0.05)",
    gap: SPACING.md,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: `${COLORS.primary}10`,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
    lineHeight: 20,
  },
  judgeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(15,92,59,0.05)",
    gap: SPACING.md,
  },
  judgeAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.primary}10`,
    justifyContent: "center",
    alignItems: "center",
  },
  judgeName: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
  },
});
