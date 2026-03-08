import Link from "next/link";

type Props = {
  variant: "creator" | "dashboard";
  /** Optional. When omitted, only the wrapper and children are rendered (no title row). */
  title?: string;
  /** Heading level for the title (default 2). */
  titleLevel?: 1 | 2 | 3;
  href?: string;
  linkLabel?: string;
  /** Optional node to render on the right side of the title row (e.g. progress dots). */
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  as?: "section" | "div";
};

const PANEL_CLASS = {
  creator: "cr-panel",
  dashboard: "dash-panel",
} as const;

const TITLE_CLASS = {
  creator: "cr-panel-title",
  dashboard: "dash-panel-title",
} as const;

const LINK_CLASS = {
  creator: "text-xs cr-accent hover:underline",
  dashboard: "text-xs dash-accent hover:underline",
} as const;

export default function Panel({
  variant,
  title,
  titleLevel = 2,
  href,
  linkLabel,
  headerRight,
  children,
  className = "",
  as: Component = "section",
}: Props) {
  const panelClass = PANEL_CLASS[variant];
  const titleClass = TITLE_CLASS[variant];
  const linkClass = LINK_CLASS[variant];
  const showTitleRow = title != null;

  return (
    <Component className={`${panelClass} flex flex-col ${className}`.trim()}>
      {showTitleRow && (
        <div className={`flex items-center justify-between ${variant === "creator" ? "mb-3" : "mb-4"}`}>
          <div className="flex items-center gap-3">
            {titleLevel === 1 && <h1 className={`${titleClass} mb-0`}>{title}</h1>}
            {titleLevel === 2 && <h2 className={`${titleClass} mb-0`}>{title}</h2>}
            {titleLevel === 3 && <h3 className={`${titleClass} mb-0`}>{title}</h3>}
            {href != null && linkLabel != null && (
              <Link href={href} className={linkClass}>
                {linkLabel}{variant === "dashboard" ? " →" : ""}
              </Link>
            )}
          </div>
          {headerRight != null ? headerRight : null}
        </div>
      )}
      {children}
    </Component>
  );
}
