import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { COLORS, BORDER_RADIUS, SPACING } from "../lib/theme";
import BottomSheetModal from "./BottomSheetModal";
import { CalendarDatePicker } from "./CalendarDatePicker";
import {
  fetchMembersPage,
  submitOwnershipChange,
  OwnershipChangeType,
  Member,
} from "../lib/api";

interface TransferDog {
  id: string;
  dog_name: string;
  KP?: string | null;
  foreign_reg_no?: string | null;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  dog: TransferDog | null;
  userId: string;
  onSuccess?: () => void;
}

export default function TransferDogModal({ visible, onClose, dog, userId, onSuccess }: Props) {
  const [transferType, setTransferType] = useState<OwnershipChangeType | "">("");
  const [memberSearch, setMemberSearch] = useState("");
  const [debouncedMemberSearch, setDebouncedMemberSearch] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<Member[]>([]);
  const [memberSearchFocused, setMemberSearchFocused] = useState(false);
  const memberBlurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedMemberSearch(memberSearch.trim()), 350);
    return () => clearTimeout(t);
  }, [memberSearch]);

  const needsMember = transferType === "Transfer Ownership" || transferType === "Lease Ownership";
  const isLease = transferType === "Lease Ownership";

  const { data: membersData, isLoading: membersLoading } = useQuery({
    queryKey: ["members-search-modal", debouncedMemberSearch],
    queryFn: () => fetchMembersPage(1, { q: debouncedMemberSearch || undefined }),
    enabled: visible && needsMember,
    staleTime: 30_000,
  });
  const memberResults: Member[] = membersData?.data ?? [];

  const resetForm = () => {
    setTransferType("");
    setMemberSearch("");
    setDebouncedMemberSearch("");
    setSelectedMembers([]);
    setMemberSearchFocused(false);
    setDateFrom("");
    setDateTo("");
    setSubmitError(null);
    if (memberBlurTimer.current) clearTimeout(memberBlurTimer.current);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const toggleMember = (m: Member) => {
    setSelectedMembers((prev) =>
      prev.some((s) => s.id === m.id) ? prev.filter((s) => s.id !== m.id) : [...prev, m]
    );
    if (memberBlurTimer.current) clearTimeout(memberBlurTimer.current);
    setMemberSearchFocused(false);
    setMemberSearch("");
    setDebouncedMemberSearch("");
  };

  const isSubmitDisabled =
    !transferType ||
    (needsMember && selectedMembers.length === 0) ||
    (isLease && (!dateFrom || !dateTo)) ||
    isSubmitting;

  const handleSubmit = async () => {
    if (!dog || !transferType || isSubmitDisabled) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await submitOwnershipChange({
        dog_id: dog.id,
        user_id: userId,
        transfer_type: transferType as OwnershipChangeType,
        chosern_users: selectedMembers.map((m) => m.id),
        ...(isLease && dateFrom ? { date_from: dateFrom } : {}),
        ...(isLease && dateTo   ? { date_to:   dateTo   } : {}),
      });
      handleClose();
      onSuccess?.();
      Alert.alert("Request Submitted", "Your ownership change request has been submitted for review.");
    } catch (e: any) {
      setSubmitError(e?.message ?? "Submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const initials = dog
    ? (dog.dog_name || "")
        .trim().split(" ").filter((w) => w.length > 0)
        .map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?"
    : "?";

  const kpLabel = dog
    ? (dog.KP && dog.KP !== "0" ? `KP ${dog.KP}` : dog.foreign_reg_no || "—")
    : "";

  return (
    <BottomSheetModal visible={visible} onClose={handleClose} maxHeight="92%">
      <ScrollView
        style={{ paddingHorizontal: 24 }}
        contentContainerStyle={{ paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Dog header */}
        {dog && (
          <View style={s.dogHeader}>
            <View style={s.dogAvatar}>
              <Text style={s.dogAvatarText}>{initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.dogName} numberOfLines={1}>{dog.dog_name}</Text>
              <Text style={s.dogKP}>{kpLabel}</Text>
            </View>
          </View>
        )}

        <View style={s.divider} />

        {/* Type selector */}
        <Text style={s.label}>Type</Text>
        <View style={s.typeRow}>
          {(["Transfer Ownership", "Lease Ownership", "Remove Ownership"] as OwnershipChangeType[]).map((t) => (
            <TouchableOpacity
              key={t}
              style={[s.typeOption, transferType === t && s.typeOptionActive]}
              onPress={() => {
                setTransferType(t);
                setSelectedMembers([]);
                setMemberSearch("");
                setDateFrom("");
                setDateTo("");
              }}
              activeOpacity={0.75}
            >
              <Text style={[s.typeOptionText, transferType === t && s.typeOptionTextActive]}>
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Member search */}
        {needsMember && (
          <>
            <Text style={s.label}>
              {transferType === "Transfer Ownership" ? "Transfer To" : "Lease To"}
            </Text>
            {selectedMembers.length > 0 && (
              <View style={s.selectedChips}>
                {selectedMembers.map((m) => (
                  <View key={m.id} style={s.selectedMember}>
                    <Ionicons name="person-circle-outline" size={16} color={COLORS.primary} />
                    <Text style={s.selectedMemberText} numberOfLines={1}>
                      {m.member_name}{m.membership_no ? ` — ${m.membership_no}` : ""}
                    </Text>
                    <TouchableOpacity onPress={() => toggleMember(m)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                      <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
            <View style={s.searchBox}>
              <Ionicons name="search" size={15} color={COLORS.textMuted} />
              <TextInput
                style={s.searchInput}
                value={memberSearch}
                onChangeText={setMemberSearch}
                placeholder="Search member by name or ID…"
                placeholderTextColor={COLORS.textMuted}
                autoCorrect={false}
                onFocus={() => {
                  if (memberBlurTimer.current) clearTimeout(memberBlurTimer.current);
                  setMemberSearchFocused(true);
                }}
                onBlur={() => {
                  memberBlurTimer.current = setTimeout(() => setMemberSearchFocused(false), 150);
                }}
              />
              {memberSearch.length > 0 && (
                <TouchableOpacity onPress={() => setMemberSearch("")} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                  <Ionicons name="close-circle" size={15} color={COLORS.textMuted} />
                </TouchableOpacity>
              )}
            </View>
            {memberSearchFocused && (membersLoading ? (
              <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 12 }} />
            ) : memberResults.length === 0 && debouncedMemberSearch.length > 0 ? (
              <Text style={s.noResults}>No members found</Text>
            ) : memberResults.length > 0 ? (
              <View style={s.memberList}>
                {memberResults.slice(0, 8).map((m) => {
                  const isSelected = selectedMembers.some((sel) => sel.id === m.id);
                  return (
                    <TouchableOpacity
                      key={m.id}
                      style={[s.memberRow, isSelected && s.memberRowActive]}
                      onPressIn={() => { if (memberBlurTimer.current) clearTimeout(memberBlurTimer.current); }}
                      onPress={() => toggleMember(m)}
                      activeOpacity={0.75}
                    >
                      <View style={s.memberAvatar}>
                        <Text style={s.memberAvatarText}>
                          {(m.member_name || "?").trim().split(" ")
                            .filter((w) => w.length > 0).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?"}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.memberName} numberOfLines={1}>{m.member_name}</Text>
                        {(m.membership_no || m.city) && (
                          <Text style={s.memberMeta} numberOfLines={1}>
                            {[m.membership_no, m.city].filter(Boolean).join(" · ")}
                          </Text>
                        )}
                      </View>
                      {isSelected
                        ? <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                        : <Ionicons name="ellipse-outline" size={20} color={COLORS.border} />
                      }
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : null)}
          </>
        )}

        {/* Lease date range */}
        {isLease && (
          <>
            <CalendarDatePicker
              label="Date From"
              required
              value={dateFrom}
              onChange={setDateFrom}
              minDate={new Date()}
              maxDate={new Date(2100, 0, 1)}
            />
            <CalendarDatePicker
              label="Date To"
              required
              value={dateTo}
              onChange={setDateTo}
              minDate={new Date()}
              maxDate={new Date(2100, 0, 1)}
            />
          </>
        )}

        {submitError && (
          <Text style={s.error}>{submitError}</Text>
        )}

        <TouchableOpacity
          style={[s.submitBtn, isSubmitDisabled && s.submitDisabled]}
          activeOpacity={0.85}
          onPress={handleSubmit}
          disabled={isSubmitDisabled}
        >
          {isSubmitting
            ? <ActivityIndicator size="small" color="#fff" />
            : <>
                <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
                <Text style={s.submitBtnText}>Confirm</Text>
              </>
          }
        </TouchableOpacity>
      </ScrollView>
    </BottomSheetModal>
  );
}

const FONT_SM = 13;
const FONT_XS = 11;

const s = StyleSheet.create({
  dogHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  dogAvatar: {
    width: 48, height: 48, borderRadius: BORDER_RADIUS.md,
    backgroundColor: "#E8F5E9", justifyContent: "center", alignItems: "center", flexShrink: 0,
  },
  dogAvatarText: { color: COLORS.primary, fontWeight: "700", fontSize: 16 },
  dogName: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  dogKP: { fontSize: FONT_SM, color: COLORS.textSecondary, marginTop: 2 },
  divider: { height: 1, backgroundColor: COLORS.border, marginBottom: 14 },
  label: {
    fontSize: 12, fontWeight: "700", color: COLORS.textSecondary,
    textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10, marginTop: 16,
  },
  typeRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  typeOption: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: BORDER_RADIUS.full,
    borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.surface,
  },
  typeOptionActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  typeOptionText: { fontSize: FONT_SM, fontWeight: "600", color: COLORS.text },
  typeOptionTextActive: { color: "#fff" },
  selectedChips: { gap: 6, marginBottom: 10 },
  selectedMember: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "rgba(15,92,58,0.06)", borderWidth: 1,
    borderColor: "rgba(15,92,58,0.2)", borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  selectedMemberText: { flex: 1, fontSize: FONT_SM, fontWeight: "600", color: COLORS.primary },
  searchBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 12, marginBottom: 8,
  },
  searchInput: { flex: 1, height: 40, fontSize: FONT_SM, color: COLORS.text },
  noResults: { fontSize: FONT_SM, color: COLORS.textMuted, textAlign: "center", marginVertical: 12 },
  memberList: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.md,
    overflow: "hidden", marginBottom: 4,
  },
  memberRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: "#fff",
  },
  memberRowActive: { backgroundColor: "rgba(15,92,58,0.05)" },
  memberAvatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: "#E8F5E9",
    justifyContent: "center", alignItems: "center", flexShrink: 0,
  },
  memberAvatarText: { color: COLORS.primary, fontWeight: "700", fontSize: 12 },
  memberName: { fontSize: FONT_SM, fontWeight: "600", color: COLORS.text },
  memberMeta: { fontSize: FONT_XS, color: COLORS.textMuted, marginTop: 1 },
  error: { fontSize: FONT_SM, color: "#DC2626", textAlign: "center", marginTop: 10, marginBottom: 2 },
  submitBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md,
    paddingVertical: 14, marginTop: 18,
  },
  submitBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  submitDisabled: { opacity: 0.45 },
});
