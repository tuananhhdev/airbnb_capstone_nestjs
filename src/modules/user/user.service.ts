import { BadRequestException, Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_CLOUD_NAME } from 'src/common/constant/app.constant';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt'
import * as sharp from 'sharp';
import { getSafeData } from 'src/common/utils/safe-data.util';
@Injectable()
export class UserService {
    constructor(private readonly prismaService: PrismaService) { }

    async findAll(
        page: string | number,
        pageSize: string | number,
    ) {
        page = Number(page) > 0 ? Number(page) : 1;
        pageSize = Number(pageSize) > 0 ? Number(pageSize) : 5;

        const skip = (page - 1) * pageSize

        const where = { isDeleted: false }
        const [users, totalItems] = await Promise.all([
            this.prismaService.users.findMany({
                where: where,
                take: pageSize,
                skip: skip,
                orderBy: {
                    createdAt: 'desc'
                },
            }),
            this.prismaService.users.count({ where })
        ]);

        const safeUsers = getSafeData(users)

        const totalPages = Math.ceil(totalItems / pageSize);

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
        if (!user) throw new BadRequestException(`Không tìm thấy người dùng với ID này`);

        const safeUser = getSafeData([user])[0]

        return safeUser
    }

    async findWithPaginationAndSearch(page: string | number, pageSize: string | number, search: string) {
        page = Number(page) > 0 ? Number(page) : 1;
        pageSize = Number(pageSize) > 0 ? Number(pageSize) : 5;
        search = search || ""

        const skip = (page - 1) * pageSize;

        const where = {
            isDeleted: false,
            OR: [
                { fullName: { contains: search } },
                { email: { contains: search } },
                { phone: { contains: search } },
            ]
        }
        const [users, totalItems] = await Promise.all([
            this.prismaService.users.findMany({
                where: where,
                take: pageSize,
                skip: skip,
                orderBy: {
                    createdAt: 'desc'
                },
            }),
            this.prismaService.users.count({ where }),
        ]);

        const safeUsers = getSafeData(users)

        const totalPages = Math.ceil(totalItems / pageSize);

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

    async findWithSearchName(page: string | number, pageSize: string | number, search: string, filters: any) {
        page = Number(page) > 0 ? Number(page) : 1;
        pageSize = Number(pageSize) > 0 ? Number(pageSize) : 5;
        search = search || "";

        const skip = (page - 1) * pageSize;

        // Xử lý filters
        const where = { isDeleted: false };
        if (search) {
            where['fullName'] = { contains: search }; // Giữ tìm kiếm theo tên nếu có
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
                take: pageSize,
                skip,
                orderBy: { createdAt: 'desc' },
            }),
            this.prismaService.users.count({ where }),
        ]);

        const safeUser = getSafeData(users)

        const totalPages = Math.ceil(totalItems / pageSize);

        return {
            items: safeUser,
            pagination: {
                currentPage: page,
                itemsPerPage: pageSize,
                totalPages,
                totalItems,
            },
        };
    }

    async createUser(createUserDto: CreateUserDto) {
        const { fullName, email, phone, gender, password } = createUserDto

        const userExist = await this.prismaService.users.findUnique({
            where: { email: email }
        })

        if (userExist) throw new BadRequestException("Tài khoản đã tồn tại, vui lòng tạo tài khoản khác")

        const salt = bcrypt.genSaltSync(10)
        const hashPasword = bcrypt.hashSync(password, salt)

        const newUser = await this.prismaService.users.create({
            data: {
                fullName: fullName,
                email: email,
                phone: phone,
                gender: gender,
                password: hashPasword
            },
        })

        const safeUser = getSafeData([newUser])[0]

        return safeUser
    }

    async updateById(id: string, body: UpdateUserDto) {
        if (isNaN(Number(id))) throw new BadRequestException("ID không hợp lệ")

        const updatedUser = await this.prismaService.users.update({
            where: { id: Number(id) },
            data: { ...body, updatedAt: new Date() },
        })

        const safeUser = getSafeData([updatedUser])[0]

        return safeUser
    }

    async updateSelf(user: any, body: UpdateUserDto) {
        const userId = user.id
        const updateUser = await this.prismaService.users.update({
            where: { id: userId },
            data: { ...body, updatedAt: new Date() },
        })

        const safeUser = getSafeData([updateUser])[0]

        return safeUser
    }

    async updateAvatar(user: any, file: Express.Multer.File) {
        if (!user) throw new BadRequestException("Không tìm thấy người dùng")
        if (!file) throw new BadRequestException("Thiếu file tải lên")

        const userId = Number(user.id)

        if (user.id !== userId && user.roleId !== 1) {
            throw new BadRequestException("Không có quyền cập nhật ảnh đại diện")
        }

        cloudinary.config({
            cloud_name: CLOUDINARY_CLOUD_NAME,
            api_key: CLOUDINARY_API_KEY,
            api_secret: CLOUDINARY_API_SECRET,
        });

        if (user?.avatar) {
            await cloudinary.uploader.destroy(user.avatar);
        }

        // nén và resize ảnh
        const processedBuffer = await sharp(file.buffer)
            .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
            .toFormat('jpeg', { quality: 80 })
            .toBuffer()

        const uploadResult: UploadApiResponse = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream({
                folder: 'avatars'
            }, (error, result) => {
                if (error) reject(error)
                else resolve(result as UploadApiResponse)
            }).end(processedBuffer)
        })

        const updateAvatar = await this.prismaService.users.update({
            where: { id: userId },
            data: { avatar: uploadResult.public_id, updatedAt: new Date() },
        })

        const safeUser = getSafeData([updateAvatar])[0]

        return {
            publicId: uploadResult.public_id,
            imgUrl: uploadResult.secure_url,
            user: {
                ...safeUser,
                avatarUrl: uploadResult.secure_url
            }
        }
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
