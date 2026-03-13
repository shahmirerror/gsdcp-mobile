import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from "../lib/theme";
import { fetchDogs, Dog } from "../lib/api";
import { DogListItem } from "../components/DogListItem";

const quickActions = [
  { label: "Search\nDogs", icon: "search" as const, tab: "DogsTab" },
  { label: "Breeders", icon: "people" as const, tab: "BreedersTab" },
  { label: "Shows", icon: "trophy" as const, tab: "ShowsTab" },
  { label: "Profile", icon: "person" as const, tab: "ProfileTab" },
];

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const { data: dogs, isLoading, isError } = useQuery<Dog[]>({
    queryKey: ["dogs"],
    queryFn: fetchDogs,
  });

  const featuredDogs = (dogs ?? []).slice(0, 5);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>German Shepherd Dog Club of Pakistan</Text>
      <Text style={styles.subtitle}>Welcome back to GSDCP</Text>

      <TouchableOpacity
        style={styles.searchBar}
        onPress={() => navigation.navigate("DogsTab")}
        activeOpacity={0.7}
      >
        <Ionicons name="search" size={18} color={COLORS.textMuted} />
        <Text style={styles.searchPlaceholder}>Search dogs, breeders, shows...</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActions}>
        {quickActions.map((action) => (
          <TouchableOpacity
            key={action.label}
            style={styles.quickAction}
            onPress={() => navigation.navigate(action.tab)}
            activeOpacity={0.7}
          >
            <View style={styles.quickActionIcon}>
              <Ionicons name={action.icon} size={22} color={COLORS.primary} />
            </View>
            <Text style={styles.quickActionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Featured Dogs</Text>
        <TouchableOpacity onPress={() => navigation.navigate("DogsTab")}>
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: SPACING.xl }} />
      ) : isError ? (
        <Text style={styles.errorText}>Could not load featured dogs.</Text>
      ) : (
        featuredDogs.map((dog) => (
          <DogListItem
            key={dog.id}
            dog={dog}
            onPress={() =>
              navigation.navigate("DogsTab", {
                screen: "DogProfile",
                params: { id: dog.id, name: dog.dog_name },
              })
            }
          />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: "700",
    color: COLORS.text,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginTop: 4,
    marginBottom: SPACING.lg,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.xl,
  },
  searchPlaceholder: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  seeAll: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: "500",
  },
  quickActions: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  quickAction: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.xs,
  },
  quickActionLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: "500",
    color: COLORS.text,
    textAlign: "center",
  },
  errorText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
    textAlign: "center",
    padding: SPACING.xl,
  },
});
