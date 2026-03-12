import Link from "next/link";

type Props = {
  href: string;
  children?: React.ReactNode;
  className?: string;
};

export default function BackLink({ href, children = "← Back to Dashboard", className = "" }: Props) {
  return (
    <Link
      href={href}
      className={`text-sm dash-accent hover:underline inline-block ${className}`.trim()}
    >
      {children}
    </Link>
  );
}
