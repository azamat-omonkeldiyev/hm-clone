import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary/cloudinary';


type CloudinaryParams = {
    folder: string;
    allowed_formats: string[];
    resource_type: string;
};

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'properties',
        allowed_formats: ['jpg', 'jpeg', 'png', "webp"],
        resource_type: 'image',
    } as CloudinaryParams,
});

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
});


export default upload;
