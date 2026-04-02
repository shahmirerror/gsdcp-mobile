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
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, BORDER_RADIUS } from "../../lib/theme";
import { fetchAbout, stripHtml } from "../../lib/api";

export default function AboutGSDCPScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["/api/mobile/about"],
    queryFn: fetchAbout,
  });

  const content = data
    ? data.map((item) => stripHtml(item.content)).join("\n\n")
    : "";

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
            <Ionicons name="information-circle" size={34} color="#fff" />
          </View>
          <Text style={styles.heroTitle}>About GSDCP</Text>
          <Text style={styles.heroSub}>Our history, mission and objectives</Text>
        </View>
      </LinearGradient>

      {isLoading ? (
        <ActivityIndicator
          style={{ marginTop: 48 }}
          size="large"
          color={COLORS.primary}
        />
      ) : (
        <View style={styles.section}>
          <Text style={styles.body}>{content}</Text>
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
  section: {
    marginHorizontal: 16,
    marginTop: 24,
    backgroundColor: "#fff",
    borderRadius: BORDER_RADIUS.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  body: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 23,
  },
});
