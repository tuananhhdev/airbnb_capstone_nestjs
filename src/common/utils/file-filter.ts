import { FileFilterCallback } from 'multer';

const imageFileFilter: (req: any, file: Express.Multer.File, callback: FileFilterCallback) => void = (
    req,
    file,
    callback,
) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
        return callback(null, false);
    }
    callback(null, true);
};

export default imageFileFilter
