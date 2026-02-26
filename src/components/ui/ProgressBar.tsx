type Props = {
  value: number;
  max?: number;
  /** "gradient" (yellow→green), "purple", or "custom" (use className for fill) */
  variant?: "gradient" | "purple" | "custom";
  height?: "sm" | "md";
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
  const hClass = height === "sm" ? "h-1.5" : "h-2";

  const fillClass =
    variant === "gradient"
      ? "bg-gradient-to-r from-[#eab308] to-[#22c55e]"
      : variant === "purple"
        ? "bg-[#7b4fff]"
        : className || "bg-gradient-to-r from-[#eab308] to-[#22c55e]";

  return (
    <div className={`${hClass} rounded-full bg-black/30 overflow-hidden`}>
      <div
        className={`h-full rounded-full transition-all duration-300 ${fillClass}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
