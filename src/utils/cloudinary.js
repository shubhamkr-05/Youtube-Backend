import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config({
    path: './.env'
})

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  if (!localFilePath) return null;

  try {
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    fs.unlinkSync(localFilePath);

    return response;
  } catch (error) {
    console.error("Error uploading file to Cloudinary:", error);
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    return null;
  }
};

const deleteFromCloudinary = async (file_public_id) => {
  if (!file_public_id) {
    console.log("File not found");
    return null;
  }

  const response = await cloudinary.uploader.destroy(file_public_id, {
    public_id: "shoes",
  });

  return response;
};

export { uploadOnCloudinary, deleteFromCloudinary };
