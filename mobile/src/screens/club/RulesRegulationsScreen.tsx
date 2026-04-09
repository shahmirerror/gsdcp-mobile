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
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, BORDER_RADIUS } from "../../lib/theme";
import { fetchRules, stripHtml, RuleItem } from "../../lib/api";

const logo = require("../../../assets/logo-square.png");

export default function RulesRegulationsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const {
    data: rules,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["/api/mobile/rules"],
    queryFn: fetchRules,
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
            <Text style={styles.heroTitle}>Rules & Regulations</Text>
            <Text style={styles.heroSub}>Club constitution and bylaws</Text>
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

      {isLoading ? (
        <ActivityIndicator
          style={{ marginTop: 48 }}
          size="large"
          color={COLORS.primary}
        />
      ) : (
        <>
          <View style={styles.noteCard}>
            <Ionicons
              name="information-circle-outline"
              size={18}
              color="#3B82F6"
            />
            <Text style={styles.noteText}>
              Tap any section to expand its full content.
            </Text>
          </View>

          <View style={styles.chaptersWrap}>
            {(rules ?? []).map((rule: RuleItem, index: number) => {
              const isOpen = expandedId === rule.id;
              return (
                <TouchableOpacity
                  key={rule.id}
                  style={[styles.chapterCard, isOpen && styles.chapterCardOpen]}
                  onPress={() => setExpandedId(isOpen ? null : rule.id)}
                  activeOpacity={0.8}
                  data-testid={`chapter-${rule.id}`}
                >
                  <View style={styles.chapterHeader}>
                    <View style={styles.chapterNumWrap}>
                      <Text style={styles.chapterNum}>{index + 1}</Text>
                    </View>
                    <Text
                      style={styles.chapterTitle}
                      numberOfLines={isOpen ? undefined : 1}
                    >
                      {rule.rule_name}
                    </Text>
                    <Ionicons
                      name={isOpen ? "chevron-up" : "chevron-down"}
                      size={18}
                      color={COLORS.textMuted}
                    />
                  </View>
                  {isOpen && (
                    <View style={styles.chapterBody}>
                      {stripHtml(rule.content)
                        .split("\n\n")
                        .map((para) => para.replace(/\n/g, " ").trim())
                        .filter((para) => para.length > 0)
                        .map((para, i, arr) => (
                          <Text
                            key={i}
                            style={[
                              styles.chapterBodyText,
                              i < arr.length - 1 && styles.chapterBodyPara,
                            ]}
                          >
                            {para}
                          </Text>
                        ))}
                    </View>
                  )}
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
  noteCard: {
    marginHorizontal: 16,
    marginTop: 20,
    flexDirection: "row",
    gap: 10,
    backgroundColor: "rgba(59,130,246,0.06)",
    borderRadius: BORDER_RADIUS.md,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.15)",
    alignItems: "flex-start",
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  chaptersWrap: { paddingHorizontal: 16, marginTop: 16, gap: 8 },
  chapterCard: {
    backgroundColor: "#fff",
    borderRadius: BORDER_RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chapterCardOpen: {
    borderColor: "rgba(15,92,58,0.3)",
  },
  chapterHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  chapterNumWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(15,92,58,0.08)",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  chapterNum: { fontSize: 12, fontWeight: "800", color: COLORS.primary },
  chapterTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },
  chapterBody: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  chapterBodyText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 21,
  },
  chapterBodyPara: { marginBottom: 10 },
});
