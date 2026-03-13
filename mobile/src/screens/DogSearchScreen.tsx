import { useState, useMemo } from "react";
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from "../lib/theme";
import { fetchDogs, Dog } from "../lib/api";
import { DogListItem } from "../components/DogListItem";
import type { DogsStackParamList } from "../navigation/AppNavigator";

type Nav = NativeStackNavigationProp<DogsStackParamList, "DogSearch">;

const genderFilters = ["All", "Male", "Female"] as const;

export default function DogSearchScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<any>();
  const initialQuery = route.params?.searchQuery || "";

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [genderFilter, setGenderFilter] = useState<string>("All");

  const { data: dogs, isLoading, isError } = useQuery<Dog[]>({
    queryKey: ["dogs"],
    queryFn: fetchDogs,
  });

  const filteredDogs = useMemo(() => {
    let results = dogs ?? [];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      results = results.filter(
        (dog) =>
          dog.dog_name.toLowerCase().includes(q) ||
          (dog.KP && dog.KP.toLowerCase().includes(q)) ||
          (dog.owner && dog.owner.toLowerCase().includes(q)) ||
          (dog.breeder && dog.breeder.toLowerCase().includes(q)) ||
          (dog.color && dog.color.toLowerCase().includes(q)) ||
          dog.titles.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (genderFilter !== "All") {
      results = results.filter((dog) => dog.sex === genderFilter);
    }
    return results;
  }, [dogs, searchQuery, genderFilter]);

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={COLORS.textMuted} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by name, KP, owner..."
          placeholderTextColor={COLORS.textMuted}
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterRow}>
        {genderFilters.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterBadge, genderFilter === filter && styles.filterBadgeActive]}
            onPress={() => setGenderFilter(filter)}
          >
            <Text style={[styles.filterText, genderFilter === filter && styles.filterTextActive]}>
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
        <Text style={styles.count}>
          {filteredDogs.length} {filteredDogs.length === 1 ? "dog" : "dogs"}
        </Text>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: SPACING.xxl }} />
      ) : isError ? (
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={48} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>Failed to load dogs</Text>
          <Text style={styles.emptyDesc}>Could not connect to the server. Please try again.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredDogs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <DogListItem
              dog={item}
              onPress={() =>
                navigation.navigate("DogProfile", { id: item.id, name: item.dog_name })
              }
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>No dogs found</Text>
              <Text style={styles.emptyDesc}>Try adjusting your search or filters.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    margin: SPACING.lg,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  filterBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterBadgeActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  filterTextActive: {
    color: "#fff",
  },
  count: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginLeft: "auto",
  },
  list: {
    padding: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 60,
    gap: SPACING.sm,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: "600",
    color: COLORS.text,
  },
  emptyDesc: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
    textAlign: "center",
    paddingHorizontal: SPACING.xxl,
  },
});
