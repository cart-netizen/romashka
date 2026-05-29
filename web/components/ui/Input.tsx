import { cn } from "@/lib/cn";

const fieldClass =
  "w-full rounded-[var(--radius-card)] border border-line bg-surface px-4 py-2.5 text-ink placeholder:text-muted/70 focus:border-ink focus:outline-none";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldClass, className)} {...props} />;
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldClass, "min-h-28 resize-y", className)} {...props} />;
}

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("mb-1.5 block text-sm text-ink", className)} {...props} />;
}
