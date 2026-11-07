'use client';

import { useCallback, useEffect, useRef } from 'react';

type PinInputProps = {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  autoFocus?: boolean;
  label?: string;
  id?: string;
};

export function PinInput({
  value,
  onChange,
  length = 6,
  disabled,
  autoFocus,
  label,
  id = 'pin-input',
}: PinInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const digits = Array.from({ length }, (_, i) => value[i] ?? '');

  const focusAt = useCallback((index: number) => {
    const i = Math.max(0, Math.min(index, length - 1));
    refs.current[i]?.focus();
    refs.current[i]?.select();
  }, [length]);

  useEffect(() => {
    if (autoFocus) focusAt(0);
  }, [autoFocus, focusAt]);

  function commit(next: string) {
    onChange(next.replace(/\D/g, '').slice(0, length));
  }

  function onDigit(index: number, raw: string) {
    const digit = raw.replace(/\D/g, '').slice(-1);
    if (!digit) {
      const arr = digits.slice();
      arr[index] = '';
      commit(arr.join(''));
      return;
    }
    const arr = digits.slice();
    arr[index] = digit;
    const joined = arr.join('');
    commit(joined);
    if (index < length - 1) focusAt(index + 1);
  }

  function onKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      e.preventDefault();
      const arr = digits.slice();
      arr[index - 1] = '';
      commit(arr.join(''));
      focusAt(index - 1);
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      focusAt(index - 1);
    }
    if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      focusAt(index + 1);
    }
  }

  function onPaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasted) return;
    commit(pasted);
    focusAt(Math.min(pasted.length, length - 1));
  }

  return (
    <div>
      {label && (
        <span id={`${id}-label`} className="tp-label mb-2 block">
          {label}
        </span>
      )}
      <div
        className="flex justify-center gap-2"
        role="group"
        aria-labelledby={label ? `${id}-label` : undefined}
      >
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              refs.current[index] = el;
            }}
            type="password"
            inputMode="numeric"
            pattern="\d*"
            maxLength={1}
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            disabled={disabled}
            value={digit}
            aria-label={`Chữ số PIN ${index + 1}`}
            className="tp-pin-cell"
            onChange={(e) => onDigit(index, e.target.value)}
            onKeyDown={(e) => onKeyDown(index, e)}
            onPaste={onPaste}
            onFocus={(e) => e.target.select()}
          />
        ))}
      </div>
    </div>
  );
}
