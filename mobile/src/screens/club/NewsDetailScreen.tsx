import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, BORDER_RADIUS } from "../../lib/theme";
import { stripHtml } from "../../lib/api";
import { TheClubStackParamList } from "../../navigation/AppNavigator";

export default function NewsDetailScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const route = useRoute<RouteProp<TheClubStackParamList, "NewsDetail">>();
  const { item } = route.params;

  const paragraphs = stripHtml(item.content)
    .split("\n\n")
    .map((p) => p.replace(/\n/g, " ").trim())
    .filter((p) => p.length > 0);

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
        {paragraphs.map((para, i) => (
          <Text
            key={i}
            style={[styles.bodyText, i < paragraphs.length - 1 && styles.bodyPara]}
          >
            {para}
          </Text>
        ))}
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
});
