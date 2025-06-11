import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import getSafeUser from 'src/common/utils/safe-user.util';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
    constructor(private readonly prismaService: PrismaService) { }

    async findAll(
        page: string | number,
        pageSize: string | number,
    ) {
        page = Number(page) > 0 ? Number(page) : 1;
        pageSize = Number(pageSize) > 0 ? Number(pageSize) : 5;

        const skip = (page - 1) * pageSize;

        const where = { isDeleted: false }
        const [users, totalItems] = await Promise.all([
            this.prismaService.users.findMany({
                where,
                take: pageSize,
                skip,
                orderBy: {
                    createdAt: 'desc'
                }
            }),
            this.prismaService.users.count({ where }),
        ]);

        const totalPages = Math.ceil(totalItems / pageSize);
        const safeUsers = users.map(user => getSafeUser(user));

        return {
            items: safeUsers,
            pagination: {
                currentPage: page,
                itemsPerPage: pageSize,
                totalPages: totalPages,
                totalItems: totalItems,
            }
        }
    }

    async findOne(id: string) {
        const user = await this.prismaService.users.findUnique({ where: { id: Number(id) } })
        if (!user) throw new BadRequestException(`Không tìm thấy user`);
        return getSafeUser(user)

    }

    async updateById(id: string, body: UpdateUserDto) {
        const updatedUser = await this.prismaService.users.update({
            where: { id: Number(id) },
            data: body
        })

        return getSafeUser(updatedUser)
    }
}
