import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING } from "../lib/theme";
import { getAncestorName, getAncestorId } from "../lib/api";
import type { Pedigree, PedigreeAncestor } from "../lib/api";

type Nav = NativeStackNavigationProp<any>;

const CARD_W = 140;
const CARD_H = 60;
const GAP = 6;
const CONN_W = 20;
const LINE_COLOR = "rgba(15,92,58,0.25)";
const LINE_W = 1.5;

const G4_CELL = CARD_H;
const G3_CELL = 2 * G4_CELL + GAP;
const G2_CELL = 2 * G3_CELL + GAP;
const G1_CELL = 2 * G2_CELL + GAP;

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

function AncestorCard({ ancestor, genIndex }: { ancestor: PedigreeAncestor; genIndex: number }) {
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
      style={[styles.card, isUnknown && styles.unknownCard]}
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

function Bracket({ cellH, childCellH }: { cellH: number; childCellH: number }) {
  const parentY = cellH / 2;
  const topY = childCellH / 2;
  const botY = cellH - childCellH / 2;

  return (
    <View style={{ width: CONN_W, height: cellH }}>
      <View style={{ position: "absolute", left: 0, top: parentY - LINE_W / 2, width: CONN_W / 2 + LINE_W, height: LINE_W, backgroundColor: LINE_COLOR, borderRadius: LINE_W }} />
      <View style={{ position: "absolute", left: CONN_W / 2, top: topY, width: LINE_W, height: botY - topY + LINE_W, backgroundColor: LINE_COLOR, borderRadius: LINE_W }} />
      <View style={{ position: "absolute", left: CONN_W / 2, top: topY - LINE_W / 2, width: CONN_W / 2 + LINE_W, height: LINE_W, backgroundColor: LINE_COLOR, borderRadius: LINE_W }} />
      <View style={{ position: "absolute", left: CONN_W / 2, top: botY - LINE_W / 2, width: CONN_W / 2 + LINE_W, height: LINE_W, backgroundColor: LINE_COLOR, borderRadius: LINE_W }} />
    </View>
  );
}

function CardColumn({ keys, gen, cellH, genIndex }: { keys: string[]; gen: Record<string, PedigreeAncestor> | undefined; cellH: number; genIndex: number }) {
  return (
    <View>
      {keys.map((k, i) => (
        <View key={k} style={{ height: cellH, justifyContent: "center", marginBottom: i < keys.length - 1 ? GAP : 0 }}>
          <AncestorCard ancestor={gen?.[k] ?? null} genIndex={genIndex} />
        </View>
      ))}
    </View>
  );
}

function BracketColumn({ count, cellH, childCellH }: { count: number; cellH: number; childCellH: number }) {
  return (
    <View>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={{ marginBottom: i < count - 1 ? GAP : 0 }}>
          <Bracket cellH={cellH} childCellH={childCellH} />
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

  const genLabels = ["Parents", "Grandparents", "Great Grand.", "GG Grand."];

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.scrollView}>
        <View>
          <View style={styles.genLabelsRow}>
            {genLabels.map((label, i) => (
              <View key={label} style={styles.genLabelCell}>
                {i > 0 && <View style={{ width: CONN_W }} />}
                <View style={{ width: CARD_W, alignItems: "center" }}>
                  <Text style={styles.genLabel}>{label}</Text>
                </View>
              </View>
            ))}
          </View>
          <View style={styles.tree}>
            <CardColumn keys={gen1Keys} gen={pedigree.gen1} cellH={G1_CELL} genIndex={1} />
            <BracketColumn count={2} cellH={G1_CELL} childCellH={G2_CELL} />
            <CardColumn keys={gen2Keys} gen={pedigree.gen2} cellH={G2_CELL} genIndex={2} />
            <BracketColumn count={4} cellH={G2_CELL} childCellH={G3_CELL} />
            <CardColumn keys={gen3Keys} gen={pedigree.gen3} cellH={G3_CELL} genIndex={3} />
            <BracketColumn count={8} cellH={G3_CELL} childCellH={G4_CELL} />
            <CardColumn keys={gen4Keys} gen={pedigree.gen4} cellH={G4_CELL} genIndex={4} />
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
        <View style={styles.legendItem}>
          <Ionicons name="open-outline" size={14} color="#94A3B8" />
          <Text style={styles.legendText}>Tap to view</Text>
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
    width: CARD_W,
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
