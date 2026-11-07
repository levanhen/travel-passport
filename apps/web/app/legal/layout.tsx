export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto min-h-screen max-w-[680px] px-4 py-8 text-gray-800 leading-relaxed">
      {children}
    </main>
  );
}
