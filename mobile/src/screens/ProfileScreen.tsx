import { useState } from "react";
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
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from "../lib/theme";
import {
  fetchMemberDetail, Member, MemberDetail, MemberOwnedDog, MemberKennel, Dog,
  fetchStudCertificates, submitStudCertificate, StudCertificate,
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

function FormSection({ title }: { title: string }) {
  return <Text style={fStyles.section}>{title}</Text>;
}

function SubmitBtn({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={fStyles.submitBtn} activeOpacity={0.8} onPress={onPress}>
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

/* ── Tab: Stud Certificate ──────────────────────────── */
function StudCertTab() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [form, setForm] = useState({
    studName: "", studKP: "",
    damName: "", damKP: "", damOwner: "",
    dateOfMating: "", noOfMatings: "", expectedWhelping: "", remarks: "",
  });
  const set = (key: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [key]: v }));

  const { data: certs = [], isLoading: certsLoading, refetch } = useQuery<StudCertificate[]>({
    queryKey: ["stud-certificates", user?.id],
    queryFn: () => fetchStudCertificates(user!.id),
    enabled: !!user,
  });

  const handleSubmit = async () => {
    if (!form.studName.trim()) { setSubmitError("Stud dog name is required."); return; }
    if (!form.damName.trim())  { setSubmitError("Dam name is required."); return; }
    if (!form.damOwner.trim()) { setSubmitError("Dam owner name is required."); return; }
    if (!form.dateOfMating.trim()) { setSubmitError("Date of mating is required."); return; }
    setSubmitError("");
    setSubmitting(true);
    try {
      await submitStudCertificate({
        user_id:          user!.id,
        stud_name:        form.studName.trim(),
        stud_kp:          form.studKP.trim(),
        dam_name:         form.damName.trim(),
        dam_kp:           form.damKP.trim(),
        dam_owner:        form.damOwner.trim(),
        date_of_mating:   form.dateOfMating.trim(),
        no_of_matings:    form.noOfMatings.trim(),
        expected_whelping: form.expectedWhelping.trim(),
        remarks:          form.remarks.trim(),
      });
      setForm({ studName: "", studKP: "", damName: "", damKP: "", damOwner: "", dateOfMating: "", noOfMatings: "", expectedWhelping: "", remarks: "" });
      setShowForm(false);
      refetch();
      Alert.alert("Submitted", "Stud certificate submitted successfully.");
    } catch (e: any) {
      setSubmitError(e.message ?? "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (showForm) {
    return (
      <View style={styles.card}>
        <FormBackBtn onPress={() => { setShowForm(false); setSubmitError(""); }} />
        <Text style={styles.cardHeading}>New Stud Certificate</Text>

        <FormSection title="STUD (SIRE)" />
        <FormField label="Stud Dog Name"        value={form.studName} onChangeText={set("studName")} placeholder="Enter stud dog name"  required />
        <FormField label="Stud Dog KP / Reg No" value={form.studKP}   onChangeText={set("studKP")}   placeholder="e.g. KP-12345" />

        <View style={styles.divider} />
        <FormSection title="DAM (BITCH)" />
        <FormField label="Dam Name"        value={form.damName}  onChangeText={set("damName")}  placeholder="Enter dam name"        required />
        <FormField label="Dam KP / Reg No" value={form.damKP}    onChangeText={set("damKP")}    placeholder="e.g. KP-67890" />
        <FormField label="Dam Owner Name"  value={form.damOwner} onChangeText={set("damOwner")} placeholder="Full name of dam owner" required />

        <View style={styles.divider} />
        <FormSection title="MATING DETAILS" />
        <FormField label="Date of Mating"    value={form.dateOfMating}     onChangeText={set("dateOfMating")}     placeholder="DD/MM/YYYY" required />
        <FormField label="Number of Matings" value={form.noOfMatings}      onChangeText={set("noOfMatings")}      placeholder="e.g. 2" keyboardType="numeric" />
        <FormField label="Expected Whelping" value={form.expectedWhelping} onChangeText={set("expectedWhelping")} placeholder="DD/MM/YYYY" />
        <FormField label="Remarks"           value={form.remarks}          onChangeText={set("remarks")}          placeholder="Any additional notes…" multiline />

        {!!submitError && (
          <Text style={tStyles.errorText}>{submitError}</Text>
        )}

        <SubmitBtn label={submitting ? "Submitting…" : "Submit Stud Certificate"} onPress={handleSubmit} />
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <ListHeader title="Stud Certificates" onNew={() => setShowForm(true)} />
      <View style={tStyles.table}>
        <TableHead cols={[{ label: "STUD DOG", flex: 2 }, { label: "DAM", flex: 2 }, { label: "MATING DATE" }, { label: "STATUS" }]} />
        {certsLoading ? (
          <ActivityIndicator style={{ margin: 16 }} color={COLORS.primary} />
        ) : certs.length === 0 ? (
          <EmptyTable icon="ribbon-outline" message="No stud certificates yet" />
        ) : (
          certs.map((c) => (
            <View key={c.id} style={tStyles.tableRow}>
              <Text style={[tStyles.tableCell, { flex: 2 }]} numberOfLines={1}>{c.stud_name}</Text>
              <Text style={[tStyles.tableCell, { flex: 2 }]} numberOfLines={1}>{c.dam_name}</Text>
              <Text style={tStyles.tableCell} numberOfLines={1}>{c.date_of_mating}</Text>
              <Text style={[tStyles.tableCell, { color: COLORS.accent }]} numberOfLines={1}>{c.status ?? "—"}</Text>
            </View>
          ))
        )}
      </View>
    </View>
  );
}

/* ── Tab: Litter Inspection ─────────────────────────── */
function LitterInspectionTab() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    sireName: "", sireKP: "",
    damName: "", damKP: "",
    dateOfWhelping: "", dateOfInspection: "",
    malePups: "", femalePups: "", deadPups: "",
    inspectorName: "", remarks: "",
  });
  const set = (key: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [key]: v }));

  if (showForm) {
    return (
      <View style={styles.card}>
        <FormBackBtn onPress={() => setShowForm(false)} />
        <Text style={styles.cardHeading}>New Litter Inspection</Text>

        <FormSection title="SIRE" />
        <FormField label="Sire Name"        value={form.sireName} onChangeText={set("sireName")} placeholder="Enter sire name" required />
        <FormField label="Sire KP / Reg No" value={form.sireKP}   onChangeText={set("sireKP")}   placeholder="e.g. KP-12345" />

        <View style={styles.divider} />
        <FormSection title="DAM" />
        <FormField label="Dam Name"         value={form.damName} onChangeText={set("damName")} placeholder="Enter dam name" required />
        <FormField label="Dam KP / Reg No"  value={form.damKP}   onChangeText={set("damKP")}   placeholder="e.g. KP-67890" />

        <View style={styles.divider} />
        <FormSection title="LITTER DETAILS" />
        <FormField label="Date of Whelping"   value={form.dateOfWhelping}   onChangeText={set("dateOfWhelping")}   placeholder="DD/MM/YYYY" required />
        <FormField label="Date of Inspection" value={form.dateOfInspection} onChangeText={set("dateOfInspection")} placeholder="DD/MM/YYYY" required />
        <View style={fStyles.row}>
          <View style={{ flex: 1 }}><FormField label="Male Pups"   value={form.malePups}   onChangeText={set("malePups")}   placeholder="0" keyboardType="numeric" required /></View>
          <View style={{ width: 12 }} />
          <View style={{ flex: 1 }}><FormField label="Female Pups" value={form.femalePups} onChangeText={set("femalePups")} placeholder="0" keyboardType="numeric" required /></View>
          <View style={{ width: 12 }} />
          <View style={{ flex: 1 }}><FormField label="Dead"        value={form.deadPups}   onChangeText={set("deadPups")}   placeholder="0" keyboardType="numeric" /></View>
        </View>
        <FormField label="Inspector Name" value={form.inspectorName} onChangeText={set("inspectorName")} placeholder="Full name" required />
        <FormField label="Remarks"        value={form.remarks}       onChangeText={set("remarks")}       placeholder="Any additional notes…" multiline />

        <SubmitBtn label="Submit Litter Inspection" onPress={() => { Alert.alert("Submitted", "Litter inspection submitted."); setShowForm(false); }} />
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <ListHeader title="Litter Inspections" onNew={() => setShowForm(true)} />
      <View style={tStyles.table}>
        <TableHead cols={[{ label: "SIRE", flex: 2 }, { label: "DAM", flex: 2 }, { label: "WHELPED" }, { label: "PUPS" }]} />
        <EmptyTable icon="search-outline" message="No litter inspections yet" />
      </View>
    </View>
  );
}

/* ── Tab: Litter Registration ───────────────────────── */
function LitterRegistrationTab() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    sireName: "", sireKP: "",
    damName: "", damKP: "",
    dateOfWhelping: "",
    totalPups: "", malePups: "", femalePups: "",
    remarks: "",
  });
  const set = (key: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [key]: v }));

  if (showForm) {
    return (
      <View style={styles.card}>
        <FormBackBtn onPress={() => setShowForm(false)} />
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
          <View style={{ flex: 1 }}><FormField label="Total Pups" value={form.totalPups}  onChangeText={set("totalPups")}  placeholder="0" keyboardType="numeric" required /></View>
          <View style={{ width: 12 }} />
          <View style={{ flex: 1 }}><FormField label="Male"       value={form.malePups}   onChangeText={set("malePups")}   placeholder="0" keyboardType="numeric" required /></View>
          <View style={{ width: 12 }} />
          <View style={{ flex: 1 }}><FormField label="Female"     value={form.femalePups} onChangeText={set("femalePups")} placeholder="0" keyboardType="numeric" required /></View>
        </View>
        <FormField label="Remarks" value={form.remarks} onChangeText={set("remarks")} placeholder="Any additional notes…" multiline />

        <SubmitBtn label="Submit Litter Registration" onPress={() => { Alert.alert("Submitted", "Litter registration submitted."); setShowForm(false); }} />
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <ListHeader title="Litter Registrations" onNew={() => setShowForm(true)} />
      <View style={tStyles.table}>
        <TableHead cols={[{ label: "SIRE", flex: 2 }, { label: "DAM", flex: 2 }, { label: "WHELPED" }, { label: "PUPS" }]} />
        <EmptyTable icon="document-text-outline" message="No litter registrations yet" />
      </View>
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
