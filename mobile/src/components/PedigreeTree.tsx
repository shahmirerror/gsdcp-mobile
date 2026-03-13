import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { COLORS, SPACING } from "../lib/theme";
import { getAncestorName, getAncestorId } from "../lib/api";
import type { Pedigree, PedigreeAncestor } from "../lib/api";

type Nav = NativeStackNavigationProp<any>;

const CARD_W = 150;
const CARD_H = 54;
const GAP = 4;
const CONN_W = 18;
const DARK_GREEN = "#2E4A2E";
const LINE_COLOR = "#B0B0B0";
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

function getDob(a: PedigreeAncestor): string | null {
  if (!a || typeof a === "string") return null;
  return a.dob || null;
}

function AncestorCard({ ancestor }: { ancestor: PedigreeAncestor }) {
  const navigation = useNavigation<Nav>();
  const name = getAncestorName(ancestor);
  const dogId = getAncestorId(ancestor);
  const isUnknown = name === "Unknown";
  const title = getTitle(ancestor);
  const dob = getDob(ancestor);

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

  return (
    <TouchableOpacity
      style={[styles.card, isUnknown && styles.unknownCard]}
      onPress={handlePress}
      disabled={isUnknown}
      activeOpacity={0.7}
    >
      <Text style={styles.cardName} numberOfLines={2}>
        {name}
        {title ? <Text style={styles.cardTitle}>{" "}({title})</Text> : null}
      </Text>
      {dob ? <Text style={styles.cardMeta}>{dob}</Text> : null}
    </TouchableOpacity>
  );
}

function Bracket({ cellH, childCellH }: { cellH: number; childCellH: number }) {
  const parentY = cellH / 2;
  const topY = childCellH / 2;
  const botY = cellH - childCellH / 2;

  return (
    <View style={{ width: CONN_W, height: cellH }}>
      <View style={{ position: "absolute", left: 0, top: parentY - LINE_W / 2, width: CONN_W / 2 + LINE_W, height: LINE_W, backgroundColor: LINE_COLOR }} />
      <View style={{ position: "absolute", left: CONN_W / 2, top: topY, width: LINE_W, height: botY - topY + LINE_W, backgroundColor: LINE_COLOR }} />
      <View style={{ position: "absolute", left: CONN_W / 2, top: topY - LINE_W / 2, width: CONN_W / 2 + LINE_W, height: LINE_W, backgroundColor: LINE_COLOR }} />
      <View style={{ position: "absolute", left: CONN_W / 2, top: botY - LINE_W / 2, width: CONN_W / 2 + LINE_W, height: LINE_W, backgroundColor: LINE_COLOR }} />
    </View>
  );
}

function CardColumn({ keys, gen, cellH }: { keys: string[]; gen: Record<string, PedigreeAncestor> | undefined; cellH: number }) {
  return (
    <View>
      {keys.map((k, i) => (
        <View key={k} style={{ height: cellH, justifyContent: "center", marginBottom: i < keys.length - 1 ? GAP : 0 }}>
          <AncestorCard ancestor={gen?.[k] ?? null} />
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

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={true}>
      <View style={styles.tree}>
        <CardColumn keys={gen1Keys} gen={pedigree.gen1} cellH={G1_CELL} />
        <BracketColumn count={2} cellH={G1_CELL} childCellH={G2_CELL} />
        <CardColumn keys={gen2Keys} gen={pedigree.gen2} cellH={G2_CELL} />
        <BracketColumn count={4} cellH={G2_CELL} childCellH={G3_CELL} />
        <CardColumn keys={gen3Keys} gen={pedigree.gen3} cellH={G3_CELL} />
        <BracketColumn count={8} cellH={G3_CELL} childCellH={G4_CELL} />
        <CardColumn keys={gen4Keys} gen={pedigree.gen4} cellH={G4_CELL} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tree: {
    flexDirection: "row",
    paddingVertical: SPACING.sm,
    paddingHorizontal: 4,
    alignItems: "flex-start",
  },
  card: {
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: "#C8C8C8",
    borderRadius: 3,
    paddingHorizontal: 8,
    paddingVertical: 5,
    justifyContent: "center",
    width: CARD_W,
    height: CARD_H,
    overflow: "hidden",
  },
  unknownCard: {
    opacity: 0.35,
  },
  cardName: {
    fontSize: 11,
    fontWeight: "700",
    color: DARK_GREEN,
    lineHeight: 14,
  },
  cardTitle: {
    fontSize: 10,
    fontWeight: "400",
    color: "#777",
  },
  cardMeta: {
    fontSize: 9,
    color: "#999",
    marginTop: 1,
  },
});
