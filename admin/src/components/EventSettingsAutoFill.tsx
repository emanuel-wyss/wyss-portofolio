'use client';

import { useEffect, useRef } from 'react';
import { useField } from '@payloadcms/ui';

type EventPreset = {
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
  endYearOffset?: number;
  intensity: 'quiet' | 'standard' | 'party';
  announcement: string;
  primaryColor: string;
  accentColor: string;
};

function getEasterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function getEventPresets(year = new Date().getFullYear()): Record<string, EventPreset> {
  const easter = getEasterSunday(year);
  const easterStart = new Date(easter);
  easterStart.setDate(easter.getDate() - 3);
  const easterEnd = new Date(easter);
  easterEnd.setDate(easter.getDate() + 1);

  return {
    halloween: {
      startMonth: 10,
      startDay: 28,
      endMonth: 10,
      endDay: 31,
      intensity: 'standard',
      announcement: 'SPOOKY SEASON // HALLOWEEN MODE ACTIVE',
      primaryColor: '#ff7518',
      accentColor: '#39ff14',
    },
    christmas: {
      startMonth: 12,
      startDay: 22,
      endMonth: 12,
      endDay: 28,
      intensity: 'standard',
      announcement: 'WINTER SOLSTICE // FESTIVE SNOW GLOBE',
      primaryColor: '#ff3333',
      accentColor: '#39d353',
    },
    newyear: {
      startMonth: 12,
      startDay: 29,
      endMonth: 1,
      endDay: 3,
      endYearOffset: 1,
      intensity: 'party',
      announcement: `HAPPY NEW YEAR ${year + 1} // LAUNCH ROCKETS`,
      primaryColor: '#ffd700',
      accentColor: '#00e5ff',
    },
    valentines: {
      startMonth: 2,
      startDay: 11,
      endMonth: 2,
      endDay: 14,
      intensity: 'standard',
      announcement: 'VALENTINES // HEART CONSTELLATION ACTIVE',
      primaryColor: '#ff4466',
      accentColor: '#ff99aa',
    },
    easter: {
      startMonth: easterStart.getMonth() + 1,
      startDay: easterStart.getDate(),
      endMonth: easterEnd.getMonth() + 1,
      endDay: easterEnd.getDate(),
      intensity: 'standard',
      announcement: 'EASTER // FIND ALL 6 HIDDEN EGGS',
      primaryColor: '#ffd700',
      accentColor: '#ffb3cc',
    },
    pride: {
      startMonth: 6,
      startDay: 1,
      endMonth: 6,
      endDay: 30,
      intensity: 'party',
      announcement: 'PRIDE MONTH // RAINBOW RIBBON PAINTER',
      primaryColor: '#ff0080',
      accentColor: '#00e5ff',
    },
    swiss: {
      startMonth: 7,
      startDay: 29,
      endMonth: 8,
      endDay: 1,
      intensity: 'standard',
      announcement: '1. AUGUST // BUNDESFEIER & HÖHENFEUER',
      primaryColor: '#ff3333',
      accentColor: '#ffffff',
    },
    aprilfools: {
      startMonth: 4,
      startDay: 1,
      endMonth: 4,
      endDay: 1,
      intensity: 'party',
      announcement: 'WARN // KERNEL_PANIC: APRIL_FOOLS.EXE',
      primaryColor: '#39ff14',
      accentColor: '#ff00ff',
    },
  };
}

export function EventSettingsAutoFill() {
  const { value: selectedEvent } = useField<string>({ path: 'event_settings.event' });
  const { setValue: setEnabled } = useField<boolean>({ path: 'event_settings.enabled' });
  const { setValue: setStartDate } = useField<string>({ path: 'event_settings.startDate' });
  const { setValue: setEndDate } = useField<string>({ path: 'event_settings.endDate' });
  const { setValue: setIntensity } = useField<string>({ path: 'event_settings.intensity' });
  const { setValue: setAnnouncement } = useField<string>({ path: 'event_settings.announcement' });
  const { setValue: setPrimaryColor } = useField<string>({ path: 'event_settings.primaryColor' });
  const { setValue: setAccentColor } = useField<string>({ path: 'event_settings.accentColor' });

  const prevEventRef = useRef<string | undefined>(selectedEvent);

  const applyPreset = (eventKey: string) => {
    const year = new Date().getFullYear();
    const presets = getEventPresets(year);
    const preset = presets[eventKey];
    if (!preset) return;

    const startIso = new Date(Date.UTC(year, preset.startMonth - 1, preset.startDay, 0, 0, 0)).toISOString();
    const endIso = new Date(
      Date.UTC(year + (preset.endYearOffset || 0), preset.endMonth - 1, preset.endDay, 23, 59, 59)
    ).toISOString();

    setEnabled(true);
    setStartDate(startIso);
    setEndDate(endIso);
    setIntensity(preset.intensity);
    setAnnouncement(preset.announcement);
    setPrimaryColor(preset.primaryColor);
    setAccentColor(preset.accentColor);
  };

  useEffect(() => {
    if (selectedEvent && selectedEvent !== prevEventRef.current) {
      prevEventRef.current = selectedEvent;
      applyPreset(selectedEvent);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEvent]);

  if (!selectedEvent) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        flexWrap: 'wrap',
        padding: '0.6rem 0.85rem',
        marginBottom: '0.85rem',
        border: '1px solid var(--theme-elevation-150)',
        borderRadius: 4,
        background: 'var(--theme-elevation-50)',
        fontSize: 12,
      }}
    >
      <span>
        Loaded preset values for <strong>{selectedEvent}</strong>. You can customize any field below before saving.
      </span>
      <button
        type="button"
        className="btn btn--style-secondary btn--size-small"
        onClick={() => applyPreset(selectedEvent)}
      >
        Reset to &ldquo;{selectedEvent}&rdquo; Defaults
      </button>
    </div>
  );
}

export default EventSettingsAutoFill;
