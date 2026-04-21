/** HomeQuickAccessCard — branded link card used on the public home page quick-access grid. */
import Link from "next/link";

type Props = {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
};

function CardArrow() {
  return (
    <span className="home-card-arrow">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M3 11L11 3M11 3H5M11 3v6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export default function HomeQuickAccessCard({ href, title, description, icon }: Props) {
  return (
    <Link href={href} className="home-card">
      <div className="home-card-icon">{icon}</div>
      <div className="home-card-title">{title}</div>
      <div className="home-card-desc">{description}</div>
      <CardArrow />
    </Link>
  );
}
