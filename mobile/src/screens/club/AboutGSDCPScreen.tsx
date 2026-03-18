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
import { LinearGradient } from "expo-linear-gradient";
import { useQuery } from "@tanstack/react-query";
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
          <Ionicons name="information-circle" size={34} color={COLORS.accent} />
        </View>
        <Text style={styles.headerTitle}>About GSDCP</Text>
        <Text style={styles.headerSub}>Our history, mission and objectives</Text>
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
  headerIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#fff" },
  headerSub: { fontSize: 13, color: "rgba(255,255,255,0.65)", marginTop: 4 },
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
