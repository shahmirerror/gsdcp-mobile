import { useMemo, useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COUNTRIES, Country } from "../lib/countries";
import { COLORS, FONT_SIZES, BORDER_RADIUS, SPACING } from "../lib/theme";

interface Props {
  visible: boolean;
  selectedIso?: string;
  onSelect: (country: Country) => void;
  onClose: () => void;
}

export default function CountryPickerModal({
  visible,
  selectedIso,
  onSelect,
  onClose,
}: Props) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");

  const data = useMemo(() => {
    const t = query.trim().toLowerCase();
    if (!t) return COUNTRIES;
    const digits = t.replace(/[^\d]/g, "");
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(t) ||
        c.iso2.toLowerCase().includes(t) ||
        (digits.length > 0 && c.dialCode.includes(digits)),
    );
  }, [query]);

  const handleClose = () => {
    setQuery("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Country</Text>
            <TouchableOpacity
              onPress={handleClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              data-testid="btn-close-country-picker"
            >
              <Ionicons name="close" size={22} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchWrap}>
            <Ionicons
              name="search-outline"
              size={16}
              color={COLORS.textMuted}
              style={{ marginRight: 6 }}
            />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Search country or code…"
              placeholderTextColor={COLORS.textMuted}
              autoCorrect={false}
              autoCapitalize="none"
              autoFocus
            />
            {query.length > 0 && (
              <TouchableOpacity
                onPress={() => setQuery("")}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={data}
            keyExtractor={(c) => c.iso2}
            keyboardShouldPersistTaps="handled"
            style={styles.list}
            initialNumToRender={20}
            ListEmptyComponent={
              <Text style={styles.empty}>No countries match “{query}”.</Text>
            }
            renderItem={({ item }) => {
              const active = item.iso2 === selectedIso;
              return (
                <TouchableOpacity
                  style={[styles.row, active && styles.rowActive]}
                  activeOpacity={0.7}
                  onPress={() => {
                    onSelect(item);
                    handleClose();
                  }}
                >
                  <View style={styles.isoBadge}>
                    <Text style={styles.isoText}>{item.iso2}</Text>
                  </View>
                  <Text
                    style={[styles.name, active && styles.nameActive]}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                  <Text style={styles.dial}>{item.dialCode}</Text>
                  {active && (
                    <Ionicons
                      name="checkmark"
                      size={18}
                      color={COLORS.primary}
                      style={{ marginLeft: 8 }}
                    />
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: "800",
    color: COLORS.text,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    paddingVertical: 0,
  },
  list: {
    marginTop: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(15,92,58,0.06)",
  },
  rowActive: {
    backgroundColor: "rgba(15,92,58,0.05)",
    borderRadius: BORDER_RADIUS.sm,
  },
  isoBadge: {
    width: 34,
    height: 26,
    borderRadius: 6,
    backgroundColor: "rgba(15,92,58,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  isoText: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  name: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  nameActive: {
    fontWeight: "700",
    color: COLORS.primary,
  },
  dial: {
    fontSize: FONT_SIZES.md,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  empty: {
    textAlign: "center",
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.sm,
    paddingVertical: 24,
  },
});
