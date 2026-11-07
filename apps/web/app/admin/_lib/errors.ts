/** Spec: specs/03-apps/_shared/errors-i18n.md */
const MESSAGES: Record<string, string> = {
  AUTH_INVALID_CREDENTIALS: 'Email hoặc mật khẩu không đúng.',
  AUTH_PIN_LOCKED: 'Bạn đã nhập sai quá nhiều lần. Thử lại sau.',
  AUTH_ACCOUNT_DISABLED: 'Tài khoản đã bị khóa. Liên hệ hỗ trợ.',
  AUTH_RATE_LIMITED: 'Thao tác quá nhanh. Vui lòng thử lại sau.',
  VALIDATION_ERROR: 'Thông tin không hợp lệ. Kiểm tra lại.',
  FORBIDDEN: 'Bạn không có quyền thực hiện thao tác này.',
  UNKNOWN: 'Đã xảy ra lỗi. Thử lại sau.',
};

export function getErrorMessage(code: string, fallback?: string): string {
  return MESSAGES[code] ?? fallback ?? MESSAGES.UNKNOWN;
}

const BO_ROLES = new Set(['site_operator', 'authority_admin', 'platform_admin']);

export function isBoRole(role: string): boolean {
  return BO_ROLES.has(role);
}

export function roleLabel(role: string): string {
  switch (role) {
    case 'site_operator':
      return 'Site Operator';
    case 'authority_admin':
      return 'Authority Admin';
    case 'platform_admin':
      return 'Platform Admin';
    default:
      return role;
  }
}
