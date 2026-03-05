const carTypeEnum = [
  "SEDAN",
  "COUPE",
  "SUV",
  "HATCHBACK",
  "CONVERTIBLE",
  "CABRIOLET",
  "CROSSOVER",
  "WAGON",
  "ESTATE",
  "PICKUP",
  "VAN",
  "MINIVAN",
  "ROADSTER",
] as const;

const sellCarSummarySchema = {
  type: "object",
  required: [
    "id",
    "brand",
    "model",
    "type",
    "year",
    "galleryImageUrls",
    "description",
    "priceValue",
    "condition",
    "fuelType",
    "transmission",
    "mileage",
    "rimSizeInches",
    "sellerType",
    "sellerName",
    "telephone",
    "postedAt",
    "color",
    "isNegotiable",
    "accidentHistory",
  ],
  properties: {
    id: { type: "string" },
    brand: { type: "string" },
    model: { type: "string" },
    type: { type: "string", enum: carTypeEnum },
    year: { type: "integer" },
    galleryImageUrls: {
      type: "array",
      items: { type: "string", format: "uri" },
    },
    description: { type: "string" },
    priceValue: { type: "number" },
    condition: { type: "string", enum: ["NEW", "USED"] },
    fuelType: {
      type: "string",
      enum: ["PETROL", "DIESEL", "HYBRID", "PLUG_IN_HYBRID", "ELECTRIC", "REEV", "GAS"],
    },
    transmission: { type: "string", enum: ["MANUAL", "AUTOMATIC"] },
    mileage: { type: "integer" },
    rimSizeInches: { type: "integer" },
    sellerType: { type: "string", enum: ["OWNER", "DEALER"] },
    sellerName: { type: "string" },
    telephone: { type: "string" },
    postedAt: { type: "string", format: "date-time" },
    color: { type: "string" },
    isNegotiable: { type: "string", enum: ["YES", "NO"] },
    accidentHistory: { type: "string", enum: ["YES", "NO"] },
  },
} as const;

const updateCarSummarySchema = {
  type: "object",
  required: [
    "id",
    "brand",
    "model",
    "type",
    "year",
    "galleryImageUrls",
    "description",
    "postedAt",
  ],
  properties: {
    id: { type: "string" },
    brand: { type: "string" },
    model: { type: "string" },
    type: { type: "string", enum: carTypeEnum },
    year: { type: "integer" },
    galleryImageUrls: {
      type: "array",
      items: { type: "string", format: "uri" },
    },
    description: { type: "string" },
    postedAt: { type: "string", format: "date-time" },
  },
} as const;

const errorSchema = {
  type: "object",
  required: ["code", "message"],
  properties: {
    code: { type: "string" },
    message: { type: "string" },
  },
} as const;

const sellCarsResponseSchema = {
  type: "object",
  required: ["cars", "total", "nextOffset"],
  properties: {
    cars: {
      type: "array",
      items: { $ref: "#/components/schemas/SellCarSummary" },
    },
    total: { type: "integer" },
    nextOffset: {
      oneOf: [{ type: "integer" }, { type: "null" }],
    },
  },
} as const;

const updateCarsResponseSchema = {
  type: "object",
  required: ["cars", "total", "nextOffset"],
  properties: {
    cars: {
      type: "array",
      items: { $ref: "#/components/schemas/UpdateCarSummary" },
    },
    total: { type: "integer" },
    nextOffset: {
      oneOf: [{ type: "integer" }, { type: "null" }],
    },
  },
} as const;

const homeCatalogSchema = {
  type: "object",
  required: ["featuredCars", "sellCars", "sellFeed", "updateFeed"],
  properties: {
    featuredCars: {
      type: "array",
      items: { $ref: "#/components/schemas/UpdateCarSummary" },
    },
    sellCars: {
      type: "array",
      items: { $ref: "#/components/schemas/SellCarSummary" },
    },
    sellFeed: { $ref: "#/components/schemas/SellCarsResponse" },
    updateFeed: { $ref: "#/components/schemas/UpdateCarsResponse" },
  },
} as const;

const modelGroupSchema = {
  type: "object",
  required: ["groupLabel", "models"],
  properties: {
    groupLabel: {
      oneOf: [{ type: "string" }, { type: "null" }],
    },
    models: {
      type: "array",
      items: { type: "string" },
    },
  },
} as const;

const referenceCatalogSchema = {
  type: "object",
  required: ["brands", "modelGroupsByBrand"],
  properties: {
    brands: {
      type: "array",
      items: { type: "string" },
    },
    modelGroupsByBrand: {
      type: "object",
      additionalProperties: {
        type: "array",
        items: { $ref: "#/components/schemas/CarReferenceModelGroup" },
      },
    },
  },
} as const;

const sellerAccessVerifyRequestSchema = {
  type: "object",
  required: ["phone", "code"],
  properties: {
    phone: { type: "string" },
    code: { type: "string" },
  },
} as const;

const sellerPinSignInRequestSchema = {
  type: "object",
  required: ["phone", "pin"],
  properties: {
    phone: { type: "string" },
    pin: { type: "string" },
  },
} as const;

const sellerAccessVerifySuccessSchema = {
  type: "object",
  required: ["ok", "phone", "accessToken", "refreshToken"],
  properties: {
    ok: { type: "boolean" },
    phone: { type: "string" },
    accessToken: { type: "string" },
    refreshToken: { type: "string" },
  },
} as const;

const sellerAccessRefreshRequestSchema = {
  type: "object",
  required: ["refreshToken"],
  properties: {
    refreshToken: { type: "string" },
  },
} as const;

const sellerAccessRefreshSuccessSchema = {
  type: "object",
  required: ["ok", "phone", "accessToken", "refreshToken"],
  properties: {
    ok: { type: "boolean" },
    phone: { type: "string" },
    accessToken: { type: "string" },
    refreshToken: { type: "string" },
  },
} as const;

const sellerAccessVerifyErrorSchema = {
  type: "object",
  required: ["code", "message"],
  properties: {
    code: { type: "string", enum: ["INVALID_PHONE", "INVALID", "INVALID_PIN", "EXPIRED", "LOCKED"] },
    message: { type: "string" },
    lockedUntil: {
      oneOf: [{ type: "string", format: "date-time" }, { type: "null" }],
    },
  },
} as const;

const sellerProfileSchema = {
  type: "object",
  required: ["id", "name", "phone", "sellerType"],
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    phone: { type: "string" },
    sellerType: { type: "string", enum: ["OWNER", "DEALER"] },
  },
} as const;

const sellerProfileRequestSchema = {
  type: "object",
  required: ["name", "phone", "sellerType", "pin"],
  properties: {
    name: { type: "string" },
    phone: { type: "string" },
    pin: { type: "string" },
    sellerType: { type: "string", enum: ["OWNER", "DEALER"] },
  },
} as const;

const sellerListingCreateRequestSchema = {
  type: "object",
  required: [
    "brand",
    "model",
    "bodyType",
    "year",
    "priceValue",
    "condition",
    "fuelType",
    "transmission",
    "mileage",
    "rimSizeInches",
    "color",
    "isNegotiable",
    "accidentHistory",
    "description",
  ],
  properties: {
    brand: { type: "string" },
    model: { type: "string" },
    bodyType: { type: "string", enum: carTypeEnum },
    year: { type: "integer" },
    priceValue: { type: "number" },
    condition: { type: "string", enum: ["NEW", "USED"] },
    fuelType: {
      type: "string",
      enum: ["PETROL", "DIESEL", "HYBRID", "PLUG_IN_HYBRID", "ELECTRIC", "REEV", "GAS"],
    },
    transmission: { type: "string", enum: ["MANUAL", "AUTOMATIC"] },
    mileage: { type: "integer" },
    rimSizeInches: { type: "integer" },
    color: { type: "string" },
    isNegotiable: { type: "string", enum: ["YES", "NO"] },
    accidentHistory: { type: "string", enum: ["YES", "NO"] },
    description: { type: "string" },
    images: {
      type: "array",
      items: { type: "string", format: "binary" },
    },
  },
} as const;

const sellerListingCreateResponseSchema = {
  type: "object",
  required: ["ok", "listingId", "status"],
  properties: {
    ok: { type: "boolean" },
    listingId: { type: "string" },
    status: { type: "string", enum: ["APPROVED"] },
  },
} as const;

const sellerListingUpdateResponseSchema = {
  type: "object",
  required: ["ok", "listingId"],
  properties: {
    ok: { type: "boolean" },
    listingId: { type: "string" },
  },
} as const;

const sellerListingDeleteResponseSchema = {
  type: "object",
  required: ["ok", "deleted", "listingId"],
  properties: {
    ok: { type: "boolean" },
    deleted: { type: "boolean" },
    listingId: { type: "string" },
  },
} as const;

const sellerOwnedListingSchema = {
  type: "object",
  required: [
    "id",
    "brand",
    "model",
    "type",
    "year",
    "galleryImageUrls",
    "description",
    "priceValue",
    "condition",
    "fuelType",
    "transmission",
    "mileage",
    "rimSizeInches",
    "postedAt",
    "color",
    "status",
    "featuredRequestStatus",
    "isFeatured",
    "featuredPosition",
  ],
  properties: {
    id: { type: "string" },
    brand: { type: "string" },
    model: { type: "string" },
    type: { type: "string", enum: carTypeEnum },
    year: { type: "integer" },
    galleryImageUrls: {
      type: "array",
      items: { type: "string", format: "uri" },
    },
    description: { type: "string" },
    priceValue: { type: "number" },
    condition: { type: "string", enum: ["NEW", "USED"] },
    fuelType: {
      type: "string",
      enum: ["PETROL", "DIESEL", "HYBRID", "PLUG_IN_HYBRID", "ELECTRIC", "REEV", "GAS"],
    },
    transmission: { type: "string", enum: ["MANUAL", "AUTOMATIC"] },
    mileage: { type: "integer" },
    rimSizeInches: { type: "integer" },
    postedAt: { type: "string", format: "date-time" },
    color: { type: "string" },
    status: { type: "string", enum: ["SHOWN", "HIDDEN", "PENDING"] },
    featuredRequestStatus: { type: "string", enum: ["NONE", "PENDING", "APPROVED", "REJECTED"] },
    isFeatured: { type: "boolean" },
    featuredPosition: {
      oneOf: [{ type: "integer" }, { type: "null" }],
    },
  },
} as const;

const sellerOwnedListingsResponseSchema = {
  type: "object",
  required: ["cars", "total", "nextOffset"],
  properties: {
    cars: {
      type: "array",
      items: { $ref: "#/components/schemas/SellerOwnedListing" },
    },
    total: { type: "integer" },
    nextOffset: {
      oneOf: [{ type: "integer" }, { type: "null" }],
    },
  },
} as const;

const sellerAccessSessionVerifySchema = {
  type: "object",
  required: ["ok", "canAccessNextPage", "hasProfile", "phone"],
  properties: {
    ok: { type: "boolean" },
    canAccessNextPage: { type: "boolean" },
    hasProfile: { type: "boolean" },
    phone: { type: "string" },
  },
} as const;

export const createOpenApiDocument = (baseUrl: string) => ({
  openapi: "3.1.0",
  info: {
    title: "Car Party Game API",
    version: "1.0.0",
    description:
      "HTTP catalog and reference API for the Car Party Game backend. Realtime room and game flow runs over Socket.IO and is described in the architecture notes.",
  },
  servers: [
    {
      url: baseUrl,
      description: "Current server",
    },
  ],
  tags: [
    { name: "Catalog" },
    { name: "Reference" },
    { name: "Access" },
    { name: "System" },
  ],
  paths: {
    "/": {
      get: {
        tags: ["System"],
        summary: "Server entry route",
        description: "Returns a small service payload with API docs links.",
        responses: {
          "200": {
            description: "Service metadata",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name", "docsUrl", "openApiUrl", "adminAccessUrl"],
                  properties: {
                    name: { type: "string" },
                    docsUrl: { type: "string", format: "uri" },
                    openApiUrl: { type: "string", format: "uri" },
                    adminAccessUrl: { type: "string", format: "uri" },
                    adminListingsUrl: { type: "string", format: "uri" },
                    adminUpdatesUrl: { type: "string", format: "uri" },
                    adminDbUrl: { type: "string", format: "uri" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/home": {
      get: {
        tags: ["Catalog"],
        summary: "Bootstrap catalog payload",
        responses: {
          "200": {
            description:
              "Initial catalog payload used to seed both hero sections and the first page of both feeds.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/HomeCatalogResponse" },
              },
            },
          },
        },
      },
    },
    "/api/sell-cars": {
      get: {
        tags: ["Catalog"],
        summary: "Paginated sell cars",
        parameters: [
          {
            name: "offset",
            in: "query",
            schema: { type: "integer", minimum: 0, default: 0 },
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", minimum: 1, maximum: 20, default: 20 },
          },
        ],
        responses: {
          "200": {
            description: "Paged sell cars response",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SellCarsResponse" },
              },
            },
          },
        },
      },
      post: {
        tags: ["Catalog"],
        summary: "Create a seller-submitted sell car listing",
        parameters: [
          {
            name: "Authorization",
            in: "header",
            required: false,
            schema: { type: "string" },
            description: "Bearer seller access token",
          },
          {
            name: "x-seller-access-token",
            in: "header",
            required: false,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: { $ref: "#/components/schemas/SellerListingCreateRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "Sell car listing created and published directly",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SellerListingCreateResponse" },
              },
            },
          },
          "400": {
            description: "Invalid sell car payload",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "401": {
            description: "Missing or invalid seller access token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/sell-cars/{listingId}/request-feature": {
      post: {
        tags: ["Catalog"],
        summary: "Request featured placement for a seller-owned sell car",
        parameters: [
          {
            name: "listingId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
          {
            name: "Authorization",
            in: "header",
            required: false,
            schema: { type: "string" },
            description: "Bearer seller access token",
          },
          {
            name: "x-seller-access-token",
            in: "header",
            required: false,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Feature request accepted and marked pending",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["ok", "status"],
                  properties: {
                    ok: { type: "boolean" },
                    status: { type: "string", enum: ["PENDING"] },
                  },
                },
              },
            },
          },
          "404": {
            description: "Listing not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "401": {
            description: "Missing or invalid seller access token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "409": {
            description: "Request cannot be created in current state",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/seller/listings": {
      get: {
        tags: ["Catalog"],
        summary: "Paginated seller-owned sell cars",
        parameters: [
          {
            name: "offset",
            in: "query",
            schema: { type: "integer", minimum: 0, default: 0 },
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", minimum: 1, maximum: 20, default: 20 },
          },
          {
            name: "Authorization",
            in: "header",
            required: false,
            schema: { type: "string" },
            description: "Bearer seller access token",
          },
          {
            name: "x-seller-access-token",
            in: "header",
            required: false,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Seller-owned paginated sell car history",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SellerOwnedListingsResponse" },
              },
            },
          },
          "401": {
            description: "Missing or invalid seller access token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/seller/listings/{listingId}": {
      patch: {
        tags: ["Catalog"],
        summary: "Update a seller-owned sell car",
        parameters: [
          {
            name: "listingId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
          {
            name: "Authorization",
            in: "header",
            required: false,
            schema: { type: "string" },
            description: "Bearer seller access token",
          },
          {
            name: "x-seller-access-token",
            in: "header",
            required: false,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: { $ref: "#/components/schemas/SellerListingCreateRequest" },
              encoding: {
                images: {
                  style: "form",
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Seller-owned sell car updated",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SellerListingUpdateResponse" },
              },
            },
          },
          "400": {
            description: "Invalid sell car payload",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "401": {
            description: "Missing or invalid seller access token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "404": {
            description: "Listing not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
      delete: {
        tags: ["Catalog"],
        summary: "Delete a seller-owned sell car",
        parameters: [
          {
            name: "listingId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
          {
            name: "Authorization",
            in: "header",
            required: false,
            schema: { type: "string" },
            description: "Bearer seller access token",
          },
          {
            name: "x-seller-access-token",
            in: "header",
            required: false,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Seller-owned sell car deleted",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SellerListingDeleteResponse" },
              },
            },
          },
          "401": {
            description: "Missing or invalid seller access token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "404": {
            description: "Listing not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/seller-access/verify": {
      get: {
        tags: ["Access"],
        summary: "Check whether the current seller access token can enter the next page",
        parameters: [
          {
            name: "Authorization",
            in: "header",
            required: false,
            schema: { type: "string" },
            description: "Bearer seller access token",
          },
          {
            name: "x-seller-access-token",
            in: "header",
            required: false,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Seller access token is valid",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SellerAccessSessionVerify" },
              },
            },
          },
          "401": {
            description: "Missing or invalid seller access token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
      post: {
        tags: ["Access"],
        summary: "Verify seller access code",
        requestBody: {
          required: true,
          content: {
            "application/x-www-form-urlencoded": {
              schema: { $ref: "#/components/schemas/SellerAccessVerifyRequest" },
            },
            "application/json": {
              schema: { $ref: "#/components/schemas/SellerAccessVerifyRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Seller access verified successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SellerAccessVerifySuccess" },
              },
            },
          },
          "400": {
            description: "Invalid phone payload",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SellerAccessVerifyError" },
              },
            },
          },
          "401": {
            description: "Wrong code or phone number",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SellerAccessVerifyError" },
              },
            },
          },
          "410": {
            description: "Code expired",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SellerAccessVerifyError" },
              },
            },
          },
          "429": {
            description: "Phone number is temporarily locked",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SellerAccessVerifyError" },
              },
            },
          },
        },
      },
    },
    "/api/seller-access/sign-in": {
      post: {
        tags: ["Access"],
        summary: "Sign in seller with phone number and PIN",
        requestBody: {
          required: true,
          content: {
            "application/x-www-form-urlencoded": {
              schema: { $ref: "#/components/schemas/SellerPinSignInRequest" },
            },
            "application/json": {
              schema: { $ref: "#/components/schemas/SellerPinSignInRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Seller signed in successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SellerAccessVerifySuccess" },
              },
            },
          },
          "400": {
            description: "Invalid phone or PIN payload",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SellerAccessVerifyError" },
              },
            },
          },
          "401": {
            description: "Wrong phone number or PIN",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SellerAccessVerifyError" },
              },
            },
          },
          "429": {
            description: "Phone number is temporarily locked",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SellerAccessVerifyError" },
              },
            },
          },
        },
      },
    },
    "/api/seller-access/refresh": {
      post: {
        tags: ["Access"],
        summary: "Refresh seller access session",
        parameters: [
          {
            name: "x-seller-refresh-token",
            in: "header",
            required: false,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: false,
          content: {
            "application/x-www-form-urlencoded": {
              schema: { $ref: "#/components/schemas/SellerAccessRefreshRequest" },
            },
            "application/json": {
              schema: { $ref: "#/components/schemas/SellerAccessRefreshRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Seller access session refreshed",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SellerAccessRefreshSuccess" },
              },
            },
          },
          "401": {
            description: "Missing or invalid seller refresh token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/seller-access/logout": {
      post: {
        tags: ["Access"],
        summary: "Revoke current seller access session",
        parameters: [
          {
            name: "Authorization",
            in: "header",
            required: false,
            schema: { type: "string" },
            description: "Bearer seller access token",
          },
          {
            name: "x-seller-refresh-token",
            in: "header",
            required: false,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: false,
          content: {
            "application/x-www-form-urlencoded": {
              schema: { $ref: "#/components/schemas/SellerAccessRefreshRequest" },
            },
            "application/json": {
              schema: { $ref: "#/components/schemas/SellerAccessRefreshRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Seller access session revoke result",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["ok", "revoked"],
                  properties: {
                    ok: { type: "boolean" },
                    revoked: { type: "boolean" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/seller/profile": {
      post: {
        tags: ["Access"],
        summary: "Create or update seller profile after access verification",
        parameters: [
          {
            name: "Authorization",
            in: "header",
            required: false,
            schema: { type: "string" },
            description: "Bearer seller access token",
          },
          {
            name: "x-seller-access-token",
            in: "header",
            required: false,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/x-www-form-urlencoded": {
              schema: { $ref: "#/components/schemas/SellerProfileRequest" },
            },
            "application/json": {
              schema: { $ref: "#/components/schemas/SellerProfileRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Seller profile saved",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["ok", "profile"],
                  properties: {
                    ok: { type: "boolean" },
                    profile: { $ref: "#/components/schemas/SellerProfile" },
                  },
                },
              },
            },
          },
          "400": {
            description: "Invalid seller profile payload",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "401": {
            description: "Missing or invalid seller access token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/new-cars": {
      get: {
        tags: ["Catalog"],
        summary: "Paginated update cars",
        parameters: [
          {
            name: "offset",
            in: "query",
            schema: { type: "integer", minimum: 0, default: 0 },
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", minimum: 1, maximum: 20, default: 20 },
          },
        ],
        responses: {
          "200": {
            description: "Paged update cars response",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UpdateCarsResponse" },
              },
            },
          },
        },
      },
    },
    "/api/reference/cars": {
      get: {
        tags: ["Reference"],
        summary: "Reference brands and grouped models",
        responses: {
          "200": {
            description: "Reference data loaded once and cached by the mobile app",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CarReferenceCatalog" },
              },
            },
          },
        },
      },
    },
    "/assets/catalog/{fileName}": {
      get: {
        tags: ["Catalog"],
        summary: "Serve a catalog image asset",
        parameters: [
          {
            name: "fileName",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Image asset file",
            content: {
              "image/png": {},
              "image/jpeg": {},
              "image/webp": {},
            },
          },
          "404": {
            description: "Asset not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      SellCarSummary: sellCarSummarySchema,
      UpdateCarSummary: updateCarSummarySchema,
      SellCarsResponse: sellCarsResponseSchema,
      UpdateCarsResponse: updateCarsResponseSchema,
      HomeCatalogResponse: homeCatalogSchema,
      CarReferenceCatalog: referenceCatalogSchema,
      CarReferenceModelGroup: modelGroupSchema,
      SellerAccessVerifyRequest: sellerAccessVerifyRequestSchema,
      SellerPinSignInRequest: sellerPinSignInRequestSchema,
      SellerAccessVerifySuccess: sellerAccessVerifySuccessSchema,
      SellerAccessVerifyError: sellerAccessVerifyErrorSchema,
      SellerAccessSessionVerify: sellerAccessSessionVerifySchema,
      SellerAccessRefreshRequest: sellerAccessRefreshRequestSchema,
      SellerAccessRefreshSuccess: sellerAccessRefreshSuccessSchema,
      SellerProfile: sellerProfileSchema,
      SellerProfileRequest: sellerProfileRequestSchema,
      SellerListingCreateRequest: sellerListingCreateRequestSchema,
      SellerListingCreateResponse: sellerListingCreateResponseSchema,
      SellerListingUpdateResponse: sellerListingUpdateResponseSchema,
      SellerListingDeleteResponse: sellerListingDeleteResponseSchema,
      SellerOwnedListing: sellerOwnedListingSchema,
      SellerOwnedListingsResponse: sellerOwnedListingsResponseSchema,
      Error: errorSchema,
    },
  },
}) as const;

export const renderSwaggerUiHtml = (openApiUrl: string) => `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Car Party Game API Docs</title>
    <link
      rel="stylesheet"
      href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css"
    />
    <style>
      body {
        margin: 0;
        background: #f4f6f8;
      }

      .topbar {
        display: none;
      }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: ${JSON.stringify(openApiUrl)},
        dom_id: "#swagger-ui",
        deepLinking: true,
        displayRequestDuration: true,
        persistAuthorization: false,
      });
    </script>
  </body>
</html>`;
