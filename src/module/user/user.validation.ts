export const registerSchema = {
    type: "object",
    required: ["userName", "email", "password"],
    additionalProperties: false,
    properties: {
        userName: { type: "string", minLength: 1, maxLength: 100 },
        email: { type: "string", format: "email", maxLength: 254 },
        password: { type: "string", minLength: 8, maxLength: 72 },
    },
} as const;

export const loginSchema = {
    type: "object",
    required: ["email", "password"],
    additionalProperties: false,
    properties: {
        email: { type: "string", format: "email", maxLength: 254 },
        password: { type: "string", minLength: 1, maxLength: 72 },
    },
} as const;

export const updateSchema = {
    type: "object",
    minProperties: 1,
    additionalProperties: false,
    properties: {
        userName: { type: "string", minLength: 1, maxLength: 100 },
        email: { type: "string", format: "email", maxLength: 254 },
    },
} as const;
