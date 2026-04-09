import {
  ScrollView,
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, BORDER_RADIUS } from "../../lib/theme";
import { fetchFees, FeeItem } from "../../lib/api";

const logo = require("../../../assets/logo-square.png");

const FEE_CATEGORIES: {
  key: string;
  label: string;
  icon: string;
  names: string[];
}[] = [
  {
    key: "membership",
    label: "Membership Fee",
    icon: "person-add-outline",
    names: ["membership_fee", "membership_renewal_fee"],
  },
  {
    key: "litter",
    label: "Litter Registration Fee",
    icon: "paw-outline",
    names: ["litter_fee", "puppy_fees"],
  },
  {
    key: "inspection",
    label: "Litter Inspection Fee",
    icon: "search-outline",
    names: [
      "inspection_charges_within_city",
      "inspection_charges_outside_city",
      "second_inspection_charges_within_city",
      "second_inspection_charges_outside_city",
    ],
  },
  {
    key: "dog",
    label: "Dog Registration Fee",
    icon: "document-text-outline",
    names: ["dog_registration_kp", "single_dog_reg_fee", "pedigree_fee"],
  },
  {
    key: "show",
    label: "Other Services",
    icon: "ribbon-outline",
    names: ["breed_survey_fee", "endurance_test", "online_stud_fee"],
  },
];

function formatAmount(value: string): string {
  const num = parseInt(value, 10);
  if (isNaN(num)) return value;
  return `Rs. ${num.toLocaleString("en-PK")}`;
}

export default function SubscriptionScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [popupText, setPopupText] = useState<string | null>(null);

  const {
    data: fees,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["/api/mobile/fees"],
    queryFn: fetchFees,
  });

  return (
    <>
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
              <Image
                source={logo}
                style={styles.logoImg}
                resizeMode="contain"
              />
            </View>
            <View style={styles.headerContent}>
              <Text style={styles.heroTitle}>Subscription & Fees</Text>
              <Text style={styles.heroSub}>
                Membership types and fee structure
              </Text>
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => navigation.goBack()}
                data-testid="button-back"
              >
                <Ionicons
                  name="chevron-back"
                  size={16}
                  color="rgba(255,255,255,0.75)"
                />
                <Text style={styles.backText}>The Club</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Service Fees</Text>
        </View>

        {isLoading ? (
          <ActivityIndicator
            style={{ marginVertical: 24 }}
            size="small"
            color={COLORS.primary}
          />
        ) : (
          <View style={styles.categoriesWrap}>
            {FEE_CATEGORIES.map((cat) => {
              const catFees = (fees ?? []).filter((f: FeeItem) =>
                cat.names.includes(f.option_name),
              );
              if (catFees.length === 0) return null;
              return (
                <View key={cat.key} style={styles.categoryBlock}>
                  <View style={styles.categoryHeader}>
                    <Ionicons
                      name={cat.icon as any}
                      size={15}
                      color={COLORS.primary}
                    />
                    <Text style={styles.categoryLabel}>{cat.label}</Text>
                  </View>
                  <View style={styles.feesCard}>
                    {catFees.map((fee: FeeItem, i: number) => (
                      <View
                        key={fee.id}
                        style={[
                          styles.feeRow,
                          i < catFees.length - 1 && styles.feeRowBorder,
                        ]}
                        data-testid={`row-fee-${fee.id}`}
                      >
                        <View style={styles.feeLabelRow}>
                          <Text style={styles.feeLabel}>
                            {fee.remarks ?? fee.option_name}
                          </Text>
                          {fee.explanation ? (
                            <TouchableOpacity
                              onPress={() => setPopupText(fee.explanation)}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              data-testid={`button-info-fee-${fee.id}`}
                            >
                              <Ionicons
                                name="information-circle-outline"
                                size={16}
                                color={COLORS.textMuted}
                              />
                            </TouchableOpacity>
                          ) : null}
                        </View>
                        <Text style={styles.feeAmount}>
                          {formatAmount(fee.option_value)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.noteCard}>
          <Ionicons
            name="information-circle-outline"
            size={18}
            color={COLORS.primary}
          />
          <Text style={styles.noteText}>
            All fees are subject to revision by the executive committee. Contact
            the GSDCP office for the most current rates.
          </Text>
        </View>
      </ScrollView>

      <Modal
        visible={popupText !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPopupText(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setPopupText(null)}
        >
          <Pressable style={styles.modalBox} onPress={() => {}}>
            <View style={styles.modalIconRow}>
              <Ionicons
                name="information-circle"
                size={22}
                color={COLORS.primary}
              />
              <Text style={styles.modalTitle}>Note</Text>
            </View>
            <Text style={styles.modalBody}>{popupText}</Text>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setPopupText(null)}
              data-testid="button-close-info-modal"
            >
              <Text style={styles.modalCloseText}>Got it</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
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
  logoImg: { width: 42, height: 42 },
  headerContent: { flex: 1, justifyContent: "center" },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
  },
  backText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    fontWeight: "600",
  },
  heroTitle: { fontSize: 22, fontWeight: "800", color: "#fff" },
  heroSub: { fontSize: 13, color: "rgba(255,255,255,0.65)", marginTop: 4 },
  sectionHeader: { paddingHorizontal: 16, marginTop: 24, marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: COLORS.text },
  categoriesWrap: { paddingHorizontal: 16, gap: 20 },
  categoryBlock: { gap: 6 },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 2,
    marginBottom: 2,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primary,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  feesCard: {
    backgroundColor: "#fff",
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  feeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 16,
    gap: 8,
  },
  feeRowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  feeLabelRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginRight: 8,
  },
  feeLabel: { fontSize: 14, color: COLORS.text, flexShrink: 1 },
  feeAmount: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primaryDark,
    flexShrink: 0,
  },
  noteCard: {
    marginHorizontal: 16,
    marginTop: 20,
    flexDirection: "row",
    gap: 10,
    backgroundColor: "rgba(15,92,58,0.06)",
    borderRadius: BORDER_RADIUS.md,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(15,92,58,0.15)",
    alignItems: "flex-start",
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  modalBox: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 340,
  },
  modalIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.primaryDark,
  },
  modalBody: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: 20,
  },
  modalClose: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  modalCloseText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
});
