import { cn } from "@/lib/cn";

export function SectionHeading({
  title,
  subtitle,
  align = "center",
  className,
  as: Tag = "h2",
}: {
  title: string;
  subtitle?: string;
  align?: "center" | "left";
  className?: string;
  as?: "h1" | "h2" | "h3";
}) {
  return (
    <div className={cn(align === "center" ? "text-center" : "text-left", className)}>
      <Tag className="text-3xl sm:text-4xl">{title}</Tag>
      <span
        className={cn(
          "mt-4 block h-px w-16 bg-terracotta",
          align === "center" && "mx-auto",
        )}
      />
      {subtitle && (
        <p className={cn("mt-4 max-w-2xl text-muted", align === "center" && "mx-auto")}>{subtitle}</p>
      )}
    </div>
  );
}
