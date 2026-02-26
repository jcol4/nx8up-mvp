"use client";

type Tab = string;

type Props<T extends Tab> = {
  tabs: readonly T[];
  activeTab: T;
  onTabChange: (tab: T) => void;
  /** Use "cr-" for creator context */
  className?: string;
};

export default function TabBar<T extends Tab>({
  tabs,
  activeTab,
  onTabChange,
  className = "",
}: Props<T>) {
  return (
    <div className={`flex gap-2 ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onTabChange(tab)}
          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            activeTab === tab ? "bg-[#00c8ff] text-black" : "cr-text-muted hover:text-[#c8dff0]"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
