import cloudinary from "../app/config/cloudinary/cloudinary";


export const uploadToCloudinary = async (filePath: string, folder: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload(
            filePath,
            { folder },
            (error, result) => {
                if (error) reject(error);
                else resolve(result!.secure_url);
            }
        );
    });
};