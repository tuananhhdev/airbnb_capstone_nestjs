/**
 * Utility functions để transform comment data với tên dễ đọc
 */

export function transformCommentData(comment: any) {
    if (!comment) return null;

    return {
        ...comment,
        // Đổi tên relation thành tên dễ đọc
        commenter: comment.Users_Comments_commenterIdToUsers,
        room: comment.Rooms,
        // Xóa tên cũ khỏi response
        Users_Comments_commenterIdToUsers: undefined,
        Rooms: undefined
    };
}

export function transformCommentsArray(comments: any[]) {
    return comments.map(comment => transformCommentData(comment));
}
