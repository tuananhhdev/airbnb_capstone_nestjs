import { BadRequestException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getSafeData } from 'src/common/utils/safe-data.util';
import { CreateBookRoomDto } from './dto/create-book-room.dto';
import { UpdateBookRoomDto } from './dto/update-book-room.dto';
import { getPaginationParams, buildPaginationResult } from 'src/common/utils/pagination.util';


// Constants cho flexible update rules
const UPDATE_TIME_RULES = {
    DATES_CHANGE: 24,    // Thay đổi ngày cần 24h
    GUESTS_CHANGE: 6,    // Thay đổi số khách cần 6h
    MINOR_CHANGE: 2,     // Thay đổi nhỏ cần 2h
    DEFAULT: 12          // Default fallback
} as const;

// Constants cho flexible cancellation rules
const CANCELLATION_RULES = {
    FREE_CANCELLATION: 48,      // Hủy miễn phí: 48h trước
    PARTIAL_REFUND: 24,         // Hoàn tiền 50%: 24h trước
    MINIMAL_REFUND: 6,          // Hoàn tiền 25%: 6h trước
    NO_REFUND: 0                // Không hoàn tiền: dưới 6h
} as const;

// Grace period - cho phép sửa/xóa tự do trong thời gian này
const GRACE_PERIOD_MINUTES = 10;

@Injectable()
export class BookRoomService {
    constructor(private readonly prismaService: PrismaService) { }

    private parseRoomImages(bookingData: any) {
        if (bookingData.Rooms?.image && typeof bookingData.Rooms.image === 'string') {
            try {
                bookingData.Rooms.image = JSON.parse(bookingData.Rooms.image);
            } catch (error) {
                bookingData.Rooms.image = [];
            }
        }
        return bookingData;
    }

    async findUserBookings(
        userId: number,
        page: string | number,
        pageSize: string | number,
    ) {
        const params = getPaginationParams(page, pageSize, 10);
        const where = {
            userId,
            isDeleted: false
        };

        const [bookRooms, totalItems] = await Promise.all([
            this.prismaService.bookRooms.findMany({
                where,
                take: params.pageSize,
                skip: params.skip,
                orderBy: { createdAt: 'desc' },
                include: {
                    Rooms: {
                        select: {
                            id: true,
                            name: true,
                            price: true,
                            image: true,
                            Locations: { select: { name: true, province: true } }
                        }
                    }
                }
            }),
            this.prismaService.bookRooms.count({ where })
        ]);

        // Tính toán thêm thông tin cho mỗi booking
        const enrichedBookings = bookRooms.map(booking => {
            const checkIn = new Date(booking.checkInDate);
            const checkOut = new Date(booking.checkOutDate);
            const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
            const totalPrice = Number(booking.Rooms.price) * nights;

            const bookingData = this.parseRoomImages(getSafeData([booking])[0]);

            return {
                ...bookingData,
                nights,
                totalPrice,
                pricePerNight: Number(booking.Rooms.price)
            };
        });

        return buildPaginationResult(enrichedBookings, totalItems, params, 'Bạn chưa có đơn đặt phòng nào');
    }

    async bookRoom(createBookRoomDto: CreateBookRoomDto, userId: number) {
        const { roomId, startDate, endDate, guestCount } = createBookRoomDto;

        // Validate ngày đặt
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const checkIn = new Date(startDate);
        const checkOut = new Date(endDate);

        if (checkIn < today) {
            throw new BadRequestException('Ngày nhận phòng phải từ hôm nay trở đi.');
        }
        if (checkIn >= checkOut) {
            throw new BadRequestException('Ngày trả phòng phải sau ngày nhận phòng.');
        }

        // Kiểm tra phòng tồn tại
        const room = await this.prismaService.rooms.findUnique({
            where: { id: roomId, isDeleted: false },
        });
        if (!room) throw new NotFoundException(`Phòng với ID ${roomId} không tồn tại.`);

        if (guestCount > room.guestCount) {
            throw new BadRequestException(`Số lượng khách (${guestCount}) vượt quá giới hạn của phòng (${room.guestCount}).`);
        }

        // Kiểm tra xung đột đặt phòng (chỉ những booking chưa bị hủy)
        const conflictBookings = await this.prismaService.bookRooms.findMany({
            where: {
                roomId,
                isDeleted: false,
                OR: [{ checkInDate: { lte: checkOut }, checkOutDate: { gte: checkIn } }],
            },
        });
        if (conflictBookings.length > 0) {
            throw new BadRequestException('Phòng đã được đặt trong khoảng thời gian này.');
        }

        // Tính tổng giá tiền
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
        const totalPrice = Number(room.price) * nights;

        // Tạo booking
        const newBooking = await this.prismaService.bookRooms.create({
            data: {
                roomId,
                userId,
                checkInDate: checkIn,
                checkOutDate: checkOut,
                guestCount,
            },
            include: {
                Rooms: {
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        image: true,
                        Locations: { select: { name: true, province: true } }
                    }
                },
                Users_BookRooms_userIdToUsers: {
                    select: { id: true, fullName: true, email: true, phone: true }
                }
            },
        });

        // Parse image JSON string thành array
        const bookingData = this.parseRoomImages(getSafeData([newBooking])[0]);

        return {
            message: 'Đặt phòng thành công! Vui lòng chờ xác nhận từ chủ nhà.',
            booking: {
                ...bookingData,
                totalPrice,
                nights,
                pricePerNight: Number(room.price)
            },
        };
    }

    async cancelBooking(bookingId: number, userId: number) {
        // Kiểm tra booking tồn tại và thuộc về user
        const booking = await this.prismaService.bookRooms.findUnique({
            where: { id: bookingId, userId, isDeleted: false },
            include: { Rooms: { select: { name: true, price: true } } }
        });

        if (!booking) {
            throw new NotFoundException('Không tìm thấy booking hoặc bạn không có quyền hủy booking này.');
        }

        // Kiểm tra grace period và cancellation rules
        const now = new Date();
        const bookingCreatedAt = new Date(booking.createdAt);
        const checkInDate = new Date(booking.checkInDate);

        // Tính thời gian từ khi đặt phòng
        const minutesSinceBooking = (now.getTime() - bookingCreatedAt.getTime()) / (1000 * 60);
        const isInGracePeriod = minutesSinceBooking <= GRACE_PERIOD_MINUTES;

        // Tính thời gian đến check-in
        const timeDiff = checkInDate.getTime() - now.getTime();
        const hoursDiff = timeDiff / (1000 * 60 * 60);

        console.log(`🚫 Cancellation Request:`, {
            bookingId,
            minutesSinceBooking: Math.floor(minutesSinceBooking),
            isInGracePeriod,
            hoursRemaining: Math.floor(hoursDiff)
        });

        // Xác định chính sách hủy
        let cancellationPolicy: {
            refundPercentage: number;
            description: string;
            policyType: string;
        };

        if (isInGracePeriod) {
            // Grace period: hủy miễn phí
            cancellationPolicy = {
                refundPercentage: 1.0,
                description: 'Hủy trong grace period - Hoàn tiền 100%',
                policyType: 'grace'
            };
            console.log(`✅ Grace period: Cho phép hủy miễn phí trong ${GRACE_PERIOD_MINUTES} phút đầu`);
        } else {
            // Áp dụng cancellation rules bình thường
            cancellationPolicy = this.getCancellationPolicy(hoursDiff);

            // Kiểm tra có được phép hủy không
            if (hoursDiff < CANCELLATION_RULES.MINIMAL_REFUND) {
                throw new BadRequestException(
                    `Không thể hủy booking khi còn ít hơn ${CANCELLATION_RULES.MINIMAL_REFUND} giờ trước ngày nhận phòng. ` +
                    `Hiện tại chỉ còn ${Math.floor(hoursDiff)} giờ. Vui lòng liên hệ host để thương lượng. ` +
                    `(Grace period ${GRACE_PERIOD_MINUTES} phút đã hết)`
                );
            }
        }

        // Tính toán refund amount
        const checkIn = new Date(booking.checkInDate);
        const checkOut = new Date(booking.checkOutDate);
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
        const totalPrice = Number(booking.Rooms.price) * nights;
        const refundAmount = Math.round(totalPrice * cancellationPolicy.refundPercentage);

        // Soft delete booking
        await this.prismaService.bookRooms.update({
            where: { id: bookingId },
            data: {
                isDeleted: true,
                deletedAt: new Date(),
                deletedBy: userId
            }
        });

        return {
            message: `Đã hủy booking phòng "${booking.Rooms.name}" thành công.`,
            cancellationPolicy: {
                hoursBeforeCancellation: Math.floor(hoursDiff),
                refundPercentage: cancellationPolicy.refundPercentage,
                refundAmount,
                totalPrice,
                policyDescription: cancellationPolicy.description
            }
        };
    }

    // 1. Lấy tất cả đặt phòng (Admin only)
    async findAllBookings(page: string | number, pageSize: string | number) {

        const params = getPaginationParams(page, pageSize);
        const where = { isDeleted: false };

        const [bookings, totalItems] = await Promise.all([
            this.prismaService.bookRooms.findMany({
                where,
                take: params.pageSize,
                skip: params.skip,
                orderBy: { createdAt: 'desc' },
                include: {
                    Rooms: {
                        select: {
                            id: true,
                            name: true,
                            price: true,
                            image: true,
                            Locations: { select: { name: true, province: true } }
                        }
                    },
                    Users_BookRooms_userIdToUsers: {
                        select: { id: true, fullName: true, email: true, phone: true }
                    }
                }
            }),
            this.prismaService.bookRooms.count({ where })
        ]);

        const enrichedBookings = bookings.map(booking => {
            const checkIn = new Date(booking.checkInDate);
            const checkOut = new Date(booking.checkOutDate);
            const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
            const totalPrice = Number(booking.Rooms.price) * nights;

            const bookingData = this.parseRoomImages(getSafeData([booking])[0]);

            return {
                ...bookingData,
                nights,
                totalPrice,
                pricePerNight: Number(booking.Rooms.price)
            };
        });

        return buildPaginationResult(
            enrichedBookings,
            totalItems,
            params,
            'Hiện tại chưa có đơn đặt phòng nào'
        );
    }

    // 3. Lấy chi tiết đặt phòng
    async findBookingDetail(bookingId: number, userId: number) {
        const booking = await this.prismaService.bookRooms.findUnique({
            where: { id: Number(bookingId), isDeleted: false },
            include: {
                Rooms: {
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        image: true,
                        description: true,
                        guestCount: true,
                        bedroomCount: true,
                        bedCount: true,
                        bathroomCount: true,
                        Locations: { select: { name: true, province: true, country: true } },
                        Users_Rooms_hostIdToUsers: { select: { fullName: true, email: true, phone: true } }
                    }
                },
                Users_BookRooms_userIdToUsers: {
                    select: { id: true, fullName: true, email: true, phone: true }
                }
            }
        });

        if (!booking) {
            throw new NotFoundException('Không tìm thấy đặt phòng với ID này');
        }

        // Kiểm tra quyền truy cập: chỉ user đặt phòng hoặc admin mới xem được
        const user = await this.prismaService.users.findUnique({
            where: { id: userId },
            include: { Roles: { select: { name: true } } }
        });

        const isAdmin = user?.Roles.name === 'admin';
        const isOwner = booking.userId === userId;

        if (!isAdmin && !isOwner) {
            throw new BadRequestException('Bạn không có quyền xem chi tiết đặt phòng này');
        }

        const checkIn = new Date(booking.checkInDate);
        const checkOut = new Date(booking.checkOutDate);
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
        const totalPrice = Number(booking.Rooms.price) * nights;

        const bookingData = this.parseRoomImages(getSafeData([booking])[0]);

        return {
            ...bookingData,
            nights,
            totalPrice,
            pricePerNight: Number(booking.Rooms.price)
        };
    }

    // 4. Cập nhật đặt phòng
    async updateBooking(bookingId: number, updateData: UpdateBookRoomDto, userId: number) {
        const booking = await this.prismaService.bookRooms.findUnique({
            where: { id: bookingId, userId, isDeleted: false },
            include: { Rooms: { select: { name: true, price: true, guestCount: true } } }
        });

        if (!booking) {
            throw new NotFoundException('Không tìm thấy booking hoặc bạn không có quyền cập nhật booking này');
        }

        // Kiểm tra grace period và time rules
        const now = new Date();
        const bookingCreatedAt = new Date(booking.createdAt);
        const checkInDate = new Date(booking.checkInDate);

        // Tính thời gian từ khi đặt phòng
        const minutesSinceBooking = (now.getTime() - bookingCreatedAt.getTime()) / (1000 * 60);
        const isInGracePeriod = minutesSinceBooking <= GRACE_PERIOD_MINUTES;

        // Tính thời gian đến check-in
        const timeDiff = checkInDate.getTime() - now.getTime();
        const hoursDiff = timeDiff / (1000 * 60 * 60);

        console.log(`📝 Booking Update Request:`, {
            bookingId,
            minutesSinceBooking: Math.floor(minutesSinceBooking),
            isInGracePeriod,
            hoursRemaining: Math.floor(hoursDiff),
            updateData
        });

        // Nếu trong grace period, cho phép update tự do
        if (isInGracePeriod) {
            console.log(`✅ Grace period: Cho phép update tự do trong ${GRACE_PERIOD_MINUTES} phút đầu`);
        } else {
            // Áp dụng time rules bình thường
            const changeType = this.determineChangeType(updateData);
            const minHoursRequired = this.getMinHoursRequired(changeType);

            if (hoursDiff < minHoursRequired) {
                const changeTypeText = this.getChangeTypeText(changeType);
                throw new BadRequestException(
                    `${changeTypeText} cần ít nhất ${minHoursRequired} giờ trước ngày nhận phòng. ` +
                    `Hiện tại chỉ còn ${Math.floor(hoursDiff)} giờ. ` +
                    `(Grace period ${GRACE_PERIOD_MINUTES} phút đã hết)`
                );
            }
        }

        const { startDate, endDate, guestCount } = updateData;

        // Xác định giá trị cuối cùng (sử dụng giá trị cũ nếu không có giá trị mới)
        const finalCheckIn = startDate ? new Date(startDate) : new Date(booking.checkInDate);
        const finalCheckOut = endDate ? new Date(endDate) : new Date(booking.checkOutDate);
        const finalGuestCount = guestCount ?? booking.guestCount;

        // Validate dates
        if (finalCheckIn >= finalCheckOut) {
            throw new BadRequestException('Ngày trả phòng phải sau ngày nhận phòng');
        }

        // Validate guest count
        if (finalGuestCount > booking.Rooms.guestCount) {
            throw new BadRequestException(`Số lượng khách vượt quá giới hạn của phòng (${booking.Rooms.guestCount})`);
        }

        // Kiểm tra xung đột với booking khác (chỉ khi có thay đổi ngày)
        if (startDate || endDate) {
            const conflictBookings = await this.prismaService.bookRooms.findMany({
                where: {
                    roomId: booking.roomId,
                    isDeleted: false,
                    id: { not: bookingId },
                    OR: [{ checkInDate: { lte: finalCheckOut }, checkOutDate: { gte: finalCheckIn } }],
                },
            });

            if (conflictBookings.length > 0) {
                throw new BadRequestException('Phòng đã được đặt trong khoảng thời gian mới này');
            }
        }

        // Tạo object update data chỉ với các field được cung cấp
        const updateDataObj: any = {
            updatedAt: new Date()
        };

        if (startDate) updateDataObj.checkInDate = finalCheckIn;
        if (endDate) updateDataObj.checkOutDate = finalCheckOut;
        if (guestCount !== undefined) updateDataObj.guestCount = finalGuestCount;

        // Cập nhật booking
        const updatedBooking = await this.prismaService.bookRooms.update({
            where: { id: bookingId },
            data: updateDataObj,
            include: {
                Rooms: {
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        image: true,
                        Locations: { select: { name: true, province: true } }
                    }
                }
            }
        });

        const nights = Math.ceil((finalCheckOut.getTime() - finalCheckIn.getTime()) / (1000 * 60 * 60 * 24));
        const totalPrice = Number(booking.Rooms.price) * nights;

        const bookingData = this.parseRoomImages(getSafeData([updatedBooking])[0]);

        return {
            message: 'Cập nhật đặt phòng thành công',
            booking: {
                ...bookingData,
                nights,
                totalPrice,
                pricePerNight: Number(booking.Rooms.price)
            }
        };
    }

    // 6. Lấy đặt phòng theo user 
    async findBookingsByUser(userId: number, page: string | number, pageSize: string | number, adminId: number) {
        // Kiểm tra quyền admin
        const admin = await this.prismaService.users.findUnique({
            where: { id: adminId },
            include: { Roles: { select: { name: true } } }
        });

        if (!admin || admin.Roles.name !== 'ADMIN' && userId === 2) {
            throw new BadRequestException('Chỉ admin mới có quyền xem đặt phòng của người dùng khác');
        }
        const params = getPaginationParams(page, pageSize);

        // Kiểm tra user tồn tại
        const user = await this.prismaService.users.findUnique({
            where: { id: userId },
            select: { id: true, fullName: true, email: true }
        });

        if (!user) {
            throw new NotFoundException('Không tìm thấy người dùng với ID này');
        }

        const where = { userId, isDeleted: false };

        const [bookings, totalItems] = await Promise.all([
            this.prismaService.bookRooms.findMany({
                where,
                take: params.pageSize,
                skip: params.skip,
                orderBy: { createdAt: 'desc' },
                include: {
                    Rooms: {
                        select: {
                            id: true,
                            name: true,
                            price: true,
                            image: true,
                            Locations: { select: { name: true, province: true } }
                        }
                    }
                }
            }),
            this.prismaService.bookRooms.count({ where })
        ]);

        const enrichedBookings = bookings.map(booking => {
            const checkIn = new Date(booking.checkInDate);
            const checkOut = new Date(booking.checkOutDate);
            const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
            const totalPrice = Number(booking.Rooms.price) * nights;

            const bookingData = this.parseRoomImages(getSafeData([booking])[0]);

            return {
                ...bookingData,
                nights,
                totalPrice,
                pricePerNight: Number(booking.Rooms.price)
            };
        });

        const result = buildPaginationResult(
            enrichedBookings,
            totalItems,
            params,
            `Người dùng ${user.fullName} chưa có đơn đặt phòng nào`
        );

        return {
            user,
            ...result
        };
    }

    // Xác nhận đặt phòng (Host only) - Tạm thời return message đơn giản
    async confirmBooking(bookingId: number, userId: number) {
        // Lấy thông tin booking và room
        const booking = await this.prismaService.bookRooms.findUnique({
            where: { id: bookingId, isDeleted: false },
            include: {
                Rooms: {
                    select: { id: true, name: true, hostId: true }
                },
                Users_BookRooms_userIdToUsers: {
                    select: { id: true, fullName: true, email: true }
                }
            }
        });

        if (!booking) {
            throw new NotFoundException('Không tìm thấy đơn đặt phòng');
        }

        // Kiểm tra user có phải host của phòng không
        const user = await this.prismaService.users.findUnique({
            where: { id: userId },
            include: { Roles: { select: { name: true } } }
        });

        if (!user) {
            throw new ForbiddenException('Người dùng không tồn tại');
        }

        const isAdmin = user.Roles.name === 'ADMIN';
        const isRoomHost = booking.Rooms.hostId === userId;

        if (!isAdmin && !isRoomHost) {
            throw new ForbiddenException('Chỉ host của phòng hoặc admin mới có thể xác nhận đặt phòng');
        }

        // Kiểm tra booking đã bị hủy chưa
        if (booking.isDeleted) {
            throw new BadRequestException('Không thể xác nhận đơn đặt phòng đã bị hủy');
        }

        return {
            message: `Host đã xác nhận đặt phòng "${booking.Rooms.name}" cho khách hàng ${booking.Users_BookRooms_userIdToUsers.fullName}`,
            booking: getSafeData([booking])[0],
            confirmedBy: user.fullName,
            confirmedAt: new Date()
        };
    }

    // Helper methods cho flexible update rules
    private determineChangeType(updateData: UpdateBookRoomDto): string {
        const { startDate, endDate, guestCount } = updateData;

        if (startDate || endDate) {
            return 'dates'; // Thay đổi ngày - quan trọng nhất
        } else if (guestCount) {
            return 'guests'; // Chỉ thay đổi số khách
        } else {
            return 'minor'; // Thay đổi nhỏ khác
        }
    }

    private getMinHoursRequired(changeType: string): number {
        switch (changeType) {
            case 'dates':
                return UPDATE_TIME_RULES.DATES_CHANGE;
            case 'guests':
                return UPDATE_TIME_RULES.GUESTS_CHANGE;
            case 'minor':
                return UPDATE_TIME_RULES.MINOR_CHANGE;
            default:
                return UPDATE_TIME_RULES.DEFAULT;
        }
    }

    private getChangeTypeText(changeType: string): string {
        switch (changeType) {
            case 'dates':
                return 'Thay đổi ngày nhận/trả phòng';
            case 'guests':
                return 'Thay đổi số lượng khách';
            case 'minor':
                return 'Cập nhật thông tin booking';
            default:
                return 'Thay đổi booking';
        }
    }

    // Helper method cho cancellation policy
    private getCancellationPolicy(hoursDiff: number): {
        refundPercentage: number;
        description: string;
        policyType: string;
    } {
        if (hoursDiff >= CANCELLATION_RULES.FREE_CANCELLATION) {
            return {
                refundPercentage: 1.0,
                description: 'Hủy miễn phí - Hoàn tiền 100%',
                policyType: 'free'
            };
        } else if (hoursDiff >= CANCELLATION_RULES.PARTIAL_REFUND) {
            return {
                refundPercentage: 0.5,
                description: 'Hủy muộn - Hoàn tiền 50%',
                policyType: 'partial'
            };
        } else if (hoursDiff >= CANCELLATION_RULES.MINIMAL_REFUND) {
            return {
                refundPercentage: 0.25,
                description: 'Hủy rất muộn - Hoàn tiền 25%',
                policyType: 'minimal'
            };
        } else {
            return {
                refundPercentage: 0.0,
                description: 'Không hoàn tiền',
                policyType: 'none'
            };
        }
    }
}
