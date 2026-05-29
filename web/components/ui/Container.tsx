import { cn } from "@/lib/cn";

export function Container({
  children,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}) {
  return <Tag className={cn("mx-auto w-full max-w-[1320px] px-4 sm:px-6 lg:px-8", className)}>{children}</Tag>;
}
