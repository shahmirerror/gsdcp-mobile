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
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import ErrorView from "../../components/ErrorView";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, BORDER_RADIUS } from "../../lib/theme";

import { fetchAbout, stripHtml } from "../../lib/api";

const logo = require("../../../assets/splash-logo.png");

export default function AboutGSDCPScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
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
            <Text style={styles.heroTitle}>About GSDCP</Text>
            <Text style={styles.heroSub}>
              Our history, mission and objectives
            </Text>
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
        <ErrorView message="Could not load content." onRetry={refetch} style={{ marginTop: 48 }} />
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
          <View style={styles.section}>
            <Text style={styles.body}>{content}</Text>
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
  heroSub: { fontSize: 14, color: "rgba(255,255,255,0.65)", marginTop: 6 },
  section: {
    marginHorizontal: 16,
    marginTop: 20,
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
