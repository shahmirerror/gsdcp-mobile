import { forwardRef } from "react";
import { View, Text, Image, ImageBackground, StyleSheet } from "react-native";

/**
 * Fixed-size (1080×1920) "share graphic" for a dog profile — a native
 * re-creation of the GSDCP share template, modelled on ShepherdIQ's DogShareCard.
 *
 * The static template (background colour, watermark art, logo and the footer
 * logo + disclaimer) is baked into `assets/share-card-bg.png`. This component
 * lays that image down full-bleed and overlays only the dynamic dog data, using
 * a bounded flex region with flexible spacers so the layout stays balanced for
 * both data-rich and sparse dogs (no stranded gap when most fields are empty) —
 * the same approach ShepherdIQ uses, instead of brittle absolute coordinates.
 *
 * Rendered off-screen / inside a scaled preview and snapshotted with
 * react-native-view-shot at 1080×1920 (see lib/shareDogProfile.ts).
 */

const bg = require("../../assets/share-card-bg.png");

const W = 1080;
const H = 1920;

const INK = "#1A1A1A";
const NAVY = "#0B2A4A";
const RED = "#C0202B";
const MUTED = "#5E5E5E";

export type ShareDogCardProps = {
  name: string;
  showTitle?: string | null;
  regNumber?: string | null;
  imageUri?: string | null;
  gender?: string | null;
  dob?: string | null; // pre-formatted date string
  chip?: string | null;
  colour?: string | null;
  coat?: string | null;
  sireName?: string | null;
  sireSub?: string | null; // "{Title} | {Coat} | {HD}/{ED}"
  damName?: string | null;
  damSub?: string | null;
  lineBreeding?: string | null;
  siblings?: string | null;
  breeder?: string | null;
  owner?: string | null;
  city?: string | null;
  workingTitle?: string | null;
  survey?: string | null;
};

const val = (v?: string | null): string =>
  v != null && String(v).trim().length > 0 ? String(v).trim() : "—";

// Breeder / owner read "Not Claimed" when empty rather than a bare dash — the
// record simply has no claimant on file (matches ShepherdIQ).
const claim = (v?: string | null): string =>
  v != null && String(v).trim().length > 0 ? String(v).trim() : "Not Claimed";

/** A "Label:  value" line; the label can be tinted (red for the key records). */
function KV({
  label,
  value,
  labelColor = INK,
  lines = 2,
}: {
  label: string;
  value: string;
  labelColor?: string;
  lines?: number;
}) {
  return (
    <Text style={styles.kv} numberOfLines={lines}>
      <Text style={[styles.kvLabel, { color: labelColor }]}>{label}:  </Text>
      {value}
    </Text>
  );
}

function Parent({
  label,
  name,
  sub,
}: {
  label: string;
  name: string;
  sub?: string | null;
}) {
  return (
    <View>
      <Text style={styles.parent} numberOfLines={1}>
        <Text style={styles.parentLabel}>{label}:  </Text>
        <Text style={styles.parentName}>{name}</Text>
      </Text>
      {sub && sub.trim() ? (
        <Text style={styles.parentSub} numberOfLines={1}>
          {sub.trim()}
        </Text>
      ) : null}
    </View>
  );
}

const ShareDogCard = forwardRef<View, ShareDogCardProps>(function ShareDogCard(
  p,
  ref,
) {
  return (
    <View ref={ref} collapsable={false} style={styles.card}>
      <ImageBackground source={bg} style={styles.bg} resizeMode="cover">
        {/* Header — name + show title + registration */}
        <View style={styles.header}>
          <Text
            style={styles.name}
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.5}
          >
            {val(p.name)}
          </Text>
          <View style={styles.titleRow}>
            <Text style={styles.showTitle} numberOfLines={1}>
              {val(p.showTitle)}
            </Text>
            <Text style={styles.regNo} numberOfLines={1}>
              {val(p.regNumber)}
            </Text>
          </View>
        </View>

        {/* Body — photo + info groups, spacers absorb the free space */}
        <View style={styles.body}>
          <View style={styles.photoWrap}>
            {p.imageUri ? (
              <Image
                source={{ uri: p.imageUri }}
                style={styles.photo}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.photo, styles.photoPlaceholder]}>
                <Text style={styles.photoPlaceholderText}>{val(p.name)[0]}</Text>
              </View>
            )}
          </View>

          <View style={{ flex: 3 }} />

          {/* Specs */}
          <View style={styles.specRow}>
            <View style={styles.specCol}>
              <KV label="Gender" value={val(p.gender)} />
            </View>
            <View style={styles.specCol}>
              <KV label="Date of Birth" value={val(p.dob)} />
            </View>
          </View>
          <View style={styles.specGap} />
          <View style={styles.specRow}>
            <View style={styles.specCol}>
              <KV label="Chip Number" value={val(p.chip)} />
            </View>
            <View style={styles.specCol}>
              <KV label="Colour" value={val(p.colour)} />
            </View>
          </View>
          <View style={styles.specGap} />
          <KV label="Coat" value={val(p.coat)} />

          <View style={{ flex: 2 }} />

          {/* Parents */}
          <Parent label="Sire" name={val(p.sireName)} sub={p.sireSub} />
          <View style={styles.parentGap} />
          <Parent label="Dam" name={val(p.damName)} sub={p.damSub} />

          <View style={{ flex: 2 }} />

          {/* Pedigree summary — line breeding may wrap past 2 lines; the flex
              spacers above (parents) and below (ownership) shrink to absorb it. */}
          <KV label="Line Breeding" value={val(p.lineBreeding)} labelColor={RED} lines={4} />
          <View style={styles.rowGap} />
          <KV label="Siblings" value={val(p.siblings)} labelColor={RED} />

          <View style={{ flex: 2 }} />

          {/* Ownership */}
          <KV label="Breeder" value={claim(p.breeder)} labelColor={RED} />
          <View style={styles.rowGap} />
          <KV label="Owner" value={claim(p.owner)} labelColor={RED} />
          <View style={styles.rowGap} />
          <KV label="City" value={val(p.city)} labelColor={RED} />
          <View style={styles.rowGap} />
          <KV label="Best Show Grade" value={val(p.showTitle)} labelColor={RED} />
          <View style={styles.rowGap} />
          <KV label="Survey" value={val(p.survey)} labelColor={RED} />
        </View>
      </ImageBackground>
    </View>
  );
});

export default ShareDogCard;

const styles = StyleSheet.create({
  card: { width: W, height: H, backgroundColor: "#F2F2F0" },
  bg: { width: W, height: H },

  header: {
    position: "absolute",
    top: 108,
    left: 180,
    right: 70,
  },
  name: {
    height: 170,
    textAlign: "center",
    textAlignVertical: "center",
    fontSize: 64,
    fontWeight: "900",
    color: NAVY,
    letterSpacing: -0.5,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    // Pull the row in to line up exactly with the centered 690px photo below:
    // header spans card x 180–1010, the photo spans x 195–885.
    marginLeft: 15,
    marginRight: 125,
  },
  showTitle: {
    flex: 1,
    fontSize: 37,
    fontWeight: "800",
    color: RED,
    textAlign: "left",
  },
  regNo: {
    flex: 1,
    fontSize: 35,
    fontWeight: "700",
    color: INK,
    textAlign: "right",
  },

  body: {
    position: "absolute",
    left: 92,
    right: 92,
    top: 352,
    bottom: 232,
  },
  photoWrap: { alignItems: "center" },
  photo: {
    width: 690,
    height: 460,
    borderRadius: 24,
    backgroundColor: "#E5E5E2",
  },
  photoPlaceholder: { alignItems: "center", justifyContent: "center" },
  photoPlaceholderText: { fontSize: 150, fontWeight: "900", color: "#B9BDBA" },

  specRow: { flexDirection: "row" },
  specCol: { flex: 1 },
  specGap: { height: 10 },
  rowGap: { height: 8 },
  parentGap: { height: 16 },

  kv: { fontSize: 32, color: INK, lineHeight: 40 },
  kvLabel: { fontSize: 32, fontWeight: "700", color: NAVY },

  parent: { fontSize: 36 },
  parentLabel: { fontSize: 36, fontWeight: "700", color: INK },
  parentName: { fontSize: 36, fontWeight: "800", color: RED },
  parentSub: { fontSize: 28, color: MUTED, marginTop: 4, marginLeft: 6 },
});
