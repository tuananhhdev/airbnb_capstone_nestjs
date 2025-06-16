import { Users } from "@prisma/client";

// Định nghĩa kiểu SafeUser (loại bỏ các trường nhạy cảm)
type SafeUser = Omit<Users, "password" | "deletedBy" | "deletedAt" | "isDeleted">;

// Danh sách các trường an toàn
const safeUserFields: Array<keyof SafeUser> = [
    "id",
    "fullName",
    "email",
    "phone",
    "birthday",
    "avatar",
    "gender",
    "roleId",
    "createdAt",
    "updatedAt",
];

// Hàm tạo object select cho Prisma
export const getSafeUserSelect = () =>
    safeUserFields.reduce(
        (select, field) => ({
            ...select,
            [field]: true,
        }),
        {} as Record<keyof SafeUser, true>,
    );