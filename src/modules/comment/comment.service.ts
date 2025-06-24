import { BadRequestException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { getSafeData } from 'src/common/utils/safe-data.util';
import { getPaginationParams, buildPaginationResult, PaginationResult } from 'src/common/utils/pagination.util';
import { transformCommentsArray, transformCommentData } from 'src/common/utils/comment-transform.util';

@Injectable()
export class CommentService {
    constructor(private readonly prismaService: PrismaService) { }

    // 1. GET /api/comment - Lấy tất cả bình luận
    async findAll(page: string | number, pageSize: string | number): Promise<PaginationResult<any>> {
        const params = getPaginationParams(page, pageSize, 10);
        const where = { isDeleted: false };

        const [comments, totalItems] = await Promise.all([
            this.prismaService.comments.findMany({
                where,
                take: params.pageSize,
                skip: params.skip,
                orderBy: { createdAt: 'desc' },
                include: {
                    Users_Comments_commenterIdToUsers: {
                        select: { id: true, fullName: true, avatar: true }
                    },
                    Rooms: {
                        select: { id: true, name: true, image: true }
                    },

                }
            }),
            this.prismaService.comments.count({ where })
        ]);

        // Transform data với tên dễ đọc hơn
        const transformedComments = transformCommentsArray(comments);
        const safeComments = getSafeData(transformedComments);
        return buildPaginationResult(safeComments, totalItems, params, 'Hiện tại chưa có bình luận nào');
    }

    // 2. POST /api/comment - Tạo bình luận mới
    async create(createCommentDto: CreateCommentDto, userId: number) {
        const { roomId, content, rating } = createCommentDto;

        // Kiểm tra phòng tồn tại
        const room = await this.prismaService.rooms.findUnique({
            where: { id: roomId, isDeleted: false }
        });

        if (!room) {
            throw new NotFoundException('Không tìm thấy phòng với ID này');
        }

        // Kiểm tra user đã bình luận phòng này chưa
        const existingComment = await this.prismaService.comments.findFirst({
            where: {
                commenterId: userId,
                roomId,
                isDeleted: false
            }
        });

        if (existingComment) {
            throw new BadRequestException('Bạn đã bình luận phòng này rồi. Vui lòng cập nhật bình luận cũ thay vì tạo mới');
        }

        // Tạo bình luận mới
        const newComment = await this.prismaService.comments.create({
            data: {
                commenterId: userId,
                roomId,
                content,
                rating
            },
            include: {
                Users_Comments_commenterIdToUsers: {
                    select: { id: true, fullName: true, avatar: true }
                },
                Rooms: {
                    select: { id: true, name: true, image: true }
                }
            }
        });

        const transformedComment = transformCommentData(newComment);
        const safeComment = getSafeData([transformedComment])[0];

        return {
            message: 'Tạo bình luận thành công',
            comment: safeComment
        };
    }

    // 3. GET /api/comment/:id - Lấy chi tiết bình luận
    async findOne(id: number) {
        const comment = await this.prismaService.comments.findUnique({
            where: { id, isDeleted: false },
            include: {
                Users_Comments_commenterIdToUsers: {
                    select: { id: true, fullName: true, avatar: true }
                },
                Rooms: {
                    select: { id: true, name: true, image: true }
                }
            }
        });

        if (!comment) {
            throw new NotFoundException('Không tìm thấy bình luận với ID này');
        }

        const transformedComment = transformCommentData(comment);
        const safeComment = getSafeData([transformedComment])[0];
        return safeComment;
    }

    // 4. PUT /api/comment/:id - Cập nhật bình luận
    async update(id: number, updateCommentDto: UpdateCommentDto, userId: number) {
        const comment = await this.prismaService.comments.findUnique({
            where: { id, isDeleted: false },
            include: {
                Users_Comments_commenterIdToUsers: { select: { fullName: true } }
            }
        });

        if (!comment) {
            throw new NotFoundException('Không tìm thấy bình luận với ID này');
        }

        // Kiểm tra quyền: Admin hoặc chủ sở hữu comment
        await this.checkCommentPermission(userId, comment.commenterId, 'cập nhật');

        const updatedComment = await this.prismaService.comments.update({
            where: { id },
            data: {
                ...updateCommentDto,
                updatedAt: new Date()
            },
            include: {
                Users_Comments_commenterIdToUsers: {
                    select: { id: true, fullName: true, avatar: true }
                },
                Rooms: {
                    select: { id: true, name: true, image: true }
                }
            }
        });

        const transformedComment = transformCommentData(updatedComment);
        const safeComment = getSafeData([transformedComment])[0];

        return {
            message: 'Cập nhật bình luận thành công',
            comment: safeComment
        };
    }

    // 5. DELETE /api/comment/:id - Xóa bình luận
    async remove(id: number, userId: number) {
        const comment = await this.prismaService.comments.findUnique({
            where: { id, isDeleted: false },
            include: {
                Users_Comments_commenterIdToUsers: { select: { fullName: true } },
                Rooms: { select: { name: true } }
            }
        });

        if (!comment) {
            throw new NotFoundException('Không tìm thấy bình luận với ID này');
        }

        // Kiểm tra quyền: Admin hoặc chủ sở hữu comment
        await this.checkCommentPermission(userId, comment.commenterId, 'xóa');

        // Soft delete
        await this.prismaService.comments.update({
            where: { id },
            data: {
                isDeleted: true,
                deletedAt: new Date(),
                deletedBy: userId
            }
        });

        return {
            message: `Đã xóa bình luận của ${comment.Users_Comments_commenterIdToUsers.fullName} về phòng "${comment.Rooms.name}" thành công`
        };
    }

    // 6. GET /api/comment/lay-binh-luan-theo-phong/:roomId - Lấy bình luận theo phòng
    async getCommentsByRoom(roomId: number, page: string | number, pageSize: string | number): Promise<{ room: any } & PaginationResult<any>> {
        // Kiểm tra phòng tồn tại
        const room = await this.prismaService.rooms.findUnique({
            where: { id: roomId, isDeleted: false },
            select: { id: true, name: true }
        });

        if (!room) {
            throw new NotFoundException('Không tìm thấy phòng với ID này');
        }

        const params = getPaginationParams(page, pageSize, 10);
        // Lấy tất cả comment của phòng này
        const where = { roomId, isDeleted: false };

        const [comments, totalItems] = await Promise.all([
            this.prismaService.comments.findMany({
                where,
                take: params.pageSize,
                skip: params.skip,
                orderBy: { createdAt: 'desc' },
                include: {
                    Users_Comments_commenterIdToUsers: {
                        select: { id: true, fullName: true, avatar: true }
                    },

                }
            }),
            this.prismaService.comments.count({ where })
        ]);

        const transformedComments = transformCommentsArray(comments);
        const safeComments = getSafeData(transformedComments);
        const result = buildPaginationResult(
            safeComments,
            totalItems,
            params,
            `Phòng "${room.name}" chưa có bình luận nào`
        );

        return {
            room,
            ...result
        };
    }

    // Helper method: Kiểm tra quyền comment (Admin hoặc chủ sở hữu)
    private async checkCommentPermission(userId: number, commenterId: number, action: string) {
        // Nếu là chủ sở hữu comment thì được phép
        if (userId === commenterId) {
            return;
        }

        // Kiểm tra có phải admin không
        const user = await this.prismaService.users.findUnique({
            where: { id: userId },
            include: { Roles: { select: { name: true } } }
        });

        if (!user) {
            throw new ForbiddenException('Người dùng không tồn tại');
        }

        if (user.Roles.name !== 'ADMIN') {
            throw new ForbiddenException(`Chỉ admin hoặc chủ sở hữu mới có thể ${action} bình luận này`);
        }
    }
}
