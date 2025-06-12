import { BadRequestException, Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_CLOUD_NAME } from 'src/common/constant/app.constant';
import getSafeUser from 'src/common/utils/safe-user.util';
import { PrismaService } from '../prisma/prisma.service';
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
                where: where,
                take: pageSize,
                skip: skip,
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

    async softDelete(id: number) {
        const userExist = await this.prismaService.users.findUnique({ where: { id: id, isDeleted: false } });
        if (!userExist) throw new BadRequestException(`Không tìm thấy người dùng`);

        await this.prismaService.users.update({
            where: { id: id },
            data: { isDeleted: true }
        })

        return { message: 'Xóa người dùng thành công' }
    }

    async uploadAvatar(file: Express.Multer.File, user: any) {
        console.log('avatarCloud', file)
        if (!file) throw new BadRequestException('Thiếu file tải lên');

        if (!user) throw new BadRequestException('Không tìm thấy người dùng');
        const userId = Number(user.id)

        cloudinary.config({
            cloud_name: CLOUDINARY_CLOUD_NAME,
            api_key: CLOUDINARY_API_KEY,
            api_secret: CLOUDINARY_API_SECRET,
        });

        if (user?.avatar) {
            await cloudinary.uploader.destroy(user.avatar);
        }

        const uploadResult: UploadApiResponse = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream({ folder: 'avatars' }, (error, result) => {
                if (error) reject(error);
                else resolve(result as UploadApiResponse);
            }).end(file.buffer)
        })

        await this.prismaService.users.update({
            where: { id: userId },
            data: { avatar: uploadResult.public_id },
        });

        return {
            publicId: uploadResult.public_id,
            imgUrl: uploadResult.secure_url,
            filename: file.originalname,
        }
    }
}
