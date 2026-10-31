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