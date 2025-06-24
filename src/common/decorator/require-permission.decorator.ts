import { SetMetadata } from '@nestjs/common';

export const REQUIRE_PERMISSION_KEY = 'require_permission';

/**
 * Decorator để đánh dấu API cần permission cụ thể
 * Chỉ những role có permission này mới được truy cập
 * 
 * @param permissions - Danh sách permission names cần thiết
 * 
 * @example
 * ```typescript
 * @RequirePermission(['delete_room'])
 * @Delete(':id')
 * deleteRoom() { }
 * 
 * @RequirePermission(['admin_view_users', 'admin_manage_users'])
 * @Get('admin/users')
 * getUsers() { }
 * ```
 */
export const RequirePermission = (permissions: string[]) => 
    SetMetadata(REQUIRE_PERMISSION_KEY, permissions);
