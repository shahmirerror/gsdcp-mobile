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
  RefreshControl,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, SPACING, BORDER_RADIUS } from "../lib/theme";
import { formatDate } from "../lib/dateUtils";
import {
  fetchDog,
  DogDetail,
  Pedigree,
  Dog,
  DogOwner,
  LineBreedingEntry,
  ProgenyEntry,
  ProgenyPuppy,
  HereditaryData,
  HereditaryGrades,
} from "../lib/api";
import { PedigreeTree } from "../components/PedigreeTree";
import { DogListItem } from "../components/DogListItem";

const heroBg = require("../../assets/hero-bg.jpg");


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
            <Text style={[styles.detailValue, styles.detailValueLink]}>
              {value}
            </Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.detailValue}>{value}</Text>
        )}
      </View>
    </View>
  );
}

function isValidOwnerImage(url: string | null | undefined) {
  if (!url) return false;
  if (url.includes("user-not-found")) return false;
  if (url.startsWith("https::")) return false;
  return url.startsWith("http");
}

function ownerInitials(name: string) {
  return name
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/* Module-level — safe to use in JSX without violating Rules of Hooks */
function OwnerRow({
  o,
  isLast,
  onPress,
}: {
  o: DogOwner;
  isLast: boolean;
  onPress: () => void;
}) {
  const hasImg = isValidOwnerImage(o.imageUrl);
  return (
    <TouchableOpacity
      style={[styles.ownerRow, !isLast && styles.ownerRowBorder]}
      onPress={onPress}
      activeOpacity={0.7}
      data-testid={`btn-owner-${o.member_id}`}
    >
      {hasImg ? (
        <Image source={{ uri: o.imageUrl! }} style={styles.ownerAvatar} />
      ) : (
        <View style={[styles.ownerAvatar, styles.ownerAvatarPlaceholder]}>
          <Text style={styles.ownerAvatarInitials}>
            {ownerInitials(o.name)}
          </Text>
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.ownerName}>{o.name}</Text>
        <Text style={styles.ownerSub}>
          {o.membership_no}
          {o.city ? ` · ${o.city}` : ""}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
}

function OwnerSection({
  owners,
  navigation,
}: {
  owners: DogOwner[] | null;
  navigation: any;
}) {
  const [expanded, setExpanded] = useState(false);

  /* deduplicate by member_id */
  const unique = owners
    ? Array.from(new Map(owners.map((o) => [o.member_id, o])).values())
    : [];

  const goToMember = (o: DogOwner) =>
    navigation.push("MemberProfile", {
      id: o.member_id,
      member: {
        id: o.member_id,
        member_name: o.name,
        membership_no: o.membership_no,
        city: o.city,
        country: o.country,
        imageUrl: o.imageUrl,
      },
    });

  if (unique.length === 0) {
    return <DetailItem icon="person" label="Owner" value="-" />;
  }

  if (unique.length === 1) {
    const o = unique[0];
    const hasImg = isValidOwnerImage(o.imageUrl);
    return (
      <TouchableOpacity
        style={styles.detailItem}
        onPress={() => goToMember(o)}
        activeOpacity={0.7}
        data-testid={`btn-owner-${o.member_id}`}
      >
        <View style={styles.detailIconWrap}>
          <Ionicons name="person" size={18} color={COLORS.primary} />
        </View>
        <View style={styles.detailTextWrap}>
          <Text style={styles.detailLabel}>Owner</Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              marginTop: 2,
            }}
          >
            {hasImg ? (
              <Image source={{ uri: o.imageUrl! }} style={styles.ownerAvatar} />
            ) : (
              <View style={[styles.ownerAvatar, styles.ownerAvatarPlaceholder]}>
                <Text style={styles.ownerAvatarInitials}>
                  {ownerInitials(o.name)}
                </Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={[styles.detailValue, { color: COLORS.primary }]}>
                {o.name}
              </Text>
              <Text style={styles.ownerSub}>
                {o.membership_no}
                {o.city ? ` · ${o.city}` : ""}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={COLORS.textMuted}
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  /* Multiple owners — collapsible dropdown */
  return (
    <View style={styles.detailItem}>
      <View style={styles.detailIconWrap}>
        <Ionicons name="people" size={18} color={COLORS.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.detailLabel}>Owners</Text>
        <TouchableOpacity
          style={styles.ownersToggle}
          onPress={() => setExpanded((v) => !v)}
          activeOpacity={0.7}
          data-testid="btn-owners-toggle"
        >
          <Text style={styles.detailValue}>{unique.length} Owners</Text>
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={16}
            color={COLORS.primary}
          />
        </TouchableOpacity>
        {expanded && (
          <View style={styles.ownersList}>
            {unique.map((o, i) => (
              <OwnerRow
                key={o.member_id}
                o={o}
                isLast={i === unique.length - 1}
                onPress={() => goToMember(o)}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

function isPedigreePopulated(
  p: Pedigree | any[] | null | undefined,
): p is Pedigree {
  if (!p || Array.isArray(p)) return false;
  return p.gen1 !== undefined;
}

type TabKey =
  | "details"
  | "pedigree"
  | "siblings"
  | "progeny"
  | "shows"
  | "health";

export default function DogProfileScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const dogId = route.params?.id;
  const [activeTab, setActiveTab] = useState<TabKey>("details");
  const [expandedLitters, setExpandedLitters] = useState<Set<number>>(
    new Set(),
  );
  const [expandedProgeny, setExpandedProgeny] = useState<Set<number>>(
    new Set(),
  );

  const { data, isLoading, isError, refetch, isRefetching } =
    useQuery<DogDetail>({
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
        <Ionicons
          name="alert-circle-outline"
          size={48}
          color={COLORS.textMuted}
        />
        <Text style={styles.errorText}>
          {isError ? "Failed to load dog details." : "Dog not found."}
        </Text>
      </View>
    );
  }

  const dog = data.dog;
  const showResults = data.showResults ?? [];
  const hdHereditary = data.hd_hereditary ?? null;
  const edHereditary = data.ed_hereditary ?? null;
  const hasHealth = !!(hdHereditary || edHereditary);
  const pedigree = data.pedigree;
  const hasPedigree = isPedigreePopulated(pedigree);
  const siblings = (data.siblings ?? []).filter((s: Dog) => s.id !== dogId);
  const lineBreeding = data.line_breeding ?? [];
  const progeny = data.progeny ?? [];

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

  const tabs: { key: TabKey; label: string; icon: string; count?: number }[] = [
    { key: "details", label: "Details", icon: "list-outline" as const },
    { key: "pedigree", label: "Pedigree", icon: "git-branch-outline" as const },
    { key: "siblings", label: "Siblings", icon: "people-outline" as const },
    { key: "progeny", label: "Progeny", icon: "paw-outline" as const },
    { key: "shows", label: "Shows", icon: "ribbon-outline" as const },
    { key: "health", label: "HD/ED", icon: "medkit-outline" as const },
  ];

  // ── HD/ED tab helpers (defined outside JSX to avoid IIFE-inside-JSX parser issues) ──

  const HEALTH_COLS: { key: keyof HereditaryGrades; label: string }[] = [
    { key: "norm",  label: "Normal" },
    { key: "fnorm", label: "Fast Normal" },
    { key: "jperm", label: "Just Permitted" },
    { key: "mid",   label: "Middle" },
    { key: "sev",   label: "Severe" },
  ];

  const healthGradesTotal = (g: HereditaryGrades) =>
    g.total ?? ((g.norm || 0) + (g.fnorm || 0) + (g.jperm || 0) + (g.mid || 0) + (g.sev || 0));
  const healthGradesRadiographed = (g: HereditaryGrades) =>
    (g.norm || 0) + (g.fnorm || 0) + (g.jperm || 0) + (g.mid || 0) + (g.sev || 0);
  const healthPct = (n: number, total: number) =>
    total > 0 ? ((n / total) * 100).toFixed(2) + "%" : "0.00%";

  const renderHealthTypeBlock = (
    typeLabel: string,
    ownRating: string | null | undefined,
    grades: HereditaryGrades | null | undefined,
  ) => {
    if (!ownRating && !grades) return null;
    const totalOffspring = grades ? healthGradesTotal(grades) : 0;
    const radiographed   = grades ? healthGradesRadiographed(grades) : 0;
    return (
      <View style={styles.healthTypeBlock}>
        <Text style={styles.healthTypeLabel}>{typeLabel}</Text>
        {ownRating ? (
          <View style={styles.healthOwnRatingRow}>
            <Text style={styles.healthOwnRatingLabel}>Rating</Text>
            <Text style={styles.healthOwnRatingValue}>{ownRating}</Text>
          </View>
        ) : null}
        {grades ? (
          <View>
            <View style={[styles.healthStats, ownRating ? { marginTop: 8 } : {}]}>
              <View style={styles.healthStatItem}>
                <Text style={styles.healthStatValue}>{totalOffspring}</Text>
                <Text style={styles.healthStatLabel}>Total Offspring</Text>
              </View>
              <View style={styles.healthStatDivider} />
              <View style={styles.healthStatItem}>
                <Text style={styles.healthStatValue}>{radiographed}</Text>
                <Text style={styles.healthStatLabel}>Radiographed</Text>
              </View>
            </View>
            <View style={styles.healthTable}>
              <View style={styles.healthTableHeader}>
                <Text style={[styles.healthTableCell, styles.healthTableHeaderText, styles.healthTableRatingCell]}>Rating</Text>
                <Text style={[styles.healthTableCell, styles.healthTableHeaderText]}>Number</Text>
                <Text style={[styles.healthTableCell, styles.healthTableHeaderText]}>Percentage</Text>
              </View>
              {HEALTH_COLS.map((c, ri) => (
                <View key={c.key} style={[styles.healthTableRow, ri % 2 === 1 && styles.healthTableRowAlt]}>
                  <Text style={[styles.healthTableCell, styles.healthTableRowLabel, styles.healthTableRatingCell]}>{c.label}</Text>
                  <Text style={styles.healthTableCell}>{grades[c.key] ?? 0}</Text>
                  <Text style={styles.healthTableCell}>{healthPct((grades[c.key] as number) || 0, radiographed)}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </View>
    );
  };

  const renderHealthContent = () => {
    const hasThisDog = !!(dog.hd || dog.ed || hdHereditary?.kids || edHereditary?.kids);
    const hasSire    = !!(hdHereditary?.sire || edHereditary?.sire);
    const hasDam     = !!(hdHereditary?.dam  || edHereditary?.dam);
    if (!hasThisDog && !hasSire && !hasDam) {
      return (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="medkit-outline" size={32} color={COLORS.primary} />
          </View>
          <Text style={styles.emptyTitle}>No Health Data</Text>
          <Text style={styles.emptyDesc}>No hereditary health results are available for this dog.</Text>
        </View>
      );
    }
    return (
      <View style={{ gap: 20 }}>
        {hasThisDog ? (
          <View style={styles.healthSection}>
            <View style={styles.healthSectionHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="heart-circle-outline" size={18} color={COLORS.primary} />
                <Text style={styles.healthSectionTitle}>This Dog</Text>
              </View>
            </View>
            <View style={styles.healthBlock}>
              {renderHealthTypeBlock("HD — Hip Dysplasia",   dog.hd, hdHereditary?.kids)}
              {renderHealthTypeBlock("ED — Elbow Dysplasia", dog.ed, edHereditary?.kids)}
            </View>
          </View>
        ) : null}
        {hasSire ? (
          <View style={styles.healthSection}>
            <View style={styles.healthSectionHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="heart-circle-outline" size={18} color={COLORS.primary} />
                <Text style={styles.healthSectionTitle}>Sire</Text>
              </View>
              {dog.sire_id ? (
                <TouchableOpacity onPress={() => (navigation as any).push("DogProfile", { id: dog.sire_id })} activeOpacity={0.7}>
                  <Text style={styles.healthBlockNavLink}>View Profile</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            <View style={styles.healthBlock}>
              {renderHealthTypeBlock("HD — Hip Dysplasia",   null, hdHereditary?.sire)}
              {renderHealthTypeBlock("ED — Elbow Dysplasia", null, edHereditary?.sire)}
            </View>
          </View>
        ) : null}
        {hasDam ? (
          <View style={styles.healthSection}>
            <View style={styles.healthSectionHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="heart-circle-outline" size={18} color={COLORS.primary} />
                <Text style={styles.healthSectionTitle}>Dam</Text>
              </View>
              {dog.dam_id ? (
                <TouchableOpacity onPress={() => (navigation as any).push("DogProfile", { id: dog.dam_id })} activeOpacity={0.7}>
                  <Text style={styles.healthBlockNavLink}>View Profile</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            <View style={styles.healthBlock}>
              {renderHealthTypeBlock("HD — Hip Dysplasia",   null, hdHereditary?.dam)}
              {renderHealthTypeBlock("ED — Elbow Dysplasia", null, edHereditary?.dam)}
            </View>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      bounces={true}
      overScrollMode="always"
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          tintColor={COLORS.primary}
          colors={[COLORS.primary]}
        />
      }
    >
      <ImageBackground
        source={heroBg}
        style={styles.heroBanner}
        resizeMode="cover"
      >
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
              navigation.navigate("DogSearch");
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
          {dog.imageUrl && dog.imageUrl.length > 0 ? (
            <Image
              source={{ uri: dog.imageUrl }}
              style={styles.avatarPhoto}
              resizeMode="cover"
            />
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

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabBar}
        contentContainerStyle={styles.tabBarContent}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.75}
            >
              <Ionicons
                name={tab.icon as any}
                size={15}
                color={isActive ? "#fff" : COLORS.textMuted}
                style={{ marginRight: 5 }}
              />
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab.label}
              </Text>
              {tab.count != null && tab.count > 0 && (
                <View
                  style={[styles.tabBadge, isActive && styles.tabBadgeActive]}
                >
                  <Text
                    style={[
                      styles.tabBadgeText,
                      isActive && styles.tabBadgeTextActive,
                    ]}
                  >
                    {tab.count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

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
                  value={
                    dog.dob
                      ? `${formatDate(dog.dob)}${age ? ` (${age})` : ""}`
                      : "Unknown"
                  }
                />
                <DetailItem
                  icon="color-palette"
                  label="Color"
                  value={dog.color || "Unknown"}
                />
                <DetailItem
                  icon="cut"
                  label="Coat Type"
                  value={dog.hair || "Unknown"}
                />
                <DetailItem
                  icon="document-text"
                  label="Stud Book Number"
                  value={
                    dog.KP && dog.KP !== "0"
                      ? `KP ${dog.KP}`
                      : dog.foreign_reg_no
                        ? dog.foreign_reg_no
                        : "-"
                  }
                />
                <DetailItem
                  icon="hardware-chip"
                  label="Microchip"
                  value={dog.microchip || "-"}
                />
                <OwnerSection owners={dog.owner} navigation={navigation} />
                <DetailItem
                  icon="build"
                  label="Breeder"
                  value={dog.breeder || "-"}
                />
                <DetailItem
                  icon="arrow-up-circle"
                  label="Sire"
                  value={dog.sire || "-"}
                  onPress={
                    dog.sire_id
                      ? () => navigation.push("DogProfile", { id: dog.sire_id })
                      : undefined
                  }
                />
                <DetailItem
                  icon="arrow-down-circle"
                  label="Dam"
                  value={dog.dam || "-"}
                  onPress={
                    dog.dam_id
                      ? () => navigation.push("DogProfile", { id: dog.dam_id })
                      : undefined
                  }
                />
              </View>
              <View style={styles.cardDivider} />
              <Text style={styles.cardSubHeading}>Line Breeding</Text>
              {lineBreeding.length > 0 ? (
                lineBreeding.map((entry: LineBreedingEntry, idx: number) => {
                  const sirePositions: string[] = [];
                  const damPositions: string[] = [];
                  entry.positions.forEach((p, i) => {
                    if (entry.sides[i] === "father") sirePositions.push(p);
                    else damPositions.push(p);
                  });
                  const genLabel = [
                    sirePositions.join(","),
                    damPositions.join(","),
                  ]
                    .filter(Boolean)
                    .join(" - ");
                  const sideLabel = [
                    sirePositions.length > 0 ? "Sire side" : "",
                    damPositions.length > 0 ? "Dam side" : "",
                  ]
                    .filter(Boolean)
                    .join(" - ");

                  if (
                    (entry.type === "litter_pair" ||
                      entry.type === "litter_group") &&
                    entry.dogs &&
                    entry.dogs.length > 0
                  ) {
                    const isExpanded = expandedLitters.has(idx);
                    const toggleExpand = () => {
                      setExpandedLitters((prev) => {
                        const next = new Set(prev);
                        if (next.has(idx)) next.delete(idx);
                        else next.add(idx);
                        return next;
                      });
                    };
                    return (
                      <View key={`litter-${idx}`}>
                        <TouchableOpacity
                          style={styles.lineBreedRow}
                          activeOpacity={0.7}
                          onPress={toggleExpand}
                        >
                          <View style={styles.lineBreedInfo}>
                            <Text
                              style={styles.lineBreedName}
                              numberOfLines={1}
                            >
                              Litter {entry.litter_letter}
                              {entry.kennel ? ` from ${entry.kennel}` : ""}
                            </Text>
                            <Text style={styles.lineBreedMeta}>
                              {genLabel} ({sideLabel})
                            </Text>
                          </View>
                          <Ionicons
                            name={
                              isExpanded ? "chevron-down" : "chevron-forward"
                            }
                            size={18}
                            color="#94A3B8"
                          />
                        </TouchableOpacity>
                        {isExpanded && (
                          <View style={styles.litterDropdown}>
                            {entry.dogs.map((d) => (
                              <TouchableOpacity
                                key={d.id}
                                style={styles.litterDogRow}
                                activeOpacity={0.7}
                                onPress={() =>
                                  navigation.push("DogProfile", { id: d.id })
                                }
                              >
                                <Ionicons
                                  name="paw"
                                  size={14}
                                  color={COLORS.primary}
                                />
                                <Text
                                  style={styles.litterDogName}
                                  numberOfLines={1}
                                >
                                  {d.dog_name}
                                </Text>
                                <Ionicons
                                  name="chevron-forward"
                                  size={16}
                                  color="#94A3B8"
                                />
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}
                      </View>
                    );
                  }

                  return (
                    <TouchableOpacity
                      key={`${entry.id}-${idx}`}
                      style={styles.lineBreedRow}
                      activeOpacity={0.7}
                      onPress={() =>
                        entry.id
                          ? navigation.push("DogProfile", { id: entry.id })
                          : undefined
                      }
                    >
                      <View style={styles.lineBreedInfo}>
                        <Text style={styles.lineBreedName} numberOfLines={1}>
                          {entry.dog_name}
                        </Text>
                        <Text style={styles.lineBreedMeta}>
                          {genLabel} ({sideLabel})
                        </Text>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color="#94A3B8"
                      />
                    </TouchableOpacity>
                  );
                })
              ) : (
                <Text style={styles.lineBreedEmpty}>
                  No common ancestory was found in 5 generations
                </Text>
              )}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardHeading}>Ratings</Text>
              <View style={styles.detailsGrid}>
                <DetailItem
                  icon="calendar-number"
                  label="Breed Survey Period"
                  value={dog.breed_survey_period || "-"}
                />
                <DetailItem
                  icon="star"
                  label="Show Rating"
                  value={
                    dog.show_rating ||
                    (dog.titles.length > 0 ? dog.titles.join(", ") : "-")
                  }
                />
                <DetailItem
                  icon="ribbon"
                  label="Working Title"
                  value={(dog.working_title && dog.working_title.trim()) || "-"}
                />
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardHeading}>Examinations</Text>
              <View style={styles.detailsGrid}>
                <DetailItem
                  icon="fitness"
                  label="HD Rating"
                  value={dog.hd || "-"}
                />
                <DetailItem
                  icon="body"
                  label="ED Rating"
                  value={dog.ed || "-"}
                />
                <DetailItem
                  icon="flask"
                  label="DNA Status"
                  value={dog.dna_status || "-"}
                />
              </View>
            </View>
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
                <Ionicons
                  name="git-branch-outline"
                  size={32}
                  color={COLORS.primary}
                />
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
                <Ionicons
                  name="people-outline"
                  size={32}
                  color={COLORS.primary}
                />
              </View>
              <Text style={styles.emptyTitle}>No Siblings Found</Text>
              <Text style={styles.emptyDesc}>
                No sibling records are available for this dog.
              </Text>
            </View>
          ))}

        {activeTab === "progeny" &&
          (progeny.length > 0 ? (
            <View style={{ gap: 14 }}>
              {progeny.map((entry: ProgenyEntry, i: number) => {
                const partner = entry.partner;
                const isSire = entry.partner_type === "sire";
                const partnerInitials =
                  (partner.dog_name || "")
                    .trim()
                    .split(" ")
                    .filter(Boolean)
                    .map((w: string) => w[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase() || "?";
                const puppies = entry.puppies || [];
                const puppyCount = puppies.length;
                const isOpen = expandedProgeny.has(i);
                const toggleProgeny = () => {
                  setExpandedProgeny((prev) => {
                    const next = new Set(prev);
                    if (next.has(i)) next.delete(i);
                    else next.add(i);
                    return next;
                  });
                };
                const uniqueDobs = [
                  ...new Set(
                    puppies
                      .map((p: ProgenyPuppy) => p.dob)
                      .filter(Boolean)
                  ),
                ];
                const singleLitterDob =
                  uniqueDobs.length === 1 ? (uniqueDobs[0] as string) : null;
                return (
                  <View key={`${partner.id}-${i}`} style={styles.litterCard}>
                    <TouchableOpacity
                      style={styles.litterPartner}
                      onPress={() =>
                        navigation.push("DogProfile", {
                          id: partner.id,
                          name: partner.dog_name,
                        })
                      }
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.litterAvatar,
                          isSire
                            ? styles.litterAvatarSire
                            : styles.litterAvatarDam,
                        ]}
                      >
                        <Text style={styles.litterAvatarText}>
                          {partnerInitials}
                        </Text>
                      </View>
                      <View style={styles.litterPartnerInfo}>
                        <View style={styles.litterPartnerRow}>
                          <Text
                            style={styles.litterPartnerName}
                            numberOfLines={1}
                          >
                            {partner.dog_name}
                          </Text>
                          <View
                            style={[
                              styles.partnerTypeBadge,
                              isSire ? styles.sireBadge : styles.damBadge,
                            ]}
                          >
                            <Text style={styles.partnerTypeBadgeText}>
                              {isSire ? "♂ Sire" : "♀ Dam"}
                            </Text>
                          </View>
                        </View>
                        {partner.show_title ? (
                          <Text style={styles.litterPartnerSub}>
                            {partner.show_title} · KP {partner.KP || "-"}
                          </Text>
                        ) : (
                          <Text style={styles.litterPartnerSub}>
                            KP {partner.KP || "-"}
                          </Text>
                        )}
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color={COLORS.textMuted}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.litterDivider}
                      onPress={toggleProgeny}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.litterDividerText}>
                        {puppyCount} {puppyCount === 1 ? "Puppy" : "Puppies"}
                        {singleLitterDob
                          ? `  ·  ${formatDate(singleLitterDob)}`
                          : uniqueDobs.length > 1
                          ? `  ·  ${uniqueDobs.length} Litters`
                          : ""}
                      </Text>
                      <Ionicons
                        name={isOpen ? "chevron-up" : "chevron-down"}
                        size={14}
                        color={COLORS.textMuted}
                      />
                    </TouchableOpacity>

                    {isOpen &&
                      (() => {
                        const groups: Record<string, ProgenyPuppy[]> = {};
                        puppies.forEach((puppy: ProgenyPuppy) => {
                          const key = puppy.dob || "Unknown";
                          if (!groups[key]) groups[key] = [];
                          groups[key].push(puppy);
                        });
                        const sortedKeys = Object.keys(groups).sort((a, b) => {
                          if (a === "Unknown") return 1;
                          if (b === "Unknown") return -1;
                          return b.localeCompare(a);
                        });
                        return sortedKeys.map((dobKey) => {
                          const group = groups[dobKey];
                          const label =
                            dobKey === "Unknown"
                              ? "Unknown DOB"
                              : formatDate(dobKey);
                          return (
                            <View key={dobKey}>
                              <View style={styles.puppyDobHeader}>
                                <Text style={styles.puppyDobHeaderText}>
                                  {label}
                                </Text>
                              </View>
                              {group.map((puppy: ProgenyPuppy, j: number) => {
                                const isMale =
                                  (puppy.sex || "").toLowerCase() === "male";
                                return (
                                  <TouchableOpacity
                                    key={puppy.id || j}
                                    style={[
                                      styles.puppyRow,
                                      j < group.length - 1 &&
                                        styles.puppyRowBorder,
                                    ]}
                                    onPress={() =>
                                      navigation.push("DogProfile", {
                                        id: puppy.id,
                                        name: puppy.dog_name,
                                      })
                                    }
                                    activeOpacity={0.7}
                                  >
                                    <View
                                      style={[
                                        styles.puppyDot,
                                        isMale
                                          ? styles.puppyDotMale
                                          : styles.puppyDotFemale,
                                      ]}
                                    >
                                      <Text style={styles.puppyDotText}>
                                        {isMale ? "♂" : "♀"}
                                      </Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                      <Text
                                        style={styles.puppyName}
                                        numberOfLines={1}
                                      >
                                        {puppy.dog_name}
                                      </Text>
                                      <Text style={styles.puppyMeta}>
                                        {puppy.show_title
                                          ? `${puppy.show_title} · `
                                          : ""}
                                        KP {puppy.KP || "-"}
                                      </Text>
                                    </View>
                                    <Ionicons
                                      name="chevron-forward"
                                      size={14}
                                      color={COLORS.textMuted}
                                    />
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                          );
                        });
                      })()}
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="paw-outline" size={32} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyTitle}>No Progeny Recorded</Text>
              <Text style={styles.emptyDesc}>
                No offspring have been recorded for this dog.
              </Text>
            </View>
          ))}

        {activeTab === "shows" &&
          (showResults.length > 0 ? (
            <View style={{ gap: 12 }}>
              {showResults.map((result) => {
                const g = (result.grading || "").toLowerCase();
                const gradingColor = g.startsWith("exc")
                  ? "#16a34a"
                  : g.startsWith("v g") || g.startsWith("very")
                    ? "#0891b2"
                    : g.startsWith("g")
                      ? COLORS.accent
                      : g.startsWith("suf")
                        ? "#ea580c"
                        : COLORS.primary;
                return (
                  <TouchableOpacity
                    key={result.id}
                    style={styles.showCard}
                    activeOpacity={result.showEventId ? 0.75 : 1}
                    onPress={() => {
                      if (result.showEventId) {
                        (navigation as any).push("ShowDetail", {
                          id: result.showEventId,
                          name: result.showName,
                        });
                      }
                    }}
                  >
                    <View
                      style={[
                        styles.showGradingStripe,
                        { backgroundColor: gradingColor },
                      ]}
                    />
                    <View style={styles.showCardInner}>
                      <View style={styles.showCardTop}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.showName} numberOfLines={2}>
                            {result.showName}
                          </Text>
                          <View style={styles.showMetaRow}>
                            {result.className ? (
                              <View style={styles.showClassBadge}>
                                <Text style={styles.showClassText}>
                                  {result.className}
                                </Text>
                              </View>
                            ) : null}
                            {result.date ? (
                              <Text style={styles.showDate}>
                                <Ionicons
                                  name="calendar-outline"
                                  size={11}
                                  color={COLORS.textMuted}
                                />{" "}
                                {formatDate(result.date)}
                              </Text>
                            ) : null}
                          </View>
                        </View>
                        <View style={styles.showRight}>
                          <View
                            style={[
                              styles.showGradingBadge,
                              { backgroundColor: gradingColor },
                            ]}
                          >
                            <Text style={styles.showGradingText}>
                              {result.grading}
                            </Text>
                          </View>
                          {result.placement ? (
                            <View style={styles.showPlacement}>
                              <Ionicons
                                name="trophy-outline"
                                size={12}
                                color={gradingColor}
                              />
                              <Text
                                style={[
                                  styles.showPlacementText,
                                  { color: gradingColor },
                                ]}
                              >
                                #{result.placement}
                              </Text>
                            </View>
                          ) : null}
                          {result.showEventId ? (
                            <Ionicons
                              name="chevron-forward"
                              size={14}
                              color="#CBD5E1"
                              style={{ marginTop: 4 }}
                            />
                          ) : null}
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Ionicons
                  name="ribbon-outline"
                  size={32}
                  color={COLORS.primary}
                />
              </View>
              <Text style={styles.emptyTitle}>No Show Results</Text>
              <Text style={styles.emptyDesc}>
                This dog has not been entered in any conformation shows yet.
              </Text>
            </View>
          ))}

        {activeTab === "health" ? renderHealthContent() : null}

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
    marginHorizontal: 16,
    marginBottom: 20,
  },
  tabBarContent: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 4,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    height: 38,
    borderRadius: 9999,
    backgroundColor: "rgba(15,92,59,0.07)",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0,
    shadowRadius: 5,
    elevation: 0,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
    shadowOpacity: 0.22,
    elevation: 3,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textMuted,
  },
  tabTextActive: {
    color: "#fff",
  },
  tabBadge: {
    marginLeft: 6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(15,92,59,0.15)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  tabBadgeActive: {
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.primary,
  },
  tabBadgeTextActive: {
    color: "#fff",
  },
  contentArea: {
    paddingHorizontal: 16,
    minHeight: 480,
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
  cardSubHeading: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 12,
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

  /* Owner section */
  ownersToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  ownersList: {
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(15,92,59,0.08)",
    overflow: "hidden",
  },
  ownerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "rgba(15,92,59,0.03)",
  },
  ownerRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(15,92,59,0.08)",
  },
  ownerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: "hidden",
  },
  ownerAvatarPlaceholder: {
    backgroundColor: "rgba(15,92,59,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  ownerAvatarInitials: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primary,
  },
  ownerName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
  },
  ownerSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 1,
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
  lineBreedEmpty: {
    fontSize: 14,
    color: "#94A3B8",
    fontStyle: "italic",
  },
  litterDropdown: {
    marginLeft: 16,
    borderLeftWidth: 2,
    borderLeftColor: "rgba(15,92,58,0.12)",
    paddingLeft: 12,
    marginBottom: 4,
  },
  litterDogRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 8,
  },
  litterDogName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primary,
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
  showCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    flexDirection: "row",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(15,92,59,0.07)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  showGradingStripe: {
    width: 5,
  },
  showCardInner: {
    flex: 1,
    padding: 14,
  },
  showCardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  showName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 6,
  },
  showMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  showClassBadge: {
    backgroundColor: "rgba(15,92,59,0.08)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  showClassText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.primary,
  },
  showDate: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  showRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  showGradingBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  showGradingText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  showPlacement: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  showPlacementText: {
    fontSize: 12,
    fontWeight: "700",
  },
  healthSection: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(15,92,59,0.07)",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  healthSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(15,92,59,0.08)",
    backgroundColor: "rgba(15,92,59,0.03)",
  },
  healthSectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.primary,
  },
  healthBlock: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  healthBlockHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(15,92,59,0.06)",
    marginBottom: 12,
  },
  healthBlockRole: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  healthBlockNavLink: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.primary,
    textDecorationLine: "underline",
  },
  healthBlockDot: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.primary,
    textDecorationLine: "none",
  },
  healthTypeBlock: {
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(15,92,59,0.06)",
  },
  healthTypeLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  healthOwnRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: `${COLORS.primary}08`,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 4,
  },
  healthOwnRatingLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textMuted,
  },
  healthOwnRatingValue: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primary,
  },
  healthTableRatingCell: {
    flex: 1.8,
    textAlign: "left",
    paddingLeft: 6,
  },
  healthStats: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15,92,59,0.04)",
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    gap: 0,
  },
  healthStatItem: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  healthStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: "rgba(15,92,59,0.12)",
  },
  healthStatValue: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.primary,
  },
  healthStatLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: "500",
  },
  healthTable: {
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(15,92,59,0.1)",
  },
  healthTableHeader: {
    flexDirection: "row",
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  healthTableHeaderText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 10,
    textAlign: "center",
  },
  healthTableRow: {
    flexDirection: "row",
    paddingVertical: 9,
    paddingHorizontal: 4,
    backgroundColor: "#fff",
  },
  healthTableRowAlt: {
    backgroundColor: "rgba(15,92,59,0.03)",
  },
  healthTableRowLabel: {
    fontWeight: "600",
    color: "#0F172A",
  },
  healthTableCell: {
    flex: 1,
    fontSize: 11,
    color: "#374151",
    textAlign: "center",
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
  litterCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  litterPartner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  litterAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  litterAvatarSire: {
    backgroundColor: "#DBEAFE",
  },
  litterAvatarDam: {
    backgroundColor: "#FCE7F3",
  },
  litterAvatarText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },
  litterPartnerInfo: {
    flex: 1,
    gap: 2,
  },
  litterPartnerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  litterPartnerName: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
    flexShrink: 1,
  },
  litterPartnerSub: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  partnerTypeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    flexShrink: 0,
  },
  sireBadge: {
    backgroundColor: "#DBEAFE",
  },
  damBadge: {
    backgroundColor: "#FCE7F3",
  },
  partnerTypeBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.text,
  },
  litterDivider: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  litterDividerText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  puppyRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 12,
  },
  puppyRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  puppyDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  puppyDotMale: {
    backgroundColor: "#DBEAFE",
  },
  puppyDotFemale: {
    backgroundColor: "#FCE7F3",
  },
  puppyDotText: {
    fontSize: 13,
    lineHeight: 16,
  },
  puppyName: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
  },
  puppyMeta: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  puppyDobHeader: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  puppyDobHeaderText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
