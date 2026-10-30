import { forwardRef } from "react";
import { View, Text, ImageBackground, StyleSheet } from "react-native";

/**
 * Fixed-size (1080×1080) "Litter on Ground!" announcement card.
 *
 * The heading, GSDCP logo, the "X" mating mark and the megaphone artwork are
 * baked into `assets/litter-share-bg.png`; this component overlays only the
 * dynamic litter data, positioned in the template's own 1080×1080 space.
 *
 * Rendered off-screen / in a scaled preview and snapshotted with
 * react-native-view-shot (see lib/shareDogProfile.ts helpers).
 */

const bg = require("../../assets/litter-share-bg.png");

const W = 1080;
const H = 1080;

const INK = "#1A1A1A";
const NAVY = "#16243F";
const RED = "#E02B1D";
const MUTED = "#3A3A3A";

export type LitterShareCardProps = {
  kennelSuffix?: string | null;
  sireName?: string | null;
  sireSub?: string | null; // "{Title} | {Coat} | {HD}/{ED}"
  damName?: string | null;
  damSub?: string | null;
  whelpingDate?: string | null;
  totalPups?: string | null;
  malePups?: string | null;
  femalePups?: string | null;
  breederName?: string | null;
  breederPhone?: string | null;
  breederCity?: string | null;
};

const val = (v?: string | null): string =>
  v != null && String(v).trim().length > 0 ? String(v).trim() : "—";

const LitterShareCard = forwardRef<View, LitterShareCardProps>(
  function LitterShareCard(p, ref) {
    return (
      <View ref={ref} collapsable={false} style={styles.card}>
        <ImageBackground source={bg} style={styles.bg} resizeMode="cover">
          {/* Kennel suffix / prefix (under the baked "Litter on Ground!" title) */}
          <Text style={styles.kennel} numberOfLines={1} adjustsFontSizeToFit>
            {val(p.kennelSuffix)}
          </Text>

          {/* Sire */}
          <Text style={styles.sireName} numberOfLines={1} adjustsFontSizeToFit>
            {val(p.sireName)}
          </Text>
          <Text style={styles.sireSub} numberOfLines={1}>
            {val(p.sireSub)}
          </Text>

          {/* (baked "X" mating mark sits here) */}

          {/* Dam */}
          <Text style={styles.damName} numberOfLines={1} adjustsFontSizeToFit>
            {val(p.damName)}
          </Text>
          <Text style={styles.damSub} numberOfLines={1}>
            {val(p.damSub)}
          </Text>

          {/* Whelping date */}
          <Text style={styles.dob} numberOfLines={1}>
            <Text style={styles.dobLabel}>Date of Birth: </Text>
            {val(p.whelpingDate)}
          </Text>

          {/* Puppy counts */}
          <Text style={styles.pupsTotal} numberOfLines={1}>
            {val(p.totalPups)} Healthy Puppies
          </Text>
          <Text style={styles.pupsSplit} numberOfLines={1}>
            {val(p.malePups)} Males & {val(p.femalePups)} Females
          </Text>

          {/* Breeder block — label column + value column so values align */}
          <View style={[styles.idRow, { top: 902 }]}>
            <Text style={styles.idLabel}>Breeder:</Text>
            <Text style={styles.idVal} numberOfLines={1}>
              {val(p.breederName)}
            </Text>
          </View>
          <View style={[styles.idRow, { top: 948 }]}>
            <Text style={styles.idLabel}>Phone:</Text>
            <Text style={styles.idVal} numberOfLines={1}>
              {val(p.breederPhone)}
            </Text>
          </View>
          <View style={[styles.idRow, { top: 994 }]}>
            <Text style={styles.idLabel}>City:</Text>
            <Text style={styles.idVal} numberOfLines={1}>
              {val(p.breederCity)}
            </Text>
          </View>
        </ImageBackground>
      </View>
    );
  },
);

export default LitterShareCard;

const SIDE = 66;

const styles = StyleSheet.create({
  card: { width: W, height: H, backgroundColor: "#F3EFE6" },
  bg: { width: W, height: H },

  kennel: {
    position: "absolute",
    top: 345,
    left: SIDE,
    right: 340,
    fontSize: 50,
    fontWeight: "700",
    color: NAVY,
  },

  sireName: {
    position: "absolute",
    top: 438,
    left: SIDE,
    right: 360,
    fontSize: 54,
    fontWeight: "900",
    color: RED,
  },
  sireSub: {
    position: "absolute",
    top: 506,
    left: SIDE,
    right: 360,
    fontSize: 30,
    fontWeight: "600",
    color: MUTED,
  },

  damName: {
    position: "absolute",
    top: 626,
    left: SIDE,
    right: 360,
    fontSize: 54,
    fontWeight: "900",
    color: RED,
  },
  damSub: {
    position: "absolute",
    top: 694,
    left: SIDE,
    right: 360,
    fontSize: 30,
    fontWeight: "600",
    color: MUTED,
  },

  dob: {
    position: "absolute",
    top: 756,
    left: SIDE,
    right: 320,
    fontSize: 38,
    color: NAVY,
  },
  dobLabel: { fontSize: 38, fontWeight: "700", color: NAVY },

  pupsTotal: {
    position: "absolute",
    top: 814,
    left: SIDE + 4,
    right: 320,
    fontSize: 36,
    fontWeight: "600",
    color: INK,
  },
  pupsSplit: {
    position: "absolute",
    top: 856,
    left: SIDE,
    right: 320,
    fontSize: 36,
    fontWeight: "600",
    color: INK,
  },

  idRow: {
    position: "absolute",
    left: SIDE,
    right: 300,
    flexDirection: "row",
    alignItems: "baseline",
  },
  idLabel: { width: 165, fontSize: 34, fontWeight: "800", color: RED },
  idVal: { flex: 1, fontSize: 34, fontWeight: "600", color: INK },
});
