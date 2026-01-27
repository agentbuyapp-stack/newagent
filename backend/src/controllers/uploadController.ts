import { Request, Response } from "express";
import { uploadImageToCloudinary } from "../utils/cloudinary";

export const uploadImage = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthenticated" });
      return;
    }

    // Support both "image" and "imageUrl" for backward compatibility
    const { image, imageUrl } = req.body;
    const imageData = image || imageUrl;

    if (!imageData || typeof imageData !== "string") {
      res.status(400).json({ error: "Image data is required" });
      return;
    }

    // If it's already a URL (not base64), return it as is
    if (!imageData.startsWith("data:image")) {
      res.json({ url: imageData });
      return;
    }

    // Upload base64 image to Cloudinary
    const uploadResult = await uploadImageToCloudinary(imageData);

    res.json({ url: uploadResult.url });
  } catch (error: any) {
    console.error("Error in POST /upload-image:", error);
    res.status(500).json({
      error: "Failed to upload image",
      message: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};
