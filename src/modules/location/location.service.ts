import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadApiResponse } from 'cloudinary';
import { uploadImageBuffer } from 'src/common/utils/cloudinary.util';
import { getSafeData } from 'src/common/utils/safe-data.util';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import cloudinary from 'src/common/config/cloudinary.config';

@Injectable()
export class LocationService {
  constructor(private readonly prismaService: PrismaService) { }

  async findAll(page: string | number, pageSize: string | number) {
    page = Number(page) > 0 ? Number(page) : 1;
    pageSize = Number(pageSize) > 0 ? Number(pageSize) : 5;

    const skip = (page - 1) * pageSize;

    const where = { isDeleted: false };
    const [locations, totalItems] = await Promise.all([
      this.prismaService.locations.findMany({
        where,
        take: pageSize,
        skip,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prismaService.locations.count({ where }),
    ]);

    const safeLocations = getSafeData(locations)

    const totalPages = Math.ceil(totalItems / pageSize);

    return {
      items: safeLocations,
      pagination: {
        currentPage: page,
        itemsPerPage: pageSize,
        totalItems,
        totalPages,
      },
    };
  }

  async findWWithPaginationAndSearch(page: string | number, pageSize: string | number, search: string) {
    page = Number(page) > 0 ? Number(page) : 1;
    pageSize = Number(pageSize) > 0 ? Number(pageSize) : 5;
    search = search || "";

    const skip = (page - 1) * pageSize;

    const where = {
      isDeleted: false,
      OR: [
        { name: { contains: search } },
        { province: { contains: search } },
        { country: { contains: search } },
      ]

    };

    const [locations, totalItems] = await Promise.all([
      this.prismaService.locations.findMany({
        where: where,
        take: pageSize,
        skip: skip,
        orderBy: {
          createdAt: 'desc'
        },
      }),
      this.prismaService.locations.count({ where: where }),
    ]);

    const safeLocations = getSafeData(locations)

    const totalPages = Math.ceil(totalItems / pageSize);

    return {
      items: safeLocations,
      pagination: {
        currentPage: page,
        itemsPerPage: pageSize,
        totalItems: totalItems,
        totalPages: totalPages,
      },
    };
  }

  async findOne(id: string) {
    const location = await this.prismaService.locations.findUnique({ where: { id: Number(id) } })
    if (!location) throw new BadRequestException(`Không tìm thấy vị trí với ID này`);

    const safeLocation = getSafeData([location])[0]
    return safeLocation
  }

  async createLocation(body: CreateLocationDto, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Thiếu file tải lên');

    const uploadResult: UploadApiResponse = await uploadImageBuffer('locations', file.buffer);

    const newLocation = await this.prismaService.locations.create({
      data: {
        ...body,
        image: uploadResult.public_id
      }
    })

    const safeLocation = getSafeData([newLocation])[0]
    return {
      location: safeLocation,
      image: {
        publicId: uploadResult.public_id,
        imgUrl: uploadResult.secure_url,
        filename: file.originalname,
      }

    }
  }

  async updateLocation(id: string, body: UpdateLocationDto, file?: Express.Multer.File) {
    const location = await this.prismaService.locations.findUnique({ where: { id: Number(id) } });
    if (!location) throw new BadRequestException('không tìm thấy vị trí với ID này');

    let uploadResult: UploadApiResponse | undefined;
    if (file) {
      // Xóa ảnh cũ trên Cloudinary nếu có
      if (location.image) {
        try {
          await this.destroyCloudinaryImage(location.image);
        } catch (error) {
          console.error('Lỗi khi xóa ảnh cũ:', error);
          // Không throw error để không làm gián đoạn quá trình update
        }
      }

      // Upload ảnh mới
      uploadResult = await uploadImageBuffer('locations', file.buffer);
    }

    const updatedLocation = await this.prismaService.locations.update({
      where: { id: Number(id) },
      data: {
        ...body,
        ...(uploadResult ? { image: uploadResult.public_id } : {}),
        updatedAt: new Date(),
      },
    });

    const safeLocation = getSafeData([updatedLocation])[0];

    return {
      location: safeLocation,
      image: uploadResult
        ? {
          publicId: uploadResult.public_id,
          imgUrl: uploadResult.secure_url,
          filename: file?.originalname,
        }
        : null,
    };
  }

  /**
   * Xóa mềm location và xóa ảnh trên Cloudinary
   */
  async softDeleteLocation(id: string) {
    const location = await this.prismaService.locations.findUnique({
      where: { id: Number(id), isDeleted: false }
    });

    if (!location) {
      throw new BadRequestException('Không tìm thấy vị trí với ID này');
    }

    // Xóa ảnh trên Cloudinary nếu có
    if (location.image) {
      try {
        await this.destroyCloudinaryImage(location.image);
      } catch (error) {
        console.error('Lỗi khi xóa ảnh location:', error);
        // Không throw error để không làm gián đoạn quá trình xóa
      }
    }

    // Soft delete location
    await this.prismaService.locations.update({
      where: { id: Number(id) },
      data: {
        isDeleted: true,
        updatedAt: new Date(),
      },
    });

    return { message: 'Xóa vị trí thành công' };
  }

  /**
   * Helper function để xóa ảnh trên Cloudinary
   */
  private async destroyCloudinaryImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
      console.log(`Đã xóa ảnh thành công: ${publicId}`);
    } catch (error) {
      console.error(`Lỗi khi xóa ảnh ${publicId}:`, error);
      throw error;
    }
  }

}
