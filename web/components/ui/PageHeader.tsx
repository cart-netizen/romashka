import { Container } from "./Container";
import { Breadcrumbs, type Crumb } from "./Breadcrumbs";

export function PageHeader({
  crumbs,
  title,
  description,
  children,
}: {
  crumbs: Crumb[];
  title: string;
  description?: string | null;
  children?: React.ReactNode;
}) {
  return (
    <div className="border-b border-line bg-surface">
      <Container className="py-8 lg:py-10">
        <Breadcrumbs items={crumbs} />
        <h1 className="mt-4 text-3xl sm:text-4xl">{title}</h1>
        {description && <p className="mt-3 max-w-3xl text-muted">{description}</p>}
        {children}
      </Container>
    </div>
  );
}
