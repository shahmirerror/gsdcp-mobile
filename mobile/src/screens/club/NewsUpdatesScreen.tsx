import {
  ScrollView,
  View,
  Text,
  Image,
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
import ErrorView from "../../components/ErrorView";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, BORDER_RADIUS } from "../../lib/theme";
import { fetchNews, stripHtml, NewsItem } from "../../lib/api";
import type { TheClubStackParamList } from "../../navigation/AppNavigator";

const logo = require("../../../assets/splash-logo.png");

type Nav = NativeStackNavigationProp<TheClubStackParamList>;

export default function NewsUpdatesScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();

  const {
    data: news,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
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
        colors={["#0F5C3A", "#083A24"]}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.headerRow}>
          <View
            style={[
              styles.logoBanner,
              { marginTop: -(insets.top + 16), paddingTop: insets.top + 16 },
            ]}
          >
            <Image source={logo} style={styles.logoImg} resizeMode="contain" />
          </View>
          <View style={styles.headerContent}>
            <Text style={styles.heroTitle}>News & Updates</Text>
            <Text style={styles.heroSub}>Latest announcements from GSDCP</Text>
          </View>
        </View>
      </LinearGradient>

      {isLoading ? (
        <ActivityIndicator
          style={{ marginTop: 48 }}
          size="large"
          color={COLORS.primary}
        />
      ) : isError ? (
        <ErrorView message="Could not load news." onRetry={refetch} style={{ marginTop: 48 }} />
      ) : (
        <>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            data-testid="button-back"
          >
            <Ionicons
              name="chevron-back"
              size={16}
              color="rgba(0,0,0,0)"
            />
            <Text style={styles.backText}>The Club</Text>
          </TouchableOpacity>
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
                      <Ionicons
                        name="megaphone-outline"
                        size={16}
                        color={COLORS.accent}
                      />
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={COLORS.textMuted}
                    />
                  </View>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.bodyPreview} numberOfLines={2}>
                    {preview}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: { flexDirection: "row", alignItems: "stretch", gap: 14 },
  logoBanner: {
    width: 60,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    backgroundColor: "rgba(255,255,255,255)",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 12,
  },
  logoImg: { width: 55, height: 55 },
  headerContent: { flex: 1, justifyContent: "center" },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 16,
    paddingLeft: 20,
  },
  backText: {
    fontSize: 13,
    color: "rgba(0,0,0,0)",
    fontWeight: "600",
  },
  heroTitle: { fontSize: 28, fontWeight: "800", color: "#fff" },
  heroSub: { fontSize: 14, color: "rgba(255,255,255,0.65)", marginTop: 4 },
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
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 6,
    lineHeight: 21,
  },
  bodyPreview: { fontSize: 13, color: COLORS.textMuted, lineHeight: 19 },
});
