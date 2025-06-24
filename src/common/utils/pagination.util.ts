/**
 * Pagination utility functions
 */

export interface PaginationParams {
    page: number;
    pageSize: number;
    skip: number;
}

export interface PaginationResult<T> {
    message?: string;
    items: T[];
    pagination: {
        currentPage: number;
        itemsPerPage: number;
        totalPages: number;
        totalItems: number;
    };
}

/**
 * Tạo pagination parameters từ query string
 */
export function getPaginationParams(
    page: string | number, 
    pageSize: string | number, 
    defaultPageSize: number = 10
): PaginationParams {
    const pageNum = Number(page) > 0 ? Number(page) : 1;
    const pageSizeNum = Number(pageSize) > 0 ? Number(pageSize) : defaultPageSize;
    
    return {
        page: pageNum,
        pageSize: pageSizeNum,
        skip: (pageNum - 1) * pageSizeNum
    };
}

/**
 * Tạo pagination result với message tùy chỉnh khi empty
 */
export function buildPaginationResult<T>(
    items: T[], 
    totalItems: number, 
    params: PaginationParams,
    emptyMessage?: string
): PaginationResult<T> {
    const totalPages = Math.ceil(totalItems / params.pageSize);
    
    const result: PaginationResult<T> = {
        items,
        pagination: {
            currentPage: params.page,
            itemsPerPage: params.pageSize,
            totalPages,
            totalItems
        }
    };

    // Thêm message nếu không có items và có emptyMessage
    if (totalItems === 0 && emptyMessage) {
        result.message = emptyMessage;
    }

    return result;
}

/**
 * Tạo empty pagination result với message
 */
export function buildEmptyPaginationResult<T>(
    params: PaginationParams,
    emptyMessage: string
): PaginationResult<T> {
    return {
        message: emptyMessage,
        items: [],
        pagination: {
            currentPage: params.page,
            itemsPerPage: params.pageSize,
            totalPages: 0,
            totalItems: 0
        }
    };
}
