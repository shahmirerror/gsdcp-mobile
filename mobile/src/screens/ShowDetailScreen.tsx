import { useState, useMemo } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  ImageBackground,
  RefreshControl,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES } from "../lib/theme";
import { fetchShow, ShowDetail, ShowResultEntry, ShowJudge, fetchRemainingDogs, RemainingDog, verifyEntry } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";

const heroBg = require("../../assets/hero-bg.jpg");

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatDate(dateStr: string): string {
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const day = parseInt(parts[2], 10);
  const monthIndex = parseInt(parts[1], 10) - 1;
  const year = parts[0];
  if (monthIndex < 0 || monthIndex > 11) return dateStr;
  return `${day} ${MONTHS[monthIndex]} ${year}`;
}

const EVENT_TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Show: "trophy",
  "Endurance Test": "fitness",
  "Breed Survey": "clipboard",
  Meeting: "people",
};

const EVENT_TYPE_COLORS: Record<string, string> = {
  Show: COLORS.accent,
  "Endurance Test": "#3B82F6",
  "Breed Survey": "#8B5CF6",
  Meeting: "#10B981",
};

const STATUS_COLORS: Record<string, string> = {
  Upcoming: "#3B82F6",
  Current: "#22C55E",
  Past: "#9CA3AF",
};

type TabKey = "info" | "results" | "entry";

function InfoRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={18} color={COLORS.primary} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function JudgeRow({ judge, onPress }: { judge: ShowJudge; onPress: () => void }) {
  const [imgError, setImgError] = useState(false);
  const initials = judge.full_name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("");
  const hasImg = !!judge.imageUrl && !imgError;
  return (
    <TouchableOpacity style={styles.judgeRow} onPress={onPress} activeOpacity={0.7} data-testid={`judge-${judge.id}`}>
      <View style={styles.judgeAvatar}>
        {hasImg ? (
          <Image source={{ uri: judge.imageUrl }} style={styles.judgeAvatarImg} onError={() => setImgError(true)} />
        ) : (
          <Text style={styles.judgeAvatarInitials}>{initials}</Text>
        )}
      </View>
      <View style={styles.judgeInfo}>
        <Text style={styles.judgeName}>{judge.full_name}</Text>
        {judge.credentials && <Text style={styles.judgeCredentials}>{judge.credentials}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
}

function ResultRow({ entry, onPress }: { entry: ShowResultEntry; onPress: () => void }) {
  const gradingPlacement = [entry.grading, entry.placement].filter(Boolean).join(" ");
  return (
    <TouchableOpacity style={styles.resultRow} onPress={onPress} activeOpacity={0.7} data-testid={`result-${entry.dog_id}`}>
      <View style={styles.gradingBadge}>
        <Text style={styles.gradingText}>{gradingPlacement}</Text>
      </View>
      <View style={styles.resultInfo}>
        <Text style={styles.resultName} numberOfLines={1}>{entry.dog_name.trim()}</Text>
        {entry.KP && (
          <Text style={styles.resultKp}>KP {entry.KP}</Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
}

function EntryFormTab({ show }: { show: ShowDetail }) {
  const { user } = useAuth();
  const [selectedDogs, setSelectedDogs] = useState<RemainingDog[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [listOpen, setListOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submittedCount, setSubmittedCount] = useState(0);
  const [submitError, setSubmitError] = useState("");
  const [dogVerifyStatus, setDogVerifyStatus] = useState<
    Record<string, { status: "pending" | "eligible" | "ineligible" | "error"; reason?: string; className?: string }>
  >({});

  const { data: availableDogs = [], isLoading: dogsLoading, isError: dogsError, refetch: refetchDogs } = useQuery<RemainingDog[]>({
    queryKey: ["remaining-dogs", show.id, user?.id],
    queryFn: () => fetchRemainingDogs(show.id, user?.id, user?.token),
    enabled: !!user,
    retry: 1,
  });

  const selectedIds = useMemo(() => new Set(selectedDogs.map(d => d.id)), [selectedDogs]);

  const filteredDogs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const unselected = availableDogs.filter(d => !selectedIds.has(d.id));
    if (!q) return unselected;
    return unselected.filter(d =>
      d.dog_name.toLowerCase().includes(q) || d.KP.toLowerCase().includes(q)
    );
  }, [searchQuery, availableDogs, selectedIds]);

  const addDog = (dog: RemainingDog) => {
    setSelectedDogs(prev => [...prev, dog]);
    setDogVerifyStatus(prev => ({ ...prev, [dog.id]: { status: "pending" } }));
    setSearchQuery("");
    setListOpen(false);
    setSubmitError("");
    // Verify immediately in the background
    verifyEntry(show.id, dog.id, user?.token)
      .then((result) => {
        setDogVerifyStatus(prev => ({
          ...prev,
          [dog.id]: result.eligible
            ? { status: "eligible", className: result.className }
            : { status: "ineligible", reason: result.reason ?? "Not eligible for this show" },
        }));
      })
      .catch(() => {
        setDogVerifyStatus(prev => ({
          ...prev,
          [dog.id]: { status: "error", reason: "Could not verify eligibility. You may still submit." },
        }));
      });
  };

  const removeDog = (id: string) => {
    setSelectedDogs(prev => prev.filter(d => d.id !== id));
    setDogVerifyStatus(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setSubmitError("");
  };

  const anyPending = selectedDogs.some(d => dogVerifyStatus[d.id]?.status === "pending");
  const anyIneligible = selectedDogs.some(d => dogVerifyStatus[d.id]?.status === "ineligible");
  const anyVerifyError = selectedDogs.some(d => dogVerifyStatus[d.id]?.status === "error");

  const handleSubmit = async () => {
    if (selectedDogs.length === 0) { setSubmitError("Please select at least one dog to enter."); return; }
    if (anyPending) { setSubmitError("Please wait for verification to complete."); return; }
    if (anyIneligible) { setSubmitError("Remove ineligible dogs before submitting."); return; }
    setSubmitError("");
    setSubmitting(true);
    try {
      const count = selectedDogs.length;
      // Placeholder — wire up to your entry submission API endpoint
      await new Promise(res => setTimeout(res, 1000));
      setSubmittedCount(count);
      setSubmitSuccess(true);
      setSelectedDogs([]);
      setDogVerifyStatus({});
      setSearchQuery("");
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (e: any) {
      setSubmitError(e.message ?? "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const allSelected = availableDogs.length > 0 && selectedDogs.length === availableDogs.length;

  if (dogsLoading) {
    return (
      <View style={styles.entryEmptyWrap}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={[styles.emptyDesc, { marginTop: 12 }]}>Loading your dogs…</Text>
      </View>
    );
  }

  if (dogsError) {
    return (
      <View style={styles.entryEmptyWrap}>
        <View style={[styles.emptyIconWrap, { backgroundColor: "#FEE2E220" }]}>
          <Ionicons name="alert-circle-outline" size={32} color="#DC2626" />
        </View>
        <Text style={styles.emptyTitle}>Could Not Load Dogs</Text>
        <Text style={styles.emptyDesc}>The server returned an error. Please try again or contact support if the problem persists.</Text>
        <TouchableOpacity
          style={[styles.retryBtn, { marginTop: 16 }]}
          onPress={() => refetchDogs()}
          activeOpacity={0.8}
        >
          <Text style={styles.retryBtnText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (availableDogs.length === 0 && selectedDogs.length === 0) {
    return (
      <View style={styles.entryEmptyWrap}>
        <View style={styles.emptyIconWrap}>
          <Ionicons name="paw-outline" size={32} color={COLORS.primary} />
        </View>
        <Text style={styles.emptyTitle}>No Eligible Dogs</Text>
        <Text style={styles.emptyDesc}>You have no dogs available to enter into this event.</Text>
      </View>
    );
  }

  return (
    <View style={styles.entryCard}>
      <Text style={styles.cardHeading}>Enter Dogs</Text>

      {submitSuccess && (
        <View style={styles.successBanner}>
          <Ionicons name="checkmark-circle" size={18} color="#16A34A" />
          <Text style={styles.successText}>
            {submittedCount === 1
              ? "Entry submitted successfully."
              : `${submittedCount} entries submitted successfully.`}
          </Text>
        </View>
      )}

      {submitError ? (
        <View style={styles.errorBanner}>
          <Ionicons name="warning-outline" size={16} color="#DC2626" />
          <Text style={styles.errorBannerText}>{submitError}</Text>
        </View>
      ) : null}

      {selectedDogs.length > 0 && (
        <View style={styles.selectedDogsSection}>
          <Text style={styles.fieldLabel}>
            Selected Dogs{" "}
            <Text style={styles.selectedDogsCount}>({selectedDogs.length})</Text>
          </Text>
          {selectedDogs.map((dog) => {
            const vs = dogVerifyStatus[dog.id];
            const isPending = !vs || vs.status === "pending";
            const isIneligible = vs?.status === "ineligible";
            const isEligible = vs?.status === "eligible";
            const isError = vs?.status === "error";
            return (
              <View key={dog.id} style={[
                styles.selectedDogCard,
                isIneligible && styles.selectedDogCardIneligible,
                isError && styles.selectedDogCardError,
              ]}>
                <View style={styles.selectedDogAvatar}>
                  <Ionicons
                    name="paw"
                    size={20}
                    color={isIneligible ? "#DC2626" : isError ? "#D97706" : COLORS.primary}
                  />
                </View>
                <View style={styles.selectedDogInfo}>
                  <Text style={styles.selectedDogName}>{dog.dog_name}</Text>
                  <Text style={styles.selectedDogSub}>
                    KP {dog.KP || "—"}
                    {dog.sex ? ` · ${dog.sex}` : ""}
                    {dog.color ? ` · ${dog.color}` : ""}
                  </Text>
                  {dog.date_of_birth ? (
                    <Text style={styles.selectedDogSub}>
                      Born {formatDate(dog.date_of_birth)}
                    </Text>
                  ) : null}
                  {isEligible && vs.className ? (
                    <View style={styles.dogClassBadge}>
                      <Text style={styles.dogClassBadgeText}>{vs.className}</Text>
                    </View>
                  ) : null}
                  {vs?.reason ? (
                    <Text style={[styles.dogIneligibleReason, isError && styles.dogErrorReason]}>{vs.reason}</Text>
                  ) : null}
                </View>
                <View style={styles.dogVerifyBadge}>
                  {isPending && <ActivityIndicator size="small" color={COLORS.primary} />}
                  {isEligible && <Ionicons name="checkmark-circle" size={22} color="#16A34A" />}
                  {isIneligible && <Ionicons name="close-circle" size={22} color="#DC2626" />}
                  {isError && <Ionicons name="warning" size={22} color="#D97706" />}
                </View>
                <TouchableOpacity
                  onPress={() => removeDog(dog.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close-circle" size={22} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}

      {!allSelected && (
        <>
          <Text style={styles.fieldLabel}>
            {selectedDogs.length === 0
              ? <>Select Dog <Text style={styles.required}>*</Text></>
              : "Add Another Dog"}
          </Text>

          <View style={[styles.searchInputWrap, listOpen && styles.searchInputWrapOpen]}>
            <Ionicons name="search-outline" size={16} color={COLORS.textMuted} style={{ marginRight: 6 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or KP…"
              placeholderTextColor={COLORS.textMuted}
              value={searchQuery}
              onChangeText={t => { setSearchQuery(t); setListOpen(true); }}
              onFocus={() => setListOpen(true)}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {listOpen && (
            <View style={styles.dropdownList}>
              {filteredDogs.length > 0 ? filteredDogs.map((dog, i) => (
                <TouchableOpacity
                  key={dog.id || i}
                  style={[styles.dropdownItem, i < filteredDogs.length - 1 && styles.dropdownItemBorder]}
                  onPress={() => addDog(dog)}
                  activeOpacity={0.7}
                >
                  <View style={styles.dropdownItemAvatar}>
                    <Ionicons name="paw" size={14} color={COLORS.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.dropdownItemName}>{dog.dog_name}</Text>
                    <Text style={styles.dropdownItemSub}>KP {dog.KP || "—"}{dog.sex ? ` · ${dog.sex}` : ""}</Text>
                  </View>
                  <Ionicons name="add-circle-outline" size={20} color={COLORS.primary} />
                </TouchableOpacity>
              )) : (
                <View style={styles.dropdownEmpty}>
                  <Text style={styles.dropdownEmptyText}>
                    {searchQuery ? `No dogs match "${searchQuery}"` : "All your dogs have been added"}
                  </Text>
                </View>
              )}
            </View>
          )}
        </>
      )}

      <TouchableOpacity
        style={[
          styles.submitBtn,
          (selectedDogs.length === 0 || submitting || anyPending || anyIneligible) && styles.submitBtnDisabled,
          anyIneligible && styles.submitBtnIneligible,
        ]}
        onPress={handleSubmit}
        activeOpacity={0.8}
        disabled={selectedDogs.length === 0 || submitting || anyPending || anyIneligible}
      >
        {submitting ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : anyPending ? (
          <>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.submitBtnText}>Checking eligibility…</Text>
          </>
        ) : anyIneligible ? (
          <>
            <Ionicons name="close-circle" size={16} color="#fff" />
            <Text style={styles.submitBtnText}>Remove ineligible dogs</Text>
          </>
        ) : anyVerifyError ? (
          <>
            <Ionicons name="send" size={16} color="#fff" />
            <Text style={styles.submitBtnText}>
              {selectedDogs.length > 1
                ? `Submit ${selectedDogs.length} Entries Anyway`
                : "Submit Entry Anyway"}
            </Text>
          </>
        ) : (
          <>
            <Ionicons name="send" size={16} color="#fff" />
            <Text style={styles.submitBtnText}>
              {selectedDogs.length > 1
                ? `Submit ${selectedDogs.length} Entries`
                : "Submit Entry"}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

export default function ShowDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { id, name } = route.params as { id: string; name?: string };
  const [activeTab, setActiveTab] = useState<TabKey>("info");
  const [selectedHair, setSelectedHair] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);

  const { data: show, isLoading, isError, refetch, isRefetching } = useQuery<ShowDetail>({
    queryKey: ["shows", id],
    queryFn: () => fetchShow(id),
  });

  const results = show?.showResults || [];

  const CLASS_ORDER = [
    "Working Female", "Working Male",
    "Adult Female", "Adult Male",
    "Open Female", "Open Male",
    "Youth Female", "Youth Male",
    "Junior Female", "Junior Male",
    "Puppy Female", "Puppy Male",
    "Minor Puppy Female", "Minor Puppy Male",
  ];

  const HAIR_ORDER = ["Stock Hair", "Long Stock Hair"];

  const normalize = (s: string) => s.replace(/[\r\n]+\s*/g, " ").trim();
  const normalizeHair = (h: string | null | undefined): string => {
    if (!h || !h.trim()) return "Stock Hair";
    const lower = h.trim().toLowerCase();
    if (lower.includes("long")) return "Long Stock Hair";
    return "Stock Hair";
  };

  const hairGroups = useMemo(() => {
    if (!results.length) return new Map<string, ShowResultEntry[]>();
    const groups = new Map<string, ShowResultEntry[]>();
    results.forEach((entry) => {
      const hair = normalizeHair(entry.hair);
      if (!groups.has(hair)) groups.set(hair, []);
      groups.get(hair)!.push(entry);
    });
    return groups;
  }, [results]);

  const orderedHairTypes = useMemo(() => {
    const ordered = HAIR_ORDER.filter((h) => hairGroups.has(h));
    const remaining = [...hairGroups.keys()].filter((h) => !HAIR_ORDER.includes(h));
    return [...ordered, ...remaining];
  }, [hairGroups]);

  const activeHair = selectedHair && hairGroups.has(selectedHair)
    ? selectedHair
    : orderedHairTypes[0] || null;

  const hairResults = activeHair ? hairGroups.get(activeHair) || [] : [];

  const classGroups = useMemo(() => {
    if (!hairResults.length) return new Map<string, ShowResultEntry[]>();
    const groups = new Map<string, ShowResultEntry[]>();
    hairResults.forEach((entry) => {
      const cls = normalize(entry.class || "Other");
      if (!groups.has(cls)) groups.set(cls, []);
      groups.get(cls)!.push(entry);
    });
    groups.forEach((arr) => arr.sort((a, b) => parseInt(a.placement) - parseInt(b.placement)));
    return groups;
  }, [hairResults]);

  const orderedClassNames = useMemo(() => {
    const ordered = CLASS_ORDER.filter((cls) => classGroups.has(cls));
    const remaining = [...classGroups.keys()].filter((cls) => !CLASS_ORDER.includes(cls));
    return [...ordered, ...remaining];
  }, [classGroups]);

  const activeClass = selectedClass && classGroups.has(selectedClass)
    ? selectedClass
    : orderedClassNames[0] || null;

  const activeClassResults = activeClass ? classGroups.get(activeClass) || [] : [];

  const hasMultipleHairTypes = orderedHairTypes.length > 1;

  const isShowType = show?.event_type === "Show";

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: "info", label: "Info" },
    ...(isShowType ? [{ key: "results" as TabKey, label: "Results", count: results.length }] : []),
    ...(user ? [{ key: "entry" as TabKey, label: "Entry Form" }] : []),
  ];

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        {name && <Text style={styles.loadingName}>{name}</Text>}
      </View>
    );
  }

  if (isError || !show) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Failed to load show details</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()} data-testid="btn-retry">
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()} data-testid="btn-go-back">
          <Text style={[styles.retryBtnText, { color: COLORS.primary, marginTop: 8 }]}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const color = EVENT_TYPE_COLORS[show.event_type] || COLORS.accent;
  const icon = EVENT_TYPE_ICONS[show.event_type] || "calendar";
  const statusColor = STATUS_COLORS[show.status] || COLORS.textMuted;

  const handleDogPress = (entry: ShowResultEntry) => {
    navigation.push("DogProfile", { id: entry.dog_id, name: entry.dog_name.trim() });
  };

  const renderHeader = () => (
    <>
      <ImageBackground source={heroBg} style={styles.heroBanner} resizeMode="cover">
        <LinearGradient
          colors={["rgba(246,248,247,0)", "rgba(246,248,247,0.6)", "#f6f8f7"]}
          style={styles.heroGradient}
          pointerEvents="none"
        />
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (navigation.canGoBack()) navigation.goBack();
          }}
          activeOpacity={0.7}
          data-testid="btn-back"
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
      </ImageBackground>

      <View style={styles.headerSection}>
        <View style={[styles.heroIcon, { backgroundColor: `${color}20` }]}>
          <Ionicons name={icon} size={32} color={color} />
        </View>
        <Text style={styles.showName} data-testid="text-show-name">{show.name}</Text>
        <View style={styles.badgeRow}>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}18` }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>{show.status}</Text>
          </View>
          <View style={[styles.typeBadge, { backgroundColor: `${color}18` }]}>
            <Text style={[styles.typeBadgeText, { color }]}>{show.event_type}</Text>
          </View>
        </View>
      </View>

      <View style={styles.tabRow}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.7}
            data-testid={`tab-${tab.key}`}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
              {tab.count != null ? ` (${tab.count})` : ""}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );

  if (activeTab === "entry" && user) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
        overScrollMode="always"
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.primary} colors={[COLORS.primary]} />
        }
      >
        {renderHeader()}
        <EntryFormTab show={show} />
        <View style={{ height: 32 }} />
      </ScrollView>
    );
  }

  if (activeTab === "info" || !isShowType) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
        overScrollMode="always"
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.primary} colors={[COLORS.primary]} />
        }
      >
        {renderHeader()}

        <View style={styles.card}>
          <Text style={styles.cardHeading}>Event Details</Text>
          <InfoRow
            icon="calendar"
            label="Date"
            value={show.dates.length > 0 ? show.dates.map(formatDate).join(" — ") : "TBA"}
          />
          {show.location && (
            <InfoRow icon="location" label="Location" value={show.location} />
          )}
          {show.last_date_of_entry && (
            <InfoRow icon="time" label="Last Date of Entry" value={formatDate(show.last_date_of_entry)} />
          )}
          <InfoRow icon="paw" label="Entries" value={String(show.entryCount)} />
        </View>

        {show.judges.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardHeading}>
              {show.judges.length === 1 ? "Judge" : "Judges"}
            </Text>
            {show.judges.map((judge) => (
              <JudgeRow
                key={judge.id}
                judge={judge}
                onPress={() => navigation.push("JudgeDetail", { id: judge.id, backLabel: show.name })}
              />
            ))}
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
        overScrollMode="always"
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.primary} colors={[COLORS.primary]} />
        }
        stickyHeaderIndices={orderedClassNames.length > 0 ? [3] : undefined}
      >
        {renderHeader()}

        {orderedClassNames.length > 0 && (
          <View style={styles.filterTabsSticky}>
            {hasMultipleHairTypes && (
              <View style={styles.hairTabsWrapper}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.hairTabsContent}
                >
                  {orderedHairTypes.map((hair) => {
                    const count = hairGroups.get(hair)?.length || 0;
                    const isSelected = hair === activeHair;
                    return (
                      <TouchableOpacity
                        key={hair}
                        style={[styles.hairTab, isSelected && styles.hairTabActive]}
                        onPress={() => { setSelectedHair(hair); setSelectedClass(null); }}
                        activeOpacity={0.7}
                        data-testid={`hair-tab-${hair.toLowerCase().replace(/\s/g, "-")}`}
                      >
                        <Text style={[styles.hairTabText, isSelected && styles.hairTabTextActive]}>
                          {hair}
                        </Text>
                        <View style={[styles.hairTabCount, isSelected && styles.hairTabCountActive]}>
                          <Text style={[styles.hairTabCountText, isSelected && styles.hairTabCountTextActive]}>
                            {count}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            <View style={styles.classTabsWrapper}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.classTabsContent}
              >
                {orderedClassNames.map((cls) => {
                  const count = classGroups.get(cls)?.length || 0;
                  const isSelected = cls === activeClass;
                  return (
                    <TouchableOpacity
                      key={cls}
                      style={[styles.classTab, isSelected && styles.classTabActive]}
                      onPress={() => setSelectedClass(cls)}
                      activeOpacity={0.7}
                      data-testid={`class-tab-${cls.toLowerCase().replace(/\s/g, "-")}`}
                    >
                      <Text style={[styles.classTabText, isSelected && styles.classTabTextActive]}>
                        {cls}
                      </Text>
                      <View style={[styles.classTabCount, isSelected && styles.classTabCountActive]}>
                        <Text style={[styles.classTabCountText, isSelected && styles.classTabCountTextActive]}>
                          {count}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        )}

        {activeClassResults.length > 0 ? (
          <View style={styles.resultsList}>
            {activeClassResults.map((item, index) => (
              <ResultRow key={`${item.dog_id}-${index}`} entry={item} onPress={() => handleDogPress(item)} />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="trophy-outline" size={32} color={COLORS.primary} />
            </View>
            <Text style={styles.emptyTitle}>No Results Yet</Text>
            <Text style={styles.emptyDesc}>Results will appear here once the show is complete.</Text>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6f8f7",
  },
  scrollContent: {
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f6f8f7",
    gap: SPACING.md,
  },
  loadingName: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 8,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
  },
  retryBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  heroBanner: {
    height: 180,
    justifyContent: "flex-end",
  },
  heroGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 120,
  },
  backButton: {
    position: "absolute",
    top: 48,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerSection: {
    alignItems: "center",
    marginTop: -40,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.md,
    borderWidth: 3,
    borderColor: "#fff",
  },
  showName: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: SPACING.sm,
    lineHeight: 26,
  },
  badgeRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    alignItems: "center",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tabRow: {
    flexDirection: "row",
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: BORDER_RADIUS.sm,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: "#fff",
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeading: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(15,92,59,0.05)",
    gap: SPACING.md,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: `${COLORS.primary}10`,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
    lineHeight: 20,
  },
  judgeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(15,92,59,0.05)",
    gap: SPACING.md,
  },
  judgeAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${COLORS.primary}10`,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: COLORS.accent,
  },
  judgeAvatarImg: { width: 44, height: 44, borderRadius: 22 },
  judgeAvatarInitials: { fontSize: 15, fontWeight: "800", color: COLORS.primary },
  judgeInfo: { flex: 1 },
  judgeName: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
  },
  judgeCredentials: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  filterTabsSticky: {
    backgroundColor: "#f6f8f7",
  },
  hairTabsWrapper: {
    paddingVertical: SPACING.sm,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  hairTabsContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  hairTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  hairTabActive: {
    backgroundColor: `${COLORS.accent}18`,
    borderColor: COLORS.accent,
  },
  hairTabText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  hairTabTextActive: {
    color: COLORS.accent,
  },
  hairTabCount: {
    minWidth: 22,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 5,
  },
  hairTabCountActive: {
    backgroundColor: `${COLORS.accent}30`,
  },
  hairTabCountText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  hairTabCountTextActive: {
    color: COLORS.accent,
  },
  classTabsWrapper: {
    paddingVertical: SPACING.sm,
  },
  classTabsContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  classTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  classTabActive: {
    backgroundColor: `${COLORS.primary}12`,
    borderColor: COLORS.primary,
  },
  classTabText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  classTabTextActive: {
    color: COLORS.primary,
  },
  classTabCount: {
    minWidth: 22,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 5,
  },
  classTabCountActive: {
    backgroundColor: `${COLORS.primary}20`,
  },
  classTabCountText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  classTabCountTextActive: {
    color: COLORS.primary,
  },
  resultsList: {
    marginHorizontal: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(15,92,59,0.05)",
    gap: SPACING.sm,
  },
  gradingBadge: {
    minWidth: 52,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: `${COLORS.accent}18`,
    alignItems: "center",
  },
  gradingText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.accent,
  },
  resultInfo: { flex: 1 },
  resultName: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },
  resultKp: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: SPACING.xl,
    gap: SPACING.sm,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: `${COLORS.primary}10`,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
  },
  emptyDesc: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 18,
  },
  entryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  entryEmptyWrap: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: SPACING.xl,
    gap: SPACING.sm,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 6,
  },
  required: {
    color: COLORS.error ?? "#DC2626",
  },
  selectedDogsSection: {
    marginBottom: 4,
  },
  selectedDogsCount: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primary,
  },
  selectedDogCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 10,
    padding: 10,
    backgroundColor: `${COLORS.primary}08`,
    gap: 10,
    marginBottom: 16,
  },
  selectedDogAvatar: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedDogInfo: { flex: 1 },
  selectedDogName: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },
  selectedDogSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  selectedDogCardIneligible: {
    borderColor: "#DC2626",
    backgroundColor: "#FEF2F2",
  },
  selectedDogCardError: {
    borderColor: "#D97706",
    backgroundColor: "#FFFBEB",
  },
  dogClassBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#DCFCE7",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 5,
  },
  dogClassBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#16A34A",
    letterSpacing: 0.3,
  },
  dogIneligibleReason: {
    fontSize: 11,
    color: "#DC2626",
    marginTop: 3,
    lineHeight: 15,
  },
  dogErrorReason: {
    color: "#D97706",
  },
  dogVerifyBadge: {
    width: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  searchInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: COLORS.surface,
    marginBottom: 4,
  },
  searchInputWrapOpen: {
    borderColor: COLORS.primary,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    paddingVertical: 0,
  },
  dropdownEmpty: {
    paddingHorizontal: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  dropdownEmptyText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  dropdownList: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    marginBottom: 16,
    overflow: "hidden",
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 10,
  },
  dropdownItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(15,92,59,0.06)",
  },
  dropdownItemAvatar: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: `${COLORS.primary}10`,
    justifyContent: "center",
    alignItems: "center",
  },
  dropdownItemName: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },
  dropdownItemSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 4,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnIneligible: {
    backgroundColor: "#DC2626",
    opacity: 1,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#86EFAC",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  successText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#15803D",
    flex: 1,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorBannerText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#DC2626",
    flex: 1,
  },
  verifyErrorBlock: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  verifyErrorHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  verifyErrorTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#DC2626",
  },
  verifyErrorRow: {
    paddingLeft: 22,
    gap: 2,
  },
  verifyErrorDog: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
  },
  verifyErrorReason: {
    fontSize: 12,
    color: "#DC2626",
  },
});
