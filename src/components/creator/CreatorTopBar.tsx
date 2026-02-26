import Logo from "@/components/shared/Logo";

type Props = {
  rightContent?: React.ReactNode;
};

export default function CreatorTopBar({ rightContent }: Props) {
  return (
    <header className="cr-topbar">
      <Logo href="/creator" variant="creator" />
      {rightContent}
    </header>
  );
}
