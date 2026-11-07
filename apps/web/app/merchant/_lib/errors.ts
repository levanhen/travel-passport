/** Spec: specs/03-apps/_shared/errors-i18n.md */
const MESSAGES: Record<string, string> = {
  AUTH_INVALID_CREDENTIALS: 'Email hoặc mật khẩu không đúng.',
  AUTH_PIN_LOCKED: 'Bạn đã nhập sai quá nhiều lần. Thử lại sau.',
  AUTH_ACCOUNT_DISABLED: 'Tài khoản đã bị khóa. Liên hệ hỗ trợ.',
  AUTH_RATE_LIMITED: 'Thao tác quá nhanh. Vui lòng thử lại sau.',
  VALIDATION_ERROR: 'Thông tin không hợp lệ. Kiểm tra lại.',
  FORBIDDEN: 'Bạn không có quyền truy cập cửa hàng này.',
  CLAIM_NOT_FOUND: 'Không tìm thấy mã voucher.',
  CLAIM_ALREADY_REDEEMED: 'Voucher đã được sử dụng.',
  UNKNOWN: 'Đã xảy ra lỗi. Thử lại sau.',
};

export function getErrorMessage(code: string, fallback?: string): string {
  return MESSAGES[code] ?? fallback ?? MESSAGES.UNKNOWN;
}

const MERCHANT_ROLES = new Set(['merchant_owner', 'merchant_staff']);

export function isMerchantRole(role: string): boolean {
  return MERCHANT_ROLES.has(role);
}

export function roleLabel(role: string): string {
  switch (role) {
    case 'merchant_owner':
      return 'Chủ cửa hàng';
    case 'merchant_staff':
      return 'Nhân viên';
    default:
      return role;
  }
}
