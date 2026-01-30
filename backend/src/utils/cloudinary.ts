import { v2 as cloudinary } from "cloudinary";

// Parse Cloudinary URL if provided, otherwise use individual env vars
function getCloudinaryConfig() {
  const cloudinaryUrl = process.env.CLOUDINARY_URL;
  
  if (cloudinaryUrl) {
    // Parse cloudinary://api_key:api_secret@cloud_name
    const match = cloudinaryUrl.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);
    if (match) {
      return {
        cloud_name: match[3],
        api_key: match[1],
        api_secret: match[2],
      };
    }
  }
  
  // Fallback to individual environment variables
  return {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  };
}

// Configure Cloudinary
const config = getCloudinaryConfig();

// Validate configuration
if (!config.cloud_name || !config.api_key || !config.api_secret) {
  console.error("Cloudinary configuration missing! Please set CLOUDINARY_URL or individual env vars.");
  console.error("Config:", {
    cloud_name: config.cloud_name ? "✓" : "✗",
    api_key: config.api_key ? "✓" : "✗",
    api_secret: config.api_secret ? "✓" : "✗",
  });
} else {
  cloudinary.config(config);
  console.log("Cloudinary configured successfully");
}

export interface UploadResult {
  url: string;
  public_id: string;
}

/**
 * Upload image to Cloudinary from base64 data URL
 */
export async function uploadImageToCloudinary(
  base64Data: string
): Promise<UploadResult> {
  try {
    // Check if Cloudinary is configured
    const config = getCloudinaryConfig();
    if (!config.cloud_name || !config.api_key || !config.api_secret) {
      throw new Error("Cloudinary is not configured. Please set CLOUDINARY_URL environment variable.");
    }

    // Ensure Cloudinary is configured (reconfigure if needed)
    cloudinary.config(config);
    
    // If it's already a full data URL, use it directly
    // Otherwise, assume it's base64 and add the data URL prefix
    let dataUrl = base64Data;
    if (!base64Data.startsWith("data:")) {
      dataUrl = `data:image/jpeg;base64,${base64Data}`;
    }
    
    const result = await cloudinary.uploader.upload(dataUrl, {
      folder: "agent-orders",
      resource_type: "image",
      transformation: [
        { width: 1200, height: 1200, crop: "limit" }, // Limit size for chat images
        { quality: "auto" }, // Auto optimize quality
        { format: "auto" }, // Auto format optimization
      ],
    });

    return {
      url: result.secure_url,
      public_id: result.public_id,
    };
  } catch (error: any) {
    console.error("Cloudinary upload error:", error);
    console.error("Error details:", {
      message: error.message,
      http_code: error.http_code,
      name: error.name,
    });
    throw new Error(`Failed to upload image: ${error.message}`);
  }
}

/**
 * Upload audio to Cloudinary from base64 data URL
 * Note: Cloudinary uses resource_type "video" for audio files
 */
export async function uploadAudioToCloudinary(
  base64Data: string
): Promise<UploadResult> {
  try {
    // Check if Cloudinary is configured
    const config = getCloudinaryConfig();
    if (!config.cloud_name || !config.api_key || !config.api_secret) {
      throw new Error("Cloudinary is not configured. Please set CLOUDINARY_URL environment variable.");
    }

    // Ensure Cloudinary is configured (reconfigure if needed)
    cloudinary.config(config);

    // If it's already a full data URL, use it directly
    // Otherwise, assume it's base64 and add the data URL prefix
    let dataUrl = base64Data;
    if (!base64Data.startsWith("data:")) {
      dataUrl = `data:audio/webm;base64,${base64Data}`;
    }

    const result = await cloudinary.uploader.upload(dataUrl, {
      folder: "agent-orders-audio",
      resource_type: "video", // Cloudinary uses "video" for both video and audio
    });

    return {
      url: result.secure_url,
      public_id: result.public_id,
    };
  } catch (error: any) {
    console.error("Cloudinary audio upload error:", error);
    console.error("Error details:", {
      message: error.message,
      http_code: error.http_code,
      name: error.name,
    });
    throw new Error(`Failed to upload audio: ${error.message}`);
  }
}

/**
 * Delete image from Cloudinary
 */
export async function deleteImageFromCloudinary(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error: any) {
    console.error("Cloudinary delete error:", error);
    // Don't throw error for delete failures
  }
}

