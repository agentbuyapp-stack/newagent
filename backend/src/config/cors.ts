// CORS configuration for frontend
// Support multiple domains from CLIENT_URL or FRONTEND_URL
export const getAllowedOrigins = (): string[] => {
  const clientUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || "http://localhost:3000";
  // If CLIENT_URL contains multiple URLs (comma-separated), split them
  if (clientUrl.includes(",")) {
    return clientUrl.split(",").map(url => url.trim().replace(/\/$/, ""));
  }
  return [clientUrl.replace(/\/$/, "")];
};

// Normalize origin for comparison (remove trailing slash)
export const normalizeOrigin = (origin: string): string => {
  return origin.replace(/\/$/, "");
};

export const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = getAllowedOrigins();

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = normalizeOrigin(origin);

    // Check if origin matches any allowed origin
    const isAllowed = allowedOrigins.some(allowed => {
      const normalizedAllowed = normalizeOrigin(allowed);
      return normalizedOrigin === normalizedAllowed ||
        normalizedOrigin.startsWith(normalizedAllowed);
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      // In development, allow localhost
      if (process.env.NODE_ENV === "development" && origin.includes("localhost")) {
        callback(null, true);
      } else {
        // Log for debugging
        console.log("CORS blocked origin:", origin);
        console.log("Allowed origins:", allowedOrigins);
        callback(new Error(`Not allowed by CORS. Origin: ${origin}`));
      }
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

