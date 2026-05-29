import Link from "next/link";

/** Обязательный чекбокс согласия на обработку ПД (152-ФЗ). */
export function ConsentCheckbox({
  name = "consent",
  id = "consent",
  required = true,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed text-muted">
      <input
        id={id}
        name={name}
        type="checkbox"
        required={required}
        className="mt-0.5 h-4 w-4 shrink-0 accent-cta"
        {...props}
      />
      <span>
        Я соглашаюсь на обработку персональных данных в соответствии с{" "}
        <Link href="/privacy" className="underline underline-offset-2 hover:text-ink">
          политикой конфиденциальности
        </Link>
        .
      </span>
    </label>
  );
}
