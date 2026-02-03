
import {UI} from "@/app/styles/userinterfacestyle";

export const Title = ({ 
    length,
    due,
    subtitle, 
}: { 
    length: number,
    due: number,
    subtitle?: React.ReactNode }
  ) => (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
        <h1
          style={{
            margin: 0,
            fontSize: 52,
            letterSpacing: -0.8,
            lineHeight: "1.05",
            fontWeight: 850,
          }}
        >
          Word Bank
        </h1>
        <span style={{ color: UI.muted, fontSize: 14, fontWeight: 650 }}>
          {length} saved • {due} due
        </span>
      </div>
      {subtitle ? <div style={{ marginTop: 10, color: UI.muted, lineHeight: "20px" }}>{subtitle}</div> : null}
    </div>
  );