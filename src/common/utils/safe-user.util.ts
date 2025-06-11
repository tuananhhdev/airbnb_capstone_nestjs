import { Users } from "@prisma/client";

const getSafeUser = (user: Users) => {
    const { password, deletedBy, deletedAt, ...safeUser } = user
    return safeUser
}

export default getSafeUser