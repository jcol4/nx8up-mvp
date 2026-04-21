/**
 * Alert — inline status/error message banner.
 * Uses ARIA roles: role="alert" for errors (assertive), role="status" for success (polite).
 */

type Props = {
  /** Visual style and ARIA role. "error" uses role="alert"; "success" uses role="status". */
  variant: "success" | "error";
  children: React.ReactNode;
  className?: string;
};

const VARIANT_CLASS = {
  success:
    "p-3 rounded-lg bg-[#22c55e]/10 border border-[#22c55e]/30 text-sm text-[#22c55e]",
  error:
    "p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm",
} as const;

export default function Alert({ variant, children, className = "" }: Props) {
  return (
    <div
      className={`${VARIANT_CLASS[variant]} ${className}`.trim()}
      role={variant === "error" ? "alert" : "status"}
    >
      {children}
    </div>
  );
}
