import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, SPACING, BORDER_RADIUS } from "../lib/theme";
import { searchDogs, fetchVirtualBreeding } from "../lib/api";
import type { DogSearchResult, LineBreedingEntry, VirtualBreedingResult } from "../lib/api";
import { PedigreeTree } from "../components/PedigreeTree";

type Nav = NativeStackNavigationProp<any>;

/* ─── Types ─────────────────────────────────────────────── */
type SelectedDog = {
  id: string;
  name: string;
  KP: string | null;
  foreign_reg_no?: string | null;
  sex: string;
  color: string;
  owner: string;
};

function kpLabel(kp?: string | null, foreign?: string | null): string {
  const k = (kp ?? "").trim();
  if (k && k !== "0") return `KP ${k}`;
  const f = (foreign ?? "").trim();
  return f || "—";
}

/* ─── Dog Search Field ───────────────────────────────────── */
function DogSearchField({
  sex, selected, onSelect, onClear,
}: {
  sex: "male" | "female";
  selected: SelectedDog | null;
  onSelect: (d: SelectedDog) => void;
  onClear: () => void;
}) {
  const [query, setQuery]         = useState("");
  const [results, setResults]     = useState<DogSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen]           = useState(false);
  const debounceRef               = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blurRef                   = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const dogs = await searchDogs(query, 1, 15, sex);
        setResults(dogs);
      } catch { setResults([]); }
      finally { setSearching(false); }
    }, 350);
  }, [query, sex]);

  const isMale = sex === "male";
  const accentColor = isMale ? COLORS.primary : "#9333EA";

  if (selected) {
    return (
      <View style={styles.selectedCard}>
        <View style={[styles.selectedAvatar, { backgroundColor: isMale ? `${COLORS.primary}18` : "#F3E8FF" }]}>
          <Ionicons name={isMale ? "male" : "female"} size={18} color={accentColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.selectedName} numberOfLines={1}>{selected.name}</Text>
          <Text style={styles.selectedSub}>
            {kpLabel(selected.KP, selected.foreign_reg_no)}{selected.color ? ` · ${selected.color}` : ""}
          </Text>
          {selected.owner ? <Text style={styles.selectedSub} numberOfLines={1}>{selected.owner}</Text> : null}
        </View>
        <TouchableOpacity onPress={onClear} activeOpacity={0.7} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="close-circle" size={22} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View>
      <View style={[styles.searchRow, open && { borderColor: accentColor, borderWidth: 1.5 }]}>
        <Ionicons name="search" size={15} color={open ? accentColor : COLORS.textMuted} style={{ marginRight: 6 }} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          onFocus={() => { if (blurRef.current) clearTimeout(blurRef.current); setOpen(true); }}
          onBlur={() => { blurRef.current = setTimeout(() => setOpen(false), 180); }}
          placeholder={`Search ${sex} dogs by name or KP…`}
          placeholderTextColor={COLORS.textMuted}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {searching
          ? <ActivityIndicator size="small" color={accentColor} />
          : query.length > 0
            ? <TouchableOpacity onPress={() => { setQuery(""); setResults([]); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
              </TouchableOpacity>
            : null}
      </View>

      {open && (
        <View style={styles.dropPanel}>
          {query.length < 2 ? (
            <View style={styles.hintWrap}>
              <Ionicons name="search-outline" size={24} color={COLORS.textMuted} />
              <Text style={styles.hintText}>Type at least 2 characters to search</Text>
            </View>
          ) : results.length === 0 && !searching ? (
            <View style={styles.hintWrap}>
              <Ionicons name="paw-outline" size={24} color={COLORS.textMuted} />
              <Text style={styles.hintText}>No {sex} dogs found for "{query}"</Text>
            </View>
          ) : results.map((dog, i) => (
            <TouchableOpacity
              key={dog.id}
              style={[styles.dropRow, i < results.length - 1 && styles.dropRowBorder]}
              onPress={() => {
                if (blurRef.current) clearTimeout(blurRef.current);
                onSelect({ id: dog.id, name: dog.dog_name, KP: dog.KP, foreign_reg_no: dog.foreign_reg_no, sex: dog.sex, color: dog.color, owner: dog.owner });
                setOpen(false); setQuery("");
              }}
              activeOpacity={0.65}
            >
              <View style={[styles.dropAvatar, { backgroundColor: isMale ? `${COLORS.primary}15` : "#F3E8FF" }]}>
                <Ionicons name={isMale ? "male" : "female"} size={13} color={accentColor} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.dropName} numberOfLines={1}>{dog.dog_name}</Text>
                <Text style={styles.dropSub} numberOfLines={1}>
                  {kpLabel(dog.KP, dog.foreign_reg_no)}{dog.color ? ` · ${dog.color}` : ""}{dog.owner ? ` · ${dog.owner}` : ""}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={13} color="#CBD5E1" />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

/* ─── Line Breeding Section ──────────────────────────────── */
function LineBreedingSection({ entries }: { entries: LineBreedingEntry[] }) {
  const navigation = useNavigation<Nav>();
  const [expandedLitters, setExpandedLitters] = useState<Set<number>>(new Set());

  if (entries.length === 0) {
    return (
      <Text style={styles.lineBreedEmpty}>No common ancestry found in 5 generations</Text>
    );
  }

  return (
    <>
      {entries.map((entry, idx) => {
        // Use positions_by_side if available (more accurate), otherwise fall back to positions+sides zip
        const pbs = entry.positions_by_side;
        const sirePositions: string[] = pbs?.father?.map(String) ??
          entry.positions.filter((_, i) => entry.sides[i] === "father");
        const damPositions: string[] = pbs?.mother?.map(String) ??
          entry.positions.filter((_, i) => entry.sides[i] === "mother");

        const genLabel = `${sirePositions.join(",")} - ${damPositions.join(",")} (Sire - Dam)`;

        const patternLabel = entry.line_breeding_pattern
          ? entry.line_breeding_pattern.replace(/_/g, " ")
          : null;

        if ((entry.type === "litter_pair" || entry.type === "litter_group") && entry.dogs && entry.dogs.length > 0) {
          const isExpanded = expandedLitters.has(idx);
          return (
            <View key={`litter-${idx}`}>
              <TouchableOpacity
                style={styles.lineBreedRow}
                activeOpacity={0.7}
                onPress={() => setExpandedLitters((prev) => {
                  const next = new Set(prev);
                  if (next.has(idx)) next.delete(idx); else next.add(idx);
                  return next;
                })}
              >
                <View style={styles.lineBreedInfo}>
                  <Text style={styles.lineBreedName} numberOfLines={1}>
                    Litter {entry.litter_letter}{entry.kennel ? ` from ${entry.kennel}` : ""}
                  </Text>
                  <Text style={styles.lineBreedMeta}>{genLabel}</Text>
                </View>
                <Ionicons name={isExpanded ? "chevron-down" : "chevron-forward"} size={18} color="#94A3B8" />
              </TouchableOpacity>
              {isExpanded && (
                <View style={styles.litterDropdown}>
                  {entry.dogs.map((d) => (
                    <TouchableOpacity
                      key={d.id}
                      style={styles.litterDogRow}
                      activeOpacity={0.7}
                      onPress={() => navigation.navigate("DogsTab", { screen: "DogProfile", params: { id: d.id, name: d.dog_name } })}
                    >
                      <Ionicons name="paw" size={14} color={COLORS.primary} />
                      <Text style={styles.litterDogName} numberOfLines={1}>{d.dog_name}</Text>
                      <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          );
        }

        return (
          <TouchableOpacity
            key={`${entry.id ?? "e"}-${idx}`}
            style={styles.lineBreedRow}
            activeOpacity={0.7}
            onPress={() => entry.id ? navigation.navigate("DogsTab", { screen: "DogProfile", params: { id: entry.id, name: entry.dog_name } }) : undefined}
          >
            <View style={styles.lineBreedInfo}>
              <View style={styles.lineBreedNameRow}>
                <Text style={styles.lineBreedName} numberOfLines={1}>{entry.dog_name}</Text>
                {patternLabel && (
                  <View style={styles.patternBadge}>
                    <Text style={styles.patternBadgeText}>{patternLabel}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.lineBreedMeta}>{genLabel}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>
        );
      })}
    </>
  );
}

/* ─── Main Screen ────────────────────────────────────────── */
export default function VirtualBreedingScreen() {
  const insets = useSafeAreaInsets();
  const [sire, setSire] = useState<SelectedDog | null>(null);
  const [dam,  setDam]  = useState<SelectedDog | null>(null);
  const [result, setResult]   = useState<VirtualBreedingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setResult(null);
    setError(null);
    if (!sire || !dam) return;

    let cancelled = false;
    setLoading(true);
    fadeAnim.setValue(0);

    fetchVirtualBreeding(sire.id, dam.id)
      .then((r) => {
        if (cancelled) return;
        setResult(r);
        Animated.spring(fadeAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 9 }).start();
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e.message ?? "Failed to generate pedigree.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [sire?.id, dam?.id]);

  const handleReset = () => {
    setSire(null);
    setDam(null);
    setResult(null);
    setError(null);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
      {/* Header */}
      <LinearGradient colors={[COLORS.primary, "#0D6640"]} style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTop}>
          <View style={styles.headerIcon}>
            <Ionicons name="git-merge" size={20} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Virtual Breeding</Text>
            <Text style={styles.headerSub}>Simulate pairing outcomes</Text>
          </View>
          {(sire || dam) && (
            <TouchableOpacity onPress={handleReset} style={styles.resetBtn} activeOpacity={0.7}>
              <Ionicons name="refresh" size={16} color="#fff" />
              <Text style={styles.resetLabel}>Reset</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.headerNote}>
          Search and select a sire and dam to generate their virtual offspring pedigree.
        </Text>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: SPACING.md, paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Sire selector */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.cardBadge, { backgroundColor: `${COLORS.primary}18` }]}>
              <Ionicons name="male" size={14} color={COLORS.primary} />
            </View>
            <Text style={styles.cardTitle}>Sire (Father)</Text>
            {sire && <View style={styles.checkBadge}><Ionicons name="checkmark" size={12} color="#fff" /></View>}
          </View>
          <DogSearchField
            sex="male"
            selected={sire}
            onSelect={setSire}
            onClear={() => setSire(null)}
          />
        </View>

        {/* Connector */}
        <View style={styles.connector}>
          <View style={styles.connectorLine} />
          <View style={styles.connectorIcon}>
            <Ionicons name="heart" size={14} color={COLORS.primary} />
          </View>
          <View style={styles.connectorLine} />
        </View>

        {/* Dam selector */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.cardBadge, { backgroundColor: "#F3E8FF" }]}>
              <Ionicons name="female" size={14} color="#9333EA" />
            </View>
            <Text style={styles.cardTitle}>Dam (Mother)</Text>
            {dam && <View style={[styles.checkBadge, { backgroundColor: "#9333EA" }]}><Ionicons name="checkmark" size={12} color="#fff" /></View>}
          </View>
          <DogSearchField
            sex="female"
            selected={dam}
            onSelect={setDam}
            onClear={() => setDam(null)}
          />
        </View>

        {/* Status area */}
        {!sire && !dam && (
          <View style={styles.emptyHint}>
            <Ionicons name="search-outline" size={32} color={COLORS.textMuted} style={{ marginBottom: 8 }} />
            <Text style={styles.emptyHintTitle}>Search to get started</Text>
            <Text style={styles.emptyHintSub}>Select a sire and a dam above to generate the virtual offspring pedigree.</Text>
          </View>
        )}

        {sire && !dam && (
          <View style={styles.emptyHint}>
            <Ionicons name="female" size={28} color="#9333EA" style={{ marginBottom: 8 }} />
            <Text style={[styles.emptyHintTitle, { color: "#9333EA" }]}>Now select a dam</Text>
            <Text style={styles.emptyHintSub}>Search and pick the dam to generate the pedigree.</Text>
          </View>
        )}

        {!sire && dam && (
          <View style={styles.emptyHint}>
            <Ionicons name="male" size={28} color={COLORS.primary} style={{ marginBottom: 8 }} />
            <Text style={[styles.emptyHintTitle, { color: COLORS.primary }]}>Now select a sire</Text>
            <Text style={styles.emptyHintSub}>Search and pick the sire to generate the pedigree.</Text>
          </View>
        )}

        {/* Loading */}
        {loading && (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Generating pedigree…</Text>
          </View>
        )}

        {/* Error */}
        {error && !loading && (
          <View style={styles.errorWrap}>
            <Ionicons name="alert-circle-outline" size={28} color="#DC2626" style={{ marginBottom: 8 }} />
            <Text style={styles.errorTitle}>Could not generate pedigree</Text>
            <Text style={styles.errorSub}>{error}</Text>
          </View>
        )}

        {/* Results */}
        {result && !loading && (
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
            }}
          >
            {/* Pedigree */}
            <View style={styles.pedigreeCard}>
              <View style={styles.pedigreeHeader}>
                <Ionicons name="git-branch-outline" size={16} color={COLORS.primary} />
                <Text style={styles.pedigreeTitle}>Virtual Offspring Pedigree</Text>
              </View>
              <Text style={styles.pedigreeNote}>
                4-generation pedigree for a theoretical offspring of{" "}
                <Text style={{ fontWeight: "700" }}>{sire?.name}</Text>{" "}
                × <Text style={{ fontWeight: "700" }}>{dam?.name}</Text>
              </Text>
              <PedigreeTree pedigree={result.pedigree} />
            </View>

            {/* Line Breeding */}
            <View style={[styles.card, { marginTop: 12 }]}>
              <View style={styles.pedigreeHeader}>
                <Ionicons name="git-merge-outline" size={16} color={COLORS.primary} />
                <Text style={styles.pedigreeTitle}>Line Breeding</Text>
              </View>
              <LineBreedingSection entries={result.lineBreeding} />
            </View>

            <View style={styles.disclaimer}>
              <Ionicons name="information-circle-outline" size={15} color={COLORS.textMuted} style={{ marginTop: 1 }} />
              <Text style={styles.disclaimerText}>
                This pedigree reflects the known lineage of both parents. It is for planning and educational purposes only. Always verify all health clearances (HD, ED, DNA) before breeding.
              </Text>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: SPACING.md,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
    fontWeight: "500",
    marginTop: 1,
  },
  headerNote: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    lineHeight: 18,
  },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  resetLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: "rgba(15,92,58,0.1)",
    shadowColor: "#0F5C3A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    gap: 12,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardBadge: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  checkBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  connector: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: SPACING.md + 4,
  },
  connectorLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: "rgba(15,92,58,0.15)",
  },
  connectorIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "rgba(15,92,58,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 8,
  },
  selectedCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(15,92,58,0.12)",
  },
  selectedAvatar: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  selectedSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(15,92,58,0.12)",
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#0F172A",
    paddingVertical: 0,
  },
  dropPanel: {
    marginTop: 4,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(15,92,58,0.12)",
    shadowColor: "#0F5C3A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    overflow: "hidden",
    maxHeight: 280,
  },
  hintWrap: {
    alignItems: "center",
    padding: 20,
    gap: 8,
  },
  hintText: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: "center",
  },
  dropRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  dropRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(15,92,58,0.07)",
  },
  dropAvatar: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  dropName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0F172A",
  },
  dropSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  emptyHint: {
    alignItems: "center",
    paddingVertical: 36,
    paddingHorizontal: 24,
  },
  emptyHintTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 6,
  },
  emptyHintSub: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 19,
  },
  loadingWrap: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: "500",
  },
  errorWrap: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 24,
    backgroundColor: "#FEF2F2",
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#DC2626",
    marginBottom: 4,
  },
  errorSub: {
    fontSize: 13,
    color: "#B91C1C",
    textAlign: "center",
    lineHeight: 18,
  },
  pedigreeCard: {
    backgroundColor: "#fff",
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: "rgba(15,92,58,0.1)",
    shadowColor: "#0F5C3A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    overflow: "hidden",
  },
  pedigreeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  pedigreeTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  pedigreeNote: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 16,
    lineHeight: 17,
  },
  disclaimer: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "rgba(15,92,58,0.08)",
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 17,
  },
  lineBreedEmpty: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontStyle: "italic",
    paddingVertical: 8,
  },
  lineBreedRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(15,92,58,0.07)",
  },
  lineBreedInfo: {
    flex: 1,
    gap: 2,
  },
  lineBreedNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  lineBreedName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0F172A",
  },
  lineBreedMeta: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  patternBadge: {
    backgroundColor: `${COLORS.primary}15`,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  patternBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: COLORS.primary,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  litterDropdown: {
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    marginBottom: 4,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(15,92,58,0.08)",
  },
  litterDogRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(15,92,58,0.07)",
  },
  litterDogName: {
    flex: 1,
    fontSize: 13,
    color: "#0F172A",
    fontWeight: "500",
  },
});
