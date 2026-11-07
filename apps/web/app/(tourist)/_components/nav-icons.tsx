export function NavIconHome({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z" strokeLinejoin="round" />
    </svg>
  );
}

export function NavIconMap({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 20 3 17V4l6 3 6-3 6 3v13l-6-3-6 3Z" strokeLinejoin="round" />
      <path d="M9 7v13M15 4v13" />
    </svg>
  );
}

export function NavIconTicket({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 9a3 3 0 0 1 0-6h18a3 3 0 0 1 0 6 2 2 0 0 0 0 4 3 3 0 0 1 0 6H3a3 3 0 0 1 0-6 2 2 0 0 0 0-4Z" />
    </svg>
  );
}

export function NavIconPassport({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <circle cx="12" cy="11" r="3" />
      <path d="M8 17h8" strokeLinecap="round" />
    </svg>
  );
}
