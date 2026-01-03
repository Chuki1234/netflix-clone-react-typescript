// Minimal OpenAPI 3.0 spec to visualize main CRUD APIs via Swagger UI (CDN)
const swaggerPort = process.env.PORT || 5001;
const swaggerBaseUrl = process.env.SWAGGER_BASE_URL || `http://localhost:${swaggerPort}/api`;

const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "Netflix Clone API",
    version: "1.0.0",
    description:
      "API cho Netflix Clone: auth, payment, preferences, watch-history, notifications, admin, movies.",
  },
  servers: [{ url: swaggerBaseUrl }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      AuthResponse: {
        type: "object",
        properties: {
          _id: { type: "string" },
          name: { type: "string" },
          email: { type: "string" },
          role: { type: "string", enum: ["user", "admin"] },
          token: { type: "string" },
          subscriptionPlan: { type: "string", nullable: true },
          subscriptionStatus: { type: "string", nullable: true },
          paymentStatus: { type: "string", nullable: true },
        },
      },
      User: {
        type: "object",
        properties: {
          _id: { type: "string" },
          name: { type: "string" },
          email: { type: "string" },
          role: { type: "string", enum: ["user", "admin"] },
          subscriptionPlan: { type: "string", nullable: true },
          subscriptionStatus: { type: "string", nullable: true },
          paymentStatus: { type: "string", nullable: true },
          paymentDate: { type: "string", format: "date-time", nullable: true },
          activatedAt: { type: "string", format: "date-time", nullable: true },
          expiresAt: { type: "string", format: "date-time", nullable: true },
        },
      },
      PaymentRequest: {
        type: "object",
        properties: {
          planId: { type: "string", enum: ["Mobile", "Basic", "Standard", "Premium"] },
          paymentMethod: { type: "string" },
          paymentInfo: { type: "object" },
        },
        required: ["planId"],
      },
      ChangePlanRequest: {
        type: "object",
        properties: {
          newPlanId: { type: "string", enum: ["Mobile", "Basic", "Standard", "Premium"] },
          paymentMethod: { type: "string" },
          paymentInfo: { type: "object" },
        },
        required: ["newPlanId"],
      },
      WatchHistory: {
        type: "object",
        properties: {
          userId: { type: "string" },
          movieId: { type: "number" },
          mediaType: { type: "string", enum: ["movie", "tv"] },
          progress: { type: "number" },
          duration: { type: "number" },
          completed: { type: "boolean" },
          lastWatchedAt: { type: "string", format: "date-time" },
        },
      },
      Notification: {
        type: "object",
        properties: {
          _id: { type: "string" },
          userId: { type: "string" },
          type: { type: "string" },
          title: { type: "string" },
          message: { type: "string" },
          read: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      AdminMovie: {
        type: "object",
        properties: {
          _id: { type: "string" },
          tmdbId: { type: "number" },
          title: { type: "string" },
          overview: { type: "string" },
          posterPath: { type: "string" },
          backdropPath: { type: "string" },
          mediaType: { type: "string", enum: ["movie", "tv"] },
          releaseDate: { type: "string" },
          genres: {
            type: "array",
            items: { type: "object", properties: { id: { type: "number" }, name: { type: "string" } } },
          },
          voteAverage: { type: "number" },
          voteCount: { type: "number" },
        },
      },
      UpdateSubscription: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["approve", "reject", "cancel", "update"],
          },
          subscriptionStatus: { type: "string" },
          paymentStatus: { type: "string" },
        },
        required: ["action"],
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Đăng ký",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  email: { type: "string" },
                  password: { type: "string" },
                },
                required: ["name", "email", "password"],
              },
            },
          },
        },
        responses: { 201: { description: "Created", content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } } } },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Đăng nhập",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { email: { type: "string" }, password: { type: "string" } },
                required: ["email", "password"],
              },
            },
          },
        },
        responses: { 200: { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } } } },
      },
    },
    "/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Thông tin người dùng hiện tại",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } } } },
      },
    },
    "/payment/process": {
      post: {
        tags: ["Payment"],
        summary: "Thanh toán đăng ký mới",
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/PaymentRequest" } } } },
        responses: { 202: { description: "Accepted - pending saga" } },
      },
    },
    "/payment/change-plan": {
      post: {
        tags: ["Payment"],
        summary: "Đổi gói (yêu cầu đang active)",
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ChangePlanRequest" } } } },
        responses: { 200: { description: "OK" } },
      },
    },
    "/payment/status": {
      get: {
        tags: ["Payment"],
        summary: "Xem trạng thái subscription/payment",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "OK" } },
      },
    },
    "/preferences/my-list": {
      post: {
        tags: ["Preferences"],
        summary: "Toggle My List",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { movieId: { type: "number" }, mediaType: { type: "string", enum: ["movie", "tv"] } },
                required: ["movieId", "mediaType"],
              },
            },
          },
        },
        responses: { 200: { description: "OK" } },
      },
    },
    "/preferences/likes": {
      post: {
        tags: ["Preferences"],
        summary: "Toggle Like",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { movieId: { type: "number" }, mediaType: { type: "string", enum: ["movie", "tv"] } },
                required: ["movieId", "mediaType"],
              },
            },
          },
        },
        responses: { 200: { description: "OK" } },
      },
    },
    "/watch-history": {
      post: {
        tags: ["WatchHistory"],
        summary: "Lưu/ cập nhật tiến độ xem",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  movieId: { type: "number" },
                  mediaType: { type: "string", enum: ["movie", "tv"] },
                  progress: { type: "number" },
                  duration: { type: "number" },
                  completed: { type: "boolean" },
                },
                required: ["movieId", "mediaType"],
              },
            },
          },
        },
        responses: { 200: { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/WatchHistory" } } } } },
      },
    },
    "/watch-history/{movieId}/{mediaType}": {
      get: {
        tags: ["WatchHistory"],
        summary: "Xem tiến độ một phim",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "movieId", in: "path", required: true, schema: { type: "number" } },
          { name: "mediaType", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: { 200: { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/WatchHistory" } } } } },
      },
      delete: {
        tags: ["WatchHistory"],
        summary: "Xóa tiến độ một phim",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "movieId", in: "path", required: true, schema: { type: "number" } },
          { name: "mediaType", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: { 200: { description: "Deleted" } },
      },
    },
    "/watch-history/{movieId}/{mediaType}/complete": {
      put: {
        tags: ["WatchHistory"],
        summary: "Đánh dấu hoàn tất",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "movieId", in: "path", required: true, schema: { type: "number" } },
          { name: "mediaType", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: { 200: { description: "OK" } },
      },
    },
    "/notifications": {
      get: {
        tags: ["Notifications"],
        summary: "Danh sách thông báo",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
        ],
        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    notifications: { type: "array", items: { $ref: "#/components/schemas/Notification" } },
                    unreadCount: { type: "number" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/notifications/unread-count": {
      get: {
        tags: ["Notifications"],
        summary: "Đếm chưa đọc",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "OK" } },
      },
    },
    "/notifications/{id}/read": {
      put: {
        tags: ["Notifications"],
        summary: "Đánh dấu đã đọc",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "OK" } },
      },
    },
    "/notifications/read-all": {
      put: {
        tags: ["Notifications"],
        summary: "Đánh dấu tất cả đã đọc",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "OK" } },
      },
    },
    "/notifications/{id}": {
      delete: {
        tags: ["Notifications"],
        summary: "Xóa thông báo",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "OK" } },
      },
    },
    "/admin/login": {
      post: {
        tags: ["Admin"],
        summary: "Đăng nhập admin",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { email: { type: "string" }, password: { type: "string" } },
                required: ["email", "password"],
              },
            },
          },
        },
        responses: { 200: { description: "OK" } },
      },
    },
    "/admin/stats": {
      get: {
        tags: ["Admin"],
        summary: "Thống kê dashboard",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "OK" } },
      },
    },
    "/admin/users": {
      get: {
        tags: ["Admin"],
        summary: "Danh sách user (filter/search)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "subscriptionStatus", in: "query", schema: { type: "string" } },
          { name: "paymentStatus", in: "query", schema: { type: "string" } },
        ],
        responses: { 200: { description: "OK" } },
      },
    },
    "/admin/users/{id}": {
      get: {
        tags: ["Admin"],
        summary: "Lấy user theo id",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } } } },
      },
    },
    "/admin/users/{id}/subscription": {
      put: {
        tags: ["Admin"],
        summary: "Cập nhật/duyệt subscription",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateSubscription" } } } },
        responses: { 200: { description: "OK" } },
      },
    },
    "/admin/payments/pending": {
      get: {
        tags: ["Admin"],
        summary: "Danh sách pending payments",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "OK" } },
      },
    },
    "/admin/movies": {
      get: {
        tags: ["AdminMovies"],
        summary: "Danh sách phim (catalog nội bộ)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
          { name: "search", in: "query", schema: { type: "string" } },
        ],
        responses: { 200: { description: "OK" } },
      },
      post: {
        tags: ["AdminMovies"],
        summary: "Tạo hoặc upsert phim (tmdbId/title)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/AdminMovie",
              },
            },
          },
        },
        responses: { 201: { description: "Created" } },
      },
    },
    "/admin/movies/{id}": {
      put: {
        tags: ["AdminMovies"],
        summary: "Cập nhật phim",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/AdminMovie" } } },
        },
        responses: { 200: { description: "OK" } },
      },
      delete: {
        tags: ["AdminMovies"],
        summary: "Xóa phim",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Deleted" } },
      },
    },
    "/movies": {
      get: {
        tags: ["Public"],
        summary: "Danh sách phim public (newest, không cần auth)",
        parameters: [{ name: "limit", in: "query", schema: { type: "integer", default: 20 } }],
        responses: { 200: { description: "OK" } },
      },
    },
  },
};

export default swaggerSpec;

