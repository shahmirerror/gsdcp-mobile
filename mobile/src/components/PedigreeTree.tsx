import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  LayoutChangeEvent,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING } from "../lib/theme";
import { getAncestorName, getAncestorId } from "../lib/api";
import type { Pedigree, PedigreeAncestor } from "../lib/api";

type Nav = NativeStackNavigationProp<any>;

const MIN_CARD_W = 140; // keeps names readable on phones (tree scrolls here)
const MAX_CARD_W = 240; // avoids absurdly wide cards on very large screens
const CARD_H = 60;
const GAP = 6;
const MIN_CONN_W = 20;
const CONN_RATIO = 0.15; // connector width as a fraction of card width
const LINE_COLOR = "rgba(15,92,58,0.25)";
const LINE_W = 1.5;

/**
 * Spreads the N card columns + (N-1) connectors to fill the available width so
 * the tree isn't a squashed block on tablets. Falls back to the minimum (and
 * lets the horizontal ScrollView take over) on phones.
 */
function computeSizing(width: number, numGens: number): { cardW: number; connW: number } {
  const PADDING = 32; // tree paddingHorizontal (16 × 2)
  const BLEED = 48; // scrollView negative margin (-24 × 2)
  const usable = width > 0 ? width + BLEED - PADDING : 0;
  const denom = numGens + (numGens - 1) * CONN_RATIO;
  const raw = usable > 0 ? usable / denom : MIN_CARD_W;
  const cardW = Math.min(MAX_CARD_W, Math.max(MIN_CARD_W, raw));
  const connW = Math.max(MIN_CONN_W, Math.round(cardW * CONN_RATIO));
  return { cardW, connW };
}

/**
 * Vertical cell height per generation: the deepest generation's cell is one
 * card tall (CARD_H); each shallower generation's cell is twice the next plus a
 * gap, so brackets line up. Returns [gen1Height, …, genNHeight].
 */
function cellHeights(numGens: number): number[] {
  const cells = new Array<number>(numGens);
  cells[numGens - 1] = CARD_H;
  for (let i = numGens - 2; i >= 0; i--) cells[i] = 2 * cells[i + 1] + GAP;
  return cells;
}

function getTitle(a: PedigreeAncestor): string | null {
  if (!a || typeof a === "string") return null;
  const p: string[] = [];
  if (a.show_title) p.push(a.show_title);
  if (a.work_title) p.push(a.work_title);
  return p.length > 0 ? p.join(", ") : null;
}

function getSex(a: PedigreeAncestor): string | null {
  if (!a || typeof a === "string") return null;
  return a.sex || null;
}

function AncestorCard({ ancestor, genIndex, cardW }: { ancestor: PedigreeAncestor; genIndex: number; cardW: number }) {
  const navigation = useNavigation<Nav>();
  const name = getAncestorName(ancestor);
  const dogId = getAncestorId(ancestor);
  const isUnknown = name === "Unknown";
  const title = getTitle(ancestor);
  const sex = getSex(ancestor);
  const isMale = sex === "Male" || sex === "M";

  const handlePress = () => {
    if (dogId) {
      navigation.navigate("DogsTab", {
        screen: "DogProfile",
        params: { id: dogId, name },
      });
    } else if (!isUnknown) {
      navigation.navigate("DogsTab", {
        screen: "DogSearch",
        params: { searchQuery: name },
      });
    }
  };

  const accentColor = isMale ? COLORS.primary : COLORS.accent;

  return (
    <TouchableOpacity
      style={[styles.card, { width: cardW }, isUnknown && styles.unknownCard]}
      onPress={handlePress}
      disabled={isUnknown}
      activeOpacity={0.7}
    >
      <View style={[styles.cardAccent, { backgroundColor: accentColor }]} />
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Ionicons
            name={isMale ? "male" : "female"}
            size={12}
            color={accentColor}
            style={styles.sexIcon}
          />
          <Text style={[styles.cardName, genIndex >= 3 && styles.cardNameSmall]} numberOfLines={2}>
            {name}
          </Text>
        </View>
        {title ? (
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle} numberOfLines={1}>{title}</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

function Bracket({ cellH, childCellH, connW }: { cellH: number; childCellH: number; connW: number }) {
  const parentY = cellH / 2;
  const topY = childCellH / 2;
  const botY = cellH - childCellH / 2;
  const half = connW / 2;

  return (
    <View style={{ width: connW, height: cellH }}>
      <View style={{ position: "absolute", left: 0, top: parentY - LINE_W / 2, width: half + LINE_W, height: LINE_W, backgroundColor: LINE_COLOR, borderRadius: LINE_W }} />
      <View style={{ position: "absolute", left: half, top: topY, width: LINE_W, height: botY - topY + LINE_W, backgroundColor: LINE_COLOR, borderRadius: LINE_W }} />
      <View style={{ position: "absolute", left: half, top: topY - LINE_W / 2, width: half + LINE_W, height: LINE_W, backgroundColor: LINE_COLOR, borderRadius: LINE_W }} />
      <View style={{ position: "absolute", left: half, top: botY - LINE_W / 2, width: half + LINE_W, height: LINE_W, backgroundColor: LINE_COLOR, borderRadius: LINE_W }} />
    </View>
  );
}

function CardColumn({ keys, gen, cellH, genIndex, cardW }: { keys: string[]; gen: Record<string, PedigreeAncestor> | undefined; cellH: number; genIndex: number; cardW: number }) {
  return (
    <View>
      {keys.map((k, i) => (
        <View key={k} style={{ height: cellH, justifyContent: "center", marginBottom: i < keys.length - 1 ? GAP : 0 }}>
          <AncestorCard ancestor={gen?.[k] ?? null} genIndex={genIndex} cardW={cardW} />
        </View>
      ))}
    </View>
  );
}

function BracketColumn({ count, cellH, childCellH, connW }: { count: number; cellH: number; childCellH: number; connW: number }) {
  return (
    <View>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={{ marginBottom: i < count - 1 ? GAP : 0 }}>
          <Bracket cellH={cellH} childCellH={childCellH} connW={connW} />
        </View>
      ))}
    </View>
  );
}

function GenLabel({ label, index }: { label: string; index: number }) {
  return (
    <View style={styles.genLabelWrap}>
      <Text style={styles.genLabel}>{label}</Text>
    </View>
  );
}

export function PedigreeTree({ pedigree }: { pedigree: Pedigree }) {
  const gen1Keys = ["sire", "dam"];
  const gen2Keys = ["sire_sire", "sire_dam", "dam_sire", "dam_dam"];
  const gen3Keys = [
    "sire_sire_sire", "sire_sire_dam", "sire_dam_sire", "sire_dam_dam",
    "dam_sire_sire", "dam_sire_dam", "dam_dam_sire", "dam_dam_dam",
  ];
  const gen4Keys = [
    "sire_sire_sire_sire", "sire_sire_sire_dam",
    "sire_sire_dam_sire", "sire_sire_dam_dam",
    "sire_dam_sire_sire", "sire_dam_sire_dam",
    "sire_dam_dam_sire", "sire_dam_dam_dam",
    "dam_sire_sire_sire", "dam_sire_sire_dam",
    "dam_sire_dam_sire", "dam_sire_dam_dam",
    "dam_dam_sire_sire", "dam_dam_sire_dam",
    "dam_dam_dam_sire", "dam_dam_dam_dam",
  ];
  const gen5Keys = gen4Keys.flatMap((k) => [`${k}_sire`, `${k}_dam`]);

  // Only show the 5th generation once the backend actually provides gen5 data,
  // so older API responses keep their clean 4-generation layout.
  const hasGen5 = !!pedigree.gen5 && Object.keys(pedigree.gen5).length > 0;
  const numGens = hasGen5 ? 5 : 4;
  const cells = cellHeights(numGens);

  const genLabels = hasGen5
    ? ["Parents", "Grandparents", "Great Grand.", "GG Grand.", "GGG Grand."]
    : ["Parents", "Grandparents", "Great Grand.", "GG Grand."];

  const [width, setWidth] = useState(0);
  const { cardW, connW } = computeSizing(width, numGens);
  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w && Math.abs(w - width) > 1) setWidth(w);
  };

  return (
    <View onLayout={onLayout}>
      <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.scrollView}>
        <View>
          <View style={styles.genLabelsRow}>
            {genLabels.map((label, i) => (
              <View key={label} style={styles.genLabelCell}>
                {i > 0 && <View style={{ width: connW }} />}
                <View style={{ width: cardW, alignItems: "center" }}>
                  <Text style={styles.genLabel}>{label}</Text>
                </View>
              </View>
            ))}
          </View>
          <View style={styles.tree}>
            <CardColumn keys={gen1Keys} gen={pedigree.gen1} cellH={cells[0]} genIndex={1} cardW={cardW} />
            <BracketColumn count={2} cellH={cells[0]} childCellH={cells[1]} connW={connW} />
            <CardColumn keys={gen2Keys} gen={pedigree.gen2} cellH={cells[1]} genIndex={2} cardW={cardW} />
            <BracketColumn count={4} cellH={cells[1]} childCellH={cells[2]} connW={connW} />
            <CardColumn keys={gen3Keys} gen={pedigree.gen3} cellH={cells[2]} genIndex={3} cardW={cardW} />
            <BracketColumn count={8} cellH={cells[2]} childCellH={cells[3]} connW={connW} />
            <CardColumn keys={gen4Keys} gen={pedigree.gen4} cellH={cells[3]} genIndex={4} cardW={cardW} />
            {hasGen5 && (
              <>
                <BracketColumn count={16} cellH={cells[3]} childCellH={cells[4]} connW={connW} />
                <CardColumn keys={gen5Keys} gen={pedigree.gen5} cellH={cells[4]} genIndex={5} cardW={cardW} />
              </>
            )}
          </View>
        </View>
      </ScrollView>
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <Ionicons name="male" size={14} color={COLORS.primary} />
          <Text style={styles.legendText}>Male</Text>
        </View>
        <View style={styles.legendItem}>
          <Ionicons name="female" size={14} color={COLORS.accent} />
          <Text style={styles.legendText}>Female</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    marginHorizontal: -24,
    paddingHorizontal: 0,
  },
  genLabelsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  genLabelCell: {
    flexDirection: "row",
    alignItems: "center",
  },
  genLabelWrap: {
    alignItems: "center",
  },
  genLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tree: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingHorizontal: 16,
    alignItems: "flex-start",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(15,92,58,0.12)",
    borderRadius: 10,
    flexDirection: "row",
    overflow: "hidden",
    height: CARD_H,
    shadowColor: "#0F5C3A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  unknownCard: {
    opacity: 0.3,
    backgroundColor: "#f8f9fa",
  },
  cardAccent: {
    width: 3,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  cardContent: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
    justifyContent: "center",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  sexIcon: {
    marginRight: 4,
    marginTop: 1,
  },
  cardName: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0F172A",
    lineHeight: 14,
    flex: 1,
  },
  cardNameSmall: {
    fontSize: 10,
  },
  cardTitleRow: {
    marginTop: 3,
  },
  cardTitle: {
    fontSize: 9,
    fontWeight: "600",
    color: COLORS.primary,
    opacity: 0.7,
  },
  legendRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(15,92,58,0.08)",
    marginTop: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendText: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "500",
  },
});
