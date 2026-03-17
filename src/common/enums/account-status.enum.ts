// ✅ FIX: DB định nghĩa: CREATE TYPE account_status AS ENUM ('active', 'inactive', 'banned')
// ❌ SAI CŨ: SUSPENDED = 'suspended' — không tồn tại trong DB
// ✅ ĐÚNG: BANNED = 'banned'
export enum AccountStatus {
  ACTIVE   = 'active',
  INACTIVE = 'inactive',
  BANNED   = 'banned',   // ← đổi từ 'suspended' → 'banned' cho khớp DB
}