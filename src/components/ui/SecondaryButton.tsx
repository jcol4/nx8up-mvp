import type { ButtonHTMLAttributes } from "react";

const VARIANT_CLASS = {
  default:
    "w-full py-2 rounded-lg cr-border border text-sm font-medium cr-text hover:text-[#c8dff0] transition-colors shrink-0",
  danger:
    "w-full py-2 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30 disabled:opacity-50 transition-colors shrink-0",
} as const;

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
  variant?: "default" | "danger";
  className?: string;
};

export default function SecondaryButton({
  children,
  variant = "default",
  className = "",
  ...props
}: Props) {
  return (
    <button
      type="button"
      className={`${VARIANT_CLASS[variant]} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
