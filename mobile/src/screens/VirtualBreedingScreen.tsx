import { useState, useEffect, useRef, useCallback } from "react";
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
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, SPACING, BORDER_RADIUS } from "../lib/theme";
import { searchDogs, DogSearchResult } from "../lib/api";

/* ─── Types ─────────────────────────────────────────────── */
type SelectedDog = {
  id: string;
  name: string;
  KP: string;
  sex: string;
  color: string;
  owner: string;
};

type ColorPrediction = { label: string; pct: number; hex: string };
type TraitPrediction = { label: string; value: string; icon: keyof typeof Ionicons.glyphMap; color: string };
type PairingReport = {
  colors: ColorPrediction[];
  traits: TraitPrediction[];
  compatibilityScore: number;
  compatibilityLabel: string;
  compatibilityColor: string;
  estimatedLitterSize: string;
  lineType: string;
  lineDesc: string;
};

/* ─── GSD colour genetics (simplified A-locus model) ─────── */
const GSD_COLORS: Record<string, { group: string; hex: string }> = {
  sable:          { group: "sable",    hex: "#B8860B" },
  "black & tan":  { group: "blacktan", hex: "#2C1810" },
  "black and tan":{ group: "blacktan", hex: "#2C1810" },
  "black & gold": { group: "blacktan", hex: "#2C1810" },
  bicolor:        { group: "bicolor",  hex: "#1A1A1A" },
  "bi-color":     { group: "bicolor",  hex: "#1A1A1A" },
  black:          { group: "black",    hex: "#111111" },
  white:          { group: "white",    hex: "#E8E8D0" },
  grey:           { group: "sable",    hex: "#808080" },
  silver:         { group: "sable",    hex: "#A8A8A8" },
};

function resolveColorGroup(colorStr: string): string {
  const lower = (colorStr ?? "").toLowerCase();
  for (const key of Object.keys(GSD_COLORS)) {
    if (lower.includes(key)) return GSD_COLORS[key].group;
  }
  return "blacktan";
}

function predictColors(sireColor: string, damColor: string): ColorPrediction[] {
  const sg = resolveColorGroup(sireColor);
  const dg = resolveColorGroup(damColor);

  const COLOR_DISPLAYS: Record<string, { label: string; hex: string }> = {
    sable:    { label: "Sable",         hex: "#B8860B" },
    blacktan: { label: "Black & Tan",   hex: "#3D1F00" },
    bicolor:  { label: "Bi-Color",      hex: "#2A2A2A" },
    black:    { label: "Black",         hex: "#111111" },
    white:    { label: "White / Cream", hex: "#C8C8B0" },
  };

  const tables: Record<string, Record<string, number[][]>> = {
    sable: {
      sable:    [[75, 0], [20, 0], [5, 0], [0, 0], [0, 0]],
      blacktan: [[50, 0], [40, 0], [10, 0], [0, 0], [0, 0]],
      bicolor:  [[45, 0], [35, 0], [20, 0], [0, 0], [0, 0]],
      black:    [[60, 0], [25, 0], [15, 0], [0, 0], [0, 0]],
      white:    [[55, 0], [35, 0], [10, 0], [0, 0], [0, 0]],
    },
    blacktan: {
      sable:    [[50, 0], [40, 0], [10, 0], [0, 0], [0, 0]],
      blacktan: [[15, 0], [65, 0], [20, 0], [0, 0], [0, 0]],
      bicolor:  [[10, 0], [50, 0], [40, 0], [0, 0], [0, 0]],
      black:    [[10, 0], [55, 0], [35, 0], [0, 0], [0, 0]],
      white:    [[15, 0], [70, 0], [15, 0], [0, 0], [0, 0]],
    },
    bicolor: {
      sable:    [[40, 0], [35, 0], [25, 0], [0, 0], [0, 0]],
      blacktan: [[10, 0], [50, 0], [40, 0], [0, 0], [0, 0]],
      bicolor:  [[ 5, 0], [30, 0], [55, 0], [10, 0], [0, 0]],
      black:    [[ 5, 0], [25, 0], [50, 0], [20, 0], [0, 0]],
      white:    [[10, 0], [40, 0], [50, 0], [0, 0], [0, 0]],
    },
    black: {
      sable:    [[55, 0], [25, 0], [15, 0], [5, 0], [0, 0]],
      blacktan: [[10, 0], [50, 0], [30, 0], [10, 0], [0, 0]],
      bicolor:  [[ 5, 0], [20, 0], [50, 0], [25, 0], [0, 0]],
      black:    [[ 0, 0], [10, 0], [40, 0], [50, 0], [0, 0]],
      white:    [[10, 0], [30, 0], [30, 0], [30, 0], [0, 0]],
    },
    white: {
      sable:    [[55, 0], [35, 0], [10, 0], [0, 0], [0, 0]],
      blacktan: [[15, 0], [65, 0], [15, 0], [0, 0], [5, 0]],
      bicolor:  [[10, 0], [40, 0], [45, 0], [0, 0], [5, 0]],
      black:    [[10, 0], [30, 0], [30, 0], [25, 0], [5, 0]],
      white:    [[20, 0], [30, 0], [20, 0], [0, 0], [30, 0]],
    },
  };

  const row = tables[sg]?.[dg] ?? tables.blacktan.blacktan;
  const keys = Object.keys(COLOR_DISPLAYS) as (keyof typeof COLOR_DISPLAYS)[];
  return keys
    .map((k, i) => ({ label: COLOR_DISPLAYS[k].label, pct: row[i][0], hex: COLOR_DISPLAYS[k].hex }))
    .filter(c => c.pct > 0)
    .sort((a, b) => b.pct - a.pct);
}

function predictTraits(sire: SelectedDog, dam: SelectedDog): TraitPrediction[] {
  const sg = resolveColorGroup(sire.color);
  const dg = resolveColorGroup(dam.color);
  const bothWorkLine = sg !== "white" && dg !== "white";

  return [
    {
      label:  "Pigmentation",
      value:  sg === "black" || dg === "black" ? "Rich — strong masking likely" : "Good — typical breed range",
      icon:   "color-palette-outline",
      color:  "#6D28D9",
    },
    {
      label: "Coat Type",
      value: "Stock coat likely dominant",
      icon:  "layers-outline",
      color: "#0369A1",
    },
    {
      label:  "Drive & Energy",
      value:  bothWorkLine ? "High — working line parentage" : "Moderate — balanced temperament",
      icon:   "flash-outline",
      color:  "#D97706",
    },
    {
      label:  "Size",
      value:  "60–65 cm / 28–40 kg (typical breed standard)",
      icon:   "resize-outline",
      color:  "#059669",
    },
    {
      label:  "Hip Health Risk",
      value:  "Verify HD/ED ratings of both parents before breeding",
      icon:   "medkit-outline",
      color:  "#DC2626",
    },
  ];
}

function calcCompatibility(sire: SelectedDog, dam: SelectedDog): {
  score: number; label: string; color: string;
} {
  let score = 70;
  const sg = resolveColorGroup(sire.color);
  const dg = resolveColorGroup(dam.color);

  if (sg === dg) score += 10;
  if (sg !== "white" && dg !== "white") score += 10;
  if (sg === "black" && dg === "black") score -= 5;

  score = Math.min(98, Math.max(50, score));

  if (score >= 85) return { score, label: "Excellent Pairing", color: "#16A34A" };
  if (score >= 72) return { score, label: "Good Pairing",      color: "#2563EB" };
  return             { score, label: "Acceptable Pairing",    color: "#D97706" };
}

function generateReport(sire: SelectedDog, dam: SelectedDog): PairingReport {
  const colors = predictColors(sire.color, dam.color);
  const traits = predictTraits(sire, dam);
  const compat = calcCompatibility(sire, dam);

  const sg = resolveColorGroup(sire.color);
  const dg = resolveColorGroup(dam.color);
  const isWorkLine = sg !== "white" && dg !== "white";

  return {
    colors,
    traits,
    compatibilityScore: compat.score,
    compatibilityLabel: compat.label,
    compatibilityColor: compat.color,
    estimatedLitterSize: "6–9 puppies (breed average)",
    lineType:  isWorkLine ? "Working / Standard Line" : "Show / Standard Line",
    lineDesc:  isWorkLine
      ? "Both parents are standard-coloured, suggesting working or show line genetics."
      : "One or both parents carry the white/dilute gene — show line characteristics expected.",
  };
}

/* ─── Dog Search Field ───────────────────────────────────── */
function DogSearchField({
  sex, label, selected, onSelect, onClear,
}: {
  sex: "male" | "female";
  label: string;
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
          <Text style={styles.selectedSub}>KP {selected.KP}{selected.color ? ` · ${selected.color}` : ""}</Text>
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
                onSelect({ id: dog.id, name: dog.dog_name, KP: dog.KP, sex: dog.sex, color: dog.color, owner: dog.owner });
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
                  KP {dog.KP}{dog.color ? ` · ${dog.color}` : ""}{dog.owner ? ` · ${dog.owner}` : ""}
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

/* ─── Colour Bar ─────────────────────────────────────────── */
function ColorBar({ item, delay }: { item: ColorPrediction; delay: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 700, delay, useNativeDriver: false }).start();
  }, []);
  const width = anim.interpolate({ inputRange: [0, 1], outputRange: ["0%", `${item.pct}%`] });
  return (
    <View style={{ marginBottom: 10 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: item.hex, borderWidth: 1, borderColor: "#00000020" }} />
          <Text style={styles.colorLabel}>{item.label}</Text>
        </View>
        <Text style={styles.colorPct}>{item.pct}%</Text>
      </View>
      <View style={styles.barBg}>
        <Animated.View style={[styles.barFill, { width, backgroundColor: item.hex === "#111111" ? "#333" : item.hex }]} />
      </View>
    </View>
  );
}

/* ─── Main Screen ────────────────────────────────────────── */
export default function VirtualBreedingScreen() {
  const insets = useSafeAreaInsets();
  const [sire, setSire] = useState<SelectedDog | null>(null);
  const [dam,  setDam]  = useState<SelectedDog | null>(null);
  const [report, setReport] = useState<PairingReport | null>(null);
  const [generating, setGenerating] = useState(false);
  const reportAnim = useRef(new Animated.Value(0)).current;

  const canSimulate = !!sire && !!dam;

  const handleGenerate = useCallback(() => {
    if (!sire || !dam) return;
    setGenerating(true);
    setReport(null);
    reportAnim.setValue(0);
    setTimeout(() => {
      const r = generateReport(sire, dam);
      setReport(r);
      setGenerating(false);
      Animated.spring(reportAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 8 }).start();
    }, 1200);
  }, [sire, dam]);

  const handleReset = () => {
    setSire(null);
    setDam(null);
    setReport(null);
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
          {(sire || dam || report) && (
            <TouchableOpacity onPress={handleReset} style={styles.resetBtn} activeOpacity={0.7}>
              <Ionicons name="refresh" size={16} color="#fff" />
              <Text style={styles.resetLabel}>Reset</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.headerNote}>
          Select a sire and dam to generate a genetics-based pairing report for German Shepherd breeding.
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
          <DogSearchField sex="male" label="Sire" selected={sire} onSelect={setSire} onClear={() => { setSire(null); setReport(null); }} />
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
          <DogSearchField sex="female" label="Dam" selected={dam} onSelect={setDam} onClear={() => { setDam(null); setReport(null); }} />
        </View>

        {/* Generate button */}
        <TouchableOpacity
          style={[styles.generateBtn, !canSimulate && styles.generateBtnDisabled]}
          onPress={handleGenerate}
          activeOpacity={0.8}
          disabled={!canSimulate || generating}
        >
          {generating ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.generateLabel}>Analysing genetics…</Text>
            </View>
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Ionicons name="flask" size={18} color={canSimulate ? "#fff" : COLORS.textMuted} />
              <Text style={[styles.generateLabel, !canSimulate && { color: COLORS.textMuted }]}>
                Generate Pairing Report
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {!canSimulate && (
          <Text style={styles.generateHint}>Select both a sire and a dam to generate a report</Text>
        )}

        {/* Report */}
        {report && (
          <Animated.View style={{ opacity: reportAnim, transform: [{ translateY: reportAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>

            {/* Compatibility */}
            <View style={styles.compatCard}>
              <LinearGradient colors={["#F0FDF4", "#DCFCE7"]} style={styles.compatGrad}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.compatTitle}>Pairing Compatibility</Text>
                  <Text style={[styles.compatLabel, { color: report.compatibilityColor }]}>{report.compatibilityLabel}</Text>
                  <Text style={styles.compatLine}>{report.lineType}</Text>
                  <Text style={styles.compatDesc}>{report.lineDesc}</Text>
                </View>
                <View style={{ alignItems: "center" }}>
                  <View style={[styles.scoreCircle, { borderColor: report.compatibilityColor }]}>
                    <Text style={[styles.scoreNumber, { color: report.compatibilityColor }]}>{report.compatibilityScore}</Text>
                    <Text style={styles.scoreOf}>/100</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>

            {/* Coat colours */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Predicted Coat Colours</Text>
              <Text style={styles.sectionNote}>Based on simplified A-locus GSD genetics model</Text>
              <View style={{ marginTop: 12 }}>
                {report.colors.map((c, i) => <ColorBar key={c.label} item={c} delay={i * 100} />)}
              </View>
            </View>

            {/* Estimated litter */}
            <View style={[styles.card, { flexDirection: "row", alignItems: "center", gap: 12 }]}>
              <View style={[styles.cardBadge, { backgroundColor: "#FEF3C7", width: 40, height: 40, borderRadius: 12 }]}>
                <Ionicons name="paw" size={18} color="#D97706" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Estimated Litter Size</Text>
                <Text style={styles.cardDesc}>{report.estimatedLitterSize}</Text>
              </View>
            </View>

            {/* Predicted traits */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Expected Traits</Text>
              {report.traits.map((t) => (
                <View key={t.label} style={styles.traitRow}>
                  <View style={[styles.traitIcon, { backgroundColor: `${t.color}18` }]}>
                    <Ionicons name={t.icon} size={16} color={t.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.traitLabel}>{t.label}</Text>
                    <Text style={styles.traitValue}>{t.value}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Disclaimer */}
            <View style={styles.disclaimer}>
              <Ionicons name="information-circle-outline" size={15} color={COLORS.textMuted} style={{ marginTop: 1 }} />
              <Text style={styles.disclaimerText}>
                This report is for educational and planning purposes only. Results are based on simplified genetic models and observed breed patterns. Always consult a veterinarian and verify all health clearances (HD, ED, DNA) before breeding.
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
    marginTop: 1,
  },
  headerNote: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    lineHeight: 17,
  },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  resetLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  cardBadge: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
    flex: 1,
  },
  cardDesc: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
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
    marginBottom: 12,
    paddingHorizontal: 24,
    gap: 8,
  },
  connectorLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  connectorIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFF0F3",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FECDD3",
  },
  generateBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    marginBottom: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  generateBtnDisabled: {
    backgroundColor: "#E2E8F0",
    shadowOpacity: 0,
    elevation: 0,
  },
  generateLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
  generateHint: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: "center",
    marginBottom: 16,
  },
  selectedCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: `${COLORS.primary}06`,
    borderWidth: 1,
    borderColor: `${COLORS.primary}30`,
    borderRadius: 10,
    padding: 10,
  },
  selectedAvatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1E293B",
  },
  selectedSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    backgroundColor: "#F8FAFC",
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#1E293B",
    paddingVertical: 11,
  },
  dropPanel: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    marginTop: 4,
    backgroundColor: "#fff",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  hintWrap: {
    alignItems: "center",
    paddingVertical: 20,
    gap: 6,
  },
  hintText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  dropRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 11,
    gap: 10,
  },
  dropRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  dropAvatar: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  dropName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E293B",
  },
  dropSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  compatCard: {
    borderRadius: 14,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  compatGrad: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  compatTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  compatLabel: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  compatLine: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  compatDesc: {
    fontSize: 11,
    color: COLORS.textMuted,
    lineHeight: 16,
  },
  scoreCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  scoreNumber: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  scoreOf: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 2,
  },
  sectionNote: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  colorLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
  },
  colorPct: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1E293B",
  },
  barBg: {
    height: 8,
    backgroundColor: "#F1F5F9",
    borderRadius: 4,
    overflow: "hidden",
  },
  barFill: {
    height: 8,
    borderRadius: 4,
  },
  traitRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  traitIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  traitLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 2,
  },
  traitValue: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 16,
  },
  disclaimer: {
    flexDirection: "row",
    gap: 6,
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
  },
  disclaimerText: {
    fontSize: 11,
    color: COLORS.textMuted,
    lineHeight: 16,
    flex: 1,
  },
});
