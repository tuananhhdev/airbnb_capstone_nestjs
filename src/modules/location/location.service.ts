import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadApiResponse } from 'cloudinary';
import { uploadImageBuffer } from 'src/common/utils/cloudinary.util';
import { getSafeData } from 'src/common/utils/safe-data.util';
import { CreateLocationDto } from './dto/create-location.dto';

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
}