import { UploadApiResponse } from 'cloudinary';
import cloudinary from '../config/cloudinary.config';

export const uploadImageBuffer = (
    folder: string,
    buffer: Buffer,
    options?: any
): Promise<UploadApiResponse> => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream({ folder, ...options }, (error, result) => {
            if (error) reject(error);
            else resolve(result as UploadApiResponse);
        }).end(buffer);
    });
};

export const destroyCloudinaryImage = (publicId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.destroy(publicId, (error, result) => {
            if (error) {
                console.error(`Lỗi khi xóa ảnh ${publicId}:`, error);
                reject(error);
            } else {
                console.log(`Đã xóa ảnh thành công: ${publicId}`);
                resolve();
            }
        });
    });
};