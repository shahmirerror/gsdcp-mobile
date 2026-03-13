import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from "../lib/theme";
import { getAncestorName, getAncestorId } from "../lib/api";
import type { Pedigree, PedigreeAncestor } from "../lib/api";

type Nav = NativeStackNavigationProp<any>;

function AncestorCell({ ancestor, type }: { ancestor: PedigreeAncestor; type: "sire" | "dam" }) {
  const navigation = useNavigation<Nav>();
  const name = getAncestorName(ancestor);
  const dogId = getAncestorId(ancestor);
  const isUnknown = name === "Unknown";
  const isSire = type === "sire";

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
      style={[
        styles.cell,
        isSire ? styles.sireCell : styles.damCell,
        isUnknown && styles.unknownCell,
      ]}
      onPress={handlePress}
      disabled={isUnknown}
      activeOpacity={0.7}
    >
      <Text
        style={[styles.cellName, isUnknown && styles.unknownText]}
        numberOfLines={2}
      >
        {name}
      </Text>
      <Text style={[styles.cellIcon, isSire ? styles.sireIcon : styles.damIcon]}>
        {isSire ? "♂" : "♀"}
      </Text>
    </TouchableOpacity>
  );
}

function GenColumn({ label, ancestors }: { label: string; ancestors: { ancestor: PedigreeAncestor; type: "sire" | "dam" }[] }) {
  return (
    <View style={styles.column}>
      <Text style={styles.columnLabel}>{label}</Text>
      {ancestors.map((a, i) => (
        <AncestorCell key={`${label}-${i}`} ancestor={a.ancestor} type={a.type} />
      ))}
    </View>
  );
}

export function PedigreeTree({ pedigree }: { pedigree: Pedigree }) {
  const g = (gen: Record<string, PedigreeAncestor>, key: string): PedigreeAncestor => gen[key] ?? null;

  const gen1 = [
    { ancestor: g(pedigree.gen1, "sire"), type: "sire" as const },
    { ancestor: g(pedigree.gen1, "dam"), type: "dam" as const },
  ];
  const gen2 = [
    { ancestor: g(pedigree.gen2, "sire_sire"), type: "sire" as const },
    { ancestor: g(pedigree.gen2, "sire_dam"), type: "dam" as const },
    { ancestor: g(pedigree.gen2, "dam_sire"), type: "sire" as const },
    { ancestor: g(pedigree.gen2, "dam_dam"), type: "dam" as const },
  ];
  const gen3Keys = [
    "sire_sire_sire", "sire_sire_dam", "sire_dam_sire", "sire_dam_dam",
    "dam_sire_sire", "dam_sire_dam", "dam_dam_sire", "dam_dam_dam",
  ];
  const gen3 = gen3Keys.map((k, i) => ({
    ancestor: g(pedigree.gen3, k),
    type: (i % 2 === 0 ? "sire" : "dam") as "sire" | "dam",
  }));
  const gen4Keys = [
    "sire_sire_sire_sire", "sire_sire_sire_dam", "sire_sire_dam_sire", "sire_sire_dam_dam",
    "sire_dam_sire_sire", "sire_dam_sire_dam", "sire_dam_dam_sire", "sire_dam_dam_dam",
    "dam_sire_sire_sire", "dam_sire_sire_dam", "dam_sire_dam_sire", "dam_sire_dam_dam",
    "dam_dam_sire_sire", "dam_dam_sire_dam", "dam_dam_dam_sire", "dam_dam_dam_dam",
  ];
  const gen4 = gen4Keys.map((k, i) => ({
    ancestor: g(pedigree.gen4, k),
    type: (i % 2 === 0 ? "sire" : "dam") as "sire" | "dam",
  }));

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.tree}>
          <GenColumn label="Gen 1" ancestors={gen1} />
          <GenColumn label="Gen 2" ancestors={gen2} />
          <GenColumn label="Gen 3" ancestors={gen3} />
          <GenColumn label="Gen 4" ancestors={gen4} />
        </View>
      </ScrollView>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.sire }]} />
          <Text style={styles.legendText}>Sire (♂)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.dam }]} />
          <Text style={styles.legendText}>Dam (♀)</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tree: {
    flexDirection: "row",
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    minWidth: 600,
  },
  column: {
    flex: 1,
    gap: 4,
  },
  columnLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    textAlign: "center",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  cell: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
  },
  sireCell: {
    backgroundColor: COLORS.sire,
    borderColor: COLORS.sireBorder,
  },
  damCell: {
    backgroundColor: COLORS.dam,
    borderColor: COLORS.damBorder,
  },
  unknownCell: {
    opacity: 0.5,
  },
  cellName: {
    fontSize: FONT_SIZES.xs,
    fontWeight: "500",
    color: COLORS.text,
  },
  unknownText: {
    fontStyle: "italic",
    color: COLORS.textMuted,
  },
  cellIcon: {
    fontSize: 9,
    fontWeight: "600",
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sireIcon: {
    color: COLORS.sireText,
  },
  damIcon: {
    color: COLORS.damText,
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: SPACING.lg,
    marginTop: SPACING.sm,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  legendText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
});
