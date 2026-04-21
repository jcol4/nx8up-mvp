/**
 * ProgressBar — accessible bar with ARIA progressbar role.
 * Fill color is controlled by variant; "custom" uses className for the fill element.
 */
type Props = {
  /** Current value — compared against max to compute percentage. */
  value: number;
  max?: number;
  /** "gradient" (yellow→green), "purple", or "custom" (use className for fill) */
  variant?: "gradient" | "purple" | "custom";
  height?: "sm" | "md";
  /** Applied to the fill div when variant="custom". */
  className?: string;
};

export default function ProgressBar({
  value,
  max = 1,
  variant = "gradient",
  height = "sm",
  className = "",
}: Props) {
  const percent = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const hClass = height === "sm" ? "h-1.5" : "h-2.5";
  // Track: visible on both light and dark (e.g. creator dashboard) backgrounds
  const trackClass = "rounded-full overflow-hidden bg-white/15 border border-white/10";

  const fillClass =
    variant === "gradient"
      ? "bg-gradient-to-r from-[#eab308] to-[#22c55e]"
      : variant === "purple"
        ? "bg-[#7b4fff]"
        : className || "bg-gradient-to-r from-[#eab308] to-[#22c55e]";

  return (
    <div className={`w-full ${hClass} ${trackClass}`} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
      <div
        className={`h-full min-w-0 rounded-full transition-all duration-300 ${fillClass}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
