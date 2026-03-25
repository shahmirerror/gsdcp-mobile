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
  Alert,
  Modal,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from "../lib/theme";
import {
  fetchMemberDetail, Member, MemberDetail, MemberOwnedDog, MemberKennel, Dog,
  fetchStudCertificates, fetchStudCertificateDetail, submitStudCertificate,
  StudCertificate, StudCertificateDetail,
  fetchLitterInspections, fetchLitterInspectionDetail, submitLitterInspection,
  checkLitterCertificate, CertificateCheck,
  LitterInspection, LitterInspectionDetail,
  fetchLitterRegistrations, fetchLitterRegistrationDetail, submitLitterRegistration,
  LitterRegistration, LitterRegistrationDetail, LitterRegStats, LitterPuppy,
  searchDogs, DogSearchResult,
  verifySire, verifyDam, SireVerification,
} from "../lib/api";
import { DogListItem } from "../components/DogListItem";
import { useAuth } from "../contexts/AuthContext";

const heroBg = require("../../assets/hero-bg.jpg");

type TabId = "detail" | "kennel" | "dogs" | "stud" | "litter-inspection" | "litter-registration";

const TABS: { id: TabId; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: "detail",               label: "Detail",             icon: "person-outline"       },
  { id: "kennel",               label: "Kennel",             icon: "home-outline"         },
  { id: "dogs",                 label: "Dogs",               icon: "paw-outline"          },
  { id: "stud",                 label: "Stud Certificates",  icon: "ribbon-outline"       },
  { id: "litter-inspection",    label: "Litter Inspections", icon: "search-outline"       },
  { id: "litter-registration",  label: "Litter Registrations", icon: "document-text-outline" },
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
function DetailTab({ detail, fallbackMember, email, phone }: {
  detail: MemberDetail | undefined; fallbackMember?: Member;
  email: string | null; phone: string | null;
}) {
  const member = detail?.member ?? fallbackMember;
  if (!member) return null;
  const statusLabel = member.membership_no.startsWith("P-") || member.membership_no.startsWith("D-") ? "Active" : "Temporary";
  const statusColor = statusLabel === "Active" ? COLORS.primary : "#F59E0B";
  const address = (detail?.member as any)?.address;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeadingRow}>
        <Text style={styles.cardHeading}>Membership Details</Text>
        <TouchableOpacity style={styles.cardEditBtn} activeOpacity={0.7} data-testid="btn-edit-details">
          <Ionicons name="pencil-outline" size={13} color={COLORS.primary} />
          <Text style={styles.cardEditBtnText}>Edit</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.detailsGrid}>
        <DetailItem icon="card"             label="Membership Number" value={member.membership_no} />
        <DetailItem icon="checkmark-circle" label="Status"            value={statusLabel} valueColor={statusColor} />
        {member.city    ? <DetailItem icon="location" label="City"    value={member.city!} />    : null}
        {member.country ? <DetailItem icon="flag"     label="Country" value={member.country!} /> : null}
        {address        ? <DetailItem icon="home"     label="Address" value={address} />          : null}
        {email          ? <DetailItem icon="mail"     label="Email"   value={email} />            : null}
        {phone          ? <DetailItem icon="call"     label="Phone"   value={phone} />            : null}
      </View>
    </View>
  );
}

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
          <Image source={{ uri: kennel.imageUrl! }} style={styles.kennelAvatar} />
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
type DogOption = { id: string; name: string; KP: string; owner?: string; sex?: string; color?: string };

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
  const [query, setQuery]       = useState("");
  const [results, setResults]   = useState<DogOption[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen]         = useState(false);
  const debounceRef             = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (mode === "local") {
      const opts = localOptions ?? [];
      if (!query.trim()) { setResults(opts.slice(0, 30)); return; }
      const q = query.toLowerCase();
      setResults(opts.filter(d => d.name.toLowerCase().includes(q) || d.KP.toLowerCase().includes(q)).slice(0, 30));
    } else {
      if (!query.trim() || query.length < 2) { setResults([]); return; }
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        setSearching(true);
        try {
          const dogs = await searchDogs(query, 1, 15, sexFilter);
          setResults(dogs.map(d => ({ id: d.id, name: d.dog_name, KP: d.KP, owner: d.owner, sex: d.sex, color: d.color })));
        } catch { setResults([]); }
        finally { setSearching(false); }
      }, 400);
    }
  }, [query, mode, localOptions, sexFilter]);

  if (selected) {
    return (
      <View style={{ marginBottom: 12 }}>
        <Text style={{ fontSize: 13, fontWeight: "600", color: "#334155", marginBottom: 5 }}>{label}{required ? <Text style={{ color: COLORS.error }}> *</Text> : null}</Text>
        <View style={{
          flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: COLORS.primary,
          borderRadius: 10, padding: 10, backgroundColor: `${COLORS.primary}08`, gap: 10,
        }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: COLORS.text }}>{selected.name}</Text>
            <Text style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 1 }}>KP {selected.KP}</Text>
            {selected.color ? <Text style={{ fontSize: 11, color: COLORS.textMuted }}>{selected.color}</Text> : null}
          </View>
          <TouchableOpacity onPress={onClear} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={22} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ fontSize: 13, fontWeight: "600", color: "#334155", marginBottom: 5 }}>{label}{required ? <Text style={{ color: COLORS.error }}> *</Text> : null}</Text>
      <View style={{
        flexDirection: "row", alignItems: "center", borderWidth: 1,
        borderColor: open ? COLORS.primary : COLORS.border,
        borderRadius: 10, paddingHorizontal: 10, backgroundColor: "#fff",
      }}>
        <Ionicons name="search" size={15} color={COLORS.textMuted} style={{ marginRight: 6 }} />
        <TextInput
          style={{ flex: 1, fontSize: 13, color: COLORS.text, paddingVertical: 10 }}
          value={query}
          onChangeText={setQuery}
          onFocus={() => setOpen(true)}
          placeholder={mode === "local" ? "Type to filter your dogs…" : "Type to search GSDCP database…"}
          placeholderTextColor={COLORS.textMuted}
        />
        {searching
          ? <ActivityIndicator size="small" color={COLORS.primary} />
          : query.length > 0
            ? <TouchableOpacity onPress={() => { setQuery(""); setResults([]); }} activeOpacity={0.7}>
                <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
              </TouchableOpacity>
            : null}
      </View>
      {open && results.length > 0 && (
        <View style={{
          borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, marginTop: 4,
          backgroundColor: "#fff", overflow: "hidden",
        }}>
          {results.map((dog, i) => (
            <TouchableOpacity
              key={dog.id}
              onPress={() => { onSelect(dog); setOpen(false); setQuery(""); setResults([]); }}
              activeOpacity={0.7}
              style={[
                { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, gap: 10 },
                i < results.length - 1 && { borderBottomWidth: 1, borderBottomColor: COLORS.border },
              ]}
            >
              <View style={{
                width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center",
                backgroundColor: dog.sex === "Male" ? `${COLORS.primary}18` : dog.sex === "Female" ? "#F3E8FF" : "#F1F5F9",
              }}>
                <Ionicons
                  name={dog.sex === "Male" ? "male" : dog.sex === "Female" ? "female" : "paw"}
                  size={13}
                  color={dog.sex === "Male" ? COLORS.primary : dog.sex === "Female" ? "#9333EA" : COLORS.textMuted}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: "600", color: COLORS.text }} numberOfLines={1}>{dog.name}</Text>
                <Text style={{ fontSize: 11, color: COLORS.textMuted }}>KP {dog.KP}{dog.color ? ` · ${dog.color}` : ""}</Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color="#CBD5E1" />
            </TouchableOpacity>
          ))}
        </View>
      )}
      {open && mode === "remote" && query.length === 0 && (
        <Text style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 4, paddingHorizontal: 4 }}>
          Type a dog's name or KP number to search…
        </Text>
      )}
      {open && mode === "remote" && query.length > 0 && query.length < 2 && (
        <Text style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 4, paddingHorizontal: 4 }}>
          Keep typing to search…
        </Text>
      )}
      {open && mode === "remote" && query.length >= 2 && !searching && results.length === 0 && (
        <Text style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 4, paddingHorizontal: 4 }}>
          No dogs found for "{query}"
        </Text>
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
  const sireOptions: DogOption[] = (memberDetail?.ownedDogs ?? [])
    .filter(d => d.sex === "Male")
    .map(d => ({ id: d.id, name: d.dog_name, KP: d.KP, sex: d.sex, color: d.color }));

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
      refetch();
      Alert.alert("Submitted", "Stud certificate submitted successfully.");
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
              <Text style={tStyles.certDate}>Mating date: {certDetail.mating_date}</Text>
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
                <Text style={tStyles.certDate}>{c.mating_date}</Text>
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
  const damOptions: DogOption[] = (inspMemberDetail?.ownedDogs ?? [])
    .filter(d => d.sex === "Female")
    .map(d => ({ id: d.id, name: d.dog_name, KP: d.KP, sex: d.sex, color: d.color }));

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
      refetch();
      Alert.alert("Submitted", "Litter inspection submitted successfully.");
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
                <Text style={tStyles.certDate}>Whelped: {detail.whelping_date}</Text>
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
                  {item.whelping_date && <Text style={tStyles.certDate}>{item.whelping_date}</Text>}
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
  const [form, setForm] = useState({
    sireName: "", sireKP: "",
    damName: "", damKP: "",
    dateOfWhelping: "",
    malePups: "", femalePups: "",
    remarks: "",
  });
  const set = (key: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [key]: v }));

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
  });

  const handleSubmit = async () => {
    if (!form.sireName.trim())       { setSubmitError("Sire name is required."); return; }
    if (!form.damName.trim())        { setSubmitError("Dam name is required."); return; }
    if (!form.dateOfWhelping.trim()) { setSubmitError("Date of whelping is required."); return; }
    if (!form.malePups.trim())       { setSubmitError("Number of male pups is required."); return; }
    if (!form.femalePups.trim())     { setSubmitError("Number of female pups is required."); return; }
    setSubmitError("");
    setSubmitting(true);
    try {
      await submitLitterRegistration({
        user_id: user!.id,
        sire_name: form.sireName.trim(), sire_kp: form.sireKP.trim(),
        dam_name: form.damName.trim(),   dam_kp: form.damKP.trim(),
        date_of_whelping: form.dateOfWhelping.trim(),
        male_pups: form.malePups.trim(),
        female_pups: form.femalePups.trim(),
        remarks: form.remarks.trim(),
      });
      setForm({ sireName: "", sireKP: "", damName: "", damKP: "", dateOfWhelping: "", malePups: "", femalePups: "", remarks: "" });
      setShowForm(false);
      refetch();
      Alert.alert("Submitted", "Litter registration submitted successfully.");
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
                <Text style={tStyles.certDate}>Whelped: {detail.dob}</Text>
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
        <FormField label="Sire Name"        value={form.sireName} onChangeText={set("sireName")} placeholder="Enter sire name" required />
        <FormField label="Sire KP / Reg No" value={form.sireKP}   onChangeText={set("sireKP")}   placeholder="e.g. KP-12345" />

        <View style={styles.divider} />
        <FormSection title="DAM" />
        <FormField label="Dam Name"         value={form.damName} onChangeText={set("damName")} placeholder="Enter dam name" required />
        <FormField label="Dam KP / Reg No"  value={form.damKP}   onChangeText={set("damKP")}   placeholder="e.g. KP-67890" />

        <View style={styles.divider} />
        <FormSection title="LITTER DETAILS" />
        <FormField label="Date of Whelping" value={form.dateOfWhelping} onChangeText={set("dateOfWhelping")} placeholder="DD/MM/YYYY" required />
        <View style={fStyles.row}>
          <View style={{ flex: 1 }}><FormField label="Male Pups"   value={form.malePups}   onChangeText={set("malePups")}   placeholder="0" keyboardType="numeric" required /></View>
          <View style={{ width: 12 }} />
          <View style={{ flex: 1 }}><FormField label="Female Pups" value={form.femalePups} onChangeText={set("femalePups")} placeholder="0" keyboardType="numeric" required /></View>
        </View>
        <FormField label="Remarks" value={form.remarks} onChangeText={set("remarks")} placeholder="Any additional notes…" multiline />

        {!!submitError && <Text style={tStyles.errorText}>{submitError}</Text>}
        <SubmitBtn label={submitting ? "Submitting…" : "Submit Litter Registration"} onPress={handleSubmit} />
      </View>
    );
  }

  /* ── List view ── */
  return (
    <View style={styles.card}>
      <ListHeader title="Litter Registrations" onNew={() => setShowForm(true)} />

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
                  {item.whelping_date && <Text style={tStyles.certDate}>{item.whelping_date}</Text>}
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

/* ── Screen ─────────────────────────────────────────── */
export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const insets     = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("detail");

  const { data: detail, isLoading, refetch, isRefetching } = useQuery<MemberDetail>({
    queryKey: ["member-detail", user?.member_id],
    queryFn:  () => fetchMemberDetail(user!.member_id),
    enabled:  !!user?.member_id,
    retry: 1,
  });

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
    imageUrl:      user.photo ? `https://gsdcp.org/storage/photos/${user.photo}` : null,
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
      case "detail":               return <DetailTab detail={detail} fallbackMember={fallbackMember} email={user.email} phone={user.phone} />;
      case "kennel":               return <KennelTab kennel={kennel} navigation={navigation} />;
      case "dogs":                 return <DogsTab dogs={ownedDogs} onDogPress={(dog) => navigation.push("DogProfile", { id: dog.id, name: dog.dog_name })} />;
      case "stud":                 return <StudCertTab />;
      case "litter-inspection":    return <LitterInspectionTab />;
      case "litter-registration":  return <LitterRegistrationTab />;
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
        <View style={styles.avatarOuter}>
          {hasPhoto ? (
            <Image source={{ uri: member.imageUrl! }} style={styles.avatarImage} resizeMode="cover" />
          ) : (
            <View style={styles.avatarInner}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}
        </View>
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
