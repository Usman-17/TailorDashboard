import { v2 as cloudinary } from "cloudinary";

const uploadImage = async (file, folder = "uploads") => {
  const result = await cloudinary.uploader.upload(file.tempFilePath, {
    folder,
  });
  return { url: result.secure_url, publicId: result.public_id };
};

const deleteImage = async (image) => {
  if (image && image.publicId) {
    await cloudinary.uploader.destroy(image.publicId);
  }
};

export { uploadImage, deleteImage };
