import { Request, Response } from "express";
import { uploadImageToCloudinary } from "../utils/cloudinary";

export const uploadImage = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthenticated" });
    }

    // Support both "image" and "imageUrl" for backward compatibility
    const { image, imageUrl } = req.body;
    const imageData = image || imageUrl;

    if (!imageData || typeof imageData !== "string") {
      return res.status(400).json({ error: "Image data is required" });
    }

    // If it's already a URL (not base64), return it as is
    if (!imageData.startsWith("data:image")) {
      return res.json({ url: imageData });
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

