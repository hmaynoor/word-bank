import {UI} from "@/app/styles/userinterfacestyle";

export const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input
      {...props}
      style={{
        fontFamily: UI.font,
        padding: 12,
        borderRadius: 14,
        border: `1px solid ${UI.borderSoft}`,
        background: "#fff",
        outline: "none",
        fontSize: 14,
        color: UI.text,
        boxShadow: "0 1px 0 rgba(43, 38, 34, 0.03)",
        ...props.style,
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = "rgba(111, 143, 119, 0.55)";
        e.currentTarget.style.boxShadow = "0 0 0 4px rgba(111, 143, 119, 0.14)";
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = UI.borderSoft;
        e.currentTarget.style.boxShadow = "0 1px 0 rgba(43, 38, 34, 0.03)";
        props.onBlur?.(e);
      }}
    />
  );