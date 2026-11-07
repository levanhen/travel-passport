/** Spec: specs/03-apps/_shared/errors-i18n.md */
const MESSAGES: Record<string, string> = {
  AUTH_INVALID_PIN: 'Mã PIN không đúng.',
  AUTH_PIN_WEAK: 'Mã PIN quá dễ đoán. Vui lòng chọn mã khác.',
  AUTH_PIN_LOCKED: 'Bạn đã nhập sai quá nhiều lần. Thử lại sau.',
  AUTH_PHONE_TAKEN: 'Số điện thoại đã đăng ký. Vui lòng đăng nhập.',
  AUTH_ACCOUNT_DISABLED: 'Tài khoản đã bị khóa. Liên hệ hỗ trợ.',
  AUTH_RATE_LIMITED: 'Thao tác quá nhanh. Vui lòng thử lại sau.',
  AUTH_PIN_REQUIRED: 'Nhập PIN để dùng máy này.',
  CONSENT_REQUIRED: 'Bạn cần đồng ý Điều khoản và Chính sách quyền riêng tư.',
  VALIDATION_ERROR: 'Thông tin không hợp lệ. Kiểm tra lại.',
  CHECKIN_GEOFENCE_FAILED: 'Bạn chưa ở đủ gần điểm này.',
  CHECKIN_ALREADY_TODAY: 'Bạn đã check-in tại điểm này hôm nay.',
  CHECKIN_UPGRADE_EXPIRED: 'Đã hết thời gian bổ sung bằng chứng.',
  CHECKIN_QR_INVALID: 'Mã QR không hợp lệ hoặc đã hết hạn.',
  SITE_CHECKIN_DISABLED: 'Điểm này chưa mở check-in.',
  UNKNOWN: 'Đã xảy ra lỗi. Thử lại sau.',
};

export function getErrorMessage(code: string, fallback?: string): string {
  return MESSAGES[code] ?? fallback ?? MESSAGES.UNKNOWN;
}
