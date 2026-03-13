import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from "../lib/theme";
import { fetchDog, DogDetail, Pedigree, Dog } from "../lib/api";
import { PedigreeTree } from "../components/PedigreeTree";
import { DogListItem } from "../components/DogListItem";

function DetailRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon} size={16} color={COLORS.textMuted} />
      <View>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function isPedigreePopulated(p: Pedigree | any[] | null | undefined): p is Pedigree {
  if (!p || Array.isArray(p)) return false;
  return p.gen1 !== undefined;
}

type TabKey = "pedigree" | "siblings";

export default function DogProfileScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const dogId = route.params?.id;
  const [activeTab, setActiveTab] = useState<TabKey>("pedigree");

  const { data, isLoading, isError } = useQuery<DogDetail>({
    queryKey: ["dog", dogId],
    queryFn: () => fetchDog(dogId),
    enabled: !!dogId,
  });

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (isError || !data?.dog) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color={COLORS.textMuted} />
        <Text style={styles.errorText}>
          {isError ? "Failed to load dog details." : "Dog not found."}
        </Text>
      </View>
    );
  }

  const dog = data.dog;
  const showResults = data.showResults ?? [];
  const pedigree = data.pedigree;
  const hasPedigree = isPedigreePopulated(pedigree);
  const siblings = (data.siblings ?? []).filter((s: Dog) => s.id !== dogId);

  const initials = dog.dog_name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const age = (() => {
    if (!dog.dob) return null;
    const birth = new Date(dog.dob);
    const now = new Date();
    const years = now.getFullYear() - birth.getFullYear();
    const months = now.getMonth() - birth.getMonth();
    if (years > 0) return `${years}y ${months >= 0 ? months : 12 + months}m`;
    return `${months >= 0 ? months : 12 + months}m`;
  })();

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: "pedigree", label: "Pedigree" },
    { key: "siblings", label: "Siblings", count: siblings.length },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        {dog.KP ? <Text style={styles.kp}>KP: {dog.KP}</Text> : null}
        {dog.titles.length > 0 && (
          <View style={styles.titlesRow}>
            {dog.titles.map((t) => (
              <View key={t} style={styles.titleBadge}>
                <Text style={styles.titleBadgeText}>{t}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Details</Text>
        <View style={styles.detailGrid}>
          <DetailRow icon="paw" label="Breed" value={dog.breed} />
          <DetailRow icon="male-female" label="Sex" value={dog.sex} />
          <DetailRow
            icon="calendar"
            label="Date of Birth"
            value={dog.dob ? `${dog.dob}${age ? ` (${age})` : ""}` : "Unknown"}
          />
          <DetailRow icon="color-palette" label="Color" value={dog.color || "Unknown"} />
        </View>
        <View style={styles.divider} />
        {dog.owner ? <InfoRow label="Owner" value={dog.owner} /> : null}
        {dog.breeder ? <InfoRow label="Breeder" value={dog.breeder} /> : null}
        {dog.microchip ? <InfoRow label="Microchip" value={dog.microchip} /> : null}
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
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === "pedigree" && (
        hasPedigree ? (
          <View style={styles.card}>
            <PedigreeTree pedigree={pedigree} />
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="git-branch-outline" size={36} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No pedigree data available</Text>
          </View>
        )
      )}

      {activeTab === "siblings" && (
        siblings.length > 0 ? (
          <View style={styles.tabContent}>
            {siblings.map((sibling: Dog) => (
              <DogListItem
                key={sibling.id}
                dog={sibling}
                onPress={() =>
                  navigation.push("DogProfile", {
                    id: sibling.id,
                    name: sibling.dog_name,
                  })
                }
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={36} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No siblings found</Text>
          </View>
        )
      )}

      {showResults.length > 0 && (
        <View style={[styles.card, { marginTop: SPACING.lg }]}>
          <Text style={styles.cardTitle}>Show Results</Text>
          {showResults.map((result) => (
            <View key={result.id} style={styles.resultRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.resultShow} numberOfLines={1}>{result.showName}</Text>
                <Text style={styles.resultMeta}>{result.className} · {result.date}</Text>
              </View>
              <View style={styles.awardBadge}>
                <Text style={styles.awardBadgeText}>{result.award}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
    gap: SPACING.md,
  },
  errorText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: SPACING.xl,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  avatarText: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: "700",
    color: COLORS.primary,
  },
  kp: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  titlesRow: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 4,
  },
  titleBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.sm,
  },
  titleBadgeText: {
    color: "#fff",
    fontSize: FONT_SIZES.xs,
    fontWeight: "500",
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  detailGrid: {
    gap: SPACING.md,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.sm,
  },
  detailLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  detailValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: "500",
    color: COLORS.text,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: "500",
    color: COLORS.text,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 3,
    marginBottom: SPACING.md,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: BORDER_RADIUS.sm,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: "#fff",
  },
  tabContent: {
    marginBottom: SPACING.lg,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: SPACING.xxl,
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
  },
  resultShow: {
    fontSize: FONT_SIZES.md,
    fontWeight: "500",
    color: COLORS.text,
  },
  resultMeta: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  awardBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  awardBadgeText: {
    color: "#fff",
    fontSize: FONT_SIZES.xs,
    fontWeight: "500",
  },
});
