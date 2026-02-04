
import {UI} from "@/app/styles/userinterfacestyle";
  
  export const Button = ({
    children,
    variant = "primary",
    disabled,
    style,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "ghost" | "danger";
  }) => {
    const base: React.CSSProperties = {
      fontFamily: UI.font,
      borderRadius: 14,
      padding: "10px 12px",
      fontSize: 14,
      fontWeight: 650,
      border: "1px solid transparent",
      cursor: disabled ? "not-allowed" : "pointer",
      transition: "transform 120ms ease, box-shadow 120ms ease, background 120ms ease, border-color 120ms ease, opacity 120ms ease",
      boxShadow: disabled ? "none" : "0 6px 14px rgba(43, 38, 34, 0.08)",
      transform: "translateY(0px)",
      opacity: disabled ? 0.55 : 1,
      userSelect: "none",
      WebkitTapHighlightColor: "transparent",
    };

    const stylesByVariant: Record<string, React.CSSProperties> = {
      primary: {
        background: UI.sage,
        color: "#fff",
        borderColor: "rgba(255,255,255,0.0)",
      },
      secondary: {
        background: UI.tanSoft,
        color: UI.text,
        borderColor: "rgba(201, 167, 126, 0.35)",
        boxShadow: disabled ? "none" : "0 6px 14px rgba(201, 167, 126, 0.10)",
      },
      ghost: {
        background: "transparent",
        color: UI.text,
        borderColor: UI.borderSoft,
        boxShadow: "none",
      },
      danger: {
        background: "rgba(176, 68, 53, 0.12)",
        color: UI.danger,
        borderColor: "rgba(176, 68, 53, 0.28)",
        boxShadow: "none",
      },
    };

    return (
      <button
        {...props}
        disabled={disabled}
        style={{ ...base, ...stylesByVariant[variant], ...style }}
        onMouseDown={(e) => {
          if (disabled) return;
          (e.currentTarget as HTMLButtonElement).style.transform = "translateY(1px)";
          props.onMouseDown?.(e);
        }}
        onMouseUp={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0px)";
          props.onMouseUp?.(e);
        }}
        onMouseEnter={(e) => {
          if (disabled) return;
          // subtle hover
          const el = e.currentTarget as HTMLButtonElement;
          if (variant === "primary") el.style.background = UI.sageDark;
          if (variant === "ghost") el.style.background = "rgba(250, 248, 245, 0.9)";
          if (variant === "secondary") el.style.background = "rgba(201, 167, 126, 0.24)";
          props.onMouseEnter?.(e);
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLButtonElement;
          if (variant === "primary") el.style.background = UI.sage;
          if (variant === "ghost") el.style.background = "transparent";
          if (variant === "secondary") el.style.background = UI.tanSoft;
          el.style.transform = "translateY(0px)";
          props.onMouseLeave?.(e);
        }}
      >
        {children}
      </button>
    );
  };