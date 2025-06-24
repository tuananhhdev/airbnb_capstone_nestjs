import { BadRequestException, Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_CLOUD_NAME } from 'src/common/constant/app.constant';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt'
import * as sharp from 'sharp';
import { getSafeData } from 'src/common/utils/safe-data.util';
import { getPaginationParams, buildPaginationResult, PaginationResult } from 'src/common/utils/pagination.util';
import { uploadImageBuffer, destroyCloudinaryImage } from 'src/common/utils/cloudinary.util';

// Helper functions để standardize image response
const buildAvatarResponse = (publicId: string) => ({
    publicId,
    url: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${publicId}`,
    thumbnailUrl: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/c_thumb,w_150,h_150/${publicId}`
});

const buildUploadInfo = (file: Express.Multer.File) => ({
    originalName: file.originalname,
    size: file.size,
    mimeType: file.mimetype,
    processedFormat: 'jpeg',
    processedSize: '800x800',
    uploadedAt: new Date().toISOString()
});

@Injectable()
export class UserService {
    constructor(private readonly prismaService: PrismaService) { }

    async findAll(
        page: string | number,
        pageSize: string | number,
    ): Promise<PaginationResult<any>> {
        const params = getPaginationParams(page, pageSize, 5);
        const where = { isDeleted: false };

        const [users, totalItems] = await Promise.all([
            this.prismaService.users.findMany({
                where,
                take: params.pageSize,
                skip: params.skip,
                orderBy: { createdAt: 'desc' },
                include: { Roles: { select: { name: true } } }
            }),
            this.prismaService.users.count({ where })
        ]);

        const safeUsers = getSafeData(users);
        return buildPaginationResult(safeUsers, totalItems, params, 'Hiện tại chưa có người dùng nào');
    }

    async findOne(id: string) {
        const user = await this.prismaService.users.findUnique({
            where: { id: Number(id), isDeleted: false },
            include: { Roles: { select: { name: true } } }
        });

        if (!user) throw new BadRequestException(`Không tìm thấy người dùng với ID này`);

        const safeUser = getSafeData([user])[0];
        return safeUser;
    }

    async findWithPaginationAndSearch(page: string | number, pageSize: string | number, search: string): Promise<PaginationResult<any>> {
        const params = getPaginationParams(page, pageSize, 5);
        const searchTerm = search || "";

        const where = {
            isDeleted: false,
            OR: [
                { fullName: { contains: searchTerm } },
                { email: { contains: searchTerm } },
                { phone: { contains: searchTerm } },
            ]
        };

        const [users, totalItems] = await Promise.all([
            this.prismaService.users.findMany({
                where,
                take: params.pageSize,
                skip: params.skip,
                orderBy: {
                    createdAt: 'desc'
                },
            }),
            this.prismaService.users.count({ where }),
        ]);

        const safeUsers = getSafeData(users);
        return buildPaginationResult(safeUsers, totalItems, params, 'Không tìm thấy người dùng nào phù hợp');
    }

    async findWithSearchName(page: string | number, pageSize: string | number, search: string, filters: any): Promise<PaginationResult<any>> {
        const params = getPaginationParams(page, pageSize, 5);
        const searchTerm = search || "";

        // Xử lý filters
        const where = { isDeleted: false };
        if (searchTerm) {
            where['fullName'] = { contains: searchTerm }; // Giữ tìm kiếm theo tên nếu có
        }

        Object.entries(filters || {}).forEach(([key, value]) => {
            if (value === "" || value === null || value === undefined) {
                return; // Bỏ qua giá trị rỗng
            }

            if (key === "email") {
                where[key] = { contains: value };
                return;
            }

            if (typeof value === "string") {
                where[key] = { contains: value }; // Tìm kiếm không phân biệt hoa thường
            }
        });

        const [users, totalItems] = await Promise.all([
            this.prismaService.users.findMany({
                where,
                take: params.pageSize,
                skip: params.skip,
                orderBy: { createdAt: 'desc' },
            }),
            this.prismaService.users.count({ where }),
        ]);

        const safeUser = getSafeData(users);
        return buildPaginationResult(safeUser, totalItems, params, 'Không tìm thấy người dùng nào với tiêu chí này');
    }

    async createUser(createUserDto: CreateUserDto, avatar?: Express.Multer.File) {
        const { fullName, email, phone, gender, password, birthday, roleId } = createUserDto;

        // Kiểm tra email đã tồn tại (bao gồm cả deleted users)
        const userExist = await this.prismaService.users.findUnique({
            where: { email }
        });

        if (userExist && !userExist.isDeleted) {
            throw new BadRequestException("Email đã được sử dụng, vui lòng chọn email khác");
        }

        const salt = bcrypt.genSaltSync(10);
        const hashPassword = bcrypt.hashSync(password, salt);

        // Xử lý upload avatar nếu có
        let avatarPublicId: string | null = null;
        if (avatar) {
            const processedBuffer = await sharp(avatar.buffer)
                .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
                .toFormat('jpeg', { quality: 80 })
                .toBuffer();

            const uploadResult = await uploadImageBuffer('avatars', processedBuffer, {
                context: { alt: `Avatar của ${fullName}` }
            });
            avatarPublicId = uploadResult.public_id;
        }

        const newUser = await this.prismaService.users.create({
            data: {
                fullName,
                email,
                phone,
                gender,
                birthday: birthday ? new Date(birthday) : null,
                roleId: roleId || 2, // Default USER role
                password: hashPassword,
                avatar: avatarPublicId
            },
        });

        const safeUser = getSafeData([newUser])[0];

        // Return theo chuẩn thực tế
        const response: any = {
            user: {
                id: newUser.id,
                fullName: newUser.fullName,
                email: newUser.email,
                phone: newUser.phone,
                gender: newUser.gender,
                birthday: newUser.birthday,
                roleId: newUser.roleId,
                createdAt: newUser.createdAt
            }
        };

        // Thêm avatar info nếu có upload
        if (newUser.avatar && avatar) {
            response.avatar = buildAvatarResponse(newUser.avatar);
            response.uploadInfo = buildUploadInfo(avatar);
        }

        return response;
    }

    async updateById(id: string, body: UpdateUserDto, avatar?: Express.Multer.File) {
        if (isNaN(Number(id))) throw new BadRequestException("ID không hợp lệ");

        // Kiểm tra user tồn tại
        const existingUser = await this.prismaService.users.findUnique({
            where: { id: Number(id), isDeleted: false }
        });

        if (!existingUser) throw new BadRequestException("Không tìm thấy người dùng");

        let updateData: any = { ...body, updatedAt: new Date() };

        // Xử lý upload avatar nếu có
        if (avatar) {
            // Xóa avatar cũ nếu có
            if (existingUser.avatar) {
                await destroyCloudinaryImage(existingUser.avatar);
            }

            // Upload avatar mới
            const processedBuffer = await sharp(avatar.buffer)
                .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
                .toFormat('jpeg', { quality: 80 })
                .toBuffer();

            const uploadResult = await uploadImageBuffer('avatars', processedBuffer, {
                context: { alt: `Avatar của ${existingUser.fullName}` }
            });
            updateData.avatar = uploadResult.public_id;
        }

        // Convert birthday string to Date if provided
        if (body.birthday) {
            updateData.birthday = new Date(body.birthday);
        }

        const updatedUser = await this.prismaService.users.update({
            where: { id: Number(id) },
            data: updateData,
        });

        // Return theo chuẩn thực tế
        const response: any = {
            user: {
                id: updatedUser.id,
                fullName: updatedUser.fullName,
                email: updatedUser.email,
                phone: updatedUser.phone,
                gender: updatedUser.gender,
                birthday: updatedUser.birthday,
                roleId: updatedUser.roleId,
                updatedAt: updatedUser.updatedAt
            }
        };

        // Thêm avatar info nếu có upload
        if (updatedUser.avatar) {
            response.avatar = {
                publicId: updatedUser.avatar,
                url: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${updatedUser.avatar}`,
                thumbnailUrl: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/c_thumb,w_150,h_150/${updatedUser.avatar}`
            };

            // Thêm upload info nếu có file mới
            if (avatar) {
                response.uploadInfo = {
                    originalName: avatar.originalname,
                    size: avatar.size,
                    mimeType: avatar.mimetype,
                    processedFormat: 'jpeg',
                    processedSize: '800x800',
                    uploadedAt: new Date().toISOString()
                };
            }
        }

        return response;
    }

    async updateSelf(user: any, body: UpdateUserDto, file?: Express.Multer.File) {
        const userId = user.id;
        let updateData: any = { ...body, updatedAt: new Date() };

        // Xử lý upload avatar nếu có file
        if (file) {
            // Xóa avatar cũ nếu có
            if (user?.avatar) {
                await destroyCloudinaryImage(user.avatar);
            }

            // Upload avatar mới với image processing
            const processedBuffer = await sharp(file.buffer)
                .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
                .toFormat('jpeg', { quality: 80 })
                .toBuffer();

            const uploadResult = await uploadImageBuffer('avatars', processedBuffer);
            updateData.avatar = uploadResult.public_id;
        }

        const updatedUser = await this.prismaService.users.update({
            where: { id: userId },
            data: updateData,
        });

        // Return theo chuẩn thực tế
        const response: any = {
            user: {
                id: updatedUser.id,
                fullName: updatedUser.fullName,
                email: updatedUser.email,
                phone: updatedUser.phone,
                gender: updatedUser.gender,
                birthday: updatedUser.birthday,
                updatedAt: updatedUser.updatedAt
            }
        };

        // Thêm avatar info nếu có upload
        if (updatedUser.avatar) {
            response.avatar = {
                publicId: updatedUser.avatar,
                url: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${updatedUser.avatar}`,
                thumbnailUrl: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/c_thumb,w_150,h_150/${updatedUser.avatar}`
            };

            // Thêm upload info nếu có file mới
            if (file) {
                response.uploadInfo = {
                    originalName: file.originalname,
                    size: file.size,
                    mimeType: file.mimetype,
                    processedFormat: 'jpeg',
                    processedSize: '800x800',
                    uploadedAt: new Date().toISOString()
                };
            }
        }

        return response;
    }

    async uploadAvatar(userId: number, avatar: Express.Multer.File) {
        const existingUser = await this.prismaService.users.findUnique({
            where: { id: userId, isDeleted: false }
        });

        if (!existingUser) {
            throw new BadRequestException("Không tìm thấy người dùng");
        }

        if (existingUser.avatar) {
            await destroyCloudinaryImage(existingUser.avatar);
        }

        const processedBuffer = await sharp(avatar.buffer)
            .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
            .toFormat('jpeg', { quality: 80 })
            .toBuffer();

        const uploadResult = await uploadImageBuffer('avatars', processedBuffer, {
            context: { alt: `Avatar của ${existingUser.fullName}` }
        });

        const updatedUser = await this.prismaService.users.update({
            where: { id: userId },
            data: {
                avatar: uploadResult.public_id,
                updatedAt: new Date()
            }
        });

        // Return theo chuẩn thực tế - chỉ thông tin cần thiết về avatar
        return {
            userId: updatedUser.id,
            avatar: {
                publicId: uploadResult.public_id,
                url: uploadResult.secure_url,
                thumbnailUrl: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/c_thumb,w_150,h_150/${uploadResult.public_id}`,
                originalUrl: uploadResult.secure_url
            },
            uploadInfo: {
                originalName: avatar.originalname,
                size: avatar.size,
                mimeType: avatar.mimetype,
                processedFormat: 'jpeg',
                processedSize: '800x800',
                uploadedAt: new Date().toISOString()
            },
            user: {
                id: updatedUser.id,
                fullName: updatedUser.fullName,
                email: updatedUser.email
            }
        };
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


}
