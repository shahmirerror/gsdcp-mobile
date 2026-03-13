import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { COLORS, SPACING } from "../lib/theme";
import { getAncestorName, getAncestorId } from "../lib/api";
import type { Pedigree, PedigreeAncestor } from "../lib/api";

type Nav = NativeStackNavigationProp<any>;

const CARD_W = 160;
const CARD_H = 56;
const GAP = 4;
const CONN_W = 16;
const DARK_GREEN = "#2E4A2E";
const LINE_COLOR = "#B0B0B0";
const LINE_W = 1.5;

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

function BracketConnector({ pairH }: { pairH: number }) {
  const half = pairH / 2;
  return (
    <View style={{ width: CONN_W, height: pairH }}>
      <View style={{ position: "absolute", left: 0, top: half - LINE_W / 2, width: CONN_W, height: LINE_W, backgroundColor: LINE_COLOR }} />
      <View style={{ position: "absolute", right: 0, top: 0, width: LINE_W, height: pairH, backgroundColor: LINE_COLOR }} />
      <View style={{ position: "absolute", right: 0, top: CARD_H / 2 - LINE_W / 2, width: CONN_W, height: LINE_W, backgroundColor: LINE_COLOR }} />
      <View style={{ position: "absolute", right: 0, bottom: CARD_H / 2 - LINE_W / 2, width: CONN_W, height: LINE_W, backgroundColor: LINE_COLOR }} />
    </View>
  );
}

export function PedigreeTree({ pedigree }: { pedigree: Pedigree }) {
  const a = (gen: Record<string, PedigreeAncestor> | undefined, key: string): PedigreeAncestor =>
    gen?.[key] ?? null;

  const g4H = CARD_H;
  const g4PairH = g4H * 2 + GAP;
  const g3H = g4PairH;
  const g3PairH = g3H * 2 + GAP;
  const g2H = g3PairH;
  const g2PairH = g2H * 2 + GAP;
  const totalH = g2PairH;

  const gen1Keys = ["sire", "dam"];
  const gen2Keys = ["sire_sire", "sire_dam", "dam_sire", "dam_dam"];
  const gen3Keys = [
    "sire_sire_sire", "sire_sire_dam", "sire_dam_sire", "sire_dam_dam",
    "dam_sire_sire", "dam_sire_dam", "dam_dam_sire", "dam_dam_dam",
  ];
  const gen4Keys = [
    "sire_sire_sire_sire", "sire_sire_sire_dam", "sire_sire_dam_sire", "sire_sire_dam_dam",
    "sire_dam_sire_sire", "sire_dam_sire_dam", "sire_dam_dam_sire", "sire_dam_dam_dam",
    "dam_sire_sire_sire", "dam_sire_sire_dam", "dam_sire_dam_sire", "dam_sire_dam_dam",
    "dam_dam_sire_sire", "dam_dam_sire_dam", "dam_dam_dam_sire", "dam_dam_dam_dam",
  ];

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={true}>
      <View style={styles.tree}>

        {/* Gen 1: 2 cards */}
        <View style={{ height: totalH }}>
          {gen1Keys.map((k, i) => (
            <View key={k} style={{ height: g2H, justifyContent: "center", marginBottom: i === 0 ? GAP : 0 }}>
              <AncestorCard ancestor={a(pedigree.gen1, k)} />
            </View>
          ))}
        </View>

        {/* Bracket 1→2 */}
        <View style={{ height: totalH }}>
          {gen1Keys.map((k, i) => (
            <View key={k} style={{ height: g2H, justifyContent: "center", marginBottom: i === 0 ? GAP : 0 }}>
              <BracketConnector pairH={g2H} />
            </View>
          ))}
        </View>

        {/* Gen 2: 4 cards */}
        <View style={{ height: totalH }}>
          {gen2Keys.map((k, i) => (
            <View key={k} style={{ height: g3H, justifyContent: "center", marginBottom: i < 3 ? GAP : 0 }}>
              <AncestorCard ancestor={a(pedigree.gen2, k)} />
            </View>
          ))}
        </View>

        {/* Bracket 2→3 */}
        <View style={{ height: totalH }}>
          {gen2Keys.map((k, i) => (
            <View key={k} style={{ height: g3H, justifyContent: "center", marginBottom: i < 3 ? GAP : 0 }}>
              <BracketConnector pairH={g3H} />
            </View>
          ))}
        </View>

        {/* Gen 3: 8 cards */}
        <View style={{ height: totalH }}>
          {gen3Keys.map((k, i) => (
            <View key={k} style={{ height: g4PairH, justifyContent: "center", marginBottom: i < 7 ? GAP : 0 }}>
              <AncestorCard ancestor={a(pedigree.gen3, k)} />
            </View>
          ))}
        </View>

        {/* Bracket 3→4 */}
        <View style={{ height: totalH }}>
          {gen3Keys.map((k, i) => (
            <View key={k} style={{ height: g4PairH, justifyContent: "center", marginBottom: i < 7 ? GAP : 0 }}>
              <BracketConnector pairH={g4PairH} />
            </View>
          ))}
        </View>

        {/* Gen 4: 16 cards */}
        <View style={{ height: totalH }}>
          {gen4Keys.map((k, i) => (
            <View key={k} style={{ height: g4H, justifyContent: "center", marginBottom: i < 15 ? GAP : 0 }}>
              <AncestorCard ancestor={a(pedigree.gen4, k)} />
            </View>
          ))}
        </View>
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
