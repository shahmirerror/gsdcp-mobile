import { useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ImageBackground,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, SPACING, BORDER_RADIUS } from "../lib/theme";
import { fetchDog, DogDetail, Pedigree, Dog, LineBreedingEntry } from "../lib/api";
import { PedigreeTree } from "../components/PedigreeTree";
import { DogListItem } from "../components/DogListItem";

const heroBg = require("../../assets/hero-bg.jpg");

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatDob(dob: string): string {
  const parts = dob.split("-");
  if (parts.length !== 3) return dob;
  const day = parseInt(parts[2], 10);
  const monthIndex = parseInt(parts[1], 10) - 1;
  const year = parts[0];
  if (monthIndex < 0 || monthIndex > 11) return dob;
  return `${day} ${MONTHS[monthIndex]} ${year}`;
}

function DetailItem({
  icon,
  label,
  value,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onPress?: () => void;
}) {
  return (
    <View style={styles.detailItem}>
      <View style={styles.detailIconWrap}>
        <Ionicons name={icon} size={18} color={COLORS.primary} />
      </View>
      <View style={styles.detailTextWrap}>
        <Text style={styles.detailLabel}>{label}</Text>
        {onPress ? (
          <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
            <Text style={[styles.detailValue, styles.detailValueLink]}>{value}</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.detailValue}>{value}</Text>
        )}
      </View>
    </View>
  );
}

function isPedigreePopulated(p: Pedigree | any[] | null | undefined): p is Pedigree {
  if (!p || Array.isArray(p)) return false;
  return p.gen1 !== undefined;
}

type TabKey = "details" | "pedigree" | "siblings";

export default function DogProfileScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const dogId = route.params?.id;
  const [activeTab, setActiveTab] = useState<TabKey>("details");

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
    { key: "details", label: "Details" },
    { key: "pedigree", label: "Pedigree" },
    { key: "siblings", label: "Siblings", count: siblings.length },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <ImageBackground source={heroBg} style={styles.heroBanner} resizeMode="cover">
        <LinearGradient
          colors={["rgba(246,248,247,0)", "rgba(246,248,247,0.6)", "#f6f8f7"]}
          style={styles.heroGradient}
        />
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
      </ImageBackground>

      <View style={styles.profileSection}>
        <View style={styles.avatarOuter}>
          {dog.imageUrl && dog.imageUrl.length > 0 ? (
            <Image source={{ uri: dog.imageUrl }} style={styles.avatarPhoto} resizeMode="cover" />
          ) : (
            <View style={styles.avatarInner}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          )}
        </View>

        {(dog.titles.length > 0 || dog.KP) && (
          <View style={styles.badgesRow}>
            {dog.titles.map((t) => (
              <View
                key={t}
                style={[
                  styles.badge,
                  t.startsWith("VA") || t.startsWith("V ")
                    ? styles.badgeGold
                    : styles.badgeGreen,
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    t.startsWith("VA") || t.startsWith("V ")
                      ? styles.badgeTextGold
                      : styles.badgeTextGreen,
                  ]}
                >
                  {t}
                </Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.dogName}>{dog.dog_name}</Text>
        <Text style={styles.kpText}>
          {dog.KP && dog.KP !== "0"
            ? `KP ${dog.KP}`
            : dog.foreign_reg_no
              ? dog.foreign_reg_no
              : "-"}
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
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
              {tab.count != null ? ` (${tab.count})` : ""}
            </Text>
            {activeTab === tab.key && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.contentArea}>
        {activeTab === "details" && (
          <>
            <View style={styles.card}>
              <Text style={styles.cardHeading}>General</Text>
              <View style={styles.detailsGrid}>
                <DetailItem icon="paw" label="Breed" value={dog.breed} />
                <DetailItem icon="male-female" label="Gender" value={dog.sex} />
                <DetailItem
                  icon="calendar"
                  label="Date of Birth"
                  value={dog.dob ? `${formatDob(dog.dob)}${age ? ` (${age})` : ""}` : "Unknown"}
                />
                <DetailItem icon="color-palette" label="Color" value={dog.color || "Unknown"} />
                <DetailItem icon="cut" label="Coat Type" value={dog.hair || "Unknown"} />
                <DetailItem
                  icon="document-text"
                  label="Stud Book Number"
                  value={dog.KP && dog.KP !== "0" ? `KP ${dog.KP}` : dog.foreign_reg_no ? dog.foreign_reg_no : "-"}
                />
                <DetailItem icon="hardware-chip" label="Microchip" value={dog.microchip || "-"} />
                <DetailItem icon="person" label="Owner" value={dog.owner || "-"} />
                <DetailItem icon="build" label="Breeder" value={dog.breeder || "-"} />
                <DetailItem
                  icon="arrow-up-circle"
                  label="Sire"
                  value={dog.sire || "-"}
                  onPress={dog.sire_id ? () => navigation.push("DogProfile", { id: dog.sire_id }) : undefined}
                />
                <DetailItem
                  icon="arrow-down-circle"
                  label="Dam"
                  value={dog.dam || "-"}
                  onPress={dog.dam_id ? () => navigation.push("DogProfile", { id: dog.dam_id }) : undefined}
                />
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardHeading}>Ratings</Text>
              <View style={styles.detailsGrid}>
                <DetailItem icon="calendar-number" label="Breed Survey Period" value={dog.breed_survey_period || "-"} />
                <DetailItem icon="star" label="Show Rating" value={dog.show_rating || "-"} />
                <DetailItem icon="ribbon" label="Working Title" value={(dog.working_title && dog.working_title.trim()) || "-"} />
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardHeading}>Examinations</Text>
              <View style={styles.detailsGrid}>
                <DetailItem icon="fitness" label="HD Rating" value={dog.hd || "-"} />
                <DetailItem icon="body" label="ED Rating" value={dog.ed || "-"} />
                <DetailItem icon="flask" label="DNA Status" value={dog.dna_status || "-"} />
              </View>
            </View>

            {dog.line_breeding && dog.line_breeding.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardHeading}>Line Breeding</Text>
                {dog.line_breeding.map((entry: LineBreedingEntry, idx: number) => {
                  const genLabel = entry.positions.map((p) => `Gen ${p}`).join("-");
                  const sideLabel = [...new Set(entry.sides.map((s) => s === "father" ? "Sire" : "Dam"))].join(" & ");
                  return (
                    <TouchableOpacity
                      key={`${entry.id}-${idx}`}
                      style={styles.lineBreedRow}
                      activeOpacity={0.7}
                      onPress={() => navigation.push("DogProfile", { id: entry.id })}
                    >
                      <View style={styles.lineBreedInfo}>
                        <Text style={styles.lineBreedName} numberOfLines={1}>{entry.dog_name}</Text>
                        <Text style={styles.lineBreedMeta}>{genLabel} · {sideLabel} side</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {showResults.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardHeading}>Show Results</Text>
                {showResults.map((result) => (
                  <View key={result.id} style={styles.resultRow}>
                    <View style={styles.resultLeft}>
                      <Text style={styles.resultShow} numberOfLines={1}>
                        {result.showName}
                      </Text>
                      <Text style={styles.resultMeta}>
                        {result.className} · {result.date}
                      </Text>
                    </View>
                    <View style={styles.awardBadge}>
                      <Text style={styles.awardBadgeText}>{result.award}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {activeTab === "pedigree" &&
          (hasPedigree ? (
            <View style={styles.card}>
              <Text style={styles.cardHeading}>4-Generation Pedigree</Text>
              <PedigreeTree pedigree={pedigree} />
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="git-branch-outline" size={32} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyTitle}>No Pedigree Data</Text>
              <Text style={styles.emptyDesc}>
                Pedigree information is not yet available for this dog.
              </Text>
            </View>
          ))}

        {activeTab === "siblings" &&
          (siblings.length > 0 ? (
            <View>
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
              <View style={styles.emptyIconWrap}>
                <Ionicons name="people-outline" size={32} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyTitle}>No Siblings Found</Text>
              <Text style={styles.emptyDesc}>
                No sibling records are available for this dog.
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
  avatarText: {
    fontSize: 36,
    fontWeight: "800",
    color: COLORS.primary,
  },
  badgesRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 16,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  badgeGold: {
    backgroundColor: COLORS.accent,
  },
  badgeGreen: {
    backgroundColor: COLORS.primary,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: -0.5,
  },
  badgeTextGold: {
    color: "#FFFFFF",
  },
  badgeTextGreen: {
    color: "#FFFFFF",
  },
  dogName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    marginTop: 12,
    lineHeight: 32,
  },
  kpText: {
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
  cardDivider: {
    height: 1,
    backgroundColor: "rgba(15,92,58,0.08)",
    marginVertical: 20,
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
  detailValueLink: {
    color: COLORS.primary,
    textDecorationLine: "underline",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(15,92,59,0.05)",
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748B",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
    maxWidth: "60%",
    textAlign: "right",
  },
  lineBreedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(15,92,59,0.05)",
  },
  lineBreedInfo: {
    flex: 1,
    marginRight: 8,
  },
  lineBreedName: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.primary,
    marginBottom: 2,
  },
  lineBreedMeta: {
    fontSize: 13,
    color: "#94A3B8",
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(15,92,59,0.05)",
    gap: 12,
  },
  resultLeft: {
    flex: 1,
  },
  resultShow: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
  },
  resultMeta: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
  },
  awardBadge: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  awardBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 8,
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
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  emptyDesc: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    maxWidth: 280,
  },
});
