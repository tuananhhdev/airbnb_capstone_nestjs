import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadApiResponse } from 'cloudinary';
import { destroyCloudinaryImage, uploadImageBuffer } from 'src/common/utils/cloudinary.util';
import { getSafeData } from 'src/common/utils/safe-data.util';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { getPaginationParams, buildPaginationResult, PaginationResult } from 'src/common/utils/pagination.util';

@Injectable()
export class LocationService {
  constructor(private readonly prismaService: PrismaService) { }

  async findAll(page: string | number, pageSize: string | number): Promise<PaginationResult<any>> {
    const params = getPaginationParams(page, pageSize, 5);
    const where = { isDeleted: false };

    const [locations, totalItems] = await Promise.all([
      this.prismaService.locations.findMany({
        where,
        take: params.pageSize,
        skip: params.skip,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prismaService.locations.count({ where }),
    ]);

    const safeLocations = getSafeData(locations);
    return buildPaginationResult(safeLocations, totalItems, params, 'Hiện tại chưa có vị trí nào');
  }

  async findWWithPaginationAndSearch(page: string | number, pageSize: string | number, search: string): Promise<PaginationResult<any>> {
    const params = getPaginationParams(page, pageSize, 5);
    const searchTerm = search || "";

    const where = {
      isDeleted: false,
      OR: [
        { name: { contains: searchTerm } },
        { province: { contains: searchTerm } },
        { country: { contains: searchTerm } },
      ]
    };

    const [locations, totalItems] = await Promise.all([
      this.prismaService.locations.findMany({
        where,
        take: params.pageSize,
        skip: params.skip,
        orderBy: {
          createdAt: 'desc'
        },
      }),
      this.prismaService.locations.count({ where }),
    ]);

    const safeLocations = getSafeData(locations);
    return buildPaginationResult(safeLocations, totalItems, params, 'Không tìm thấy vị trí nào phù hợp');
  }

  async findOne(id: string) {
    const location = await this.prismaService.locations.findUnique({ where: { id: Number(id) } })
    if (!location) throw new BadRequestException(`Không tìm thấy vị trí với ID này`);

    const safeLocation = getSafeData([location])[0]
    return safeLocation
  }

  async createLocation(body: CreateLocationDto, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Thiếu file tải lên');

    const altText = `Hình ảnh của ${body.name}`

    const uploadResult: UploadApiResponse = await uploadImageBuffer('locations', file.buffer, {
      context: { alt: altText }
    });

    const publicId = uploadResult.public_id

    const newLocation = await this.prismaService.locations.create({
      data: {
        ...body,
        image: publicId
      }
    })

    const safeLocation = getSafeData([newLocation])[0]
    return {
      location: safeLocation,
      image: {
        publicId: publicId,
        imgUrl: uploadResult.secure_url,
        altText: altText,
        filename: file.originalname,
      }

    }
  }

  async updateLocation(id: string, body: UpdateLocationDto, file?: Express.Multer.File) {
    const location = await this.prismaService.locations.findUnique({ where: { id: Number(id) } });
    if (!location) throw new BadRequestException('không tìm thấy vị trí với ID này');

    let uploadResult: UploadApiResponse | undefined;
    let altText = `Hình ảnh của ${location.name}`

    if (file) {
      if (location.image) {
        try {
          await destroyCloudinaryImage(location.image);
        } catch (error) {
          console.error('Lỗi khi xóa ảnh cũ:', error);
        }
      }

      uploadResult = await uploadImageBuffer('locations', file.buffer, {
        context: { alt: altText }
      });
    }

    const publicId = uploadResult?.public_id


    const updateData = {
      ...body,
      ...(uploadResult ? { image: publicId } : {}),
      updatedAt: new Date(),
    };

    const updatedLocation = await this.prismaService.locations.update({
      where: { id: Number(id) },
      data: updateData,
    });

    const safeLocation = getSafeData([updatedLocation])[0];

    return {
      location: safeLocation,
      image: uploadResult
        ? {
          publicId: publicId,
          imgUrl: uploadResult.secure_url,
          altText: altText,
          filename: file?.originalname,
          width: uploadResult.width,
          height: uploadResult.height,
        }
        : null,
    };
  }


  async softDeleteLocation(id: string, userId: number) {
    const location = await this.prismaService.locations.findUnique({
      where: { id: Number(id), isDeleted: false },
      select: {
        id: true,
        name: true,
        province: true,
        country: true,
        image: true
      }
    });

    if (!location) {
      throw new BadRequestException('Không tìm thấy vị trí với ID này');
    }

    // Xóa ảnh trên Cloudinary nếu có
    if (location.image) {
      try {
        await destroyCloudinaryImage(location.image);
      } catch (error) {
        console.error('Lỗi khi xóa ảnh location:', error);
      }
    }

    // Soft delete
    const deletedLocation = await this.prismaService.locations.update({
      where: { id: Number(id) },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        province: true,
        country: true,
        deletedAt: true
      }
    });

    // Lấy thông tin người thực hiện xóa
    const deletedByUser = await this.prismaService.users.findUnique({
      where: { id: userId },
      select: { fullName: true, Roles: { select: { name: true } } }
    });

    return {
      message: `Đã xóa vị trí "${location.name}, ${location.province}" thành công`,
      deletedLocation: {
        id: deletedLocation.id,
        name: deletedLocation.name,
        province: deletedLocation.province,
        country: deletedLocation.country,
        deletedAt: deletedLocation.deletedAt,
        deletedBy: deletedByUser?.fullName || 'Không xác định',
        deletedByRole: deletedByUser?.Roles?.name || 'Không xác định',
        imageRemoved: !!location.image
      }
    };
  }




}
