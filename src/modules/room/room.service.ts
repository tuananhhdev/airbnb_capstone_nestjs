import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getSafeData } from 'src/common/utils/safe-data.util';
import { getPaginationParams, buildPaginationResult, PaginationResult } from 'src/common/utils/pagination.util';
import { FindRoomsDto } from './dto/find-room.dto';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { UploadApiResponse } from 'cloudinary';
import { destroyCloudinaryImage, uploadImageBuffer } from 'src/common/utils/cloudinary.util';
import { Decimal } from '@prisma/client/runtime/library';


// Constants
const ROLE_IDS = {
    ADMIN: 1,
    USER: 2,
    HOST: 3
} as const;


const MAX_IMAGES = 5;

// Interfaces
export interface RoomImageData {
    publicId: string;
    imgUrl: string;
    altText: string;
    filename: string;
}



interface RoomOwnershipCheck {
    room: any;
    user: any;
    isAdmin: boolean;
    isOwner: boolean;
}

@Injectable()
export class RoomService {
    constructor(private readonly prismaService: PrismaService) { }



    private extractImagePublicIds(imageJson?: string): string[] {
        return imageJson ? JSON.parse(imageJson) : [];
    }

    private parseRoomImages(roomData: any) {
        if (roomData.image && typeof roomData.image === 'string') {
            try {
                roomData.image = JSON.parse(roomData.image);
            } catch (error) {
                roomData.image = [];
            }
        }
        return roomData;
    }

    private async checkRoomOwnership(roomId: number, userId: number): Promise<RoomOwnershipCheck> {
        const room = await this.prismaService.rooms.findUnique({
            where: { id: roomId, isDeleted: false },
            include: { Users_Rooms_hostIdToUsers: { select: { fullName: true } } }
        });

        if (!room) throw new NotFoundException('Không tìm thấy phòng');

        const user = await this.prismaService.users.findUnique({
            where: { id: userId },
            include: { Roles: { select: { name: true } } }
        });

        if (!user) throw new NotFoundException('Không tìm thấy người dùng');

        const isAdmin = user.Roles.name === 'admin';
        const isOwner = room.hostId === userId;

        if (!isAdmin && !isOwner) {
            const hostName = room.Users_Rooms_hostIdToUsers?.fullName || 'Không xác định';
            throw new ForbiddenException(`Chỉ admin hoặc chủ phòng (${hostName}) mới có quyền thực hiện hành động này`);
        }

        return { room, user, isAdmin, isOwner };
    }

    private async upgradeUserToHost(userId: number, userName: string): Promise<void> {
        await this.prismaService.users.update({
            where: { id: userId },
            data: { roleId: ROLE_IDS.HOST }
        });
        console.log(`🔄 User ${userName} (ID: ${userId}) đã được upgrade thành Host`);
    }

    private async handleImageUpdates(
        existingImageIds: string[],
        files?: Express.Multer.File[],
        roomName?: string,
    ): Promise<{ newImages: any[]; updatedImageIds: string[] }> {
        let updatedImageIds = [...existingImageIds];
        let newImages: { publicId: string; imgUrl: string; altText: string; filename: string }[] = [];

        if (files?.length) {
            if (files.length > 5) throw new BadRequestException('Chỉ được upload tối đa 5 ảnh');
            const uploads = await Promise.all(files.map((file, idx) =>
                uploadImageBuffer('rooms', file.buffer, {
                    context: { alt: `Hình ảnh của ${roomName}_${idx + 1}_${file.originalname}` },
                })
            ));
            updatedImageIds = uploads.map(r => r.public_id).slice(0, 5);
            newImages = uploads.map((r, idx) => ({
                publicId: r.public_id,
                imgUrl: r.secure_url,
                altText: `Hình ảnh của ${roomName}_${idx + 1}_${files[idx].originalname}`,
                filename: files[idx].originalname,
            }));
            if (existingImageIds.length) await Promise.all(existingImageIds.map(id => destroyCloudinaryImage(id)));
        }

        return { newImages, updatedImageIds };
    }

    // 1. GET /api/rooms - Lấy tất cả phòng (chỉ phân trang)
    async findAll(page: string | number, pageSize: string | number): Promise<PaginationResult<any>> {
        const params = getPaginationParams(page, pageSize);
        const where = { isDeleted: false };

        const [rooms, totalItems] = await Promise.all([
            this.prismaService.rooms.findMany({
                where,
                take: params.pageSize,
                skip: params.skip,
                orderBy: { createdAt: 'desc' },
                include: {
                    Locations: {
                        select: { name: true, province: true, country: true }
                    }
                }
            }),
            this.prismaService.rooms.count({ where })
        ]);

        const safeRooms = getSafeData(rooms);
        return buildPaginationResult(safeRooms, totalItems, params, 'Hiện tại chưa có phòng nào');
    }

    // 2. GET /api/rooms/pagination-search - Lấy phòng với phân trang và tìm kiếm
    async getRoomsWithPaginationAndSearch(
        page: string | number,
        pageSize: string | number,
        search?: string,
        locationId?: number,
        minPrice?: number,
        maxPrice?: number,
        guestCount?: number
    ): Promise<PaginationResult<any>> {
        const params = getPaginationParams(page, pageSize);

        // Build where clause với multiple filters
        const where: any = { isDeleted: false };

        // Text search
        if (search && search.trim()) {
            where.OR = [
                { name: { contains: search.trim(), mode: 'insensitive' } },
                { description: { contains: search.trim(), mode: 'insensitive' } },
                { Locations: { name: { contains: search.trim(), mode: 'insensitive' } } },
                { Locations: { province: { contains: search.trim(), mode: 'insensitive' } } },
                { Locations: { country: { contains: search.trim(), mode: 'insensitive' } } }
            ];
        }

        // Location filter
        if (locationId) {
            where.locationId = locationId;
        }

        // Price range filter
        if (minPrice !== undefined || maxPrice !== undefined) {
            where.price = {};
            if (minPrice !== undefined) where.price.gte = minPrice;
            if (maxPrice !== undefined) where.price.lte = maxPrice;
        }

        // Guest count filter
        if (guestCount) {
            where.guestCount = { gte: guestCount };
        }

        const [rooms, totalItems] = await Promise.all([
            this.prismaService.rooms.findMany({
                where,
                take: params.pageSize,
                skip: params.skip,
                orderBy: { createdAt: 'desc' },
                include: { Locations: true }
            }),
            this.prismaService.rooms.count({ where })
        ]);

        const mappedRooms = this.mapRoomsWithLocation(rooms);
        const safeRooms = getSafeData(mappedRooms).map(room => this.parseRoomImages(room));

        return buildPaginationResult(safeRooms, totalItems, params, 'Không tìm thấy phòng nào phù hợp với tiêu chí tìm kiếm');
    }

    // 3. GET /api/rooms/by-location - Lấy phòng theo vị trí
    async getRoomsByLocation(locationId: number, page: string | number, pageSize: string | number): Promise<PaginationResult<any>> {
        await this.validateLocationExists(locationId);

        const params = getPaginationParams(page, pageSize);
        const where = { isDeleted: false, locationId };

        const [rooms, totalItems] = await Promise.all([
            this.prismaService.rooms.findMany({
                where,
                take: params.pageSize,
                skip: params.skip,
                orderBy: { createdAt: 'desc' },
                include: {
                    Locations: {
                        select: { name: true, province: true, country: true }
                    }
                }
            }),
            this.prismaService.rooms.count({ where })
        ]);

        const safeRooms = getSafeData(rooms);
        return buildPaginationResult(safeRooms, totalItems, params, 'Không có phòng nào tại vị trí này');
    }

    private mapRoomsWithLocation(rooms: any[]) {
        return rooms.map(room => {
            const { Locations, locationId, updatedAt, createdAt, ...rest } = room;
            return {
                ...rest,
                locationId,
                location: {
                    id: Locations.id,
                    name: Locations.name,
                    province: Locations.province,
                    country: Locations.country,
                    image: Locations.image,
                    createdAt: Locations.createdAt,
                    updatedAt: Locations.updatedAt,
                },
                updatedAt,
                createdAt,
            };
        });
    }

    async findRoomByLocation(locationId: string, query: FindRoomsDto): Promise<PaginationResult<any>> {
        await this.validateLocationExists(Number(locationId));

        const params = getPaginationParams(query.page, query.pageSize);
        const searchTerm = query.search || "";

        const where = {
            isDeleted: false,
            locationId: Number(locationId),
            OR: [
                { name: { contains: searchTerm } },
                { Locations: { name: { contains: searchTerm } } }
            ].filter(Boolean)
        };

        const [rooms, totalItems] = await Promise.all([
            this.prismaService.rooms.findMany({
                where,
                take: params.pageSize,
                skip: params.skip,
                orderBy: { createdAt: 'desc' },
                include: { Locations: true }
            }),
            this.prismaService.rooms.count({ where })
        ]);

        const safeRooms = getSafeData(rooms).map(room => this.parseRoomImages(room));
        return buildPaginationResult(safeRooms, totalItems, params, 'Không có phòng nào tại vị trí này');
    }

    private async validateLocationExists(locationId: number): Promise<void> {
        const location = await this.prismaService.locations.findUnique({
            where: { id: locationId }
        });
        if (!location) {
            throw new NotFoundException('Không tìm thấy vị trí với ID này');
        }
    }

    async create(createRoomDto: CreateRoomDto, files: Express.Multer.File[], userId: number) {
        this.validateFiles(files);
        await this.validateLocationExists(createRoomDto.locationId);

        await this.validateAndUpgradeUser(userId);
        const imageData = await this.uploadRoomImages(files, createRoomDto.name);
        const newRoom = await this.createRoomRecord(createRoomDto, userId, imageData.publicIds);

        const safeRoom = this.parseRoomImages(getSafeData([newRoom])[0]);

        // Return theo chuẩn thực tế
        return {
            room: {
                id: newRoom.id,
                name: newRoom.name,
                description: newRoom.description,
                price: newRoom.price,
                guestCount: newRoom.guestCount,
                bedroomCount: newRoom.bedroomCount,
                bedCount: newRoom.bedCount,
                bathroomCount: newRoom.bathroomCount,
                locationId: newRoom.locationId,
                hostId: newRoom.hostId,
                createdAt: newRoom.createdAt
            },
            images: {
                totalCount: imageData.images.length,
                items: imageData.images.map(img => ({
                    publicId: img.publicId,
                    url: img.imgUrl,
                    thumbnailUrl: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/c_thumb,w_300,h_200/${img.publicId}`,
                    altText: img.altText,
                    filename: img.filename
                }))
            },
            uploadInfo: {
                totalUploaded: imageData.images.length,
                maxAllowed: 5,
                uploadedAt: new Date().toISOString()
            }
        };
    }

    private validateFiles(files: Express.Multer.File[]): void {
        if (!files || files.length === 0) {
            throw new BadRequestException('Thiếu file tải lên');
        }
        if (files.length > MAX_IMAGES) {
            throw new BadRequestException(`Chỉ được upload tối đa ${MAX_IMAGES} ảnh`);
        }
    }

    private async validateAndUpgradeUser(userId: number) {
        // Validate userId
        if (!userId || isNaN(userId) || userId <= 0) {
            throw new BadRequestException(`Invalid userId: ${userId}. UserId phải là số nguyên dương.`);
        }

        console.log('🔍 Validating user with ID:', userId);

        const user = await this.prismaService.users.findUnique({
            where: { id: userId },
            include: { Roles: { select: { id: true, name: true } } }
        });

        if (!user) {
            throw new ForbiddenException(`Người dùng với ID ${userId} không tồn tại`);
        }

        // Auto-upgrade User thành Host
        if (user.roleId === ROLE_IDS.USER) {
            await this.upgradeUserToHost(userId, user.fullName);
        } else if (user.roleId !== ROLE_IDS.ADMIN && user.roleId !== ROLE_IDS.HOST) {
            throw new ForbiddenException('Không có quyền tạo phòng');
        }

        return user;
    }

    private async uploadRoomImages(files: Express.Multer.File[], roomName: string): Promise<{ images: RoomImageData[], publicIds: string[] }> {
        const uploadPromises = files.map((file, index) =>
            uploadImageBuffer('rooms', file.buffer, {
                context: { alt: `Hình ảnh của ${roomName}_${index + 1}` },
            })
        );

        const uploadResults: UploadApiResponse[] = await Promise.all(uploadPromises);

        const images: RoomImageData[] = uploadResults.map((result, index) => ({
            publicId: result.public_id,
            imgUrl: result.secure_url,
            altText: `Hình ảnh của ${roomName}_${index + 1}_${files[index].originalname}`,
            filename: files[index].originalname,
        }));

        const publicIds = uploadResults.map(result => result.public_id);

        return { images, publicIds };
    }

    private async createRoomRecord(createRoomDto: CreateRoomDto, userId: number, imagePublicIds: string[]) {
        return this.prismaService.rooms.create({
            data: {
                ...createRoomDto,
                price: new Decimal(createRoomDto.price).toFixed(2),
                hostId: userId,
                washingMachine: createRoomDto.washingMachine ?? false,
                iron: createRoomDto.iron ?? false,
                tv: createRoomDto.tv ?? false,
                airConditioner: createRoomDto.airConditioner ?? false,
                wifi: createRoomDto.wifi ?? false,
                kitchen: createRoomDto.kitchen ?? false,
                parking: createRoomDto.parking ?? false,
                pool: createRoomDto.pool ?? false,
                ironingBoard: createRoomDto.ironingBoard ?? false,
                image: JSON.stringify(imagePublicIds),
            },
            include: {
                Locations: true,
                Users_Rooms_hostIdToUsers: { select: { fullName: true, email: true } }
            },
        });
    }

    async findOne(id: string) {
        const room = await this.prismaService.rooms.findUnique({
            where: { id: Number(id), isDeleted: false }
        });

        if (!room) throw new NotFoundException('Không tìm thấy phòng với ID này');

        const safeRoom = this.parseRoomImages(getSafeData([room])[0]);
        return safeRoom;
    }

    async update(id: string, updateRoomDto: UpdateRoomDto, files?: Express.Multer.File[], userId?: number) {
        const roomId = Number(id);

        if (!userId) {
            throw new ForbiddenException('Cần đăng nhập để cập nhật phòng');
        }

        const { room } = await this.checkRoomOwnership(roomId, userId);

        if (updateRoomDto.locationId && updateRoomDto.locationId !== room.locationId) {
            await this.validateLocationExists(updateRoomDto.locationId);
        }

        const existingImageIds = this.extractImagePublicIds(room.image?.toString() ?? '');
        const { newImages, updatedImageIds } = await this.handleImageUpdates(
            existingImageIds,
            files,
            updateRoomDto.name || room.name,
        );

        const updateData = this.buildUpdateData(updateRoomDto, room, updatedImageIds, existingImageIds);
        const updatedRoom = await this.prismaService.rooms.update({
            where: { id: roomId },
            data: updateData,
            include: { Locations: true },
        });

        // Return theo chuẩn thực tế
        const response: any = {
            room: {
                id: updatedRoom.id,
                name: updatedRoom.name,
                description: updatedRoom.description,
                price: updatedRoom.price,
                guestCount: updatedRoom.guestCount,
                bedroomCount: updatedRoom.bedroomCount,
                bedCount: updatedRoom.bedCount,
                bathroomCount: updatedRoom.bathroomCount,
                locationId: updatedRoom.locationId,
                hostId: updatedRoom.hostId,
                updatedAt: updatedRoom.updatedAt
            }
        };

        // Thêm image info nếu có upload mới
        if (newImages.length > 0) {
            response.images = {
                totalCount: updatedImageIds.length,
                newUploaded: newImages.length,
                items: newImages.map(img => ({
                    publicId: img.publicId,
                    url: img.imgUrl,
                    thumbnailUrl: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/c_thumb,w_300,h_200/${img.publicId}`,
                    altText: img.altText,
                    filename: img.filename
                }))
            };
            response.uploadInfo = {
                newUploaded: newImages.length,
                totalImages: updatedImageIds.length,
                maxAllowed: 5,
                uploadedAt: new Date().toISOString()
            };
        } else {
            response.images = {
                totalCount: updatedImageIds.length,
                newUploaded: 0,
                message: 'Không có ảnh mới được upload'
            };
        }

        return response;
    }

    private buildUpdateData(updateRoomDto: UpdateRoomDto, room: any, updatedImageIds: string[], existingImageIds: string[]) {
        return {
            name: updateRoomDto.name || room.name,
            guestCount: updateRoomDto.guestCount || room.guestCount,
            bedroomCount: updateRoomDto.bedroomCount || room.bedroomCount,
            bedCount: updateRoomDto.bedCount || room.bedCount,
            bathroomCount: updateRoomDto.bathroomCount || room.bathroomCount,
            description: updateRoomDto.description !== undefined ? updateRoomDto.description : room.description,
            price: updateRoomDto.price ? new Decimal(updateRoomDto.price).toFixed(2) : room.price,
            locationId: updateRoomDto.locationId || room.locationId,
            washingMachine: updateRoomDto.washingMachine !== undefined ? updateRoomDto.washingMachine : room.washingMachine,
            iron: updateRoomDto.iron !== undefined ? updateRoomDto.iron : room.iron,
            tv: updateRoomDto.tv !== undefined ? updateRoomDto.tv : room.tv,
            airConditioner: updateRoomDto.airConditioner !== undefined ? updateRoomDto.airConditioner : room.airConditioner,
            wifi: updateRoomDto.wifi !== undefined ? updateRoomDto.wifi : room.wifi,
            kitchen: updateRoomDto.kitchen !== undefined ? updateRoomDto.kitchen : room.kitchen,
            parking: updateRoomDto.parking !== undefined ? updateRoomDto.parking : room.parking,
            pool: updateRoomDto.pool !== undefined ? updateRoomDto.pool : room.pool,
            ironingBoard: updateRoomDto.ironingBoard !== undefined ? updateRoomDto.ironingBoard : room.ironingBoard,
            image: JSON.stringify(updatedImageIds.length ? updatedImageIds : existingImageIds),
            updatedAt: new Date(),
        };
    }

    async softDelete(id: string, userId: number) {
        const roomId = Number(id);
        const { room, user, isAdmin } = await this.checkRoomOwnershipWithBookings(roomId, userId);

        this.validateNoActiveBookings(room.BookRooms);

        const deletedRoom = await this.prismaService.rooms.update({
            where: { id: roomId },
            data: {
                isDeleted: true,
                deletedBy: userId,
                deletedAt: new Date(),
                updatedAt: new Date(),
            },
            include: {
                Locations: { select: { name: true, province: true } },
                Users_Rooms_hostIdToUsers: { select: { fullName: true } }
            }
        });

        return {
            message: `Đã xóa phòng "${room.name}" thành công`,
            deletedRoom: {
                roomId: deletedRoom.id,
                name: deletedRoom.name,
                location: `${deletedRoom.Locations.name}, ${deletedRoom.Locations.province}`,
                host: deletedRoom.Users_Rooms_hostIdToUsers?.fullName || 'Không xác định',
                deletedAt: deletedRoom.deletedAt,
                deletedBy: user.fullName,
                deletedByRole: isAdmin ? 'Admin' : 'Chủ phòng'
            }
        };
    }

    private async checkRoomOwnershipWithBookings(roomId: number, userId: number) {
        const room = await this.prismaService.rooms.findUnique({
            where: { id: roomId, isDeleted: false },
            include: {
                Locations: { select: { name: true, province: true } },
                Users_Rooms_hostIdToUsers: { select: { id: true, fullName: true } },
                BookRooms: {
                    where: {
                        isDeleted: false,
                        checkOutDate: { gte: new Date() }
                    },
                    select: { id: true, checkInDate: true, checkOutDate: true }
                }
            }
        });

        if (!room) throw new NotFoundException(`Không tìm thấy phòng với ID ${roomId}`);

        const user = await this.prismaService.users.findUnique({
            where: { id: userId },
            include: { Roles: { select: { id: true } } }
        });

        if (!user) throw new NotFoundException('Không tìm thấy người dùng');

        const isAdmin = user.Roles.id === ROLE_IDS.ADMIN;
        const isOwner = room.hostId === userId;

        if (!isAdmin && !isOwner) {
            const hostName = room.Users_Rooms_hostIdToUsers?.fullName || 'Không xác định';
            throw new ForbiddenException(`Chỉ admin hoặc chủ phòng (${hostName}) mới có quyền xóa phòng này`);
        }

        return { room, user, isAdmin, isOwner };
    }

    private validateNoActiveBookings(bookings: any[]): void {
        if (bookings.length > 0) {
            throw new BadRequestException(
                `Không thể xóa phòng vì còn ${bookings.length} booking đang hoạt động. Vui lòng chờ tất cả booking kết thúc.`
            );
        }
    }

}
