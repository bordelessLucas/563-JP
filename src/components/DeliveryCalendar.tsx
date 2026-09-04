import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { colors, radius, spacing } from "@/src/components/theme";
import { Typography } from "@/src/components/Typography";

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

type DeliveryCalendarProps = {
  selectedDate: string;
  onSelectDate: (value: string) => void;
  minDate: Date;
  maxDate: Date;
};

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function formatDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateInput(value: string): Date | null {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return startOfDay(new Date(year, month - 1, day));
}

function monthLabel(date: Date): string {
  const label = date.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function sameMonth(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth()
  );
}

export function DeliveryCalendar({
  selectedDate,
  onSelectDate,
  minDate,
  maxDate,
}: DeliveryCalendarProps) {
  const minimum = startOfDay(minDate);
  const maximum = startOfDay(maxDate);
  const initialMonth = parseDateInput(selectedDate) ?? minimum;

  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(initialMonth.getFullYear(), initialMonth.getMonth(), 1),
  );

  const canGoPrevious = useMemo(() => {
    const previous = new Date(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth() - 1,
      1,
    );
    const minMonth = new Date(minimum.getFullYear(), minimum.getMonth(), 1);
    return previous >= minMonth;
  }, [minimum, visibleMonth]);

  const canGoNext = useMemo(() => {
    const next = new Date(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth() + 1,
      1,
    );
    const maxMonth = new Date(maximum.getFullYear(), maximum.getMonth(), 1);
    return next <= maxMonth;
  }, [maximum, visibleMonth]);

  const days = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: Array<Date | null> = [];

    for (let index = 0; index < firstWeekday; index += 1) {
      cells.push(null);
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push(new Date(year, month, day));
    }
    while (cells.length % 7 !== 0) {
      cells.push(null);
    }
    return cells;
  }, [visibleMonth]);

  const goPreviousMonth = () => {
    if (!canGoPrevious) return;
    setVisibleMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() - 1, 1),
    );
  };

  const goNextMonth = () => {
    if (!canGoNext) return;
    setVisibleMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() + 1, 1),
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Mês anterior"
          accessibilityRole="button"
          disabled={!canGoPrevious}
          hitSlop={8}
          onPress={goPreviousMonth}
          style={[styles.navButton, !canGoPrevious && styles.navDisabled]}
        >
          <Ionicons
            color={canGoPrevious ? colors.primary : colors.border}
            name="chevron-back"
            size={20}
          />
        </Pressable>
        <Typography style={styles.monthLabel} variant="body">
          {monthLabel(visibleMonth)}
        </Typography>
        <Pressable
          accessibilityLabel="Próximo mês"
          accessibilityRole="button"
          disabled={!canGoNext}
          hitSlop={8}
          onPress={goNextMonth}
          style={[styles.navButton, !canGoNext && styles.navDisabled]}
        >
          <Ionicons
            color={canGoNext ? colors.primary : colors.border}
            name="chevron-forward"
            size={20}
          />
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAYS.map((label, index) => (
          <Typography key={`${label}-${index}`} style={styles.weekday} variant="caption">
            {label}
          </Typography>
        ))}
      </View>

      <View style={styles.grid}>
        {days.map((day, index) => {
          if (!day) {
            return <View key={`empty-${index}`} style={styles.dayCell} />;
          }

          const value = formatDateInput(day);
          const isSelected = selectedDate === value;
          const isDisabled = day < minimum || day > maximum;
          const isToday = sameMonth(day, new Date()) && formatDateInput(new Date()) === value;

          return (
            <Pressable
              key={value}
              accessibilityRole="button"
              accessibilityState={{ disabled: isDisabled, selected: isSelected }}
              disabled={isDisabled}
              onPress={() => onSelectDate(value)}
              style={[styles.dayCell, isDisabled && styles.dayDisabled]}
            >
              <View
                style={[
                  styles.dayInner,
                  isSelected && styles.daySelected,
                  isToday && !isSelected && styles.dayToday,
                ]}
              >
                <Typography
                  style={[
                    styles.dayLabel,
                    isSelected && styles.dayLabelSelected,
                    isDisabled && styles.dayLabelDisabled,
                  ]}
                  variant="caption"
                >
                  {day.getDate()}
                </Typography>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  navButton: {
    alignItems: "center",
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  navDisabled: {
    opacity: 0.45,
  },
  monthLabel: {
    color: colors.ink,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  weekRow: {
    flexDirection: "row",
  },
  weekday: {
    color: colors.muted,
    flex: 1,
    fontWeight: "700",
    textAlign: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: spacing.sm,
  },
  dayCell: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    width: `${100 / 7}%`,
  },
  dayInner: {
    alignItems: "center",
    borderRadius: radius.md,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  daySelected: {
    backgroundColor: colors.primary,
  },
  dayToday: {
    borderColor: colors.primary,
    borderWidth: 1,
  },
  dayDisabled: {
    opacity: 0.35,
  },
  dayLabel: {
    color: colors.ink,
    fontWeight: "700",
  },
  dayLabelSelected: {
    color: colors.white,
  },
  dayLabelDisabled: {
    color: colors.muted,
  },
});
