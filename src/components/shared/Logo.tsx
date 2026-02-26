import Link from "next/link";

type Props = {
  href?: string;
  /** "creator" for cr-logo, "admin" for dash-logo */
  variant?: "creator" | "admin";
  className?: string;
};

export default function Logo({ href = "/creator", variant = "creator", className = "" }: Props) {
  const logoClass = variant === "creator" ? "cr-logo" : "dash-logo";
  const iconClass = variant === "creator" ? "cr-logo-icon" : "dash-logo-icon";
  return (
    <Link href={href} className={`${logoClass} ${className}`.trim()}>
      <div className={iconClass}>
        <span />
        <span />
        <span />
      </div>
      NX8UP
    </Link>
  );
}
