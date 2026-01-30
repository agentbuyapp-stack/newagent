import { Request, Response } from "express";
import { uploadImageToCloudinary, uploadAudioToCloudinary } from "../utils/cloudinary";

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

export const uploadAudio = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Unauthenticated" });
      return;
    }

    const { audio } = req.body;

    if (!audio || typeof audio !== "string") {
      res.status(400).json({ error: "Audio data is required" });
      return;
    }

    // Validate audio MIME type
    if (!audio.startsWith("data:audio/")) {
      res.status(400).json({ error: "Invalid audio format. Must be audio/webm, audio/mpeg, or audio/ogg" });
      return;
    }

    // Check file size (max 2MB for audio)
    // Base64 is roughly 4/3 the size of binary, so 2MB binary ≈ 2.67MB base64
    const base64Size = audio.length * 0.75; // Approximate binary size
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (base64Size > maxSize) {
      res.status(400).json({ error: "Audio file too large. Maximum size is 2MB" });
      return;
    }

    // Upload base64 audio to Cloudinary
    const uploadResult = await uploadAudioToCloudinary(audio);

    res.json({ url: uploadResult.url });
  } catch (error: any) {
    console.error("Error in POST /upload-image/audio:", error);
    res.status(500).json({
      error: "Failed to upload audio",
      message: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};
