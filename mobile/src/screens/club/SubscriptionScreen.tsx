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
import { fetchFees, stripHtml } from "../../lib/api";

const PLANS = [
  {
    title: "Junior Member",
    subtitle: "Under 18 years",
    price: "Rs. 1,000",
    period: "per year",
    color: "#3B82F6",
    bg: "rgba(59,130,246,0.06)",
    border: "rgba(59,130,246,0.2)",
    features: ["Membership card", "Club newsletter", "Discounted show entry", "Vote at AGM (guardian)"],
  },
  {
    title: "Ordinary Member",
    subtitle: "Standard membership",
    price: "Rs. 3,000",
    period: "per year",
    color: COLORS.primary,
    bg: "rgba(15,92,58,0.06)",
    border: "rgba(15,92,58,0.2)",
    features: ["Membership card", "Club newsletter", "Show entry eligibility", "Vote at AGM", "Litter registration"],
    highlight: true,
  },
  {
    title: "Life Member",
    subtitle: "One-time payment",
    price: "Rs. 30,000",
    period: "one-time",
    color: COLORS.accent,
    bg: "rgba(199,164,92,0.08)",
    border: "rgba(199,164,92,0.3)",
    features: ["All Ordinary benefits", "Lifetime voting rights", "Priority show entry", "Free dog registration (1/yr)", "Honorary recognition"],
  },
];

export default function SubscriptionScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const { data: fees, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["/api/mobile/fees"],
    queryFn: fetchFees,
  });

  const paymentInfo = fees ? fees.map((f) => stripHtml(f.content)).join("\n\n") : "";

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
          <Ionicons name="card" size={34} color={COLORS.accent} />
        </View>
        <Text style={styles.headerTitle}>Subscription & Fees</Text>
        <Text style={styles.headerSub}>Membership types and fee structure</Text>
      </LinearGradient>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Membership Plans</Text>
      </View>

      <View style={styles.plansWrap}>
        {PLANS.map((plan) => (
          <View
            key={plan.title}
            style={[
              styles.planCard,
              { backgroundColor: plan.bg, borderColor: plan.border },
              plan.highlight && styles.planHighlight,
            ]}
          >
            {plan.highlight && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
              </View>
            )}
            <Text style={[styles.planTitle, { color: plan.color }]}>{plan.title}</Text>
            <Text style={styles.planSubtitle}>{plan.subtitle}</Text>
            <View style={styles.priceRow}>
              <Text style={[styles.planPrice, { color: plan.color }]}>{plan.price}</Text>
              <Text style={styles.planPeriod}> / {plan.period}</Text>
            </View>
            <View style={styles.divider} />
            {plan.features.map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={16} color={plan.color} />
                <Text style={styles.featureText}>{f}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>How to Pay</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginVertical: 24 }} size="small" color={COLORS.primary} />
      ) : (
        <View style={styles.paymentCard}>
          <View style={styles.paymentIconRow}>
            <Ionicons name="receipt-outline" size={20} color={COLORS.primary} />
            <Text style={styles.paymentTitle}>Payment Instructions</Text>
          </View>
          <Text style={styles.paymentBody}>{paymentInfo}</Text>
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
  backBtn: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", marginBottom: 20, gap: 4 },
  backText: { fontSize: 15, color: "#fff", fontWeight: "600" },
  headerIconWrap: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center", alignItems: "center", marginBottom: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#fff" },
  headerSub: { fontSize: 13, color: "rgba(255,255,255,0.65)", marginTop: 4 },
  sectionHeader: {
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: COLORS.text },
  plansWrap: { paddingHorizontal: 16, gap: 12 },
  planCard: {
    borderRadius: BORDER_RADIUS.lg,
    padding: 18,
    borderWidth: 1.5,
    position: "relative",
  },
  planHighlight: { borderWidth: 2 },
  popularBadge: {
    position: "absolute",
    top: -10,
    right: 16,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  popularBadgeText: { fontSize: 9, fontWeight: "800", color: "#fff", letterSpacing: 0.5 },
  planTitle: { fontSize: 17, fontWeight: "800" },
  planSubtitle: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  priceRow: { flexDirection: "row", alignItems: "baseline", marginTop: 8 },
  planPrice: { fontSize: 22, fontWeight: "800" },
  planPeriod: { fontSize: 13, color: COLORS.textMuted },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 12 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  featureText: { fontSize: 13, color: COLORS.textSecondary },
  paymentCard: {
    marginHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
  },
  paymentIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  paymentTitle: { fontSize: 14, fontWeight: "700", color: COLORS.primaryDark },
  paymentBody: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 21,
  },
});
