import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "AgentBuy API",
      version: "1.0.0",
      description: "AgentBuy.mn - Худалдааны агент платформын API",
      contact: {
        name: "AgentBuy Support",
        email: "support@agentbuy.mn",
      },
    },
    servers: [
      {
        url: process.env.API_URL || "http://localhost:4000",
        description: process.env.NODE_ENV === "production" ? "Production server" : "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Clerk JWT token",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            error: {
              type: "string",
              description: "Error message",
            },
          },
        },
        Order: {
          type: "object",
          properties: {
            id: { type: "string" },
            userId: { type: "string" },
            agentId: { type: "string" },
            productName: { type: "string" },
            description: { type: "string" },
            imageUrls: { type: "array", items: { type: "string" } },
            status: {
              type: "string",
              enum: ["niitlegdsen", "huleej_awsan", "hudaldaj_awsan", "tolbor_huleej_bn", "amjilttai_zahialga", "tsutsalsan_zahialga"]
            },
            userPaymentVerified: { type: "boolean" },
            agentPaymentPaid: { type: "boolean" },
            trackCode: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Profile: {
          type: "object",
          properties: {
            id: { type: "string" },
            userId: { type: "string" },
            name: { type: "string" },
            phone: { type: "string" },
            cargo: { type: "string" },
          },
        },
        User: {
          type: "object",
          properties: {
            id: { type: "string" },
            email: { type: "string" },
            role: { type: "string", enum: ["user", "agent", "admin"] },
            isApproved: { type: "boolean" },
            agentPoints: { type: "number" },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: "Auth", description: "Authentication endpoints" },
      { name: "Orders", description: "Order management" },
      { name: "Bundle Orders", description: "Bundle order management" },
      { name: "Profile", description: "User profile management" },
      { name: "Admin", description: "Admin operations" },
      { name: "Agents", description: "Agent management" },
      { name: "Notifications", description: "Notification management" },
    ],
  },
  apis: ["./src/routes/*.ts", "./src/controllers/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
