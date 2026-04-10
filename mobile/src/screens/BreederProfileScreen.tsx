import { useState, useMemo } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
  Platform,
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
import { fetchBreeder, BreederDetail, BreederDog, Breeder } from "../lib/api";
import LazyImage from "../components/LazyImage";

const heroBg = require("../../assets/hero-bg.png");

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
        <LazyImage source={{ uri: dog.imageUrl }} style={styles.dogAvatar} resizeMode="cover" />
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
          {dog.hair ? (
            <View style={styles.dogBadge}>
              <Text style={styles.dogBadgeText}>{dog.hair}</Text>
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

type SexFilter = "All" | "Male" | "Female";

function formatDOB(raw: string | null): string | null {
  if (!raw) return null;
  const d = new Date(raw);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function DogQuickView({
  dog,
  onClose,
  onViewProfile,
}: {
  dog: BreederDog;
  onClose: () => void;
  onViewProfile: () => void;
}) {
  const hasImg = dog.imageUrl && !dog.imageUrl.includes("dog-not-found") && dog.imageUrl.length > 0;
  const initials = dog.name
    .trim().split(" ").filter(Boolean)
    .map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  const rows: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }[] = [];
  const kp = dog.KP && dog.KP !== "0" ? `KP ${dog.KP}` : null;
  const reg = dog.foreign_reg_no ?? null;
  if (kp)   rows.push({ icon: "card-outline",     label: "KP No.",      value: kp });
  if (reg)  rows.push({ icon: "document-outline", label: "Reg No.",     value: reg });
  if (dog.breed) rows.push({ icon: "paw-outline",  label: "Breed",      value: dog.breed });
  if (dog.color) rows.push({ icon: "color-palette-outline", label: "Color", value: dog.color });
  if (dog.hair)  rows.push({ icon: "brush-outline",          label: "Hair",  value: dog.hair });
  const dob = formatDOB(dog.dateOfBirth);
  if (dob)  rows.push({ icon: "calendar-outline", label: "Date of Birth", value: dob });
  if (dog.sire)  rows.push({ icon: "male-outline",   label: "Sire",     value: dog.sire });
  if (dog.dam)   rows.push({ icon: "female-outline", label: "Dam",      value: dog.dam });
  if (dog.owner) rows.push({ icon: "person-outline", label: "Owner",    value: dog.owner });
  if (dog.breeder) rows.push({ icon: "home-outline", label: "Breeder",  value: dog.breeder });
  if (dog.microchip) rows.push({ icon: "barcode-outline", label: "Microchip", value: dog.microchip });

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.modalSheet} onPress={() => {}}>
          {/* Handle bar */}
          <View style={styles.modalHandle} />

          {/* Close */}
          <TouchableOpacity style={styles.modalClose} onPress={onClose} activeOpacity={0.7}>
            <Ionicons name="close" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.modalHeader}>
            {hasImg ? (
              <LazyImage source={{ uri: dog.imageUrl }} style={styles.modalAvatar} resizeMode="cover" />
            ) : (
              <View style={styles.modalAvatarFallback}>
                <Text style={styles.modalAvatarText}>{initials}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.modalName} numberOfLines={2}>{dog.name.trim()}</Text>
              {/* Sex badge */}
              <View style={styles.modalBadgeRow}>
                <View style={[styles.modalBadge, dog.sex === "Male" ? styles.modalBadgeMale : styles.modalBadgeFemale]}>
                  <Ionicons
                    name={dog.sex === "Male" ? "male" : "female"}
                    size={10}
                    color="#fff"
                  />
                  <Text style={styles.modalBadgeText}>{dog.sex}</Text>
                </View>
                {dog.titles.slice(0, 3).map((t) => (
                  <View key={t} style={[styles.modalBadge, t.startsWith("VA") || t.startsWith("V ") ? styles.titleBadgeGold : styles.titleBadgeGreen]}>
                    <Text style={styles.modalBadgeText}>{t}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.modalDivider} />

          {/* Details scroll */}
          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 280 }}>
            <View style={styles.modalRows}>
              {rows.map((r) => (
                <View key={r.label} style={styles.modalRow}>
                  <View style={styles.modalRowIcon}>
                    <Ionicons name={r.icon} size={15} color={COLORS.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalRowLabel}>{r.label}</Text>
                    <Text style={styles.modalRowValue}>{r.value}</Text>
                  </View>
                </View>
              ))}
              {rows.length === 0 && (
                <Text style={styles.modalNoDetails}>No additional details available.</Text>
              )}
            </View>
          </ScrollView>

          {/* Action button */}
          <TouchableOpacity style={styles.modalViewBtn} onPress={onViewProfile} activeOpacity={0.85}>
            <Text style={styles.modalViewBtnText}>VIEW FULL PROFILE</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function DogListSection({
  dogs,
  emptyTitle,
  emptyDesc,
  onDogPress,
}: {
  dogs: BreederDog[];
  emptyTitle: string;
  emptyDesc: string;
  onDogPress: (dog: BreederDog) => void;
}) {
  const [query, setQuery] = useState("");
  const [sex, setSex] = useState<SexFilter>("All");
  const [titlesOnly, setTitlesOnly] = useState(false);
  const [selectedDog, setSelectedDog] = useState<BreederDog | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return dogs.filter((d) => {
      if (sex !== "All" && d.sex?.toLowerCase() !== sex.toLowerCase()) return false;
      if (titlesOnly && d.titles.length === 0) return false;
      if (q) {
        const inName = d.name.toLowerCase().includes(q);
        const inKP   = (d.KP ?? "").toLowerCase().includes(q);
        const inReg  = (d.foreign_reg_no ?? "").toLowerCase().includes(q);
        if (!inName && !inKP && !inReg) return false;
      }
      return true;
    });
  }, [dogs, query, sex, titlesOnly]);

  const SEX_OPTIONS: SexFilter[] = ["All", "Male", "Female"];
  const hasActiveFilter = query.trim() !== "" || sex !== "All" || titlesOnly;

  if (dogs.length === 0) {
    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIconWrap}>
          <Ionicons name="paw-outline" size={32} color={COLORS.primary} />
        </View>
        <Text style={styles.emptyTitle}>{emptyTitle}</Text>
        <Text style={styles.emptyDesc}>{emptyDesc}</Text>
      </View>
    );
  }

  return (
    <View>
      {/* Search bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={17} color={COLORS.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name, KP, or reg no…"
            placeholderTextColor={COLORS.textMuted}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {query.length > 0 && (
            <TouchableOpacity onPressIn={() => setQuery("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {/* Sex chips */}
        {SEX_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt}
            style={[styles.chip, sex === opt && styles.chipActive]}
            onPressIn={() => setSex(opt)}
            activeOpacity={0.75}
          >
            {opt !== "All" && (
              <Ionicons
                name={opt === "Male" ? "male-outline" : "female-outline"}
                size={12}
                color={sex === opt ? "#fff" : COLORS.textSecondary}
                style={{ marginRight: 4 }}
              />
            )}
            <Text style={[styles.chipText, sex === opt && styles.chipTextActive]}>{opt}</Text>
          </TouchableOpacity>
        ))}

        {/* Titled dogs chip */}
        <TouchableOpacity
          style={[styles.chip, titlesOnly && styles.chipActiveGold]}
          onPressIn={() => setTitlesOnly((v) => !v)}
          activeOpacity={0.75}
        >
          <Ionicons
            name="ribbon-outline"
            size={12}
            color={titlesOnly ? "#fff" : COLORS.textSecondary}
            style={{ marginRight: 4 }}
          />
          <Text style={[styles.chipText, titlesOnly && styles.chipTextActive]}>Titled Only</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Result count / clear */}
      <View style={styles.resultRow}>
        <Text style={styles.resultCount}>
          {filtered.length} {filtered.length === 1 ? "dog" : "dogs"}
          {hasActiveFilter ? " found" : ""}
        </Text>
        {hasActiveFilter && (
          <TouchableOpacity
            onPressIn={() => { setQuery(""); setSex("All"); setTitlesOnly(false); }}
            activeOpacity={0.7}
          >
            <Text style={styles.clearText}>Clear filters</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Dog list */}
      {filtered.length > 0 ? (
        filtered.map((dog) => (
          <BreederDogItem key={dog.id} dog={dog} onPress={() => setSelectedDog(dog)} />
        ))
      ) : (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="search-outline" size={28} color={COLORS.primary} />
          </View>
          <Text style={styles.emptyTitle}>No matches</Text>
          <Text style={styles.emptyDesc}>Try adjusting your search or filters.</Text>
        </View>
      )}

      {/* Quick-view popup */}
      {selectedDog && (
        <DogQuickView
          dog={selectedDog}
          onClose={() => setSelectedDog(null)}
          onViewProfile={() => {
            setSelectedDog(null);
            onDogPress(selectedDog);
          }}
        />
      )}
    </View>
  );
}

function listBreederToDetail(b: Breeder): BreederDetail {
  return {
    breeder: b,
    dogsBred: [],
    dogsOwned: [],
  };
}

export default function BreederProfileScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { id, name, breederData } = route.params as { id: string; name?: string; breederData?: Breeder };
  const [activeTab, setActiveTab] = useState<TabKey>("info");

  const { data, isLoading, isError, refetch, isRefetching } = useQuery<BreederDetail>({
    queryKey: ["breeders", id],
    queryFn: () => fetchBreeder(id, breederData),
  });

  const fallback = breederData ? listBreederToDetail(breederData) : null;
  const resolved = data ?? fallback ?? null;

  const breeder = resolved?.breeder;
  const kennel = resolved?.kennel ?? null;
  const dogsBred = resolved?.dogsBred || [];
  const dogsOwned = resolved?.dogsOwned || [];

  const contactPhone = (breeder?.phone && breeder.phone !== "+00-000-000-0000") ? breeder.phone
    : (kennel?.phone && kennel.phone !== "+00-000-000-0000") ? kennel.phone : null;
  const contactEmail = breeder?.email || kennel?.email || null;

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!breeder) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color={COLORS.textMuted} />
        <Text style={styles.errorText}>Breeder not found.</Text>
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

  const initials = (breeder.name || "?")
    .split(" ")
    .map((w) => w[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

  const handleDogPress = (dog: BreederDog) => {
    navigation.navigate("DogProfile", { id: dog.id, name: dog.name.trim() });
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
            <LazyImage source={{ uri: breeder.imageUrl }} style={styles.avatarPhoto} resizeMode="cover" />
          ) : (
            <View style={styles.avatarInner}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}
        </View>

        <Text style={styles.breederName}>{breeder.name}</Text>
        {breeder.kennelName ? (
          <TouchableOpacity
            style={styles.kennelLink}
            onPress={() => navigation.navigate("KennelProfile", { id: breeder.id, name: breeder.kennelName })}
            activeOpacity={0.7}
          >
            <Ionicons name="home-outline" size={13} color={COLORS.primary} />
            <Text style={styles.kennelLinkText}>{breeder.kennelName}</Text>
            <Ionicons name="chevron-forward" size={13} color={COLORS.primary} />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPressIn={() => setActiveTab(tab.key)}
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
                {breeder.kennelName ? (
                  <TouchableOpacity
                    onPress={() => navigation.navigate("KennelProfile", { id: breeder.id, name: breeder.kennelName })}
                    activeOpacity={0.7}
                  >
                    <View style={styles.linkableDetailItem}>
                      <View style={{ flex: 1 }}>
                        <DetailItem icon="home" label="Kennel" value={breeder.kennelName} />
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={COLORS.primary} style={{ marginLeft: 8 }} />
                    </View>
                  </TouchableOpacity>
                ) : null}
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
                <DetailItem icon="paw" label="Total Litters" value={String(breeder.totalLitters ?? 0)} />
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardHeading}>Contact</Text>
              <View style={styles.contactRow}>
                {contactPhone ? (
                  <TouchableOpacity
                    style={styles.contactBtn}
                    onPress={() => Linking.openURL(`tel:${contactPhone}`)}
                    activeOpacity={0.7}
                    data-testid="btn-call"
                  >
                    <Ionicons name="call" size={18} color="#fff" />
                    <Text style={styles.contactBtnText}>Call</Text>
                  </TouchableOpacity>
                ) : null}
                {contactEmail ? (
                  <TouchableOpacity
                    style={[styles.contactBtn, styles.contactBtnSecondary]}
                    onPress={() => Linking.openURL(`mailto:${contactEmail}`)}
                    activeOpacity={0.7}
                    data-testid="btn-email"
                  >
                    <Ionicons name="mail" size={18} color={COLORS.primary} />
                    <Text style={[styles.contactBtnText, styles.contactBtnTextSecondary]}>Email</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              {contactPhone ? (
                <View style={styles.detailsGrid}>
                  <DetailItem icon="call" label="Phone" value={contactPhone} />
                </View>
              ) : null}
              {contactEmail ? (
                <View style={[styles.detailsGrid, { marginTop: contactPhone ? 20 : 0 }]}>
                  <DetailItem icon="mail" label="Email" value={contactEmail} />
                </View>
              ) : null}
            </View>
          </>
        )}

        {activeTab === "bred" && (
          <DogListSection
            dogs={dogsBred}
            emptyTitle="No Dogs Bred"
            emptyDesc="No dogs have been bred by this breeder yet."
            onDogPress={handleDogPress}
          />
        )}

        {activeTab === "owned" && (
          <DogListSection
            dogs={dogsOwned}
            emptyTitle="No Dogs Owned"
            emptyDesc="No dogs are currently owned by this breeder."
            onDogPress={handleDogPress}
          />
        )}
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
  kennelLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: "rgba(15,92,59,0.07)",
  },
  kennelLinkText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primary,
  },
  linkableDetailItem: {
    flexDirection: "row",
    alignItems: "center",
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

  searchRow: {
    marginBottom: 10,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    height: 44,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    height: "100%",
  },

  filterRow: {
    flexDirection: "row",
    gap: 8,
    paddingBottom: 12,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "#fff",
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipActiveGold: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.text,
  },
  chipTextActive: {
    color: "#fff",
  },

  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  resultCount: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textMuted,
  },
  clearText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    paddingTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 24,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E2E8F0",
    alignSelf: "center",
    marginBottom: 16,
  },
  modalClose: {
    position: "absolute",
    top: 16,
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 16,
    paddingRight: 40,
  },
  modalAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  modalAvatarFallback: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(15,92,59,0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  modalAvatarText: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.primary,
  },
  modalName: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 6,
    lineHeight: 24,
  },
  modalBadgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  modalBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.sm,
  },
  modalBadgeMale: {
    backgroundColor: "#3B82F6",
  },
  modalBadgeFemale: {
    backgroundColor: "#EC4899",
  },
  modalBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
  },
  modalDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginBottom: 14,
  },
  modalRows: {
    gap: 14,
    paddingBottom: 8,
  },
  modalRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  modalRowIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(15,92,59,0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  modalRowLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.textMuted,
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  modalRowValue: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    lineHeight: 20,
  },
  modalNoDetails: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    textAlign: "center",
    paddingVertical: 16,
  },
  modalViewBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    height: 52,
    marginTop: 18,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  modalViewBtnText: {
    fontSize: FONT_SIZES.md,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 1,
  },
});
