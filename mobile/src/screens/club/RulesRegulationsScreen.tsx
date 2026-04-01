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
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { COLORS, BORDER_RADIUS } from "../../lib/theme";
import { fetchRules, stripHtml, RuleItem } from "../../lib/api";

export default function RulesRegulationsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: rules, isLoading, refetch, isRefetching } = useQuery({
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
            <Ionicons name="document-text" size={26} color="#3B82F6" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Rules & Regulations</Text>
            <Text style={styles.headerSub}>Club constitution and bylaws</Text>
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
        <>
          <View style={styles.noteCard}>
            <Ionicons name="information-circle-outline" size={18} color="#3B82F6" />
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
                    <Text style={styles.chapterTitle} numberOfLines={isOpen ? undefined : 1}>
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
                            style={[styles.chapterBodyText, i < arr.length - 1 && styles.chapterBodyPara]}
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
    backgroundColor: "rgba(59,130,246,0.08)",
    justifyContent: "center", alignItems: "center",
  },
  headerTitle: { fontSize: 20, fontWeight: "800", color: COLORS.text },
  headerSub: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
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
  noteText: { flex: 1, fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
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
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: "rgba(15,92,58,0.08)",
    justifyContent: "center", alignItems: "center",
    flexShrink: 0,
  },
  chapterNum: { fontSize: 12, fontWeight: "800", color: COLORS.primary },
  chapterTitle: { flex: 1, fontSize: 14, fontWeight: "700", color: COLORS.text },
  chapterBody: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  chapterBodyText: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 21 },
  chapterBodyPara: { marginBottom: 10 },
});
