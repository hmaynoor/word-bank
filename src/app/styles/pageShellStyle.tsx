import {UI} from "@/app/styles/userinterfacestyle";

export const PageShell = ({ children }: { children: React.ReactNode }) => (
    <div
      style={{
        minHeight: "100vh",
        background: UI.bg,
        color: UI.text,
        fontFamily: UI.font,
      }}
    >
      <div style={{ maxWidth: 780, margin: "0 auto", padding: "44px 16px 80px" }}>{children}</div>
    </div>
);