type StubPageProps = {
  title: string;
  route: string;
  spec?: string;
};

export function StubPage({ title, route, spec }: StubPageProps) {
  return (
    <div>
      <span className="tp-stub-badge">Stub</span>
      <h1 className="tp-page-title mt-3">{title}</h1>
      <p className="mt-2">
        <code className="rounded bg-surface px-2 py-1 text-sm text-gray-800">{route}</code>
      </p>
      {spec && <p className="tp-page-subtitle mt-3">{spec}</p>}
    </div>
  );
}
