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
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          data-testid="button-back"
        >
          <Ionicons name="chevron-back" size={22} color={COLORS.primary} />
          <Text style={styles.backText}>The Club</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.headerIconWrap}>
            <Ionicons name="information-circle" size={26} color={COLORS.primary} />
          </View>
          <View>
            <Text style={styles.headerTitle}>About GSDCP</Text>
            <Text style={styles.headerSub}>Our history, mission and objectives</Text>
          </View>
        </View>
      </View>

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
    backgroundColor: COLORS.surface,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 16 },
  backText: { fontSize: 15, color: COLORS.primary, fontWeight: "600" },
  headerContent: { flexDirection: "row", alignItems: "center", gap: 14 },
  headerIconWrap: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: "rgba(15,92,58,0.1)",
    justifyContent: "center", alignItems: "center",
  },
  headerTitle: { fontSize: 20, fontWeight: "800", color: COLORS.text },
  headerSub: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
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
