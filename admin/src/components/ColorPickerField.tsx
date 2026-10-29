'use client';

import type { TextFieldClientComponent } from 'payload';
import { FieldLabel, useField } from '@payloadcms/ui';

function normalizeHex(val?: string | null): string {
  if (!val) return '#ffd700';
  const trimmed = val.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed;
  if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
    const [, r, g, b] = trimmed;
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return '#ffd700';
}

export const ColorPickerField: TextFieldClientComponent = ({ field, path }) => {
  const fieldPath = path || field.name;
  const { value, setValue } = useField<string>({ path: fieldPath });
  const safeHex = normalizeHex(value);

  return (
    <div className="field-type text" style={{ flex: 1, minWidth: 200 }}>
      <FieldLabel label={field.label || field.name} path={fieldPath} required={field.required} />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.55rem',
          marginTop: '0.35rem',
        }}
      >
        <input
          type="color"
          value={safeHex}
          onChange={(e) => setValue(e.target.value)}
          aria-label={typeof field.label === 'string' ? field.label : field.name}
          style={{
            width: 42,
            height: 40,
            padding: 2,
            border: '1px solid var(--theme-elevation-200)',
            borderRadius: 4,
            background: 'var(--theme-input-bg, var(--theme-elevation-50))',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        />
        <input
          type="text"
          value={value || ''}
          placeholder="#ffd700"
          onChange={(e) => setValue(e.target.value)}
          style={{
            width: '100%',
            height: 40,
            padding: '0 0.75rem',
            border: '1px solid var(--theme-elevation-150)',
            borderRadius: 4,
            background: 'var(--theme-input-bg, var(--theme-elevation-50))',
            color: 'var(--theme-text)',
            fontFamily: 'monospace',
            fontSize: 13,
          }}
        />
      </div>
    </div>
  );
};

export default ColorPickerField;
