import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
  className?: string;
};

export default function SecondaryButton({
  children,
  className = "",
  ...props
}: Props) {
  return (
    <button
      type="button"
      className={`w-full py-2 rounded-lg cr-border border text-sm font-medium cr-text hover:bg-white/5 transition-colors shrink-0 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
