import { UploadApiResponse } from 'cloudinary';
import cloudinary from '../config/cloudinary.config';

export const uploadImageBuffer = (
    folder: string,
    buffer: Buffer,
): Promise<UploadApiResponse> => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream({ folder }, (error, result) => {
            if (error) reject(error);
            else resolve(result as UploadApiResponse);
        }).end(buffer);
    });
};
