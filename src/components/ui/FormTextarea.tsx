import type { TextareaHTMLAttributes } from "react";

const BASE_CLASS =
  "rounded-lg border placeholder-[#3a5570] focus:outline-none focus:ring-1 focus:ring-[#00c8ff]/50 min-h-[80px] resize-y";

const VARIANT_CLASS = {
  creator: "w-full px-4 py-2.5 cr-border border cr-bg-inner cr-text",
  dashboard: "w-full px-4 py-2.5 dash-border border dash-bg-inner dash-text",
} as const;

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  variant?: "creator" | "dashboard";
};

export default function FormTextarea({
  variant = "creator",
  className = "",
  ...props
}: Props) {
  return (
    <textarea
      className={`${BASE_CLASS} ${VARIANT_CLASS[variant]} ${className}`.trim()}
      {...props}
    />
  );
}
