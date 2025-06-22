import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getSafeData } from 'src/common/utils/safe-data.util';
import { FindRoomsDto } from './dto/find-room.dto';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { UploadApiResponse } from 'cloudinary';
import { destroyCloudinaryImage, uploadImageBuffer } from 'src/common/utils/cloudinary.util';
import cloudinary from 'src/common/config/cloudinary.config';
import { Decimal } from '@prisma/client/runtime/library';
import { Prisma } from '@prisma/client';

@Injectable()
export class RoomService {
    constructor(private readonly prismaService: PrismaService) { }


    private extractImagePublicIds(imageJson?: string): string[] {
        return imageJson ? JSON.parse(imageJson) : [];
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

    async findAll(
        page: string | number,
        pageSize: string | number,
    ) {
        page = Number(page) > 0 ? Number(page) : 1;
        pageSize = Number(pageSize) > 0 ? Number(pageSize) : 5;

        const skip = (page - 1) * pageSize;

        const where = { isDeleted: false };

        const [rooms, totalItems] = await Promise.all([
            this.prismaService.rooms.findMany({
                where: where,
                take: pageSize,
                skip: skip,
                orderBy: {
                    createdAt: 'desc'
                },
            }),
            this.prismaService.rooms.count({ where })
        ]);

        const safeRooms = getSafeData(rooms)

        const totalPages = Math.ceil(totalItems / pageSize);

        return {
            items: safeRooms,
            pagination: {
                currentPage: page,
                itemsPerPage: pageSize,
                totalPages: totalPages,
                totalItems: totalItems,
            }


        }
    }

    async findWithPaginationAndSearch(page: string | number, pageSize: string | number, search: string) {
        page = Number(page) > 0 ? Number(page) : 1;
        pageSize = Number(pageSize) > 0 ? Number(pageSize) : 5;
        search = search || "";

        const skip = (page - 1) * pageSize;

        const where = {
            isDeleted: false,
            OR: [
                { name: { contains: search } },
                { Locations: { name: { contains: search } } },
            ].filter(Boolean)
        }

        type RoomWithLocations = Prisma.RoomsGetPayload<{ include: { Locations: true } }>

        type SafeLocation = Pick<
            RoomWithLocations['Locations'],
            'id' | 'name' | 'province' | 'country' | 'image' | 'createdAt' | 'updatedAt'
        >;

        type RoomWithLocation = Omit<RoomWithLocations, 'Locations'> & {
            location: SafeLocation;
            updatedAt: Date;
            createdAt: Date;
        };

        const [rooms, totalItems] = await Promise.all([
            this.prismaService.rooms.findMany({
                where: where,
                take: pageSize,
                skip: skip,
                orderBy: {
                    createdAt: 'desc'
                },
                include: {
                    Locations: true
                }

            }),
            this.prismaService.rooms.count({ where })
        ]);

        const mappedRooms = rooms.map((room: RoomWithLocations) => {
            const { Locations, locationId, updatedAt, createdAt, ...rest } = room;
            const safeLocation: SafeLocation = {
                id: Locations.id,
                name: Locations.name,
                province: Locations.province,
                country: Locations.country,
                image: Locations.image,
                createdAt: Locations.createdAt,
                updatedAt: Locations.updatedAt,
            };
            return {
                ...rest,
                locationId,
                location: safeLocation,
                updatedAt,
                createdAt,
            };
        });

        const safeRooms = getSafeData(mappedRooms as RoomWithLocation[]);
        const totalPages = Math.ceil(totalItems / pageSize);

        return {
            items: safeRooms,
            pagination: {
                currentPage: page,
                itemsPerPage: pageSize,
                totalPages: totalPages,
                totalItems: totalItems,
            }
        }

    }

    async findRoomByLocation(locationId: string, query: FindRoomsDto) {
        const locationExist = await this.prismaService.locations.findUnique({ where: { id: Number(locationId) } });
        if (!locationExist) throw new NotFoundException('Không tìm thấy vị trí với ID này');

        const { page, pageSize, search } = query

        const pageNumber = Number(page) > 0 ? Number(page) : 1;
        const pageSizeNumber = Number(pageSize) > 0 ? Number(pageSize) : 5;
        const skip = (pageNumber - 1) * pageSizeNumber;

        const where = {
            isDeleted: false,
            locationId: Number(locationId),
            OR: [
                { name: { contains: search } },
                {
                    Locations: {
                        name: { contains: search }
                    }
                }
            ].filter(Boolean)
        }

        const [rooms, totalItems] = await Promise.all([
            this.prismaService.rooms.findMany({
                where: where,
                take: pageSizeNumber,
                skip: skip,
                orderBy: {
                    createdAt: 'desc'
                },
                include: {
                    Locations: true
                }
            }),
            this.prismaService.rooms.count({ where })
        ]);

        const safeRooms = getSafeData(rooms);

        const totalPages = Math.ceil(totalItems / pageSizeNumber);

        return {
            items: safeRooms,
            pagination: {
                currentPage: pageNumber,
                itemsPerPage: pageSizeNumber,
                totalPages: totalPages,
                totalItems: totalItems,
            }
        }
    }

    // src/modules/room/room.service.ts
async create(createRoomDto: CreateRoomDto, files: Express.Multer.File[], userId: number) {
    // Kiểm tra nếu không có file upload
    if (!files || files.length === 0) {
      throw new BadRequestException('Thiếu file tải lên');
    }
  
    // Kiểm tra vị trí tồn tại
    const locationExists = await this.prismaService.locations.findUnique({
      where: { id: createRoomDto.locationId, isDeleted: false },
    });
    if (!locationExists) {
      throw new BadRequestException('Vị trí không tồn tại');
    }
  
    // Kiểm tra user tồn tại
    const user = await this.prismaService.users.findUnique({ where: { id: userId } });
    if (!user) {
      throw new ForbiddenException('Người dùng không tồn tại');
    }
  
    // Upload ảnh lên Cloudinary
    const uploadPromises = files.map((file, index) =>
      uploadImageBuffer('rooms', file.buffer, {
        context: { alt: `Hình ảnh của ${createRoomDto.name}_${index + 1}` },
      })
    );
    const uploadResults: UploadApiResponse[] = await Promise.all(uploadPromises);
  
    // Chuẩn bị dữ liệu ảnh
    const imageData = uploadResults.map((result, index) => ({
      publicId: result.public_id,
      imgUrl: result.secure_url,
      altText: `Hình ảnh của ${createRoomDto.name}_${index + 1}_${files[index].originalname}`,
      filename: files[index].originalname,
    }));
  
    const imagePublicIdsJson = JSON.stringify(uploadResults.map(result => result.public_id));
  
    // Tạo phòng mới với hostId
    const newRoom = await this.prismaService.rooms.create({
      data: {
        name: createRoomDto.name,
        guestCount: createRoomDto.guestCount,
        bedroomCount: createRoomDto.bedroomCount,
        bedCount: createRoomDto.bedCount,
        bathroomCount: createRoomDto.bathroomCount,
        description: createRoomDto.description,
        price: new Decimal(createRoomDto.price).toFixed(2),
        locationId: createRoomDto.locationId,
        washingMachine: createRoomDto.washingMachine ?? false,
        iron: createRoomDto.iron ?? false,
        tv: createRoomDto.tv ?? false,
        airConditioner: createRoomDto.airConditioner ?? false,
        wifi: createRoomDto.wifi ?? false,
        kitchen: createRoomDto.kitchen ?? false,
        parking: createRoomDto.parking ?? false,
        pool: createRoomDto.pool ?? false,
        ironingBoard: createRoomDto.ironingBoard ?? false,
        image: imagePublicIdsJson,
        hostId: userId, 
      } ,
      include: {
        Locations: true,
      },
    });
  
    const safeRoom = getSafeData([newRoom])[0];
  
    return {
      totalImages: imageData.length,
      room: safeRoom,
      images: imageData,
    };
  }

    async findOne(id: string) {
        const room = await this.prismaService.rooms.findUnique({ where: { id: Number(id) } })
        if (!room) throw new NotFoundException(` Không tìm thấy phòng với ID này`);

        const safeRoom = getSafeData([room])[0]

        return safeRoom
    }

    async update(id: string, updateRoomDto: UpdateRoomDto, files?: Express.Multer.File[]) {
        const roomId = Number(id);
        const room = await this.prismaService.rooms.findUnique({ where: { id: roomId, isDeleted: false } });
        if (!room) throw new NotFoundException(`Không tìm phòng với ID này`);

        if (updateRoomDto.locationId && updateRoomDto.locationId !== room.locationId) {
            const location = await this.prismaService.locations.findUnique({ where: { id: updateRoomDto.locationId, isDeleted: false } });
            if (!location) throw new NotFoundException('Không tìm thấy vị trí với ID này');
        }

        const existingImageIds = this.extractImagePublicIds(room.image?.toString() ?? '');
        const { newImages, updatedImageIds } = await this.handleImageUpdates(
            existingImageIds,
            files,
            updateRoomDto.name || room.name,
        );

        const updateData = {
            ...room,
            ...updateRoomDto,
            price: updateRoomDto.price ? new Decimal(updateRoomDto.price).toFixed(2) : room.price,
            image: JSON.stringify(updatedImageIds.length ? updatedImageIds : existingImageIds),
            updatedAt: new Date(),
        };

        const updatedRoom = await this.prismaService.rooms.update({
            where: { id: roomId },
            data: updateData,
            include: { Locations: true },
        });

        const safeRoom = getSafeData([updatedRoom])[0];

        return {
            room: safeRoom,
            images: newImages.length ? newImages : null,
            totalImages: updatedImageIds.length,
        };
    }

    async softDelete(id: string) {
        const roomExist = await this.prismaService.rooms.findUnique({ where: { id: Number(id), isDeleted: false }, include: { Locations: true } });
        if (!roomExist) throw new NotFoundException(`Không tìm thấy phòng với ID này`);

        // xóa ảnh trên cloud nếu có
        if (typeof roomExist.image === 'string') {
            const imagePublicIds = this.extractImagePublicIds(roomExist.image);
            if (imagePublicIds.length > 0) {
                const deletePromises = imagePublicIds.map(publicId =>
                    cloudinary.uploader.destroy(publicId).catch((error: any) => {
                        console.error(`Lỗi khi xóa ảnh ${publicId}:`, error);
                    })
                );
                await Promise.all(deletePromises);
            }
        }

        await this.prismaService.rooms.update({
            where: { id: Number(id) },
            data: {
                isDeleted: true,
                updatedAt: new Date(),
            }
        });

        return {
            roomId: Number(id),
        };
    }

}
