

// Design for main page interface.

  export const UI = {
    bg: "#FAF8F5",
    card: "#FFFFFF",
    border: "#E7DED5",
    borderSoft: "#EFE7DF",
    text: "#2B2622", // dark brown/charcoal
    muted: "rgba(43, 38, 34, 0.65)",
    shadow: "0 10px 28px rgba(43, 38, 34, 0.08), 0 1px 0 rgba(43, 38, 34, 0.04)",
    shadowSoft: "0 6px 18px rgba(43, 38, 34, 0.06), 0 1px 0 rgba(43, 38, 34, 0.035)",
    radius: 18,
    radiusSm: 12,
    radiusPill: 999,
    sage: "#6F8F77", // primary
    sageDark: "#5E7E66",
    tan: "#C9A77E", // secondary
    tanSoft: "rgba(201, 167, 126, 0.18)",
    danger: "#B04435",
    success: "#2E7D57",
    font: `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
    fontSerif: `ui-serif, Georgia, "Times New Roman", serif`,
  };


  // Design for individual card components (e.g. log-in box, search box, review card, definition card etc).

  export const Card = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
    <div
      style={{
        background: UI.card,
        border: `1px solid ${UI.borderSoft}`,
        borderRadius: UI.radius,
        boxShadow: UI.shadowSoft,
        padding: 18,
        ...style,
      }}
    >
      {children}
    </div>
  );

  // Design for micro components in cards (e.g. adjective bubble).

  export const Chip = ({ children }: { children: React.ReactNode }) => (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "5px 10px",
        borderRadius: UI.radiusPill,
        border: `1px solid ${UI.borderSoft}`,
        background: "rgba(250, 248, 245, 0.75)",
        color: UI.text,
        fontSize: 12,
        lineHeight: "16px",
        fontWeight: 600,
        letterSpacing: 0.2,
      }}
    >
      {children}
    </span>
  );