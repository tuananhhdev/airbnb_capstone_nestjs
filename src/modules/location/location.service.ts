import { Injectable } from '@nestjs/common';
import { getSafeData } from 'src/common/utils/safe-data.util';
import { PrismaService } from '../prisma/prisma.service';

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
}