
import { UI } from "@/app/styles/userinterfacestyle";

type PillTabItem<T extends string> = { value: T; label: string };

type PillTabsProps<T extends string> = {
  value: T;
  onChange: (v: T) => void;
  items: PillTabItem<T>[];
};

export const PillTabs = <T extends string>({ value, onChange, items }: PillTabsProps<T>) => (
    <div
      style={{
        display: "inline-flex",
        gap: 6,
        padding: 6,
        borderRadius: UI.radiusPill,
        background: "rgba(255,255,255,0.70)",
        border: `1px solid ${UI.borderSoft}`,
        boxShadow: "0 6px 18px rgba(43, 38, 34, 0.06)",
      }}
    >
      {items.map((it) => {
        const active = it.value === value;
        return (
          <button
            key={it.value}
            onClick={() => onChange(it.value)}
            style={{
              fontFamily: UI.font,
              border: "1px solid transparent",
              cursor: "pointer",
              borderRadius: UI.radiusPill,
              padding: "10px 12px",
              fontSize: 13,
              fontWeight: 700,
              color: active ? "#fff" : UI.text,
              background: active ? UI.sage : "transparent",
              transition: "background 150ms ease, color 150ms ease, transform 120ms ease",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              if (!active) el.style.background = "rgba(111, 143, 119, 0.10)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              if (!active) el.style.background = "transparent";
            }}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );