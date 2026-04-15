import { useState } from "react";
import { View, Text, TouchableOpacity, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../lib/theme";

const CAL_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const CAL_DOW = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function CalendarDatePicker({
  label,
  required,
  value,
  onChange,
  minDate,
  maxDate,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  minDate?: Date;
  maxDate?: Date;
}) {
  const today = new Date();
  const max = maxDate ?? today;
  const maxDay = new Date(max.getFullYear(), max.getMonth(), max.getDate());
  const minDay = minDate
    ? new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate())
    : null;

  const parseValue = (v: string): Date | null => {
    if (!v) return null;
    const [d, m, y] = v.split("-").map(Number);
    return d && m && y ? new Date(y, m - 1, d) : null;
  };
  const selected = parseValue(value);
  const [show, setShow] = useState(false);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const openPicker = () => {
    if (selected) {
      setViewYear(selected.getFullYear());
      setViewMonth(selected.getMonth());
    } else if (minDay) {
      setViewYear(minDay.getFullYear());
      setViewMonth(minDay.getMonth());
    } else {
      setViewYear(maxDay.getFullYear());
      setViewMonth(maxDay.getMonth());
    }
    setShow(true);
  };

  const atMaxMonth =
    viewYear > maxDay.getFullYear() ||
    (viewYear === maxDay.getFullYear() && viewMonth >= maxDay.getMonth());
  const atMinMonth = !!minDay && (
    viewYear < minDay.getFullYear() ||
    (viewYear === minDay.getFullYear() && viewMonth <= minDay.getMonth())
  );

  const prevMonth = () => {
    if (atMinMonth) return;
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (atMaxMonth) return;
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const isDisabled = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    if (d > maxDay) return true;
    if (minDay && d < minDay) return true;
    return false;
  };

  const selectDay = (day: number) => {
    if (isDisabled(day)) return;
    onChange(
      `${String(day).padStart(2, "0")}-${String(viewMonth + 1).padStart(2, "0")}-${viewYear}`,
    );
    setShow(false);
  };

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);
  while (cells.length % 7 !== 0) cells.push(null);

  const isSel = (d: number) =>
    selected &&
    selected.getDate() === d &&
    selected.getMonth() === viewMonth &&
    selected.getFullYear() === viewYear;
  const isTod = (d: number) =>
    today.getDate() === d &&
    today.getMonth() === viewMonth &&
    today.getFullYear() === viewYear;

  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontSize: 13, fontWeight: "600", color: "#334155", marginBottom: 5 }}>
        {label}
        {required ? <Text style={{ color: COLORS.error }}> *</Text> : null}
      </Text>
      <View style={{
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 10,
        backgroundColor: "#fff",
        overflow: "hidden",
      }}>
        <TouchableOpacity
          onPress={openPicker}
          activeOpacity={0.8}
          style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 10 }}
        >
          <Ionicons name="calendar-outline" size={16} color={value ? COLORS.primary : COLORS.textMuted} />
          <Text style={{ fontSize: 13, color: value ? COLORS.text : COLORS.textMuted }}>
            {value || "Select date"}
          </Text>
        </TouchableOpacity>
        {!!value && (
          <TouchableOpacity
            onPress={() => onChange("")}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{ paddingHorizontal: 12 }}
          >
            <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <Modal visible={show} transparent animationType="fade" onRequestClose={() => setShow(false)}>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center" }}
          activeOpacity={1}
          onPress={() => setShow(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}} style={{ backgroundColor: "#fff", borderRadius: 16, padding: 16, width: 300 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <TouchableOpacity
                onPress={atMinMonth ? undefined : prevMonth}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={{ opacity: atMinMonth ? 0.25 : 1 }}
              >
                <Ionicons name="chevron-back" size={22} color={COLORS.primary} />
              </TouchableOpacity>
              <Text style={{ fontSize: 15, fontWeight: "700", color: COLORS.text }}>
                {CAL_MONTHS[viewMonth]} {viewYear}
              </Text>
              <TouchableOpacity
                onPress={atMaxMonth ? undefined : nextMonth}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={{ opacity: atMaxMonth ? 0.25 : 1 }}
              >
                <Ionicons name="chevron-forward" size={22} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: "row", marginBottom: 6 }}>
              {CAL_DOW.map((d) => (
                <Text key={d} style={{ flex: 1, textAlign: "center", fontSize: 11, fontWeight: "600", color: COLORS.textMuted }}>
                  {d}
                </Text>
              ))}
            </View>
            {Array.from({ length: cells.length / 7 }).map((_, week) => (
              <View key={week} style={{ flexDirection: "row", marginBottom: 2 }}>
                {cells.slice(week * 7, week * 7 + 7).map((day, i) => {
                  const disabled = !!day && isDisabled(day);
                  const sel = !!day && !!isSel(day);
                  const tod = !!day && isTod(day);
                  return (
                    <TouchableOpacity
                      key={i}
                      onPress={() => { if (day && !disabled) selectDay(day); }}
                      activeOpacity={day && !disabled ? 0.7 : 1}
                      style={{
                        flex: 1,
                        height: 36,
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 18,
                        backgroundColor: sel ? COLORS.primary : tod ? `${COLORS.primary}18` : "transparent",
                        opacity: disabled ? 0.3 : 1,
                      }}
                    >
                      {!!day && (
                        <Text style={{
                          fontSize: 13,
                          fontWeight: sel || tod ? "700" : "400",
                          color: sel ? "#fff" : tod ? COLORS.primary : COLORS.text,
                        }}>
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
