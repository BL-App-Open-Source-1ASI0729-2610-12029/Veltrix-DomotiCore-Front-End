import { TimelineSlotResponse } from '../infrastructure/automation-response';

export type TimelineZoomMode = 'business' | 'extended' | 'focus';
export type TimelineFilter = 'all' | 'operational' | 'security';

export interface TimelineRange {
  start: number;
  end: number;
}

export const TIMELINE_ZOOM_RANGES: Record<Exclude<TimelineZoomMode, 'focus'>, TimelineRange> = {
  business: { start: 8, end: 22 },
  extended: { start: 6, end: 23 },
};

export function getFocusRange(currentDecimal: number): TimelineRange {
  const start = Math.max(6, Math.floor(currentDecimal) - 2);
  const end = Math.min(23, Math.ceil(currentDecimal) + 5);
  return { start, end };
}

export function getTimelineRange(zoom: TimelineZoomMode, currentDecimal: number): TimelineRange {
  if (zoom === 'focus') {
    return getFocusRange(currentDecimal);
  }
  return TIMELINE_ZOOM_RANGES[zoom];
}

export function formatDecimalHour(value: number): string {
  const hours = Math.floor(value);
  const minutes = Math.round((value - hours) * 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function getTimelineHours(range: TimelineRange): number[] {
  const hours: number[] = [];
  for (let hour = range.start; hour <= range.end; hour += 2) {
    hours.push(hour);
  }
  if (hours[hours.length - 1] !== range.end) {
    hours.push(range.end);
  }
  return hours;
}

export function getTimelineGridHours(range: TimelineRange): number[] {
  const hours: number[] = [];
  for (let hour = range.start; hour < range.end; hour += 2) {
    hours.push(hour);
  }
  return hours;
}

function slotsOverlap(a: TimelineSlotResponse, b: TimelineSlotResponse): boolean {
  return a.startHour < b.endHour && b.startHour < a.endHour;
}

export function assignStackIndexes(slots: TimelineSlotResponse[]): TimelineSlotResponse[] {
  const categories: Array<TimelineSlotResponse['category']> = ['operational', 'security'];

  return categories.flatMap(category => {
    const categorySlots = slots
      .filter(slot => slot.category === category)
      .sort((a, b) => a.startHour - b.startHour || a.endHour - b.endHour);

    const laneEnds: number[] = [];

    return categorySlots.map(slot => {
      let stackIndex = laneEnds.findIndex(endHour => endHour <= slot.startHour);

      if (stackIndex === -1) {
        stackIndex = laneEnds.length;
        laneEnds.push(slot.endHour);
      } else {
        laneEnds[stackIndex] = slot.endHour;
      }

      return { ...slot, stackIndex };
    });
  });
}

export function markConflicts(slots: TimelineSlotResponse[]): TimelineSlotResponse[] {
  const conflictIds = new Set<string>();

  for (let i = 0; i < slots.length; i += 1) {
    for (let j = i + 1; j < slots.length; j += 1) {
      const left = slots[i];
      const right = slots[j];

      if (left.category !== right.category) continue;
      if (!slotsOverlap(left, right)) continue;

      conflictIds.add(left.id);
      conflictIds.add(right.id);
    }
  }

  return slots.map(slot => ({
    ...slot,
    hasConflict: conflictIds.has(slot.id),
    conflictCount: conflictIds.has(slot.id)
      ? slots.filter(other => other.id !== slot.id && other.category === slot.category && slotsOverlap(slot, other)).length
      : 0,
  }));
}

export function layoutTimelineSlots(slots: TimelineSlotResponse[]): TimelineSlotResponse[] {
  return markConflicts(assignStackIndexes(slots));
}

export function filterTimelineSlots(
  slots: TimelineSlotResponse[],
  filter: TimelineFilter,
): TimelineSlotResponse[] {
  if (filter === 'all') return slots;
  if (filter === 'operational') return slots.filter(slot => slot.category === 'operational');
  return slots.filter(slot => slot.category === 'security');
}

export function getMaxStackIndex(slots: TimelineSlotResponse[], category: TimelineSlotResponse['category']): number {
  const indexes = slots
    .filter(slot => slot.category === category)
    .map(slot => slot.stackIndex ?? 0);

  return indexes.length ? Math.max(...indexes) : 0;
}
