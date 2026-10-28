import { useRef, useState } from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../lib/theme";
import LitterShareCard, { LitterShareCardProps } from "./LitterShareCard";
import { captureCard, shareImageWithLink, dogShareUrl } from "../lib/shareDogProfile";

/**
 * Full-screen preview + share for the "Litter on Ground!" card. Shows a live,
 * scaled preview of the 1080×1080 card and captures it at full resolution on
 * share (same approach as the dog-profile share screen).
 */
export default function LitterShareModal({
  visible,
  onClose,
  card,
}: {
  visible: boolean;
  onClose: () => void;
  card: LitterShareCardProps;
}) {
  const insets = useSafeAreaInsets();
  const cardRef = useRef<View>(null);
  const [busy, setBusy] = useState(false);

  const previewW = Math.min(Dimensions.get("window").width - 32, 380);
  const scale = previewW / 1080;
  const previewH = 1080 * scale;

  // A litter has no page of its own, so the shared deep link points at the dam's
  // profile (she whelped the litter), falling back to the sire, then the app's
  // download page. The link is attached to the image on builds that include
  // react-native-share; otherwise sharing degrades to image-only.
  const shareLink = card.damName
    ? dogShareUrl(card.damName)
    : card.sireName
    ? dogShareUrl(card.sireName)
    : "https://gsdcp.org/mobile-app";
  const shareMessage =
    [card.sireName, card.damName].filter(Boolean).join(" × ") ||
    "Litter on ground";

  const handleShare = async () => {
    if (busy) return;
    setBusy(true);
    try {
      // Let the card (and any decoded images) finish painting before the snapshot.
      await new Promise((r) => setTimeout(r, 120));
      const uri = await captureCard(cardRef, 1080, 1080);
      const ok = await shareImageWithLink(uri, shareLink, {
        title: "Share litter announcement",
        message: shareMessage,
      });
      if (!ok) {
        Alert.alert("Sharing unavailable", "Sharing isn't supported on this device.");
      }
    } catch {
      Alert.alert("Could not share", "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.screen}>
        <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.back}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.kicker}>SHARE</Text>
            <Text style={styles.title} numberOfLines={1}>
              Litter on Ground
            </Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.previewScroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.shadow}>
            <View
              style={{
                width: previewW,
                height: previewH,
                overflow: "hidden",
                borderRadius: 14,
              }}
            >
              <View
                style={{
                  position: "absolute",
                  left: (previewW - 1080) / 2,
                  top: (previewH - 1080) / 2,
                  transform: [{ scale }],
                }}
              >
                <LitterShareCard ref={cardRef} {...card} />
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={[styles.panel, { paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity
            style={[styles.shareBtn, { flex: 1 }]}
            onPress={handleShare}
            activeOpacity={0.85}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="share-social" size={18} color="#fff" />
            )}
            <Text style={styles.shareBtnText}>{busy ? "Preparing…" : "Share"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f6f8f7" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  kicker: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    color: COLORS.textMuted,
  },
  title: { fontSize: 18, fontWeight: "800", color: "#0F172A", marginTop: 1 },
  previewScroll: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  shadow: {
    borderRadius: 18,
    backgroundColor: "#fff",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 28,
    elevation: 10,
  },
  panel: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 12,
  },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 14,
    minWidth: 140,
  },
  shareBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});
