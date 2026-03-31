import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery } from "@tanstack/react-query";
import { COLORS, BORDER_RADIUS } from "../../lib/theme";
import { fetchNews, stripHtml, NewsItem } from "../../lib/api";

export default function NewsUpdatesScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: news, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["/api/mobile/news"],
    queryFn: fetchNews,
  });

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          tintColor={COLORS.primary}
          colors={[COLORS.primary]}
        />
      }
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
          <Text style={styles.backText}>The Club</Text>
        </TouchableOpacity>
        <View style={styles.headerIconWrap}>
          <Ionicons name="newspaper" size={34} color="#F59E0B" />
        </View>
        <Text style={styles.headerTitle}>News & Updates</Text>
        <Text style={styles.headerSub}>Latest announcements from GSDCP</Text>
      </LinearGradient>

      {isLoading ? (
        <ActivityIndicator
          style={{ marginTop: 48 }}
          size="large"
          color={COLORS.primary}
        />
      ) : (
        <View style={styles.cardsWrap}>
          {(news ?? []).map((item: NewsItem) => {
            const isOpen = expandedId === item.id;
            const bodyText = stripHtml(item.content);
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.card}
                activeOpacity={0.85}
                onPress={() => setExpandedId(isOpen ? null : item.id)}
                data-testid={`card-news-${item.id}`}
              >
                <View style={styles.cardTop}>
                  <View style={styles.newsIconWrap}>
                    <Ionicons name="megaphone-outline" size={16} color={COLORS.accent} />
                  </View>
                  <Ionicons
                    name={isOpen ? "chevron-up" : "chevron-down"}
                    size={16}
                    color={COLORS.textMuted}
                  />
                </View>
                <Text style={styles.title}>{item.title}</Text>
                {isOpen && (
                  <View style={styles.body}>
                    {bodyText
                      .split("\n\n")
                      .map((para) => para.replace(/\n/g, " ").trim())
                      .filter((para) => para.length > 0)
                      .map((para, i, arr) => (
                        <Text
                          key={i}
                          style={[styles.bodyText, i < arr.length - 1 && styles.bodyPara]}
                        >
                          {para}
                        </Text>
                      ))}
                  </View>
                )}
                {!isOpen && (
                  <Text style={styles.bodyPreview} numberOfLines={2}>
                    {bodyText.replace(/\n/g, " ")}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 20, paddingBottom: 28, alignItems: "center" },
  backBtn: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", marginBottom: 20, gap: 4 },
  backText: { fontSize: 15, color: "#fff", fontWeight: "600" },
  headerIconWrap: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center", alignItems: "center", marginBottom: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#fff" },
  headerSub: { fontSize: 13, color: "rgba(255,255,255,0.65)", marginTop: 4 },
  cardsWrap: { paddingHorizontal: 16, marginTop: 20, gap: 12 },
  card: {
    backgroundColor: "#fff",
    borderRadius: BORDER_RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  newsIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: `${COLORS.accent}18`,
    justifyContent: "center",
    alignItems: "center",
  },
  title: { fontSize: 15, fontWeight: "700", color: COLORS.text, marginBottom: 6, lineHeight: 21 },
  body: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.border },
  bodyText: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 },
  bodyPara: { marginBottom: 10 },
  bodyPreview: { fontSize: 13, color: COLORS.textMuted, lineHeight: 19 },
});
