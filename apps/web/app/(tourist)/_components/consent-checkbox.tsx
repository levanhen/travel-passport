import Link from 'next/link';

type ConsentCheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
};

export function ConsentCheckbox({ checked, onChange, disabled }: ConsentCheckboxProps) {
  return (
    <label className="flex gap-3 rounded-xl border border-sky-100 bg-sky-50/60 p-3 text-sm">
      <input
        type="checkbox"
        className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="text-gray-700">
        Tôi đã đọc và đồng ý với{' '}
        <Link href="/legal/terms" target="_blank" className="tp-link font-medium">
          Điều khoản
        </Link>{' '}
        và{' '}
        <Link href="/legal/privacy" target="_blank" className="tp-link font-medium">
          Chính sách quyền riêng tư
        </Link>
        .
      </span>
    </label>
  );
}
