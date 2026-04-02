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
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, BORDER_RADIUS } from "../../lib/theme";
import { fetchNews, stripHtml, NewsItem } from "../../lib/api";
import type { TheClubStackParamList } from "../../navigation/AppNavigator";

type Nav = NativeStackNavigationProp<TheClubStackParamList>;

export default function NewsUpdatesScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();

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
      <LinearGradient colors={["#0F5C3A", "#083A24"]} style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          data-testid="button-back"
        >
          <Ionicons name="chevron-back" size={20} color="rgba(255,255,255,0.85)" />
          <Text style={styles.backText}>The Club</Text>
        </TouchableOpacity>
        <View style={styles.heroCenter}>
          <View style={styles.heroIconWrap}>
            <Ionicons name="newspaper" size={34} color="#fff" />
          </View>
          <Text style={styles.heroTitle}>News & Updates</Text>
          <Text style={styles.heroSub}>Latest announcements from GSDCP</Text>
        </View>
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
            const preview = stripHtml(item.content).replace(/\n/g, " ");
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.card}
                activeOpacity={0.85}
                onPress={() => navigation.navigate("NewsDetail", { item })}
                data-testid={`card-news-${item.id}`}
              >
                <View style={styles.cardTop}>
                  <View style={styles.newsIconWrap}>
                    <Ionicons name="megaphone-outline" size={16} color={COLORS.accent} />
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
                </View>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.bodyPreview} numberOfLines={2}>
                  {preview}
                </Text>
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
  header: { paddingHorizontal: 20, paddingBottom: 32 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 20 },
  backText: { fontSize: 15, color: "rgba(255,255,255,0.85)", fontWeight: "600" },
  heroCenter: { alignItems: "center" },
  heroIconWrap: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center", alignItems: "center", marginBottom: 14,
  },
  heroTitle: { fontSize: 24, fontWeight: "800", color: "#fff", textAlign: "center" },
  heroSub: { fontSize: 13, color: "rgba(255,255,255,0.65)", textAlign: "center", marginTop: 6 },
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
  bodyPreview: { fontSize: 13, color: COLORS.textMuted, lineHeight: 19 },
});
