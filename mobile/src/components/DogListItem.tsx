import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from "../lib/theme";
import type { Dog, DogOwner } from "../lib/api";
import LazyImage from "./LazyImage";

function hasImage(url: string | null): url is string {
  return !!url && url.length > 0;
}

interface DogListItemProps {
  dog: Dog;
  onPress: () => void;
  onOwnerPress?: (owner: DogOwner) => void;
}

export function DogListItem({ dog, onPress, onOwnerPress }: DogListItemProps) {
  const [ownerOpen, setOwnerOpen] = useState(false);

  const initials = (dog.dog_name || "")
    .trim()
    .split(" ")
    .filter((w) => w.length > 0)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

  const showImage = hasImage(dog.imageUrl);
  const titles = dog.titles || [];
  const owners = dog.owner && dog.owner.length > 0 ? dog.owner : [];

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      {showImage ? (
        <LazyImage source={{ uri: dog.imageUrl! }} style={styles.avatarImage} resizeMode="cover" />
      ) : (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{dog.dog_name}</Text>
        <Text style={styles.kp}>
          {dog.KP && dog.KP !== "0"
            ? `KP ${dog.KP}`
            : dog.foreign_reg_no
              ? dog.foreign_reg_no
              : "-"}
        </Text>
        {owners.length === 1 && (
          <TouchableOpacity
            style={styles.ownerRow}
            onPress={() => onOwnerPress?.(owners[0])}
            activeOpacity={0.7}
          >
            <Text style={styles.ownerLink} numberOfLines={1}>{owners[0].name}</Text>
            <Ionicons name="chevron-forward" size={11} color={COLORS.primary} />
          </TouchableOpacity>
        )}
        {owners.length > 1 && (
          <View>
            <TouchableOpacity
              style={styles.ownerRow}
              onPress={() => setOwnerOpen(!ownerOpen)}
              activeOpacity={0.7}
            >
              <Text style={styles.ownerLink}>{owners.length} owners</Text>
              <Ionicons
                name={ownerOpen ? "chevron-up" : "chevron-down"}
                size={11}
                color={COLORS.primary}
              />
            </TouchableOpacity>
            {ownerOpen && owners.map((o) => (
              <TouchableOpacity
                key={o.member_id}
                style={styles.ownerDropdownItem}
                onPress={() => onOwnerPress?.(o)}
                activeOpacity={0.7}
              >
                <Ionicons name="person-outline" size={11} color={COLORS.textMuted} />
                <Text style={styles.ownerDropdownText} numberOfLines={1}>{o.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {dog.microchip ? <Text style={styles.kp}>Microchip: {dog.microchip}</Text> : null}
        <View style={styles.badges}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{dog.sex}</Text>
          </View>
          {dog.color ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{dog.color}</Text>
            </View>
          ) : null}
          {dog.hair ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{dog.hair}</Text>
            </View>
          ) : null}
        </View>
      </View>
      {titles.length > 0 && (
        <View style={styles.titles}>
          {titles.slice(0, 2).map((t) => (
            <View key={t} style={styles.titleBadge}>
              <Text style={styles.titleBadgeText}>{t}</Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.md,
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.full,
    marginRight: SPACING.md,
    backgroundColor: "#E8F5E9",
  },
  avatarText: {
    color: COLORS.primary,
    fontWeight: "600",
    fontSize: FONT_SIZES.sm,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: FONT_SIZES.md,
    fontWeight: "600",
    color: COLORS.text,
  },
  kp: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  ownerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginTop: 1,
  },
  ownerLink: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    fontWeight: "600",
  },
  ownerDropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
    paddingLeft: 2,
  },
  ownerDropdownText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    flex: 1,
  },
  badges: {
    flexDirection: "row",
    gap: 6,
    marginTop: 4,
    flexWrap: "wrap",
  },
  badge: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  badgeText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text,
  },
  titles: {
    alignItems: "flex-end",
    gap: 4,
  },
  titleBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  titleBadgeText: {
    fontSize: FONT_SIZES.xs,
    color: "#fff",
    fontWeight: "500",
  },
});
