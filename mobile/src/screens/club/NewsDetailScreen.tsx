import { useEffect, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";

import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, BORDER_RADIUS } from "../../lib/theme";
import { parseRichContent } from "../../lib/api";
import type { TheClubStackParamList } from "../../navigation/AppNavigator";

type Nav = NativeStackNavigationProp<TheClubStackParamList>;

/** Renders a content image at full width, sizing its height from the real aspect ratio. */
function ContentImage({ uri }: { uri: string }) {
  const [aspectRatio, setAspectRatio] = useState(16 / 9);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    Image.getSize(
      uri,
      (w, h) => {
        if (active && w > 0 && h > 0) setAspectRatio(w / h);
      },
      () => {
        if (active) setFailed(true);
      },
    );
    return () => {
      active = false;
    };
  }, [uri]);

  if (failed) return null;

  return (
    <Image
      source={{ uri }}
      style={[styles.contentImage, { aspectRatio }]}
      resizeMode="cover"
    />
  );
}

export default function NewsDetailScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const route = useRoute<RouteProp<TheClubStackParamList, "NewsDetail">>();
  const { item } = route.params;

  const blocks = parseRichContent(item.content);

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 48 }}
    >
      <LinearGradient
        colors={[COLORS.primaryDark, COLORS.primary]}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          data-testid="button-back"
        >
          <Ionicons name="chevron-back" size={22} color="#fff" />
          <Text style={styles.backText}>News & Updates</Text>
        </TouchableOpacity>

        <View style={styles.iconWrap}>
          <Ionicons name="megaphone" size={30} color="#F59E0B" />
        </View>

        <Text style={styles.headerTitle}>{item.title}</Text>
      </LinearGradient>

      <View style={styles.card}>
        {blocks.map((block, bi) =>
          block.type === "image" ? (
            <ContentImage key={`img-${bi}`} uri={block.uri} />
          ) : (
            block.paragraphs.map((para, i) => (
              <Text key={`t-${bi}-${i}`} style={[styles.bodyText, styles.bodyPara]}>
                {para}
              </Text>
            ))
          ),
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    alignItems: "center",
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginBottom: 20,
    gap: 4,
  },
  backText: { fontSize: 15, color: "#fff", fontWeight: "600" },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    lineHeight: 26,
    paddingHorizontal: 8,
  },
  card: {
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: "#fff",
    borderRadius: BORDER_RADIUS.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bodyText: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 23 },
  bodyPara: { marginBottom: 14 },
  contentImage: {
    width: "100%",
    borderRadius: BORDER_RADIUS.md,
    marginBottom: 14,
    backgroundColor: COLORS.border,
  },
});
