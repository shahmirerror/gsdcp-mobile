import { useState, useEffect, useRef, createElement } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ImageBackground,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Platform,
  Modal,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from "../lib/theme";
import { formatDate } from "../lib/dateUtils";
import {
  fetchMemberDetail, Member, MemberDetail, MemberOwnedDog, MemberKennel, Dog,
  fetchStudCertificates, fetchStudCertificateDetail, submitStudCertificate,
  StudCertificate, StudCertificateDetail,
  fetchLitterInspections, fetchLitterInspectionDetail, submitLitterInspection,
  checkLitterCertificate, CertificateCheck,
  LitterInspection, LitterInspectionDetail,
  fetchLitterRegistrations, fetchLitterRegistrationDetail, submitLitterRegistration,
  checkLitterInspection, LitterInspectionCheck,
  LitterRegistration, LitterRegistrationDetail, LitterRegStats, LitterPuppy,
  searchDogs, DogSearchResult,
  verifySire, verifyDam, SireVerification,
  updateProfile, uploadProfilePhoto, fetchCities, City, fetchProfileShow,
  submitHDEDRegistration,
  fetchHDEDRequests, HDEDRequest,
  fetchSingleDogRegistrations, submitSingleDogRegistration, SingleDogRegistration,
} from "../lib/api";
import { DogListItem } from "../components/DogListItem";
import { useAuth } from "../contexts/AuthContext";
import { Switch } from "react-native";
import LazyImage from "../components/LazyImage";

const heroBg = require("../../assets/hero-bg.jpg");

type TabId = "detail" | "kennel" | "dogs" | "stud" | "litter-inspection" | "litter-registration" | "hd-ed" | "single-dog-reg";

const TABS: { id: TabId; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: "detail",               label: "Detail",               icon: "person-outline"       },
  { id: "kennel",               label: "Kennel",               icon: "home-outline"         },
  { id: "dogs",                 label: "Dogs",                 icon: "paw-outline"          },
  { id: "stud",                 label: "Stud Certificates",    icon: "ribbon-outline"       },
  { id: "litter-inspection",    label: "Litter Inspections",   icon: "search-outline"       },
  { id: "litter-registration",  label: "Litter Registrations", icon: "document-text-outline" },
  { id: "hd-ed",                label: "HD/ED",                icon: "medkit-outline"       },
  { id: "single-dog-reg",       label: "Dog Registration",     icon: "add-circle-outline"   },
];

/* ── helpers ──────────────────────────────────────────── */
function getInitials(name: string): string {
  const t = name.trim();
  if (!t) return "?";
  return t.split(" ").filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function isValidImage(url: string | null | undefined): boolean {
  if (!url) return false;
  if (url.includes("user-not-found") || url.includes("dog_not_found")) return false;
  if (url.startsWith("https::")) return false;
  return url.startsWith("http");
}

function getMembershipType(no: string): { label: string; color: string; bg: string } {
  if (no.startsWith("T-")) return { label: "Temporary Member", color: "#92400E", bg: "#FEF3C7" };
  if (no.startsWith("P-")) return { label: "Permanent Member", color: "#fff",    bg: COLORS.primary };
  if (no.startsWith("D-")) return { label: "Associate Member", color: "#fff",    bg: COLORS.primary };
  return { label: "Member", color: COLORS.textMuted, bg: COLORS.border };
}

function toListDog(d: MemberOwnedDog): Dog {
  return {
    id: d.id, dog_name: d.dog_name, KP: d.KP || null, breed: d.breed,
    sex: d.sex, dob: d.dob, color: d.color || null, imageUrl: d.imageUrl,
    owner: d.owner || null, breeder: d.breeder || null,
    sire: d.sire || null, sire_id: null, dam: d.dam || null, dam_id: null,
    titles: d.titles, microchip: d.microchip,
    foreign_reg_no: d.foreign_reg_no || null, hair: d.hair || null,
    hd: null, ed: null, working_title: null, dna_status: null,
    breed_survey_period: null, show_rating: null,
  };
}

/* ── FormField ──────────────────────────────────────────── */
function FormField({
  label, value, onChangeText, placeholder, multiline, keyboardType, required,
}: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder?: string; multiline?: boolean; keyboardType?: any; required?: boolean;
}) {
  return (
    <View style={fStyles.field}>
      <Text style={fStyles.label}>
        {label}
        {required ? <Text style={fStyles.required}> *</Text> : null}
      </Text>
      <TextInput
        style={[fStyles.input, multiline && fStyles.inputMulti]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? ""}
        placeholderTextColor="#94A3B8"
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        keyboardType={keyboardType ?? "default"}
        autoCapitalize="sentences"
        autoCorrect={false}
      />
    </View>
  );
}

function DateField({
  label, value, onChange, required,
}: {
  label: string; value: string; onChange: (v: string) => void; required?: boolean;
}) {
  const today = new Date().toISOString().split("T")[0];
  return (
    <View style={fStyles.field}>
      <Text style={fStyles.label}>
        {label}
        {required ? <Text style={fStyles.required}> *</Text> : null}
      </Text>
      {Platform.OS === "web"
        ? createElement("input", {
            type: "date",
            value: value,
            max: today,
            onChange: (e: any) => onChange(e.target.value),
            style: {
              width: "100%", height: 42, borderWidth: 1, borderStyle: "solid",
              borderColor: "#CBD5E1", borderRadius: 10, paddingLeft: 12, paddingRight: 12,
              fontSize: 13, color: "#1E293B", backgroundColor: "#fff",
              fontFamily: "inherit", boxSizing: "border-box", outline: "none",
            },
          })
        : <TextInput
            style={fStyles.input}
            value={value}
            onChangeText={onChange}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#94A3B8"
            autoCorrect={false}
            keyboardType="numbers-and-punctuation"
          />
      }
    </View>
  );
}

function FormSection({ title }: { title: string }) {
  return <Text style={fStyles.section}>{title}</Text>;
}

function SubmitBtn({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <TouchableOpacity
      style={[fStyles.submitBtn, disabled && { opacity: 0.4 }]}
      activeOpacity={disabled ? 1 : 0.8}
      onPress={disabled ? undefined : onPress}
    >
      <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
      <Text style={fStyles.submitBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

/* ── DetailItem ─────────────────────────────────────── */
function DetailItem({ icon, label, value, valueColor }: {
  icon: keyof typeof Ionicons.glyphMap; label: string; value: string; valueColor?: string;
}) {
  return (
    <View style={styles.detailItem}>
      <View style={styles.detailIconWrap}>
        <Ionicons name={icon} size={18} color={COLORS.primary} />
      </View>
      <View style={styles.detailTextWrap}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={[styles.detailValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
      </View>
    </View>
  );
}

/* ── Tab: Detail ────────────────────────────────────── */
function DetailTab({ detail, fallbackMember, email, phone, refetchDetail }: {
  detail: MemberDetail | undefined; fallbackMember?: Member;
  email: string | null; phone: string | null;
  refetchDetail: () => void;
}) {
  const { user, updateUser } = useAuth();
  const member = detail?.member ?? fallbackMember;
  if (!member) return null;
  const statusLabel = member.membership_no.startsWith("P-") || member.membership_no.startsWith("D-") ? "Active" : "Temporary";
  const statusColor = statusLabel === "Active" ? COLORS.primary : "#F59E0B";
  const detailMember = detail?.member as any;

  // Local display state — updated immediately after save so UI refreshes without waiting for refetch
  const [displayPhone,    setDisplayPhone]    = useState(phone ?? "");
  const [displayEmail,    setDisplayEmail]    = useState(email ?? "");
  const [displayAddress,  setDisplayAddress]  = useState(detailMember?.address ?? "");
  const [displayCity,     setDisplayCity]     = useState(member.city ?? "");
  // Check/visibility state — updated immediately after save so re-opening edit shows correct toggles
  const [checkPhone,   setCheckPhone]   = useState<string>(detailMember?.check_phone   ?? "Show");
  const [checkEmail,   setCheckEmail]   = useState<string>(detailMember?.check_email   ?? "Show");
  const [checkAddress, setCheckAddress] = useState<string>(detailMember?.check_address ?? "Show");

  // Keep display state in sync when detail/props refresh from server
  useEffect(() => { setDisplayPhone(phone ?? ""); },                [phone]);
  useEffect(() => { setDisplayEmail(email ?? ""); },                [email]);
  useEffect(() => { setDisplayAddress(detailMember?.address ?? ""); }, [detailMember?.address]);
  useEffect(() => { setDisplayCity(member.city ?? ""); },            [member.city]);
  useEffect(() => { if (detailMember?.check_phone   != null) setCheckPhone(detailMember.check_phone);   }, [detailMember?.check_phone]);
  useEffect(() => { if (detailMember?.check_email   != null) setCheckEmail(detailMember.check_email);   }, [detailMember?.check_email]);
  useEffect(() => { if (detailMember?.check_address != null) setCheckAddress(detailMember.check_address); }, [detailMember?.check_address]);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [cityPickerOpen, setCityPickerOpen] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const [cityId, setCityId] = useState<number | null>(null);
  const [cityLabel, setCityLabel] = useState(member.city ?? "");

  const { data: cities = [] } = useQuery<City[]>({
    queryKey: ["cities"],
    queryFn: fetchCities,
    staleTime: 10 * 60 * 1000,
  });

  const filteredCities = cities.filter(c =>
    c.city.toLowerCase().includes(citySearch.toLowerCase())
  );

  const [form, setForm] = useState({
    phone:       phone ?? "",
    email:       email ?? "",
    address:     detailMember?.address ?? "",
    password:    "",
    showPhone:   true,
    showEmail:   true,
    showAddress: true,
  });

  function openEdit() {
    setForm({
      phone:       displayPhone,
      email:       displayEmail,
      address:     displayAddress,
      password:    "",
      showPhone:   checkPhone   !== "Hide",
      showEmail:   checkEmail   !== "Hide",
      showAddress: checkAddress !== "Hide",
    });
    // Prefer city_id directly from auth context; fall back to name-matching the cities list
    const directId = user?.city_id ?? null;
    const matched  = cities.find(c =>
      directId
        ? c.id === directId
        : c.city.toLowerCase() === displayCity.toLowerCase()
    );
    setCityId(matched?.id ?? directId);
    setCityLabel(matched?.city ?? displayCity);
    setCitySearch("");
    setSaveError("");
    setSaveSuccess(false);
    setEditing(true);
  }

  async function handleSave() {
    if (!user) return;
    setSaveError("");
    setSaving(true);
    const payload: any = {
      user_id:       user.id,
      check_phone:   form.showPhone   ? "Show" : "Hide",
      check_email:   form.showEmail   ? "Show" : "Hide",
      check_address: form.showAddress ? "Show" : "Hide",
      phone:         form.phone.trim(),
      email:         form.email.trim(),
      address:       form.address.trim(),
    };
    if (cityId != null) payload.city_id = cityId;
    if (form.password.trim()) payload.password = form.password.trim();
    console.log("[ProfileSave] payload:", JSON.stringify(payload));
    try {
      await updateProfile(payload, user.token);
      console.log("[ProfileSave] update-profile succeeded");
      // Update local display + check state immediately — no need to wait for refetch
      setDisplayPhone(form.phone.trim());
      setDisplayEmail(form.email.trim());
      setDisplayAddress(form.address.trim());
      setDisplayCity(cityLabel);
      setCheckPhone(form.showPhone   ? "Show" : "Hide");
      setCheckEmail(form.showEmail   ? "Show" : "Hide");
      setCheckAddress(form.showAddress ? "Show" : "Hide");
      const fresh = await fetchProfileShow(user.id);
      console.log("[ProfileSave] profile/show fresh:", JSON.stringify(fresh));
      if (fresh) {
        await updateUser({
          first_name:      fresh.first_name,
          last_name:       fresh.last_name,
          name:            [fresh.first_name, fresh.last_name].filter(Boolean).join(" "),
          email:           fresh.email,
          phone:           fresh.phone,
          photo:           fresh.photo,
          // Don't overwrite city with null if backend doesn't return it — keep form value
          city:            fresh.city ?? cityLabel ?? user.city,
          city_id:         fresh.city_id ?? cityId ?? user.city_id,
          country:         fresh.country,
          membership_no:   fresh.membership_no,
          membership_type: fresh.membership_type,
          role:            fresh.role,
          role_id:         fresh.role_id,
          myDogs:          fresh.myDogs,
          myKennel:        fresh.myKennel,
        });
      } else {
        await updateUser({
          phone:   form.phone.trim() || user.phone,
          email:   form.email.trim() || user.email,
          city:    cityLabel || user.city,
          city_id: cityId ?? user.city_id,
        });
      }
      refetchDetail();
      setSaveSuccess(true);
      setEditing(false);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (e: any) {
      setSaveError(e.message ?? "Update failed. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.cardHeadingRow}>
        <Text style={styles.cardHeading}>Membership Details</Text>
        {!editing && (
          <TouchableOpacity style={styles.cardEditBtn} activeOpacity={0.7} onPress={openEdit} data-testid="btn-edit-details">
            <Ionicons name="pencil-outline" size={13} color={COLORS.primary} />
            <Text style={styles.cardEditBtnText}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      {saveSuccess && (
        <View style={eStyles.successBanner}>
          <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
          <Text style={eStyles.successBannerText}>Profile updated successfully.</Text>
        </View>
      )}

      {!editing ? (
        <View style={styles.detailsGrid}>
          <DetailItem icon="card"             label="Membership Number" value={member.membership_no} />
          <DetailItem icon="checkmark-circle" label="Status"            value={statusLabel} valueColor={statusColor} />
          {displayCity    ? <DetailItem icon="location" label="City"    value={displayCity} />       : null}
          {member.country ? <DetailItem icon="flag"     label="Country" value={member.country!} />  : null}
          {displayAddress ? <DetailItem icon="home"     label="Address" value={displayAddress} />    : null}
          {displayEmail   ? <DetailItem icon="mail"     label="Email"   value={displayEmail} />      : null}
          {displayPhone   ? <DetailItem icon="call"     label="Phone"   value={displayPhone} />      : null}
        </View>
      ) : (
        <View style={eStyles.editForm}>
          {/* Phone */}
          <View style={eStyles.fieldGroup}>
            <View style={eStyles.fieldLabelRow}>
              <Text style={eStyles.fieldLabel}>Phone Number</Text>
              <View style={eStyles.visibilityRow}>
                <Text style={eStyles.visibilityLabel}>Visible to others</Text>
                <Switch
                  value={form.showPhone}
                  onValueChange={v => setForm(f => ({ ...f, showPhone: v }))}
                  trackColor={{ false: "#E5E7EB", true: `${COLORS.primary}60` }}
                  thumbColor={form.showPhone ? COLORS.primary : "#9CA3AF"}
                />
              </View>
            </View>
            <TextInput
              style={eStyles.input}
              value={form.phone}
              onChangeText={v => setForm(f => ({ ...f, phone: v }))}
              placeholder="Phone number"
              keyboardType="phone-pad"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          {/* Email */}
          <View style={eStyles.fieldGroup}>
            <View style={eStyles.fieldLabelRow}>
              <Text style={eStyles.fieldLabel}>Email Address</Text>
              <View style={eStyles.visibilityRow}>
                <Text style={eStyles.visibilityLabel}>Visible to others</Text>
                <Switch
                  value={form.showEmail}
                  onValueChange={v => setForm(f => ({ ...f, showEmail: v }))}
                  trackColor={{ false: "#E5E7EB", true: `${COLORS.primary}60` }}
                  thumbColor={form.showEmail ? COLORS.primary : "#9CA3AF"}
                />
              </View>
            </View>
            <TextInput
              style={eStyles.input}
              value={form.email}
              onChangeText={v => setForm(f => ({ ...f, email: v }))}
              placeholder="Email address"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          {/* Address */}
          <View style={eStyles.fieldGroup}>
            <View style={eStyles.fieldLabelRow}>
              <Text style={eStyles.fieldLabel}>Address</Text>
              <View style={eStyles.visibilityRow}>
                <Text style={eStyles.visibilityLabel}>Visible to others</Text>
                <Switch
                  value={form.showAddress}
                  onValueChange={v => setForm(f => ({ ...f, showAddress: v }))}
                  trackColor={{ false: "#E5E7EB", true: `${COLORS.primary}60` }}
                  thumbColor={form.showAddress ? COLORS.primary : "#9CA3AF"}
                />
              </View>
            </View>
            <TextInput
              style={[eStyles.input, eStyles.inputMultiline]}
              value={form.address}
              onChangeText={v => setForm(f => ({ ...f, address: v }))}
              placeholder="Street address"
              multiline
              numberOfLines={2}
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          {/* City */}
          <View style={eStyles.fieldGroup}>
            <Text style={eStyles.fieldLabel}>City</Text>
            <TouchableOpacity
              style={eStyles.cityPickerBtn}
              activeOpacity={0.8}
              onPress={() => { setCitySearch(""); setCityPickerOpen(true); }}
            >
              <Text style={cityLabel ? eStyles.cityPickerValue : eStyles.cityPickerPlaceholder} numberOfLines={1}>
                {cityLabel || "Select city…"}
              </Text>
              <Ionicons name="chevron-down" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          {/* City Picker Modal */}
          <Modal visible={cityPickerOpen} animationType="slide" transparent onRequestClose={() => setCityPickerOpen(false)}>
            <View style={eStyles.modalOverlay}>
              <View style={eStyles.modalSheet}>
                <View style={eStyles.modalHeader}>
                  <Text style={eStyles.modalTitle}>Select City</Text>
                  <TouchableOpacity onPress={() => setCityPickerOpen(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="close" size={22} color={COLORS.text} />
                  </TouchableOpacity>
                </View>
                <View style={eStyles.modalSearchWrap}>
                  <Ionicons name="search-outline" size={16} color={COLORS.textMuted} style={{ marginRight: 6 }} />
                  <TextInput
                    style={eStyles.modalSearchInput}
                    value={citySearch}
                    onChangeText={setCitySearch}
                    placeholder="Search cities…"
                    placeholderTextColor={COLORS.textMuted}
                    autoFocus
                  />
                  {citySearch.length > 0 && (
                    <TouchableOpacity onPress={() => setCitySearch("")} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                      <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
                    </TouchableOpacity>
                  )}
                </View>
                <ScrollView style={eStyles.modalList} keyboardShouldPersistTaps="handled">
                  {filteredCities.map(c => (
                    <TouchableOpacity
                      key={c.id}
                      style={[eStyles.modalCityRow, cityId === c.id && eStyles.modalCityRowActive]}
                      activeOpacity={0.7}
                      onPress={() => { setCityId(c.id); setCityLabel(c.city); setCityPickerOpen(false); }}
                    >
                      <Text style={[eStyles.modalCityName, cityId === c.id && eStyles.modalCityNameActive]}>{c.city}</Text>
                      {cityId === c.id && <Ionicons name="checkmark" size={16} color={COLORS.primary} />}
                    </TouchableOpacity>
                  ))}
                  {filteredCities.length === 0 && (
                    <View style={{ padding: 24, alignItems: "center" }}>
                      <Text style={{ color: COLORS.textMuted, fontSize: 14 }}>No cities found</Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            </View>
          </Modal>

          {/* Password */}
          <View style={eStyles.fieldGroup}>
            <Text style={eStyles.fieldLabel}>New Password</Text>
            <TextInput
              style={eStyles.input}
              value={form.password}
              onChangeText={v => setForm(f => ({ ...f, password: v }))}
              placeholder="Leave blank to keep current password"
              secureTextEntry
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          {saveError ? (
            <View style={eStyles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={15} color="#DC2626" />
              <Text style={eStyles.errorBannerText}>{saveError}</Text>
            </View>
          ) : null}

          <View style={eStyles.btnRow}>
            <TouchableOpacity style={eStyles.cancelBtn} onPress={() => setEditing(false)} activeOpacity={0.8} disabled={saving}>
              <Text style={eStyles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={eStyles.saveBtn} onPress={handleSave} activeOpacity={0.85} disabled={saving}>
              {saving
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={eStyles.saveBtnText}>Save Changes</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const eStyles = StyleSheet.create({
  editForm: { gap: 16, marginTop: 8 },
  fieldGroup: { gap: 6 },
  fieldLabelRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  fieldLabel: { fontSize: 12, fontWeight: "700", color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.5 },
  visibilityRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  visibilityLabel: { fontSize: 11, color: COLORS.textMuted },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: COLORS.text,
    backgroundColor: "#FAFAFA",
  },
  inputMultiline: { minHeight: 64, textAlignVertical: "top" },
  btnRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  cancelBtnText: { fontSize: 14, fontWeight: "600", color: COLORS.textMuted },
  saveBtn: {
    flex: 2,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  saveBtnText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  errorBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FEF2F2", borderRadius: 8, padding: 10 },
  errorBannerText: { fontSize: 13, color: "#DC2626", flex: 1 },
  successBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#F0FDF4", borderRadius: 8, padding: 10, marginBottom: 12 },
  successBannerText: { fontSize: 13, color: "#16A34A", flex: 1 },
  cityPickerBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: "#FAFAFA",
  },
  cityPickerValue: { fontSize: 14, color: COLORS.text, flex: 1 },
  cityPickerPlaceholder: { fontSize: 14, color: COLORS.textMuted, flex: 1 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: "75%", paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: "#F1F5F9",
  },
  modalTitle: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  modalSearchWrap: {
    flexDirection: "row", alignItems: "center",
    margin: 12, paddingHorizontal: 12, paddingVertical: 9,
    backgroundColor: "#F8FAFC", borderRadius: 10, borderWidth: 1, borderColor: "#E5E7EB",
  },
  modalSearchInput: { flex: 1, fontSize: 14, color: COLORS.text, padding: 0 },
  modalList: { flexGrow: 0 },
  modalCityRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 13,
    borderBottomWidth: 1, borderBottomColor: "#F8FAFC",
  },
  modalCityRowActive: { backgroundColor: `${COLORS.primary}08` },
  modalCityName: { fontSize: 14, color: COLORS.text },
  modalCityNameActive: { fontWeight: "700", color: COLORS.primary },
});

/* ── Tab: Kennel ────────────────────────────────────── */
function KennelTab({ kennel, navigation }: { kennel: MemberKennel | null | undefined; navigation: any }) {
  if (!kennel) {
    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIconWrap}><Ionicons name="home-outline" size={32} color={COLORS.primary} /></View>
        <Text style={styles.emptyTitle}>No Kennel Registered</Text>
        <Text style={styles.emptyDesc}>You have not registered a kennel with GSDCP yet.</Text>
      </View>
    );
  }
  const hasImage = kennel.imageUrl && !kennel.imageUrl.includes("user-not-found") && !kennel.imageUrl.startsWith("https::");
  const initials = kennel.kennelName.trim().split(" ").filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const phone = kennel.phone && kennel.phone !== "+00-000-000-0000" ? kennel.phone : null;
  const activeSince = kennel.active_since ? new Date(kennel.active_since).getFullYear().toString() : null;

  return (
    <View style={styles.card}>
      <View style={styles.kennelHeader}>
        {hasImage ? (
          <LazyImage source={{ uri: kennel.imageUrl! }} style={styles.kennelAvatar} />
        ) : (
          <View style={[styles.kennelAvatar, styles.kennelAvatarPlaceholder]}>
            <Text style={styles.kennelAvatarInitials}>{initials}</Text>
          </View>
        )}
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={styles.kennelName}>{kennel.kennelName}</Text>
          {kennel.suffix ? <Text style={styles.kennelSuffix}>"{kennel.suffix}"</Text> : null}
          {kennel.city   ? <Text style={styles.kennelCity}>{kennel.city}{kennel.country ? `, ${kennel.country}` : ""}</Text> : null}
        </View>
      </View>
      <View style={styles.divider} />
      <View style={styles.cardHeadingRow}>
        <Text style={styles.cardHeading}>Kennel Details</Text>
        <TouchableOpacity style={styles.cardEditBtn} activeOpacity={0.7} data-testid="btn-edit-kennel-card">
          <Ionicons name="pencil-outline" size={13} color={COLORS.primary} />
          <Text style={styles.cardEditBtnText}>Edit</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.detailsGrid}>
        {kennel.prefix   ? <DetailItem icon="text-outline"     label="Prefix"       value={kennel.prefix}   /> : null}
        {phone           ? <DetailItem icon="call-outline"     label="Phone"        value={phone}           /> : null}
        {kennel.email    ? <DetailItem icon="mail-outline"     label="Email"        value={kennel.email}    /> : null}
        {kennel.location ? <DetailItem icon="location-outline" label="Location"     value={kennel.location} /> : null}
        {activeSince     ? <DetailItem icon="calendar-outline" label="Active Since" value={activeSince}     /> : null}
      </View>
      <TouchableOpacity
        style={styles.kennelViewBtn} activeOpacity={0.8}
        onPress={() => navigation.push("KennelProfile", { id: kennel.kennel_id, name: kennel.kennelName })}
        data-testid="btn-view-kennel"
      >
        <Ionicons name="home" size={16} color="#fff" style={{ marginRight: 6 }} />
        <Text style={styles.kennelViewBtnText}>View Full Kennel Profile</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ── Tab: Dogs ──────────────────────────────────────── */
function DogsTab({ dogs, onDogPress }: { dogs: MemberOwnedDog[]; onDogPress: (d: MemberOwnedDog) => void }) {
  if (dogs.length === 0) {
    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIconWrap}><Ionicons name="paw-outline" size={32} color={COLORS.primary} /></View>
        <Text style={styles.emptyTitle}>No Dogs Registered</Text>
        <Text style={styles.emptyDesc}>You have no dogs registered under your account yet.</Text>
      </View>
    );
  }
  return (
    <View>
      {dogs.map((dog) => (
        <DogListItem key={dog.id} dog={toListDog(dog)} onPress={() => onDogPress(dog)} />
      ))}
    </View>
  );
}

/* ── Reusable: list header with "+ New" button ────────── */
function ListHeader({ title, onNew }: { title: string; onNew: () => void }) {
  return (
    <View style={tStyles.listHeader}>
      <Text style={tStyles.listTitle}>{title}</Text>
      <TouchableOpacity style={tStyles.newBtn} onPress={onNew} activeOpacity={0.8} data-testid="btn-new-record">
        <Ionicons name="add" size={15} color="#fff" />
        <Text style={tStyles.newBtnText}>New</Text>
      </TouchableOpacity>
    </View>
  );
}

function TableRow({ cols }: { cols: { label: string; value: string; flex?: number }[] }) {
  return (
    <View style={tStyles.tableRow}>
      {cols.map((c, i) => (
        <Text key={i} style={[tStyles.tableCell, { flex: c.flex ?? 1 }]} numberOfLines={1}>{c.value}</Text>
      ))}
    </View>
  );
}

function TableHead({ cols }: { cols: { label: string; flex?: number }[] }) {
  return (
    <View style={[tStyles.tableRow, tStyles.tableHeadRow]}>
      {cols.map((c, i) => (
        <Text key={i} style={[tStyles.tableHeadCell, { flex: c.flex ?? 1 }]}>{c.label}</Text>
      ))}
    </View>
  );
}

function EmptyTable({ icon, message }: { icon: keyof typeof Ionicons.glyphMap; message: string }) {
  return (
    <View style={tStyles.emptyRow}>
      <Ionicons name={icon} size={20} color={COLORS.textMuted} />
      <Text style={tStyles.emptyRowText}>{message}</Text>
    </View>
  );
}

function FormBackBtn({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity style={tStyles.backBtn} onPress={onPress} activeOpacity={0.7} data-testid="btn-back-to-list">
      <Ionicons name="arrow-back" size={15} color={COLORS.primary} />
      <Text style={tStyles.backBtnText}>Back to list</Text>
    </TouchableOpacity>
  );
}

/* ── Map a cert/reg sire/dam to the Dog shape DogListItem expects ── */
type DogCardShape = { id: string; name: string; KP: string; foreign_reg_no: string | null; color: string | null; imageUrl: string | null; date_of_birth?: string | null };
function certDogToDog(d: DogCardShape, sex: string): Dog {
  return {
    id: d.id,
    dog_name: d.name,
    KP: d.KP,
    foreign_reg_no: d.foreign_reg_no,
    color: d.color,
    imageUrl: d.imageUrl,
    sex,
    dob: d.date_of_birth ?? null,
    breed: "GSD",
    owner: null, breeder: null,
    sire: null, sire_id: null,
    dam: null,  dam_id: null,
    titles: [], microchip: null, hair: null,
    hd: null, ed: null, working_title: null,
    dna_status: null, breed_survey_period: null, show_rating: null,
  };
}

/* ── Dog search dropdown (used in stud cert form) ──── */
type DogOption = { id: string; name: string; KP: string | null; foreign_reg_no?: string | null; owner?: string; sex?: string; color?: string };

function kpLabel(kp?: string | null, foreign?: string | null): string {
  const k = (kp ?? "").trim();
  if (k && k !== "0") return `KP ${k}`;
  const f = (foreign ?? "").trim();
  return f || "—";
}

const CAL_MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const CAL_DOW    = ["Su","Mo","Tu","We","Th","Fr","Sa"];

function CalendarDatePicker({ label, required, value, onChange, maxDate }: {
  label: string; required?: boolean;
  value: string;       // DD-MM-YYYY display / storage
  onChange: (v: string) => void;
  maxDate?: Date;      // no date after this may be selected (defaults to today)
}) {
  const today = new Date();
  const max   = maxDate ?? today;
  // Normalise max to start-of-day for clean comparisons
  const maxDay = new Date(max.getFullYear(), max.getMonth(), max.getDate());

  const parseValue = (v: string): Date | null => {
    if (!v) return null;
    const [d, m, y] = v.split("-").map(Number);
    return d && m && y ? new Date(y, m - 1, d) : null;
  };
  const selected = parseValue(value);
  const [show,      setShow]      = useState(false);
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const openPicker = () => {
    if (selected) { setViewYear(selected.getFullYear()); setViewMonth(selected.getMonth()); }
    else { setViewYear(maxDay.getFullYear()); setViewMonth(maxDay.getMonth()); }
    setShow(true);
  };

  // Block navigating forward past the max month
  const atMaxMonth = viewYear > maxDay.getFullYear() ||
    (viewYear === maxDay.getFullYear() && viewMonth >= maxDay.getMonth());

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); };
  const nextMonth = () => {
    if (atMaxMonth) return;
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1);
  };

  const isFuture = (day: number) => new Date(viewYear, viewMonth, day) > maxDay;

  const selectDay = (day: number) => {
    if (isFuture(day)) return;
    onChange(`${String(day).padStart(2,"0")}-${String(viewMonth+1).padStart(2,"0")}-${viewYear}`);
    setShow(false);
  };

  const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);
  while (cells.length % 7 !== 0) cells.push(null);

  const isSel = (d: number) => selected && selected.getDate() === d && selected.getMonth() === viewMonth && selected.getFullYear() === viewYear;
  const isTod = (d: number) => today.getDate() === d && today.getMonth() === viewMonth && today.getFullYear() === viewYear;

  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontSize: 13, fontWeight: "600", color: "#334155", marginBottom: 5 }}>
        {label}{required ? <Text style={{ color: COLORS.error }}> *</Text> : null}
      </Text>
      <View style={{ flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, backgroundColor: "#fff", overflow: "hidden" }}>
        <TouchableOpacity onPress={openPicker} activeOpacity={0.8} style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 10 }}>
          <Ionicons name="calendar-outline" size={16} color={value ? COLORS.primary : COLORS.textMuted} />
          <Text style={{ fontSize: 13, color: value ? COLORS.text : COLORS.textMuted }}>{value || "Select date"}</Text>
        </TouchableOpacity>
        {!!value && (
          <TouchableOpacity onPress={() => onChange("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={{ paddingHorizontal: 12 }}>
            <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <Modal visible={show} transparent animationType="fade" onRequestClose={() => setShow(false)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center" }} activeOpacity={1} onPress={() => setShow(false)}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}} style={{ backgroundColor: "#fff", borderRadius: 16, padding: 16, width: 300 }}>
            {/* Month navigation */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <TouchableOpacity onPress={prevMonth} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="chevron-back" size={22} color={COLORS.primary} />
              </TouchableOpacity>
              <Text style={{ fontSize: 15, fontWeight: "700", color: COLORS.text }}>{CAL_MONTHS[viewMonth]} {viewYear}</Text>
              <TouchableOpacity onPress={atMaxMonth ? undefined : nextMonth} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={{ opacity: atMaxMonth ? 0.25 : 1 }}>
                <Ionicons name="chevron-forward" size={22} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
            {/* Day-of-week headers */}
            <View style={{ flexDirection: "row", marginBottom: 6 }}>
              {CAL_DOW.map(d => (
                <Text key={d} style={{ flex: 1, textAlign: "center", fontSize: 11, fontWeight: "600", color: COLORS.textMuted }}>{d}</Text>
              ))}
            </View>
            {/* Day grid */}
            {Array.from({ length: cells.length / 7 }).map((_, week) => (
              <View key={week} style={{ flexDirection: "row", marginBottom: 2 }}>
                {cells.slice(week * 7, week * 7 + 7).map((day, i) => {
                  const future  = !!day && isFuture(day);
                  const sel     = !!day && !!isSel(day);
                  const tod     = !!day && isTod(day);
                  return (
                    <TouchableOpacity
                      key={i}
                      onPress={() => { if (day && !future) selectDay(day); }}
                      activeOpacity={day && !future ? 0.7 : 1}
                      style={{ flex: 1, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 18, backgroundColor: sel ? COLORS.primary : tod ? `${COLORS.primary}18` : "transparent", opacity: future ? 0.3 : 1 }}
                    >
                      {!!day && (
                        <Text style={{ fontSize: 13, fontWeight: sel || tod ? "700" : "400", color: sel ? "#fff" : tod ? COLORS.primary : COLORS.text }}>
                          {day}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
            <TouchableOpacity onPress={() => setShow(false)} style={{ marginTop: 10, alignItems: "center", paddingVertical: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: COLORS.textMuted }}>Cancel</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

/* Highlight the matched portion of a string */
function HighlightText({ text, query, style }: { text: string; query: string; style?: any }) {
  if (!query.trim()) return <Text style={style}>{text}</Text>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <Text style={style}>{text}</Text>;
  return (
    <Text style={style}>
      {text.slice(0, idx)}
      <Text style={[style, { backgroundColor: `${COLORS.primary}28`, color: COLORS.primary, fontWeight: "700" }]}>
        {text.slice(idx, idx + query.length)}
      </Text>
      {text.slice(idx + query.length)}
    </Text>
  );
}

function DogDropdown({
  label, required, selected, onSelect, onClear, mode, localOptions, sexFilter,
}: {
  label: string; required?: boolean;
  selected: DogOption | null;
  onSelect: (d: DogOption) => void;
  onClear: () => void;
  mode: "local" | "remote";
  localOptions?: DogOption[];
  sexFilter?: string;
}) {
  const [query, setQuery]         = useState("");
  const [results, setResults]     = useState<DogOption[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen]           = useState(false);
  const debounceRef               = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blurTimerRef              = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (mode === "local") {
      const opts = localOptions ?? [];
      if (!query.trim()) { setResults(opts.slice(0, 50)); return; }
      const q = query.toLowerCase();
      setResults(
        opts.filter(d =>
          (d.name ?? "").toLowerCase().includes(q) ||
          (d.KP  ?? "").toLowerCase().includes(q)
        ).slice(0, 50)
      );
    } else {
      if (!query.trim() || query.length < 2) { setResults([]); return; }
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        setSearching(true);
        try {
          const dogs = await searchDogs(query, 1, 20, sexFilter);
          setResults(dogs.map(d => ({ id: d.id, name: d.dog_name, KP: d.KP, foreign_reg_no: d.foreign_reg_no ?? null, owner: d.owner, sex: d.sex, color: d.color })));
        } catch { setResults([]); }
        finally { setSearching(false); }
      }, 350);
    }
  }, [query, mode, localOptions, sexFilter]);

  const handleFocus = () => {
    if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
    setOpen(true);
  };
  const handleBlur = () => {
    blurTimerRef.current = setTimeout(() => setOpen(false), 180);
  };
  const handleSelect = (dog: DogOption) => {
    if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
    onSelect(dog);
    setOpen(false);
    setQuery("");
  };

  const isMale   = (s?: string | null) => (s ?? "").toLowerCase() === "male";
  const isFemale = (s?: string | null) => (s ?? "").toLowerCase() === "female";
  const sexBg    = (s?: string | null) => isMale(s) ? `${COLORS.primary}18` : isFemale(s) ? "#F3E8FF" : "#F1F5F9";
  const sexIcon  = (s?: string | null): any => isMale(s) ? "male" : isFemale(s) ? "female" : "paw";
  const sexColor = (s?: string | null) => isMale(s) ? COLORS.primary : isFemale(s) ? "#9333EA" : COLORS.textMuted;

  const showPanel = open && !selected;
  const showResults = showPanel && results.length > 0;
  const showRemoteHint = showPanel && mode === "remote" && query.length === 0;
  const showKeepTyping = showPanel && mode === "remote" && query.length === 1;
  const showNoResults  = showPanel && mode === "remote" && query.length >= 2 && !searching && results.length === 0;
  const showLocalEmpty = showPanel && mode === "local" && !searching && results.length === 0;

  if (selected) {
    return (
      <View style={{ marginBottom: 12 }}>
        <Text style={{ fontSize: 13, fontWeight: "600", color: "#334155", marginBottom: 5 }}>
          {label}{required ? <Text style={{ color: COLORS.error }}> *</Text> : null}
        </Text>
        <View style={{
          flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: COLORS.primary,
          borderRadius: 10, padding: 10, backgroundColor: `${COLORS.primary}08`, gap: 10,
        }}>
          <View style={{
            width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center",
            backgroundColor: sexBg(selected.sex),
          }}>
            <Ionicons name={sexIcon(selected.sex)} size={16} color={sexColor(selected.sex)} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: COLORS.text }}>{selected.name}</Text>
            <Text style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 1 }}>
              {kpLabel(selected.KP, selected.foreign_reg_no)}{selected.color ? ` · ${selected.color}` : ""}
            </Text>
          </View>
          <TouchableOpacity onPress={onClear} activeOpacity={0.7} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close-circle" size={22} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ fontSize: 13, fontWeight: "600", color: "#334155", marginBottom: 5 }}>
        {label}{required ? <Text style={{ color: COLORS.error }}> *</Text> : null}
      </Text>

      {/* Input row */}
      <View style={{
        flexDirection: "row", alignItems: "center", borderWidth: 1.5,
        borderColor: open ? COLORS.primary : COLORS.border,
        borderRadius: 10, paddingHorizontal: 10, backgroundColor: "#fff",
        shadowColor: open ? COLORS.primary : "transparent",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: open ? 0.12 : 0,
        shadowRadius: 4,
        elevation: open ? 2 : 0,
      }}>
        <Ionicons name="search" size={15} color={open ? COLORS.primary : COLORS.textMuted} style={{ marginRight: 6 }} />
        <TextInput
          style={{ flex: 1, fontSize: 13, color: COLORS.text, paddingVertical: 11 }}
          value={query}
          onChangeText={setQuery}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={mode === "local" ? "Search by name or KP…" : "Search GSDCP database…"}
          placeholderTextColor={COLORS.textMuted}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {searching
          ? <ActivityIndicator size="small" color={COLORS.primary} style={{ marginLeft: 4 }} />
          : query.length > 0
            ? <TouchableOpacity onPress={() => setQuery("")} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
              </TouchableOpacity>
            : <Ionicons name={open ? "chevron-up" : "chevron-down"} size={14} color={COLORS.textMuted} />
        }
      </View>

      {/* Dropdown panel */}
      {showPanel && (
        <View style={{
          borderWidth: 1, borderColor: COLORS.border, borderRadius: 10,
          marginTop: 4, backgroundColor: "#fff",
          shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1, shadowRadius: 8, elevation: 6,
          overflow: "hidden",
        }}>
          {/* Result count header */}
          {showResults && (
            <View style={{
              flexDirection: "row", alignItems: "center", justifyContent: "space-between",
              paddingHorizontal: 12, paddingVertical: 7,
              borderBottomWidth: 1, borderBottomColor: COLORS.border,
              backgroundColor: "#F8FAFC",
            }}>
              <Text style={{ fontSize: 11, color: COLORS.textMuted, fontWeight: "600" }}>
                {results.length} {results.length === 1 ? "dog" : "dogs"}{mode === "local" && query ? " matched" : ""}
              </Text>
              {mode === "local" && !query && (
                <Text style={{ fontSize: 11, color: COLORS.textMuted }}>Your registered dogs</Text>
              )}
            </View>
          )}

          {/* Results list */}
          {showResults && results.map((dog, i) => (
            <TouchableOpacity
              key={dog.id}
              onPress={() => handleSelect(dog)}
              activeOpacity={0.65}
              style={[
                { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 11, gap: 10 },
                i < results.length - 1 && { borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
              ]}
            >
              <View style={{
                width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center",
                backgroundColor: sexBg(dog.sex),
              }}>
                <Ionicons name={sexIcon(dog.sex)} size={14} color={sexColor(dog.sex)} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <HighlightText
                  text={dog.name ?? ""}
                  query={query}
                  style={{ fontSize: 13, fontWeight: "600", color: COLORS.text }}
                />
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 1, flexWrap: "wrap" }}>
                  <HighlightText
                    text={kpLabel(dog.KP, dog.foreign_reg_no)}
                    query={query}
                    style={{ fontSize: 11, color: COLORS.textMuted }}
                  />
                  {dog.color ? <Text style={{ fontSize: 11, color: COLORS.textMuted }}>· {dog.color}</Text> : null}
                  {dog.owner && mode === "remote" ? (
                    <Text style={{ fontSize: 11, color: COLORS.textMuted }} numberOfLines={1}>· {dog.owner}</Text>
                  ) : null}
                </View>
              </View>
              <Ionicons name="chevron-forward" size={14} color="#CBD5E1" />
            </TouchableOpacity>
          ))}

          {/* Hints / empty states inside the panel */}
          {showRemoteHint && (
            <View style={{ alignItems: "center", paddingVertical: 20, gap: 6 }}>
              <Ionicons name="search-outline" size={28} color={COLORS.textMuted} />
              <Text style={{ fontSize: 13, color: COLORS.textMuted, fontWeight: "600" }}>Search the GSDCP database</Text>
              <Text style={{ fontSize: 11, color: COLORS.textMuted }}>Type a dog name or KP number</Text>
            </View>
          )}
          {showKeepTyping && (
            <View style={{ alignItems: "center", paddingVertical: 16, gap: 4 }}>
              <Text style={{ fontSize: 12, color: COLORS.textMuted }}>Keep typing to search…</Text>
            </View>
          )}
          {showNoResults && (
            <View style={{ alignItems: "center", paddingVertical: 20, gap: 6 }}>
              <Ionicons name="paw-outline" size={28} color={COLORS.textMuted} />
              <Text style={{ fontSize: 13, color: COLORS.textMuted, fontWeight: "600" }}>No dogs found</Text>
              <Text style={{ fontSize: 11, color: COLORS.textMuted }}>Try a different name or KP</Text>
            </View>
          )}
          {showLocalEmpty && (
            <View style={{ alignItems: "center", paddingVertical: 20, gap: 6 }}>
              <Ionicons name="paw-outline" size={28} color={COLORS.textMuted} />
              <Text style={{ fontSize: 13, color: COLORS.textMuted, fontWeight: "600" }}>No matching dogs</Text>
              <Text style={{ fontSize: 11, color: COLORS.textMuted }}>Try a different name or KP</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

/* ── Tab: Stud Certificate ──────────────────────────── */
function StudCertTab() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const [showForm, setShowForm]         = useState(false);
  const [selectedCertId, setSelectedCertId] = useState<string | null>(null);
  const [submitting, setSubmitting]     = useState(false);
  const [submitError, setSubmitError]   = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [selectedSire, setSelectedSire]         = useState<DogOption | null>(null);
  const [selectedDam,  setSelectedDam]          = useState<DogOption | null>(null);
  const [sireVerifying, setSireVerifying]       = useState(false);
  const [sireVerification, setSireVerification] = useState<SireVerification | null>(null);
  const [sireVerifyError, setSireVerifyError]   = useState<string | null>(null);
  const [damVerifying, setDamVerifying]         = useState(false);
  const [damVerification, setDamVerification]   = useState<SireVerification | null>(null);
  const [damVerifyError, setDamVerifyError]     = useState<string | null>(null);

  const [form, setForm] = useState({
    dateOfMating: "",
  });
  const set = (key: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [key]: v }));

  const { data: memberDetail } = useQuery<MemberDetail>({
    queryKey: ["member-detail", user ? `member-${user.id}` : null],
    queryFn: () => fetchMemberDetail(`member-${user!.id}`),
    enabled: !!user,
    staleTime: 300_000,
  });
  const allOwnedDogs: MemberOwnedDog[] = memberDetail?.ownedDogs?.length
    ? memberDetail.ownedDogs
    : (user?.myDogs as MemberOwnedDog[] ?? []);
  const sireOptions: DogOption[] = allOwnedDogs
    .filter(d => (d.sex ?? "").toLowerCase() === "male")
    .map(d => ({ id: d.id, name: d.dog_name, KP: d.KP, foreign_reg_no: d.foreign_reg_no ?? null, sex: d.sex, color: d.color }));

  useEffect(() => {
    if (!selectedSire || !user) {
      setSireVerification(null);
      setSireVerifyError(null);
      return;
    }
    let cancelled = false;
    setSireVerifying(true);
    setSireVerification(null);
    setSireVerifyError(null);
    verifySire(selectedSire.id, user.id)
      .then(result => { if (!cancelled) setSireVerification(result); })
      .catch(err  => { if (!cancelled) setSireVerifyError(err?.message ?? "Verification unavailable"); })
      .finally(()  => { if (!cancelled) setSireVerifying(false); });
    return () => { cancelled = true; };
  }, [selectedSire?.id]);

  useEffect(() => {
    if (!selectedDam || !user) {
      setDamVerification(null);
      setDamVerifyError(null);
      return;
    }
    let cancelled = false;
    setDamVerifying(true);
    setDamVerification(null);
    setDamVerifyError(null);
    verifyDam(selectedDam.id, user.id, selectedSire?.id)
      .then(result => { if (!cancelled) setDamVerification(result); })
      .catch(err  => { if (!cancelled) setDamVerifyError(err?.message ?? "Verification unavailable"); })
      .finally(()  => { if (!cancelled) setDamVerifying(false); });
    return () => { cancelled = true; };
  }, [selectedDam?.id, selectedSire?.id]);

  const CERT_PER_PAGE = 10;
  const [allCerts, setAllCerts]     = useState<StudCertificate[]>([]);
  const [certTotal, setCertTotal]   = useState(0);
  const [certPage, setCertPage]     = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const { data: page1Certs, isLoading: certsLoading, refetch } = useQuery({
    queryKey: ["stud-certificates", user?.id],
    queryFn: () => fetchStudCertificates(user!.id, 1, CERT_PER_PAGE),
    enabled: !!user,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (page1Certs) {
      setAllCerts(page1Certs.certificates);
      setCertTotal(page1Certs.total);
      setCertPage(1);
    }
  }, [page1Certs]);

  const loadMoreCerts = async () => {
    if (loadingMore || allCerts.length >= certTotal) return;
    setLoadingMore(true);
    try {
      const res = await fetchStudCertificates(user!.id, certPage + 1, CERT_PER_PAGE);
      setAllCerts(prev => [...prev, ...res.certificates]);
      setCertPage(prev => prev + 1);
    } finally {
      setLoadingMore(false);
    }
  };

  const { data: certDetail, isLoading: detailLoading } = useQuery<StudCertificateDetail>({
    queryKey: ["stud-certificate-detail", selectedCertId],
    queryFn: () => fetchStudCertificateDetail(selectedCertId!, user!.id),
    enabled: !!selectedCertId && !!user,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const handleSubmit = async () => {
    if (!selectedSire)                                   { setSubmitError("Stud (sire) dog is required."); return; }
    if (sireVerification && !sireVerification.eligible) { setSubmitError(`Sire not eligible: ${sireVerification.message}`); return; }
    if (!selectedDam)                                   { setSubmitError("Dam dog is required."); return; }
    if (damVerification && !damVerification.eligible)   { setSubmitError(`Dam not eligible: ${damVerification.message}`); return; }
    if (!form.dateOfMating.trim()) { setSubmitError("Date of mating is required."); return; }
    setSubmitError("");
    setSubmitting(true);
    // Convert DD-MM-YYYY → YYYY-MM-DD for the API
    const [matDD, matMM, matYYYY] = form.dateOfMating.split("-");
    const matingApiDate = `${matYYYY}-${matMM}-${matDD}`;
    try {
      await submitStudCertificate({
        user_id:     user!.id,
        sire_id:     parseInt(selectedSire.id.replace(/^dog-/, ""), 10),
        dam_id:      parseInt(selectedDam.id.replace(/^dog-/, ""), 10),
        mating_date: matingApiDate,
      }, user!.token);
      setSelectedSire(null);
      setSelectedDam(null);
      setSireVerification(null);
      setSireVerifyError(null);
      setDamVerification(null);
      setDamVerifyError(null);
      setForm({ dateOfMating: "" });
      setShowForm(false);
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 5000);
      refetch();
    } catch (e: any) {
      setSubmitError(e.message ?? "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Detail view ── */
  if (selectedCertId) {
    return (
      <View style={styles.card}>
        <FormBackBtn onPress={() => setSelectedCertId(null)} />
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <Text style={styles.cardHeading}>Certificate Detail</Text>
          {certDetail && (
            <View style={[tStyles.statusPill, { backgroundColor: certDetail.status === "Used" ? "#DCFCE7" : "#FEF9C3" }]}>
              <Text style={[tStyles.statusPillText, { color: certDetail.status === "Used" ? "#166534" : "#854D0E" }]}>
                {certDetail.status ?? "Pending"}
              </Text>
            </View>
          )}
        </View>

        {detailLoading ? (
          <ActivityIndicator style={{ marginVertical: 32 }} color={COLORS.primary} />
        ) : certDetail ? (
          <>
            <FormSection title="SIRE" />
            <DogListItem
              dog={certDogToDog(certDetail.sire, "Male")}
              onPress={() => navigation.push("DogProfile", { id: certDetail.sire.id, name: certDetail.sire.name })}
            />
            <View style={styles.divider} />
            <FormSection title="DAM" />
            <DogListItem
              dog={certDogToDog(certDetail.dam, "Female")}
              onPress={() => navigation.push("DogProfile", { id: certDetail.dam.id, name: certDetail.dam.name })}
            />
            <View style={styles.divider} />
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Ionicons name="calendar-outline" size={16} color={COLORS.textMuted} />
              <Text style={tStyles.certDate}>Mating date: {formatDate(certDetail.mating_date)}</Text>
            </View>
          </>
        ) : (
          <Text style={tStyles.emptyRowText}>Could not load certificate details.</Text>
        )}
      </View>
    );
  }

  /* ── Form view ── */
  if (showForm) {
    return (
      <View style={styles.card}>
        <FormBackBtn onPress={() => {
          setShowForm(false); setSubmitError("");
          setSelectedSire(null); setSelectedDam(null);
          setSireVerification(null); setSireVerifyError(null);
          setDamVerification(null); setDamVerifyError(null);
        }} />
        <Text style={styles.cardHeading}>New Stud Certificate</Text>

        <FormSection title="STUD (SIRE)" />
        <DogDropdown
          label="Stud Dog"
          required
          mode="local"
          localOptions={sireOptions}
          selected={selectedSire}
          onSelect={setSelectedSire}
          onClear={() => { setSelectedSire(null); setSireVerification(null); setSireVerifyError(null); }}
        />

        {/* Sire verification status */}
        {selectedSire && (
          sireVerifying ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10, marginTop: -4 }}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={{ fontSize: 12, color: COLORS.textMuted }}>Verifying sire eligibility…</Text>
            </View>
          ) : sireVerification ? (
            <View style={{
              flexDirection: "row", alignItems: "center", gap: 8,
              marginBottom: 10, marginTop: -4,
              paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
              backgroundColor: sireVerification.eligible ? "#DCFCE7" : "#FEE2E2",
            }}>
              <Ionicons
                name={sireVerification.eligible ? "checkmark-circle" : "close-circle"}
                size={16}
                color={sireVerification.eligible ? "#16A34A" : "#DC2626"}
              />
              <Text style={{ fontSize: 12, fontWeight: "600", color: sireVerification.eligible ? "#166534" : "#991B1B", flex: 1 }}>
                {sireVerification.eligible ? "Eligible" : "Not Eligible"}{sireVerification.message ? ` — ${sireVerification.message}` : ""}
              </Text>
            </View>
          ) : sireVerifyError ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10, marginTop: -4 }}>
              <Ionicons name="warning-outline" size={14} color="#D97706" />
              <Text style={{ fontSize: 12, color: "#92400E" }}>Verification unavailable</Text>
            </View>
          ) : null
        )}

        <View style={styles.divider} />
        <FormSection title="DAM (BITCH)" />
        <DogDropdown
          label="Dam Dog"
          required
          mode="remote"
          sexFilter="Female"
          selected={selectedDam}
          onSelect={setSelectedDam}
          onClear={() => { setSelectedDam(null); setDamVerification(null); setDamVerifyError(null); }}
        />

        {/* Dam verification status */}
        {selectedDam && (
          damVerifying ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10, marginTop: -4 }}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={{ fontSize: 12, color: COLORS.textMuted }}>Verifying dam eligibility…</Text>
            </View>
          ) : damVerification ? (
            <View style={{
              flexDirection: "row", alignItems: "center", gap: 8,
              marginBottom: 10, marginTop: -4,
              paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
              backgroundColor: damVerification.eligible ? "#DCFCE7" : "#FEE2E2",
            }}>
              <Ionicons
                name={damVerification.eligible ? "checkmark-circle" : "close-circle"}
                size={16}
                color={damVerification.eligible ? "#16A34A" : "#DC2626"}
              />
              <Text style={{ fontSize: 12, fontWeight: "600", color: damVerification.eligible ? "#166534" : "#991B1B", flex: 1 }}>
                {damVerification.eligible ? "Eligible" : "Not Eligible"}{damVerification.message ? ` — ${damVerification.message}` : ""}
              </Text>
            </View>
          ) : damVerifyError ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10, marginTop: -4 }}>
              <Ionicons name="warning-outline" size={14} color="#D97706" />
              <Text style={{ fontSize: 12, color: "#92400E" }}>Verification unavailable</Text>
            </View>
          ) : null
        )}

        <View style={styles.divider} />
        <FormSection title="MATING DETAILS" />
        <CalendarDatePicker label="Date of Mating" required value={form.dateOfMating} onChange={set("dateOfMating")} />

        {!!submitError && <Text style={tStyles.errorText}>{submitError}</Text>}
        <SubmitBtn
          label={submitting ? "Submitting…" : "Submit Stud Certificate"}
          onPress={handleSubmit}
          disabled={
            submitting ||
            !sireVerification?.eligible ||
            !damVerification?.eligible
          }
        />
      </View>
    );
  }

  /* ── List view ── */
  return (
    <View style={styles.card}>
      <ListHeader title="Stud Certificates" onNew={() => setShowForm(true)} />
      {submitSuccess && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12, padding: 12, borderRadius: 10, backgroundColor: "#DCFCE7" }}>
          <Ionicons name="checkmark-circle" size={18} color="#16A34A" />
          <Text style={{ fontSize: 13, fontWeight: "600", color: "#166534" }}>Stud certificate submitted successfully.</Text>
        </View>
      )}
      {certsLoading ? (
        <ActivityIndicator style={{ marginVertical: 24 }} color={COLORS.primary} />
      ) : allCerts.length === 0 ? (
        <View style={tStyles.emptyRow}>
          <Ionicons name="ribbon-outline" size={20} color={COLORS.textMuted} />
          <Text style={tStyles.emptyRowText}>No stud certificates yet</Text>
        </View>
      ) : (
        <View style={tStyles.certList}>
          {allCerts.map((c, i) => (
            <TouchableOpacity
              key={c.id}
              style={[tStyles.certRow, i < allCerts.length - 1 && tStyles.certRowBorder]}
              onPress={() => setSelectedCertId(c.id)}
              activeOpacity={0.7}
            >
              <View style={{ flex: 1, gap: 2 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Ionicons name="male" size={12} color={COLORS.primary} />
                  <Text style={tStyles.certSire} numberOfLines={1}>{c.sire.name}</Text>
                </View>
                <Text style={tStyles.certKP} numberOfLines={1}>KP {c.sire.KP}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
                  <Ionicons name="female" size={12} color="#9333EA" />
                  <Text style={tStyles.certDam} numberOfLines={1}>{c.dam.name}</Text>
                </View>
                <Text style={tStyles.certKP} numberOfLines={1}>KP {c.dam.KP}</Text>
              </View>
              <View style={{ alignItems: "flex-end", gap: 6, marginLeft: 8 }}>
                <View style={[tStyles.statusPill, { backgroundColor: c.status === "Used" ? "#DCFCE7" : "#FEF9C3" }]}>
                  <Text style={[tStyles.statusPillText, { color: c.status === "Used" ? "#166534" : "#854D0E" }]}>
                    {c.status ?? "Pending"}
                  </Text>
                </View>
                <Text style={tStyles.certDate}>{formatDate(c.mating_date)}</Text>
                <Ionicons name="chevron-forward" size={14} color="#CBD5E1" />
              </View>
            </TouchableOpacity>
          ))}
          {allCerts.length < certTotal && (
            <TouchableOpacity style={tStyles.loadMoreBtn} onPress={loadMoreCerts} disabled={loadingMore} activeOpacity={0.7}>
              {loadingMore
                ? <ActivityIndicator size="small" color={COLORS.primary} />
                : <Text style={tStyles.loadMoreText}>Load more ({certTotal - allCerts.length} remaining)</Text>}
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

/* ── Tab: Litter Inspection ─────────────────────────── */
function LitterInspectionTab() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const [showForm, setShowForm]           = useState(false);
  const [selectedId, setSelectedId]       = useState<string | null>(null);
  const [submitting, setSubmitting]       = useState(false);
  const [submitError, setSubmitError]     = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [inspSire, setInspSire]           = useState<DogOption | null>(null);
  const [inspDam,  setInspDam]            = useState<DogOption | null>(null);
  const [certCheck, setCertCheck]         = useState<CertificateCheck | null>(null);
  const [certChecking, setCertChecking]   = useState(false);
  const [certCheckError, setCertCheckError] = useState<string | null>(null);
  const [form, setForm] = useState({
    dateOfWhelping: "",
    totalPups: "", malePups: "", femalePups: "", deadPups: "",
  });
  const set = (key: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [key]: v }));

  const { data: inspMemberDetail } = useQuery<MemberDetail>({
    queryKey: ["member-detail", user ? `member-${user.id}` : null],
    queryFn: () => fetchMemberDetail(`member-${user!.id}`),
    enabled: !!user,
    staleTime: 300_000,
  });
  const allInspOwnedDogs: MemberOwnedDog[] = inspMemberDetail?.ownedDogs?.length
    ? inspMemberDetail.ownedDogs
    : (user?.myDogs as MemberOwnedDog[] ?? []);
  const damOptions: DogOption[] = allInspOwnedDogs
    .filter(d => (d.sex ?? "").toLowerCase() === "female")
    .map(d => ({ id: d.id, name: d.dog_name, KP: d.KP, foreign_reg_no: d.foreign_reg_no ?? null, sex: d.sex, color: d.color }));

  const INSP_PER_PAGE = 10;
  const [allInspections, setAllInspections] = useState<LitterInspection[]>([]);
  const [inspTotal, setInspTotal]           = useState(0);
  const [inspPage, setInspPage]             = useState(1);
  const [loadingMoreInsp, setLoadingMoreInsp] = useState(false);

  const { data: page1Insp, isLoading, error: listError, refetch } = useQuery({
    queryKey: ["litter-inspections", user?.id],
    queryFn: () => fetchLitterInspections(user!.id, 1, INSP_PER_PAGE),
    enabled: !!user,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (page1Insp) {
      setAllInspections(page1Insp.inspections);
      setInspTotal(page1Insp.total);
      setInspPage(1);
    }
  }, [page1Insp]);

  useEffect(() => {
    if (!inspSire || !inspDam) {
      setCertCheck(null);
      setCertCheckError(null);
      return;
    }
    let cancelled = false;
    setCertChecking(true);
    setCertCheck(null);
    setCertCheckError(null);
    checkLitterCertificate(inspSire.id, inspDam.id, user?.id)
      .then(result => { if (!cancelled) setCertCheck(result); })
      .catch(err   => { if (!cancelled) setCertCheckError(err?.message ?? "Check unavailable"); })
      .finally(()  => { if (!cancelled) setCertChecking(false); });
    return () => { cancelled = true; };
  }, [inspSire?.id, inspDam?.id]);

  const loadMoreInspections = async () => {
    if (loadingMoreInsp || allInspections.length >= inspTotal) return;
    setLoadingMoreInsp(true);
    try {
      const res = await fetchLitterInspections(user!.id, inspPage + 1, INSP_PER_PAGE);
      setAllInspections(prev => [...prev, ...res.inspections]);
      setInspPage(prev => prev + 1);
    } finally {
      setLoadingMoreInsp(false);
    }
  };

  const { data: detail, isLoading: detailLoading } = useQuery<LitterInspectionDetail>({
    queryKey: ["litter-inspection-detail", selectedId],
    queryFn: () => fetchLitterInspectionDetail(selectedId!, user!.id),
    enabled: !!selectedId && !!user,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const setNum = (key: keyof typeof form) => (v: string) =>
    setForm(f => ({ ...f, [key]: v.replace(/[^0-9]/g, "") }));

  const totalVal  = parseInt(form.totalPups)  || 0;
  const maleVal   = parseInt(form.malePups)   || 0;
  const femaleVal = parseInt(form.femalePups) || 0;
  const deadVal   = parseInt(form.deadPups)   || 0;
  const puppySum  = maleVal + femaleVal + deadVal;
  const puppyMismatch = form.totalPups.trim() !== "" && totalVal !== puppySum;

  const handleSubmit = async () => {
    if (!inspSire)                   { setSubmitError("Sire dog is required."); return; }
    if (!inspDam)                    { setSubmitError("Dam dog is required."); return; }
    if (!form.dateOfWhelping.trim()) { setSubmitError("Whelping date is required."); return; }
    if (!form.malePups.trim())       { setSubmitError("Number of male puppies is required."); return; }
    if (!form.femalePups.trim())     { setSubmitError("Number of female puppies is required."); return; }
    if (puppyMismatch)               { setSubmitError(`Total (${totalVal}) must equal Male + Female + Expired (${puppySum}).`); return; }
    setSubmitError("");
    setSubmitting(true);
    const today = new Date().toISOString().split("T")[0];
    // Convert DD-MM-YYYY → YYYY-MM-DD for the API
    const [dd, mm, yyyy] = form.dateOfWhelping.split("-");
    const whelpingApiDate = `${yyyy}-${mm}-${dd}`;
    try {
      await submitLitterInspection({
        user_id:            user!.id,
        sire_id:            parseInt(inspSire.id.replace(/^dog-/, ""), 10),
        dam_id:             parseInt(inspDam.id.replace(/^dog-/, ""), 10),
        sire_name:          inspSire.name,
        sire_kp:            inspSire.KP,
        dam_name:           inspDam.name,
        dam_kp:             inspDam.KP,
        date_of_whelping:   whelpingApiDate,
        date_of_inspection: today,
        total_puppies:      form.totalPups.trim() || undefined,
        male_pups:          form.malePups.trim(),
        female_pups:        form.femalePups.trim(),
        dead_pups:          form.deadPups.trim() || "0",
        inspector_name:     "",
        remarks:            "",
      });
      setInspSire(null);
      setInspDam(null);
      setForm({ dateOfWhelping: "", totalPups: "", malePups: "", femalePups: "", deadPups: "" });
      setShowForm(false);
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 5000);
      refetch();
    } catch (e: any) {
      console.error("[LitterInspection] submit error:", e);
      setSubmitError(e.message ?? "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Detail view ── */
  if (selectedId) {
    return (
      <View style={styles.card}>
        <FormBackBtn onPress={() => setSelectedId(null)} />
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <Text style={styles.cardHeading}>Litter Inspection</Text>
          {detail && (
            <View style={[tStyles.statusPill, { backgroundColor: detail.status === "Approved" ? "#DCFCE7" : "#FEF9C3" }]}>
              <Text style={[tStyles.statusPillText, { color: detail.status === "Approved" ? "#166534" : "#854D0E" }]}>
                {detail.status ?? "Pending"}
              </Text>
            </View>
          )}
        </View>

        {detailLoading ? (
          <ActivityIndicator style={{ marginVertical: 32 }} color={COLORS.primary} />
        ) : detail ? (
          <>
            <FormSection title="SIRE" />
            <DogListItem
              dog={certDogToDog(detail.sire, "Male")}
              onPress={() => navigation.push("DogProfile", { id: detail.sire.id, name: detail.sire.name })}
            />
            <View style={styles.divider} />
            <FormSection title="DAM" />
            <DogListItem
              dog={certDogToDog(detail.dam, "Female")}
              onPress={() => navigation.push("DogProfile", { id: detail.dam.id, name: detail.dam.name })}
            />
            <View style={styles.divider} />

            {/* Pup counts */}
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
              {[
                { label: "Male", value: detail.male_puppies, color: COLORS.primary },
                { label: "Female", value: detail.female_puppies, color: "#9333EA" },
                { label: "Expired", value: detail.expired_puppies, color: "#EF4444" },
              ].map(({ label, value, color }) => (
                <View key={label} style={tStyles.pupCountBox}>
                  <Text style={[tStyles.pupCountNum, { color }]}>{value ?? "—"}</Text>
                  <Text style={tStyles.pupCountLabel}>{label}</Text>
                </View>
              ))}
            </View>

            {detail.whelping_date && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="calendar-outline" size={15} color={COLORS.textMuted} />
                <Text style={tStyles.certDate}>Whelped: {formatDate(detail.whelping_date)}</Text>
              </View>
            )}
          </>
        ) : (
          <Text style={tStyles.emptyRowText}>Could not load inspection details.</Text>
        )}
      </View>
    );
  }

  /* ── Form view ── */
  if (showForm) {
    return (
      <View style={styles.card}>
        <FormBackBtn onPress={() => { setShowForm(false); setSubmitError(""); }} />
        <Text style={styles.cardHeading}>New Litter Inspection</Text>

        <FormSection title="SIRE" />
        <DogDropdown
          label="Sire Dog" required
          mode="remote"
          sexFilter="male"
          selected={inspSire}
          onSelect={setInspSire}
          onClear={() => setInspSire(null)}
        />

        <View style={styles.divider} />
        <FormSection title="DAM" />
        <DogDropdown
          label="Dam Dog" required
          mode="local"
          localOptions={damOptions}
          selected={inspDam}
          onSelect={setInspDam}
          onClear={() => setInspDam(null)}
        />

        {/* Stud certificate check banner */}
        {inspSire && inspDam && (
          certChecking ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10, padding: 10, borderRadius: 8, backgroundColor: "#F1F5F9" }}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={{ fontSize: 12, color: COLORS.textMuted }}>Checking stud certificate…</Text>
            </View>
          ) : certCheck ? (
            <View style={{
              flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10,
              padding: 10, borderRadius: 8,
              backgroundColor: certCheck.found ? "#DCFCE7" : "#FEE2E2",
            }}>
              <Ionicons
                name={certCheck.found ? "checkmark-circle" : "close-circle"}
                size={16}
                color={certCheck.found ? "#16A34A" : "#DC2626"}
              />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: "700", color: certCheck.found ? "#166534" : "#991B1B" }}>
                  {certCheck.found ? "Stud Certificate Found" : "No Stud Certificate"}
                </Text>
                {certCheck.found && certCheck.matingDate ? (
                  <Text style={{ fontSize: 11, color: "#166534", marginTop: 1 }}>Mating date: {certCheck.matingDate}</Text>
                ) : certCheck.found && !certCheck.matingDate ? (
                  <Text style={{ fontSize: 11, color: "#166534", marginTop: 1 }}>{certCheck.message}</Text>
                ) : !certCheck.found ? (
                  <Text style={{ fontSize: 11, color: "#991B1B", marginTop: 1 }}>{certCheck.message}</Text>
                ) : null}
              </View>
            </View>
          ) : certCheckError ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10, padding: 10, borderRadius: 8, backgroundColor: "#FFFBEB" }}>
              <Ionicons name="warning-outline" size={14} color="#D97706" />
              <Text style={{ fontSize: 12, color: "#92400E" }}>Certificate check unavailable</Text>
            </View>
          ) : null
        )}

        <View style={styles.divider} />
        <FormSection title="LITTER DETAILS" />
        <CalendarDatePicker label="Whelping Date" required value={form.dateOfWhelping} onChange={set("dateOfWhelping")} />
        <FormField label="Total No. of Puppies (Born)" value={form.totalPups} onChangeText={setNum("totalPups")} placeholder="0" keyboardType="number-pad" />
        {puppyMismatch && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10, marginTop: -6, paddingHorizontal: 4 }}>
            <Ionicons name="warning-outline" size={13} color="#D97706" />
            <Text style={{ fontSize: 12, color: "#92400E" }}>Total must equal Male + Female + Expired ({puppySum})</Text>
          </View>
        )}
        <View style={fStyles.row}>
          <View style={{ flex: 1 }}><FormField label="Male (Alive)"   value={form.malePups}   onChangeText={setNum("malePups")}   placeholder="0" keyboardType="number-pad" required /></View>
          <View style={{ width: 12 }} />
          <View style={{ flex: 1 }}><FormField label="Female (Alive)" value={form.femalePups} onChangeText={setNum("femalePups")} placeholder="0" keyboardType="number-pad" required /></View>
          <View style={{ width: 12 }} />
          <View style={{ flex: 1 }}><FormField label="Expired"        value={form.deadPups}   onChangeText={setNum("deadPups")}   placeholder="0" keyboardType="number-pad" /></View>
        </View>

        {!!submitError && <Text style={tStyles.errorText}>{submitError}</Text>}
        <SubmitBtn label={submitting ? "Submitting…" : "Submit Litter Inspection"} onPress={handleSubmit} />
      </View>
    );
  }

  /* ── List view ── */
  return (
    <View style={styles.card}>
      <ListHeader title="Litter Inspections" onNew={() => setShowForm(true)} />
      {submitSuccess && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12, padding: 12, borderRadius: 10, backgroundColor: "#DCFCE7" }}>
          <Ionicons name="checkmark-circle" size={18} color="#16A34A" />
          <Text style={{ fontSize: 13, fontWeight: "600", color: "#166534" }}>Litter inspection submitted successfully.</Text>
        </View>
      )}
      {isLoading ? (
        <ActivityIndicator style={{ marginVertical: 24 }} color={COLORS.primary} />
      ) : listError ? (
        <View style={tStyles.emptyRow}>
          <Ionicons name="alert-circle-outline" size={20} color="#EF4444" />
          <Text style={[tStyles.emptyRowText, { color: "#EF4444" }]}>Could not load inspections</Text>
        </View>
      ) : allInspections.length === 0 ? (
        <View style={tStyles.emptyRow}>
          <Ionicons name="search-outline" size={20} color={COLORS.textMuted} />
          <Text style={tStyles.emptyRowText}>No litter inspections yet</Text>
        </View>
      ) : (
        <View style={tStyles.certList}>
          {allInspections.map((item, i) => {
            const totalPups = item.total_puppies ?? ((Number(item.male_puppies) || 0) + (Number(item.female_puppies) || 0));
            return (
              <TouchableOpacity
                key={item.id}
                style={[tStyles.certRow, i < allInspections.length - 1 && tStyles.certRowBorder]}
                onPress={() => setSelectedId(item.id)}
                activeOpacity={0.7}
              >
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Ionicons name="male" size={12} color={COLORS.primary} />
                    <Text style={tStyles.certSire} numberOfLines={1}>{item.sire.name}</Text>
                  </View>
                  <Text style={tStyles.certKP} numberOfLines={1}>KP {item.sire.KP}</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
                    <Ionicons name="female" size={12} color="#9333EA" />
                    <Text style={tStyles.certDam} numberOfLines={1}>{item.dam.name}</Text>
                  </View>
                  <Text style={tStyles.certKP} numberOfLines={1}>KP {item.dam.KP}</Text>
                </View>
                <View style={{ alignItems: "flex-end", gap: 6, marginLeft: 8 }}>
                  <View style={[tStyles.statusPill, { backgroundColor: item.status === "Approved" ? "#DCFCE7" : "#FEF9C3" }]}>
                    <Text style={[tStyles.statusPillText, { color: item.status === "Approved" ? "#166534" : "#854D0E" }]}>
                      {item.status ?? "Pending"}
                    </Text>
                  </View>
                  {item.whelping_date && <Text style={tStyles.certDate}>{formatDate(item.whelping_date)}</Text>}
                  <Text style={tStyles.certKP}>{totalPups} pups</Text>
                  <Ionicons name="chevron-forward" size={14} color="#CBD5E1" />
                </View>
              </TouchableOpacity>
            );
          })}
          {allInspections.length < inspTotal && (
            <TouchableOpacity style={tStyles.loadMoreBtn} onPress={loadMoreInspections} disabled={loadingMoreInsp} activeOpacity={0.7}>
              {loadingMoreInsp
                ? <ActivityIndicator size="small" color={COLORS.primary} />
                : <Text style={tStyles.loadMoreText}>Load more ({inspTotal - allInspections.length} remaining)</Text>}
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

/* ── Tab: Litter Registration ───────────────────────── */
function LitterRegistrationTab() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const [showForm, setShowForm]         = useState(false);
  const [selectedId, setSelectedId]     = useState<string | null>(null);
  const [submitting, setSubmitting]     = useState(false);
  const [submitError, setSubmitError]   = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [regSire, setRegSire]           = useState<DogOption | null>(null);
  const [regDam,  setRegDam]            = useState<DogOption | null>(null);
  const [dateOfWhelping, setDateOfWhelping] = useState("");
  const [inspCheck, setInspCheck]       = useState<LitterInspectionCheck | null>(null);
  const [inspChecking, setInspChecking] = useState(false);
  const [inspCheckError, setInspCheckError] = useState("");
  const [puppies, setPuppies] = useState<{ name: string; sex: string; color: string }[]>([
    { name: "", sex: "Male", color: "" },
  ]);
  const updatePuppy = (idx: number, field: string, val: string) =>
    setPuppies(prev => prev.map((p, i) => i === idx ? { ...p, [field]: val } : p));
  const addPuppy    = () => setPuppies(prev => [...prev, { name: "", sex: "Male", color: "" }]);
  const removePuppy = (idx: number) => setPuppies(prev => prev.filter((_, i) => i !== idx));

  useEffect(() => {
    if (!regSire || !regDam || !dateOfWhelping) { setInspCheck(null); setInspCheckError(""); return; }
    const [dd, mm, yyyy] = dateOfWhelping.split("-");
    const apiDate = `${yyyy}-${mm}-${dd}`;
    let cancelled = false;
    setInspChecking(true);
    setInspCheck(null);
    setInspCheckError("");
    checkLitterInspection(regSire.id, regDam.id, apiDate)
      .then(result => { if (!cancelled) { setInspCheck(result); setInspCheckError(""); } })
      .catch((e: any) => { if (!cancelled) setInspCheckError(e.message ?? "Verification failed"); })
      .finally(() => { if (!cancelled) setInspChecking(false); });
    return () => { cancelled = true; };
  }, [regSire?.id, regDam?.id, dateOfWhelping]);

  const { data: regMemberDetail } = useQuery<MemberDetail>({
    queryKey: ["member-detail", user ? `member-${user.id}` : null],
    queryFn: () => fetchMemberDetail(`member-${user!.id}`),
    enabled: !!user,
    staleTime: 300_000,
  });
  const allRegOwnedDogs: MemberOwnedDog[] = regMemberDetail?.ownedDogs?.length
    ? regMemberDetail.ownedDogs
    : (user?.myDogs as MemberOwnedDog[] ?? []);
  const regDamOptions: DogOption[] = allRegOwnedDogs
    .filter(d => (d.sex ?? "").toLowerCase() === "female")
    .map(d => ({ id: d.id, name: d.dog_name, KP: d.KP, foreign_reg_no: d.foreign_reg_no ?? null, sex: d.sex, color: d.color }));

  const REG_PER_PAGE = 10;
  const [allRegs, setAllRegs]             = useState<LitterRegistration[]>([]);
  const [regTotal, setRegTotal]           = useState(0);
  const [regPage, setRegPage]             = useState(1);
  const [loadingMoreReg, setLoadingMoreReg] = useState(false);
  const [regStats, setRegStats]           = useState<LitterRegStats | null>(null);

  const { data: page1Regs, isLoading, error: listError, refetch } = useQuery({
    queryKey: ["litter-registrations", user?.id],
    queryFn: () => fetchLitterRegistrations(user!.id, 1, REG_PER_PAGE),
    enabled: !!user,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (page1Regs) {
      setAllRegs(page1Regs.registrations);
      setRegTotal(page1Regs.total);
      setRegPage(1);
      setRegStats(page1Regs.stats);
    }
  }, [page1Regs]);

  const loadMoreRegs = async () => {
    if (loadingMoreReg || allRegs.length >= regTotal) return;
    setLoadingMoreReg(true);
    try {
      const res = await fetchLitterRegistrations(user!.id, regPage + 1, REG_PER_PAGE);
      setAllRegs(prev => [...prev, ...res.registrations]);
      setRegPage(prev => prev + 1);
    } finally {
      setLoadingMoreReg(false);
    }
  };

  const { data: detail, isLoading: detailLoading } = useQuery<LitterRegistrationDetail>({
    queryKey: ["litter-registration-detail", selectedId],
    queryFn: () => fetchLitterRegistrationDetail(selectedId!, user!.id),
    enabled: !!selectedId && !!user,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const handleSubmit = async () => {
    if (!regSire)                    { setSubmitError("Sire dog is required."); return; }
    if (!regDam)                     { setSubmitError("Dam dog is required."); return; }
    if (!dateOfWhelping.trim())      { setSubmitError("Whelping date is required."); return; }
    if (puppies.length === 0)        { setSubmitError("Add at least one puppy."); return; }
    const badIdx = puppies.findIndex(p => !p.name.trim());
    if (badIdx !== -1)               { setSubmitError(`Puppy ${badIdx + 1} needs a name.`); return; }
    const parsedSireId = parseInt(String(regSire.id).replace(/^dog-/, ""), 10);
    const parsedDamId  = parseInt(String(regDam.id).replace(/^dog-/, ""), 10);
    if (isNaN(parsedSireId)) { setSubmitError("Could not resolve sire dog ID. Please re-select the sire and try again."); return; }
    if (isNaN(parsedDamId))  { setSubmitError("Could not resolve dam dog ID. Please re-select the dam and try again."); return; }
    setSubmitError("");
    setSubmitting(true);
    const [dd, mm, yyyy] = dateOfWhelping.split("-");
    const whelpingApiDate = `${yyyy}-${mm}-${dd}`;
    const malePups   = String(puppies.filter(p => p.sex === "Male").length);
    const femalePups = String(puppies.filter(p => p.sex === "Female").length);
    try {
      await submitLitterRegistration({
        user_id:          user!.id,
        kennel_id:        user!.myKennel?.kennel_id ?? null,
        sire_id:          parsedSireId,
        sire_name:        regSire.name,
        sire_kp:          regSire.KP,
        dam_id:           parsedDamId,
        dam_name:         regDam.name,
        dam_kp:           regDam.KP,
        date_of_whelping: whelpingApiDate,
        male_pups:        malePups,
        female_pups:      femalePups,
        remarks:          "",
        puppies:          puppies.map(p => ({ name: p.name.trim(), sex: p.sex, color: p.color.trim() })),
      });
      setRegSire(null);
      setRegDam(null);
      setDateOfWhelping("");
      setPuppies([{ name: "", sex: "Male", color: "" }]);
      setInspCheck(null);
      setInspCheckError("");
      setShowForm(false);
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 5000);
      refetch();
    } catch (e: any) {
      setSubmitError(e.message ?? "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Detail view ── */
  if (selectedId) {
    return (
      <View style={styles.card}>
        <FormBackBtn onPress={() => setSelectedId(null)} />
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <Text style={styles.cardHeading}>Litter Registration</Text>
          {detail && (() => {
            const dApproved = detail.status === "Approved";
            const dGranted  = detail.status === "Permission Granted";
            const dRejected = detail.status === "Rejected";
            const dBg   = dApproved ? "#DCFCE7" : dRejected ? "#FEE2E2" : dGranted ? "#EFF6FF" : "#FEF9C3";
            const dTxt  = dApproved ? "#166534" : dRejected ? "#991B1B" : dGranted ? "#1D4ED8" : "#854D0E";
            return (
              <View style={[tStyles.statusPill, { backgroundColor: dBg }]}>
                <Text style={[tStyles.statusPillText, { color: dTxt }]}>{detail.status ?? "Pending"}</Text>
              </View>
            );
          })()}
        </View>

        {detailLoading ? (
          <ActivityIndicator style={{ marginVertical: 32 }} color={COLORS.primary} />
        ) : detail ? (
          <>
            {detail.registration_no && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12, padding: 10, backgroundColor: "#F0FDF4", borderRadius: 8 }}>
                <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
                <Text style={{ fontSize: 13, color: "#166534", fontWeight: "600" }}>Reg No: {detail.registration_no}</Text>
              </View>
            )}
            <FormSection title="SIRE" />
            <DogListItem
              dog={certDogToDog(detail.sire, "Male")}
              onPress={() => navigation.push("DogProfile", { id: detail.sire.id, name: detail.sire.name })}
            />
            <View style={styles.divider} />
            <FormSection title="DAM" />
            <DogListItem
              dog={certDogToDog(detail.dam, "Female")}
              onPress={() => navigation.push("DogProfile", { id: detail.dam.id, name: detail.dam.name })}
            />
            <View style={styles.divider} />

            {/* Pup count boxes — derive from puppies array if counts are 0 */}
            {(() => {
              const pups = detail.puppies ?? [];
              const males   = pups.filter(p => p.sex === "Male").length   || detail.male_puppies   || 0;
              const females = pups.filter(p => p.sex === "Female").length || detail.female_puppies || 0;
              const total   = pups.length || detail.puppy_count || 0;
              return (
                <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
                  {[
                    { label: "Male",   value: males,   color: COLORS.primary },
                    { label: "Female", value: females, color: "#9333EA" },
                    { label: "Total",  value: total,   color: COLORS.accent },
                  ].map(({ label, value, color }) => (
                    <View key={label} style={tStyles.pupCountBox}>
                      <Text style={[tStyles.pupCountNum, { color }]}>{value}</Text>
                      <Text style={tStyles.pupCountLabel}>{label}</Text>
                    </View>
                  ))}
                </View>
              );
            })()}

            {detail.dob && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <Ionicons name="calendar-outline" size={15} color={COLORS.textMuted} />
                <Text style={tStyles.certDate}>Whelped: {formatDate(detail.dob)}</Text>
              </View>
            )}

            {/* Puppies list */}
            {detail.puppies && detail.puppies.length > 0 && (
              <>
                <View style={styles.divider} />
                <FormSection title={`PUPPIES (${detail.puppies.length})`} />
                {detail.puppies.map((pup, i) => {
                  const isDead = pup.dead_check === "1" || pup.dead_check === 1 || (pup.dead_check as any) === true;
                  const dogId  = pup.dog_id ? `dog-${pup.dog_id}` : null;
                  const sexColor = pup.sex === "Male" ? COLORS.primary : "#9333EA";
                  const Row = dogId ? TouchableOpacity : View;
                  return (
                    <Row
                      key={pup.id}
                      {...(dogId ? {
                        onPress: () => navigation.push("DogProfile", { id: dogId, name: pup.name }),
                        activeOpacity: 0.7,
                      } : {})}
                      style={[
                        { flexDirection: "row", alignItems: "center", paddingVertical: 8, gap: 10 },
                        i < detail.puppies.length - 1 && { borderBottomWidth: 1, borderBottomColor: COLORS.border },
                        isDead && { opacity: 0.5 },
                      ]}
                    >
                      <View style={{
                        width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center",
                        backgroundColor: isDead ? "#F1F5F9" : pup.sex === "Male" ? `${COLORS.primary}18` : "#F3E8FF",
                      }}>
                        <Ionicons
                          name={isDead ? "skull-outline" : pup.sex === "Male" ? "male" : "female"}
                          size={14}
                          color={isDead ? COLORS.textMuted : sexColor}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          <Text style={{ fontSize: 13, fontWeight: "600", color: isDead ? COLORS.textMuted : COLORS.text }}>
                            {pup.name}
                          </Text>
                          {isDead && (
                            <View style={{ backgroundColor: "#FEE2E2", paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8 }}>
                              <Text style={{ fontSize: 9, fontWeight: "700", color: "#991B1B", letterSpacing: 0.3 }}>DECEASED</Text>
                            </View>
                          )}
                        </View>
                        {pup.color && <Text style={{ fontSize: 11, color: COLORS.textMuted }}>{pup.color}</Text>}
                      </View>
                      <View style={{ alignItems: "flex-end", gap: 3 }}>
                        {pup.microchip
                          ? <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                              <Ionicons name="checkmark-circle" size={12} color="#16A34A" />
                              <Text style={{ fontSize: 10, color: "#16A34A", fontWeight: "600" }}>Chipped</Text>
                            </View>
                          : <Text style={{ fontSize: 10, color: COLORS.textMuted }}>No chip</Text>}
                        {pup.DNA_taken === "Yes" && (
                          <Text style={{ fontSize: 10, color: COLORS.accent, fontWeight: "600" }}>DNA ✓</Text>
                        )}
                        {dogId && <Ionicons name="chevron-forward" size={13} color="#CBD5E1" />}
                      </View>
                    </Row>
                  );
                })}
              </>
            )}
          </>
        ) : (
          <Text style={tStyles.emptyRowText}>Could not load registration details.</Text>
        )}
      </View>
    );
  }

  /* ── Form view ── */
  if (showForm) {
    return (
      <View style={styles.card}>
        <FormBackBtn onPress={() => { setShowForm(false); setSubmitError(""); }} />
        <Text style={styles.cardHeading}>New Litter Registration</Text>

        <FormSection title="SIRE" />
        <DogDropdown
          label="Sire Dog" required
          mode="remote" sexFilter="male"
          selected={regSire}
          onSelect={setRegSire}
          onClear={() => setRegSire(null)}
        />

        <View style={styles.divider} />
        <FormSection title="DAM" />
        <DogDropdown
          label="Dam Dog" required
          mode="local"
          localOptions={regDamOptions}
          selected={regDam}
          onSelect={setRegDam}
          onClear={() => setRegDam(null)}
        />

        <View style={styles.divider} />
        <FormSection title="LITTER DETAILS" />
        <CalendarDatePicker label="Date of Whelping" required value={dateOfWhelping} onChange={setDateOfWhelping} />

        {/* Inspection verification banner */}
        {(inspChecking || inspCheck || inspCheckError) && (
          <View style={{
            flexDirection: "row", alignItems: "center", gap: 8,
            borderRadius: 10, padding: 12, marginTop: 8,
            backgroundColor: inspChecking
              ? "#F1F5F9"
              : inspCheck?.found
                ? "#F0FDF4"
                : "#FFF7ED",
            borderWidth: 1,
            borderColor: inspChecking
              ? COLORS.border
              : inspCheck?.found
                ? "#86EFAC"
                : "#FED7AA",
          }}>
            {inspChecking
              ? <ActivityIndicator size="small" color={COLORS.primary} />
              : <Ionicons
                  name={inspCheck?.found ? "checkmark-circle" : "warning"}
                  size={18}
                  color={inspCheck?.found ? "#16A34A" : "#EA580C"}
                />
            }
            <View style={{ flex: 1 }}>
              {inspChecking
                ? <Text style={{ fontSize: 13, color: COLORS.textMuted }}>Verifying litter inspection…</Text>
                : inspCheck?.found
                  ? <View>
                      <Text style={{ fontSize: 13, fontWeight: "700", color: "#15803D" }}>Litter inspection verified</Text>
                      {inspCheck.matingDate
                        ? <Text style={{ fontSize: 11, color: "#16A34A", marginTop: 1 }}>{"Mating date: " + inspCheck.matingDate}</Text>
                        : null}
                    </View>
                  : <Text style={{ fontSize: 13, fontWeight: "600", color: "#C2410C" }}>{inspCheckError || (inspCheck ? inspCheck.message : "") || "No matching litter inspection found"}</Text>
              }
            </View>
          </View>
        )}

        {inspCheck?.found && (
        <View>
        <View style={styles.divider} />
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <FormSection title={`PUPPIES (${puppies.length})`} />
          <TouchableOpacity
            onPress={addPuppy}
            activeOpacity={0.7}
            style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8, backgroundColor: `${COLORS.primary}12` }}
          >
            <Ionicons name="add-circle-outline" size={16} color={COLORS.primary} />
            <Text style={{ fontSize: 12, fontWeight: "700", color: COLORS.primary }}>Add Puppy</Text>
          </TouchableOpacity>
        </View>

        {puppies.map((pup, idx) => (
          <View key={idx} style={{ borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, marginBottom: 10, backgroundColor: "#FAFAFA" }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: COLORS.textMuted }}>PUPPY {idx + 1}</Text>
              {puppies.length > 1 && (
                <TouchableOpacity onPress={() => removePuppy(idx)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="trash-outline" size={15} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>

            {/* Name */}
            <FormField
              label="Name" required
              value={pup.name}
              onChangeText={v => updatePuppy(idx, "name", v)}
              placeholder="Puppy name"
            />

            {/* Sex toggle */}
            <Text style={{ fontSize: 13, fontWeight: "600", color: "#334155", marginBottom: 6 }}>
              Gender <Text style={{ color: COLORS.error }}>*</Text>
            </Text>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
              {["Male", "Female"].map(s => (
                <TouchableOpacity
                  key={s}
                  onPress={() => updatePuppy(idx, "sex", s)}
                  activeOpacity={0.7}
                  style={{
                    flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center",
                    borderWidth: 1.5,
                    borderColor: pup.sex === s ? (s === "Male" ? COLORS.primary : "#9333EA") : COLORS.border,
                    backgroundColor: pup.sex === s ? (s === "Male" ? `${COLORS.primary}15` : "#9333EA15") : "#fff",
                  }}
                >
                  <Ionicons
                    name={s === "Male" ? "male" : "female"}
                    size={14}
                    color={pup.sex === s ? (s === "Male" ? COLORS.primary : "#9333EA") : COLORS.textMuted}
                  />
                  <Text style={{ fontSize: 12, fontWeight: "600", marginTop: 2, color: pup.sex === s ? (s === "Male" ? COLORS.primary : "#9333EA") : COLORS.textMuted }}>
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Color */}
            <Text style={{ fontSize: 13, fontWeight: "600", color: "#334155", marginBottom: 6 }}>Color</Text>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
              {["Black - Brown", "Black", "Sable"].map(c => (
                <TouchableOpacity
                  key={c}
                  onPress={() => updatePuppy(idx, "color", c)}
                  activeOpacity={0.7}
                  style={{
                    paddingVertical: 7, paddingHorizontal: 14, borderRadius: 8, alignItems: "center",
                    borderWidth: 1.5,
                    borderColor: pup.color === c ? COLORS.primary : COLORS.border,
                    backgroundColor: pup.color === c ? `${COLORS.primary}15` : "#fff",
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: "600", color: pup.color === c ? COLORS.primary : COLORS.textMuted }}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
        </View>
        )}

        {!!submitError && <Text style={tStyles.errorText}>{submitError}</Text>}
        <SubmitBtn
          label={submitting ? "Submitting…" : "Submit Litter Registration"}
          onPress={handleSubmit}
          disabled={
            !inspCheck?.found ||
            submitting ||
            !regSire ||
            !regDam ||
            !dateOfWhelping ||
            puppies.length === 0 ||
            puppies.some(p => !p.name.trim())
          }
        />
      </View>
    );
  }

  /* ── List view ── */
  return (
    <View style={styles.card}>
      <ListHeader title="Litter Registrations" onNew={() => setShowForm(true)} />
      {submitSuccess && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12, padding: 12, borderRadius: 10, backgroundColor: "#DCFCE7" }}>
          <Ionicons name="checkmark-circle" size={18} color="#16A34A" />
          <Text style={{ fontSize: 13, fontWeight: "600", color: "#166534" }}>Litter registration submitted successfully.</Text>
        </View>
      )}

      {regStats && (
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
          {[
            { label: "Submitted",    value: regStats.submitted,   bg: "#EFF6FF", text: "#1D4ED8" },
            { label: "Approved",     value: regStats.approved,    bg: "#F0FDF4", text: "#166534" },
            { label: "Rejected",     value: regStats.rejected,    bg: "#FEF2F2", text: "#991B1B" },
            { label: "Microchipped", value: regStats.microchipped, bg: "#FEF9C3", text: "#854D0E" },
          ].map(({ label, value, bg, text }) => (
            <View key={label} style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, backgroundColor: bg }}>
              <Text style={{ fontSize: 12, fontWeight: "600", color: text }}>{value} {label}</Text>
            </View>
          ))}
        </View>
      )}

      {isLoading ? (
        <ActivityIndicator style={{ marginVertical: 24 }} color={COLORS.primary} />
      ) : listError ? (
        <View style={tStyles.emptyRow}>
          <Ionicons name="alert-circle-outline" size={20} color="#EF4444" />
          <Text style={[tStyles.emptyRowText, { color: "#EF4444" }]}>Could not load registrations</Text>
        </View>
      ) : allRegs.length === 0 ? (
        <View style={tStyles.emptyRow}>
          <Ionicons name="document-text-outline" size={20} color={COLORS.textMuted} />
          <Text style={tStyles.emptyRowText}>No litter registrations yet</Text>
        </View>
      ) : (
        <View style={tStyles.certList}>
          {allRegs.map((item, i) => {
            const males   = item.male_puppies   ?? 0;
            const females = item.female_puppies ?? 0;
            const total   = item.puppy_count != null && item.puppy_count > 0
              ? item.puppy_count
              : males + females;
            const isApproved = item.status === "Approved";
            const isGranted  = item.status === "Permission Granted";
            const isRejected = item.status === "Rejected";
            const pillBg   = isApproved ? "#DCFCE7" : isRejected ? "#FEE2E2" : isGranted ? "#EFF6FF" : "#FEF9C3";
            const pillText = isApproved ? "#166534" : isRejected ? "#991B1B" : isGranted ? "#1D4ED8" : "#854D0E";
            return (
              <TouchableOpacity
                key={item.id}
                style={[tStyles.certRow, i < allRegs.length - 1 && tStyles.certRowBorder]}
                onPress={() => setSelectedId(item.id)}
                activeOpacity={0.7}
              >
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Ionicons name="male" size={12} color={COLORS.primary} />
                    <Text style={tStyles.certSire} numberOfLines={1}>{item.sire.name}</Text>
                  </View>
                  <Text style={tStyles.certKP} numberOfLines={1}>KP {item.sire.KP}</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
                    <Ionicons name="female" size={12} color="#9333EA" />
                    <Text style={tStyles.certDam} numberOfLines={1}>{item.dam.name}</Text>
                  </View>
                  <Text style={tStyles.certKP} numberOfLines={1}>KP {item.dam.KP}</Text>
                  {/* Puppy count chips */}
                  <View style={{ flexDirection: "row", gap: 4, marginTop: 6 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: `${COLORS.primary}12`, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 }}>
                      <Ionicons name="male" size={10} color={COLORS.primary} />
                      <Text style={{ fontSize: 11, fontWeight: "700", color: COLORS.primary }}>{males}</Text>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "#F3E8FF", paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 }}>
                      <Ionicons name="female" size={10} color="#9333EA" />
                      <Text style={{ fontSize: 11, fontWeight: "700", color: "#9333EA" }}>{females}</Text>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "#F1F5F9", paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 }}>
                      <Text style={{ fontSize: 11, fontWeight: "700", color: COLORS.textMuted }}>{total} total</Text>
                    </View>
                  </View>
                </View>
                <View style={{ alignItems: "flex-end", gap: 6, marginLeft: 8 }}>
                  <View style={[tStyles.statusPill, { backgroundColor: pillBg }]}>
                    <Text style={[tStyles.statusPillText, { color: pillText }]}>{item.status ?? "Pending"}</Text>
                  </View>
                  {item.whelping_date && <Text style={tStyles.certDate}>{formatDate(item.whelping_date)}</Text>}
                  <Ionicons name="chevron-forward" size={14} color="#CBD5E1" />
                </View>
              </TouchableOpacity>
            );
          })}
          {allRegs.length < regTotal && (
            <TouchableOpacity style={tStyles.loadMoreBtn} onPress={loadMoreRegs} disabled={loadingMoreReg} activeOpacity={0.7}>
              {loadingMoreReg
                ? <ActivityIndicator size="small" color={COLORS.primary} />
                : <Text style={tStyles.loadMoreText}>Load more ({regTotal - allRegs.length} remaining)</Text>}
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

/* ── Tab: HD/ED Registration ────────────────────────── */
const HD_GRADES = ["Normal", "Fast Normal", "Noch Zugelassen", "Mittlere HD", "Schwere HD"];
const ED_GRADES = ["ED-Normal (0)", "ED Grade 1", "ED Grade 2", "ED Grade 3"];

function GradeSelector({
  label, required, value, options, onChange,
}: {
  label: string; required?: boolean; value: string; options: string[]; onChange: (v: string) => void;
}) {
  return (
    <View style={fStyles.field}>
      <Text style={fStyles.label}>
        {label}{required ? <Text style={fStyles.required}> *</Text> : null}
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {options.map((opt) => {
          const active = value === opt;
          return (
            <TouchableOpacity
              key={opt}
              activeOpacity={0.75}
              onPress={() => onChange(opt)}
              style={{
                paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
                backgroundColor: active ? COLORS.primary : "rgba(15,92,59,0.07)",
                borderWidth: 1, borderColor: active ? COLORS.primary : COLORS.border,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "600", color: active ? "#fff" : COLORS.textMuted }}>
                {opt}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const hdedStyles = StyleSheet.create({
  card: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 12, paddingHorizontal: 2,
    borderBottomWidth: 1, borderBottomColor: "#F1F5F9", gap: 12,
  },
  cardLeft: { justifyContent: "center" },
  iconBox: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: "rgba(15,92,59,0.08)",
    justifyContent: "center", alignItems: "center",
  },
  cardBody: { flex: 1, gap: 2 },
  dogName: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  dogKP: { fontSize: 12, color: COLORS.textMuted },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 3 },
  dateText: { fontSize: 12, color: COLORS.textMuted },
  cardRight: { alignItems: "flex-end", justifyContent: "center", gap: 2 },
});

function HDEDTab() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [selectedDog, setSelectedDog] = useState<DogOption | null>(null);
  const [form, setForm] = useState({ hd_grade: "", ed_grade: "", xray_date: "", certificate_no: "", institute: "", remarks: "" });
  const set = (key: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [key]: v }));

  const { data: memberDetail } = useQuery<MemberDetail>({
    queryKey: ["member-detail", user ? `member-${user.id}` : null],
    queryFn: () => fetchMemberDetail(`member-${user!.id}`),
    enabled: !!user,
    staleTime: 300_000,
  });
  const allOwnedDogs: MemberOwnedDog[] = memberDetail?.ownedDogs?.length
    ? memberDetail.ownedDogs
    : (user?.myDogs as MemberOwnedDog[] ?? []);
  const dogOptions: DogOption[] = allOwnedDogs.map(d => ({
    id: d.id, name: d.dog_name, KP: d.KP, foreign_reg_no: d.foreign_reg_no ?? null, sex: d.sex, color: d.color,
  }));

  const { data: hdedRequests = [], isLoading: requestsLoading, refetch: refetchRequests } = useQuery<HDEDRequest[]>({
    queryKey: ["hded-requests", user?.id],
    queryFn: () => fetchHDEDRequests(user!.id),
    enabled: !!user,
    staleTime: 30_000,
  });

  const resetForm = () => {
    setSelectedDog(null);
    setForm({ hd_grade: "", ed_grade: "", xray_date: "", certificate_no: "", institute: "", remarks: "" });
    setSubmitError("");
  };

  const handleSubmit = async () => {
    if (!selectedDog)          { setSubmitError("Please select a dog."); return; }
    if (!form.hd_grade)        { setSubmitError("HD grade is required."); return; }
    if (!form.ed_grade)        { setSubmitError("ED grade is required."); return; }
    if (!form.xray_date.trim()) { setSubmitError("X-Ray date is required."); return; }
    setSubmitError("");
    setSubmitting(true);
    try {
      await submitHDEDRegistration({
        user_id:        user!.id,
        dog_id:         parseInt(selectedDog.id.replace(/^dog-/, ""), 10),
        hd_grade:       form.hd_grade,
        ed_grade:       form.ed_grade,
        xray_date:      form.xray_date,
        certificate_no: form.certificate_no.trim() || undefined,
        institute:      form.institute.trim() || undefined,
        remarks:        form.remarks.trim() || undefined,
      }, user!.token);
      resetForm();
      setShowForm(false);
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 5000);
      refetchRequests();
    } catch (e: any) {
      setSubmitError(e.message ?? "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (showForm) {
    return (
      <View style={styles.card}>
        <FormBackBtn onPress={() => { setShowForm(false); resetForm(); }} />
        <Text style={styles.cardHeading}>New HD/ED Registration</Text>

        <FormSection title="DOG" />
        <DogDropdown
          label="Select Dog"
          required
          mode="local"
          localOptions={dogOptions}
          selected={selectedDog}
          onSelect={setSelectedDog}
          onClear={() => setSelectedDog(null)}
        />

        <View style={styles.divider} />
        <FormSection title="HIP DYSPLASIA (HD)" />
        <GradeSelector label="HD Grade" required value={form.hd_grade} options={HD_GRADES} onChange={set("hd_grade")} />

        <View style={styles.divider} />
        <FormSection title="ELBOW DYSPLASIA (ED)" />
        <GradeSelector label="ED Grade" required value={form.ed_grade} options={ED_GRADES} onChange={set("ed_grade")} />

        <View style={styles.divider} />
        <FormSection title="X-RAY DETAILS" />
        <CalendarDatePicker label="X-Ray Date" required value={form.xray_date} onChange={set("xray_date")} />
        <FormField label="Certificate Number" value={form.certificate_no} onChangeText={set("certificate_no")} placeholder="e.g. HD-2024-001" />
        <FormField label="Institute / Clinic" value={form.institute} onChangeText={set("institute")} placeholder="Name of veterinary institute" />
        <FormField label="Remarks" value={form.remarks} onChangeText={set("remarks")} placeholder="Optional remarks" multiline />

        {!!submitError && <Text style={tStyles.errorText}>{submitError}</Text>}
        <SubmitBtn
          label={submitting ? "Submitting…" : "Submit HD/ED Registration"}
          onPress={handleSubmit}
          disabled={submitting}
        />
      </View>
    );
  }

  const statusColors = (status: string | null) => {
    const s = (status ?? "").toLowerCase();
    if (s === "approved") return { bg: "#DCFCE7", text: "#166534" };
    if (s === "rejected") return { bg: "#FEE2E2", text: "#991B1B" };
    return { bg: "#FEF9C3", text: "#854D0E" };
  };

  return (
    <View style={styles.card}>
      <ListHeader title="HD/ED Requests" onNew={() => { resetForm(); setShowForm(true); }} />
      {submitSuccess && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12, padding: 12, borderRadius: 10, backgroundColor: "#DCFCE7" }}>
          <Ionicons name="checkmark-circle" size={18} color="#16A34A" />
          <Text style={{ fontSize: 13, fontWeight: "600", color: "#166534" }}>HD/ED request submitted successfully.</Text>
        </View>
      )}
      {requestsLoading ? (
        <ActivityIndicator style={{ marginVertical: 24 }} color={COLORS.primary} />
      ) : hdedRequests.length === 0 ? (
        <View style={tStyles.emptyRow}>
          <Ionicons name="document-outline" size={20} color={COLORS.textMuted} />
          <Text style={tStyles.emptyRowText}>No HD/ED requests yet</Text>
        </View>
      ) : (
        <View style={tStyles.certList}>
          {hdedRequests.map((r) => (
            <TouchableOpacity
              key={r.id}
              activeOpacity={0.7}
              onPress={() => r.dog && navigation.push("DogProfile", { id: r.dog.id, name: r.dog.name })}
              style={hdedStyles.card}
            >
              <View style={hdedStyles.cardLeft}>
                <View style={hdedStyles.iconBox}>
                  <Ionicons name="fitness-outline" size={18} color={COLORS.primary} />
                </View>
              </View>
              <View style={hdedStyles.cardBody}>
                <Text style={hdedStyles.dogName} numberOfLines={1}>{r.dog?.name?.trim() ?? "—"}</Text>
                <Text style={hdedStyles.dogKP}>
                  {r.dog?.KP ? `KP: ${r.dog.KP}` : r.dog?.foreign_reg_no ?? ""}
                </Text>
                {r.appointment_date ? (
                  <View style={hdedStyles.dateRow}>
                    <Ionicons name="calendar-outline" size={11} color={COLORS.textMuted} />
                    <Text style={hdedStyles.dateText}>
                      {formatDate(r.appointment_date)}
                      {r.appointment_time ? `  ·  ${r.appointment_time.slice(0, 5)}` : ""}
                    </Text>
                  </View>
                ) : null}
              </View>
              <View style={hdedStyles.cardRight}>
                {r.status ? (
                  <View style={[tStyles.statusPill, { backgroundColor: statusColors(r.status).bg, marginBottom: 6 }]}>
                    <Text style={[tStyles.statusPillText, { color: statusColors(r.status).text }]}>{r.status}</Text>
                  </View>
                ) : null}
                <Ionicons name="chevron-forward" size={14} color={COLORS.textMuted} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

/* ── Tab: Single Dog Registration ───────────────────── */
const SEX_OPTIONS = ["Male", "Female"];
const HAIR_OPTIONS = ["Short (S)", "Long (L)"];
const COLOR_OPTIONS = ["Black & Tan", "Sable", "Black & Gold", "Bi-Color", "All Black", "All White", "Other"];

function OptionPillSelector({
  label, required, value, options, onChange,
}: {
  label: string; required?: boolean; value: string; options: string[]; onChange: (v: string) => void;
}) {
  return (
    <View style={fStyles.field}>
      <Text style={fStyles.label}>
        {label}{required ? <Text style={fStyles.required}> *</Text> : null}
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {options.map((opt) => {
          const active = value === opt;
          return (
            <TouchableOpacity
              key={opt}
              activeOpacity={0.75}
              onPress={() => onChange(opt)}
              style={{
                paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
                backgroundColor: active ? COLORS.primary : "rgba(15,92,59,0.07)",
                borderWidth: 1, borderColor: active ? COLORS.primary : COLORS.border,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: "600", color: active ? "#fff" : COLORS.textMuted }}>
                {opt}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function SingleDogRegTab() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [selectedSire, setSelectedSire] = useState<DogOption | null>(null);
  const [selectedDam,  setSelectedDam]  = useState<DogOption | null>(null);

  const [form, setForm] = useState({
    dog_name: "", sex: "", color: "", hair: "", date_of_birth: "",
    microchip: "", foreign_reg_no: "", remarks: "",
  });
  const set = (key: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [key]: v }));

  const [allRegs, setAllRegs] = useState<SingleDogRegistration[]>([]);
  const [regTotal, setRegTotal] = useState(0);
  const [regPage, setRegPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const REG_PER_PAGE = 10;

  const { data: page1, isLoading: regsLoading, refetch } = useQuery({
    queryKey: ["single-dog-registrations", user?.id],
    queryFn: () => fetchSingleDogRegistrations(user!.id, 1, REG_PER_PAGE),
    enabled: !!user,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (page1) { setAllRegs(page1.registrations); setRegTotal(page1.total); setRegPage(1); }
  }, [page1]);

  const loadMore = async () => {
    if (loadingMore || allRegs.length >= regTotal) return;
    setLoadingMore(true);
    try {
      const res = await fetchSingleDogRegistrations(user!.id, regPage + 1, REG_PER_PAGE);
      setAllRegs(prev => [...prev, ...res.registrations]);
      setRegPage(p => p + 1);
    } finally { setLoadingMore(false); }
  };

  const resetForm = () => {
    setSelectedSire(null);
    setSelectedDam(null);
    setForm({ dog_name: "", sex: "", color: "", hair: "", date_of_birth: "", microchip: "", foreign_reg_no: "", remarks: "" });
    setSubmitError("");
  };

  const hairApiValue = (h: string) => {
    if (h.startsWith("Short")) return "S";
    if (h.startsWith("Long")) return "L";
    return h;
  };

  const handleSubmit = async () => {
    if (!form.dog_name.trim()) { setSubmitError("Dog name is required."); return; }
    if (!form.sex)             { setSubmitError("Sex is required."); return; }
    if (!form.color)           { setSubmitError("Color is required."); return; }
    if (!form.hair)            { setSubmitError("Hair type is required."); return; }
    if (!form.date_of_birth.trim()) { setSubmitError("Date of birth is required."); return; }
    setSubmitError("");
    setSubmitting(true);
    try {
      await submitSingleDogRegistration({
        user_id:        user!.id,
        dog_name:       form.dog_name.trim(),
        sex:            form.sex,
        color:          form.color,
        hair:           hairApiValue(form.hair),
        date_of_birth:  form.date_of_birth,
        microchip:      form.microchip.trim() || undefined,
        foreign_reg_no: form.foreign_reg_no.trim() || undefined,
        sire_id:        selectedSire ? parseInt(selectedSire.id.replace(/^dog-/, ""), 10) : undefined,
        sire_name:      selectedSire?.name || undefined,
        sire_kp:        selectedSire?.KP || undefined,
        dam_id:         selectedDam ? parseInt(selectedDam.id.replace(/^dog-/, ""), 10) : undefined,
        dam_name:       selectedDam?.name || undefined,
        dam_kp:         selectedDam?.KP || undefined,
        remarks:        form.remarks.trim() || undefined,
      }, user!.token);
      resetForm();
      setShowForm(false);
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 5000);
      refetch();
    } catch (e: any) {
      setSubmitError(e.message ?? "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (showForm) {
    return (
      <View style={styles.card}>
        <FormBackBtn onPress={() => { setShowForm(false); resetForm(); }} />
        <Text style={styles.cardHeading}>Single Dog Registration</Text>

        <FormSection title="DOG INFORMATION" />
        <FormField label="Dog Name" required value={form.dog_name} onChangeText={set("dog_name")} placeholder="Full registered name" />
        <OptionPillSelector label="Sex" required value={form.sex} options={SEX_OPTIONS} onChange={set("sex")} />
        <OptionPillSelector label="Coat Color" required value={form.color} options={COLOR_OPTIONS} onChange={set("color")} />
        <OptionPillSelector label="Hair Type" required value={form.hair} options={HAIR_OPTIONS} onChange={set("hair")} />
        <CalendarDatePicker label="Date of Birth" required value={form.date_of_birth} onChange={set("date_of_birth")} />

        <View style={styles.divider} />
        <FormSection title="IDENTIFICATION (OPTIONAL)" />
        <FormField label="Microchip Number" value={form.microchip} onChangeText={set("microchip")} placeholder="15-digit microchip number" keyboardType="numeric" />
        <FormField label="Foreign Registration No." value={form.foreign_reg_no} onChangeText={set("foreign_reg_no")} placeholder="e.g. SZ 123456" />

        <View style={styles.divider} />
        <FormSection title="SIRE (OPTIONAL)" />
        <DogDropdown
          label="Sire"
          mode="remote"
          sexFilter="Male"
          selected={selectedSire}
          onSelect={setSelectedSire}
          onClear={() => setSelectedSire(null)}
        />

        <View style={styles.divider} />
        <FormSection title="DAM (OPTIONAL)" />
        <DogDropdown
          label="Dam"
          mode="remote"
          sexFilter="Female"
          selected={selectedDam}
          onSelect={setSelectedDam}
          onClear={() => setSelectedDam(null)}
        />

        <View style={styles.divider} />
        <FormSection title="ADDITIONAL NOTES" />
        <FormField label="Remarks" value={form.remarks} onChangeText={set("remarks")} placeholder="Any additional information" multiline />

        {!!submitError && <Text style={tStyles.errorText}>{submitError}</Text>}
        <SubmitBtn
          label={submitting ? "Submitting…" : "Submit Registration"}
          onPress={handleSubmit}
          disabled={submitting}
        />
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <ListHeader title="Dog Registrations" onNew={() => { resetForm(); setShowForm(true); }} />
      {submitSuccess && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12, padding: 12, borderRadius: 10, backgroundColor: "#DCFCE7" }}>
          <Ionicons name="checkmark-circle" size={18} color="#16A34A" />
          <Text style={{ fontSize: 13, fontWeight: "600", color: "#166534" }}>Dog registration submitted successfully.</Text>
        </View>
      )}
      {regsLoading ? (
        <ActivityIndicator style={{ marginVertical: 24 }} color={COLORS.primary} />
      ) : allRegs.length === 0 ? (
        <View style={tStyles.emptyRow}>
          <Ionicons name="paw-outline" size={20} color={COLORS.textMuted} />
          <Text style={tStyles.emptyRowText}>No dog registrations yet</Text>
        </View>
      ) : (
        <View style={tStyles.certList}>
          {allRegs.map((r, i) => (
            <View
              key={r.id}
              style={[tStyles.certRow, i < allRegs.length - 1 && tStyles.certRowBorder]}
            >
              <View style={{ flex: 1 }}>
                <Text style={tStyles.certSire} numberOfLines={1}>{r.dog_name}</Text>
                <View style={{ flexDirection: "row", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                  {r.sex ? (
                    <View style={{ backgroundColor: r.sex.toLowerCase() === "male" ? "#EFF6FF" : "#FDF2F8", paddingHorizontal: 7, paddingVertical: 2, borderRadius: 9 }}>
                      <Text style={{ fontSize: 11, fontWeight: "600", color: r.sex.toLowerCase() === "male" ? "#1D4ED8" : "#9D174D" }}>{r.sex}</Text>
                    </View>
                  ) : null}
                  {r.KP ? <Text style={tStyles.certDate}>KP: {r.KP}</Text> : null}
                </View>
                {r.dob ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
                    <Ionicons name="calendar-outline" size={12} color={COLORS.textMuted} />
                    <Text style={tStyles.certDate}>DOB: {formatDate(r.dob)}</Text>
                  </View>
                ) : null}
              </View>
              {r.status ? (
                <View style={[tStyles.statusPill, { backgroundColor: r.status === "Approved" ? "#DCFCE7" : r.status === "Rejected" ? "#FEE2E2" : "#FEF9C3" }]}>
                  <Text style={[tStyles.statusPillText, { color: r.status === "Approved" ? "#166534" : r.status === "Rejected" ? "#991B1B" : "#854D0E" }]}>
                    {r.status}
                  </Text>
                </View>
              ) : null}
            </View>
          ))}
          {allRegs.length < regTotal && (
            <TouchableOpacity style={tStyles.loadMoreBtn} onPress={loadMore} disabled={loadingMore} activeOpacity={0.7}>
              {loadingMore
                ? <ActivityIndicator size="small" color={COLORS.primary} />
                : <Text style={tStyles.loadMoreText}>Load more ({regTotal - allRegs.length} remaining)</Text>}
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

/* ── Screen ─────────────────────────────────────────── */
export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const insets     = useSafeAreaInsets();
  const { user, logout, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("detail");
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoVersion, setPhotoVersion] = useState(() => Date.now());

  const { data: detail, isLoading, refetch, isRefetching } = useQuery<MemberDetail>({
    queryKey: ["member-detail", user?.member_id],
    queryFn:  () => fetchMemberDetail(user!.member_id),
    enabled:  !!user?.member_id,
    retry: 1,
  });

  async function handleChangePhoto() {
    if (Platform.OS === "web") {
      // Alert.alert is a no-op on web — open the file picker directly
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true, aspect: [1, 1], quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) await doUpload(result.assets[0].uri);
      return;
    }
    Alert.alert("Change Profile Photo", "Choose a source", [
      {
        text: "Camera",
        onPress: async () => {
          const perm = await ImagePicker.requestCameraPermissionsAsync();
          if (!perm.granted) { Alert.alert("Permission required", "Camera access is needed to take a photo."); return; }
          const result = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
          if (!result.canceled && result.assets[0]) await doUpload(result.assets[0].uri);
        },
      },
      {
        text: "Photo Library",
        onPress: async () => {
          const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!perm.granted) { Alert.alert("Permission required", "Photo library access is needed to pick a photo."); return; }
          const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
          if (!result.canceled && result.assets[0]) await doUpload(result.assets[0].uri);
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  }

  async function doUpload(uri: string) {
    if (!user) return;
    setPhotoUploading(true);
    try {
      await uploadProfilePhoto(uri, { id: user.id, phone: user.phone, email: user.email }, user.token);
      const fresh = await fetchProfileShow(user.id);
      if (fresh?.photo) await updateUser({ photo: fresh.photo });
      setPhotoVersion(Date.now());
    } catch (e: any) {
      Alert.alert("Upload failed", e.message ?? "Could not upload photo. Please try again.");
    } finally {
      setPhotoUploading(false);
    }
  }

  if (!user) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const fallbackMember: Member = {
    id:            user.member_id,
    member_name:   user.name,
    membership_no: user.membership_no ?? "",
    imageUrl:      user.photo ? `https://gsdcp.org/public/members/profile_pic/${user.photo}?v=${photoVersion}` : null,
    city:          user.city,
    country:       user.country,
  };

  const member     = detail?.member ?? fallbackMember;
  const ownedDogs  = detail?.ownedDogs ?? (user.myDogs as MemberOwnedDog[]) ?? [];
  const kennel     = detail?.kennel ?? (user.myKennel as MemberKennel | null);
  const memberName = member.member_name.trim() || "GSDCP Member";
  const initials   = getInitials(memberName);
  const hasPhoto   = isValidImage(member.imageUrl);
  const mType      = getMembershipType(member.membership_no);

  function renderTabContent() {
    if (isLoading && activeTab !== "detail") {
      return <View style={styles.loadingWrap}><ActivityIndicator size="small" color={COLORS.primary} /></View>;
    }
    switch (activeTab) {
      case "detail":               return <DetailTab detail={detail} fallbackMember={fallbackMember} email={user.email} phone={user.phone} refetchDetail={refetch} />;
      case "kennel":               return <KennelTab kennel={kennel} navigation={navigation} />;
      case "dogs":                 return <DogsTab dogs={ownedDogs} onDogPress={(dog) => navigation.push("DogProfile", { id: dog.id, name: dog.dog_name })} />;
      case "stud":                 return <StudCertTab />;
      case "litter-inspection":    return <LitterInspectionTab />;
      case "litter-registration":  return <LitterRegistrationTab />;
      case "hd-ed":                return <HDEDTab />;
      case "single-dog-reg":       return <SingleDogRegTab />;
    }
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.primary} colors={[COLORS.primary]} />}
    >
      {/* ── Hero ── */}
      <ImageBackground source={heroBg} style={styles.heroBanner} resizeMode="cover">
        <LinearGradient colors={["rgba(246,248,247,0)", "rgba(246,248,247,0.6)", "#f6f8f7"]} style={styles.heroGradient} pointerEvents="none" />
      </ImageBackground>

      {/* ── Avatar & Identity ── */}
      <View style={styles.profileSection}>
        <TouchableOpacity activeOpacity={0.85} onPress={handleChangePhoto} disabled={photoUploading} style={styles.avatarOuter}>
          {hasPhoto ? (
            <LazyImage source={{ uri: member.imageUrl! }} style={styles.avatarImage} resizeMode="cover" />
          ) : (
            <View style={styles.avatarInner}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}
          <View style={styles.avatarCameraOverlay}>
            {photoUploading
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name="camera" size={18} color="#fff" />}
          </View>
        </TouchableOpacity>
        <Text style={styles.memberName}>{memberName}</Text>
        <View style={[styles.typeBadge, { backgroundColor: mType.bg }]}>
          <Text style={[styles.typeBadgeText, { color: mType.color }]}>{mType.label}</Text>
        </View>
        <Text style={styles.memberNo}>Membership No: {member.membership_no}</Text>
        <TouchableOpacity style={styles.signOutBtn} activeOpacity={0.8} onPress={logout} data-testid="btn-sign-out">
          <Ionicons name="log-out-outline" size={14} color={COLORS.error} />
          <Text style={styles.signOutBtnText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* ── Horizontally scrollable pill tab bar ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabBar}
      >
        {TABS.map((t) => {
          const active = t.id === activeTab;
          const count  = t.id === "dogs" && !isLoading ? ownedDogs.length : null;
          return (
            <TouchableOpacity
              key={t.id}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => setActiveTab(t.id)}
              activeOpacity={0.75}
              data-testid={`tab-${t.id}`}
            >
              <Ionicons name={t.icon} size={15} color={active ? "#fff" : COLORS.textMuted} style={{ marginRight: 5 }} />
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{t.label}</Text>
              {count !== null && count > 0 && (
                <View style={[styles.tabBadge, active && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeText, active && styles.tabBadgeTextActive]}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Tab Content ── */}
      <View style={styles.contentArea}>
        {renderTabContent()}
      </View>

      <View style={{ height: 48 }} />
    </ScrollView>
  );
}

/* ── Table / list styles ────────────────────────────── */
const tStyles = StyleSheet.create({
  listHeader: {
    flexDirection: "row", alignItems: "center",
    marginBottom: 16,
  },
  listTitle: { flex: 1, fontSize: 18, fontWeight: "700", color: "#0F172A" },
  sectionHeading: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  newBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, backgroundColor: COLORS.primary,
  },
  newBtnText: { fontSize: 13, fontWeight: "700", color: "#fff" },

  table: {
    borderWidth: 1, borderColor: "#E2E8F0",
    borderRadius: 10, overflow: "hidden",
  },
  tableHeadRow: { backgroundColor: "#F1F5F9" },
  tableRow: {
    flexDirection: "row",
    paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: "#E2E8F0",
  },
  tableHeadCell: { fontSize: 10, fontWeight: "700", color: COLORS.textMuted, letterSpacing: 0.5 },
  tableCell:     { fontSize: 13, fontWeight: "500", color: "#0F172A" },

  emptyRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    justifyContent: "center", paddingVertical: 28,
  },
  emptyRowText: { fontSize: 13, color: COLORS.textMuted },

  backBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    marginBottom: 16,
  },
  backBtnText: { fontSize: 13, fontWeight: "600", color: COLORS.primary },

  errorText: {
    fontSize: 13, color: "#DC2626",
    marginTop: 8, marginBottom: 4,
    fontWeight: "500",
  },

  /* ── Cert card list ── */
  certList: {
    borderWidth: 1, borderColor: "#E2E8F0",
    borderRadius: 10, overflow: "hidden",
  },
  certRow: {
    flexDirection: "row", alignItems: "flex-start",
    paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: "#fff",
  },
  certRowBorder: {
    borderBottomWidth: 1, borderBottomColor: "#F1F5F9",
  },
  certSire: {
    fontSize: 13, fontWeight: "700", color: "#0F172A", flex: 1,
  },
  certDam: {
    fontSize: 13, fontWeight: "500", color: "#334155", flex: 1,
  },
  certKP: {
    fontSize: 11, color: COLORS.textMuted, marginLeft: 18,
  },
  certDate: {
    fontSize: 11, color: COLORS.textMuted, fontWeight: "500",
  },
  certId: {
    fontSize: 10, color: "#CBD5E1", letterSpacing: 0.3,
  },
  statusPill: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 12,
  },
  statusPillText: {
    fontSize: 11, fontWeight: "700", letterSpacing: 0.2,
  },

  /* ── Pup count boxes (litter inspection detail) ── */
  pupCountBox: {
    flex: 1, alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: 10,
    borderWidth: 1, borderColor: COLORS.border,
  },
  pupCountNum: {
    fontSize: 22, fontWeight: "700",
  },
  pupCountLabel: {
    fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginTop: 2,
  },

  /* ── Load more button ── */
  loadMoreBtn: {
    alignItems: "center", justifyContent: "center",
    paddingVertical: 12, marginTop: 4,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  loadMoreText: {
    fontSize: FONT_SIZES.sm, color: COLORS.primary, fontWeight: "600",
  },
});

/* ── Form styles ────────────────────────────────────── */
const fStyles = StyleSheet.create({
  section: {
    fontSize: 11, fontWeight: "700", color: COLORS.textMuted,
    letterSpacing: 1, marginBottom: 14, marginTop: 4,
  },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "600", color: "#334155", marginBottom: 6 },
  required: { color: COLORS.error },
  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1, borderColor: "#E2E8F0",
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 14, color: "#0F172A",
  },
  inputMulti: { height: 96, textAlignVertical: "top", paddingTop: 11 },
  row: { flexDirection: "row", marginBottom: 0 },
  submitBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, marginTop: 24, paddingVertical: 14,
    borderRadius: 12, backgroundColor: COLORS.primary,
  },
  submitBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});

/* ── Screen styles ──────────────────────────────────── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f8f7" },

  heroBanner: { width: "100%", height: 256 },
  heroGradient: { position: "absolute", left: 0, right: 0, bottom: 0, height: 256 },

  profileSection: { alignItems: "center", marginTop: -80, paddingHorizontal: 16, marginBottom: 24 },
  avatarOuter: {
    width: 136, height: 136, borderRadius: 68,
    borderWidth: 4, borderColor: COLORS.accent,
    backgroundColor: "#fff", overflow: "hidden",
    marginBottom: SPACING.sm,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 10, elevation: 8,
  },
  avatarInner: { flex: 1, backgroundColor: "rgba(15,92,59,0.08)", justifyContent: "center", alignItems: "center" },
  avatarImage: { width: "100%", height: "100%" },
  avatarInitials: { fontSize: 42, fontWeight: "800", color: COLORS.primary },
  avatarCameraOverlay: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    height: 36, backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center", alignItems: "center",
  },
  memberName: {
    fontSize: 24, fontWeight: "800", color: "#0F172A",
    textAlign: "center", paddingHorizontal: SPACING.lg,
    marginTop: 12, marginBottom: 8, lineHeight: 32,
  },
  typeBadge: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: BORDER_RADIUS.full, marginBottom: 6 },
  typeBadgeText: { fontSize: 12, fontWeight: "700", letterSpacing: 0.3 },
  memberNo: { fontSize: 14, fontWeight: "500", color: "#64748B" },

  signOutBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    marginTop: 12, paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1.5, borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
  },
  signOutBtnText: { fontSize: 13, fontWeight: "700", color: COLORS.error },

  tabBar: { paddingHorizontal: 16, paddingVertical: 4, gap: 8, marginBottom: 20 },
  tab: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 14, height: 38,
    borderRadius: 9999, backgroundColor: "rgba(15,92,59,0.07)",
  },
  tabActive: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22, shadowRadius: 5, elevation: 3,
  },
  tabText: { fontSize: 13, fontWeight: "600", color: COLORS.textMuted },
  tabTextActive: { color: "#fff" },
  tabBadge: {
    marginLeft: 6, minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: "rgba(15,92,59,0.15)",
    alignItems: "center", justifyContent: "center", paddingHorizontal: 4,
  },
  tabBadgeActive: { backgroundColor: "rgba(255,255,255,0.25)" },
  tabBadgeText: { fontSize: 10, fontWeight: "700", color: COLORS.primary },
  tabBadgeTextActive: { color: "#fff" },

  contentArea: { paddingHorizontal: 16, minHeight: 320 },
  card: {
    backgroundColor: "#fff", borderRadius: 16, padding: 24, marginBottom: 16,
    borderWidth: 1, borderColor: "rgba(15,92,59,0.05)",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
  },
  cardHeadingRow: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  cardHeading: { flex: 1, fontSize: 18, fontWeight: "700", color: "#0F172A" },
  cardEditBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1, borderColor: COLORS.primary,
  },
  cardEditBtnText: { fontSize: 12, fontWeight: "700", color: COLORS.primary },

  detailsGrid: { gap: 20 },
  detailItem: { flexDirection: "row", alignItems: "center", gap: 16 },
  detailIconWrap: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: "rgba(15,92,59,0.08)",
    justifyContent: "center", alignItems: "center",
  },
  detailTextWrap: { flex: 1 },
  detailLabel: { fontSize: 12, fontWeight: "500", color: "#94A3B8", marginBottom: 2 },
  detailValue: { fontSize: 16, fontWeight: "600", color: "#0F172A" },

  divider: { height: 1, backgroundColor: "rgba(15,92,59,0.06)", marginVertical: 20 },
  kennelHeader: { flexDirection: "row", alignItems: "center" },
  kennelAvatar: { width: 64, height: 64, borderRadius: 12, overflow: "hidden" },
  kennelAvatarPlaceholder: { backgroundColor: "rgba(15,92,59,0.1)", justifyContent: "center", alignItems: "center" },
  kennelAvatarInitials: { fontSize: 20, fontWeight: "700", color: COLORS.primary },
  kennelName: { fontSize: 17, fontWeight: "700", color: "#0F172A", marginBottom: 2 },
  kennelSuffix: { fontSize: 13, fontStyle: "italic", color: COLORS.textMuted, marginBottom: 2 },
  kennelCity: { fontSize: 13, color: COLORS.textMuted },
  kennelViewBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    marginTop: 24, paddingVertical: 13, borderRadius: 12, backgroundColor: COLORS.primary,
  },
  kennelViewBtnText: { fontSize: 14, fontWeight: "700", color: "#fff" },

  emptyState: { alignItems: "center", paddingVertical: 56, paddingHorizontal: SPACING.xl, gap: 10 },
  emptyIconWrap: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: "rgba(15,92,59,0.08)",
    justifyContent: "center", alignItems: "center", marginBottom: 4,
  },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
  emptyDesc: { fontSize: 13, color: COLORS.textMuted, textAlign: "center", lineHeight: 20 },

  loadingWrap: { padding: SPACING.xl, alignItems: "center" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", gap: SPACING.md },
});
