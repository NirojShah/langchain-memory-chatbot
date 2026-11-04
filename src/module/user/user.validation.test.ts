import Fastify from "fastify";
import { registerSchema, loginSchema, updateSchema } from "./user.validation.js";

describe("User Validation Schemas", () => {
    let app: ReturnType<typeof Fastify>;

    beforeAll(async () => {
        app = Fastify({
            ajv: {
                customOptions: {
                    removeAdditional: false,
                },
            },
        });

        app.post("/test-register", { schema: { body: registerSchema } }, async () => ({ ok: true }));
        app.post("/test-login", { schema: { body: loginSchema } }, async () => ({ ok: true }));
        app.patch("/test-update", { schema: { body: updateSchema } }, async () => ({ ok: true }));

        await app.ready();
    });

    afterAll(async () => {
        await app.close();
    });

    describe("registerSchema", () => {
        it("should accept a valid registration payload", async () => {
            const res = await app.inject({
                method: "POST",
                url: "/test-register",
                payload: {
                    userName: "john_doe",
                    email: "john@example.com",
                    password: "password123",
                },
            });
            expect(res.statusCode).toBe(200);
            expect(res.json()).toEqual({ ok: true });
        });

        it("should reject payload missing userName", async () => {
            const res = await app.inject({
                method: "POST",
                url: "/test-register",
                payload: {
                    email: "john@example.com",
                    password: "password123",
                },
            });
            expect(res.statusCode).toBe(400);
        });

        it("should reject empty userName", async () => {
            const res = await app.inject({
                method: "POST",
                url: "/test-register",
                payload: {
                    userName: "",
                    email: "john@example.com",
                    password: "password123",
                },
            });
            expect(res.statusCode).toBe(400);
        });

        it("should reject payload missing email", async () => {
            const res = await app.inject({
                method: "POST",
                url: "/test-register",
                payload: {
                    userName: "john_doe",
                    password: "password123",
                },
            });
            expect(res.statusCode).toBe(400);
        });

        it("should reject invalid email format", async () => {
            const res = await app.inject({
                method: "POST",
                url: "/test-register",
                payload: {
                    userName: "john_doe",
                    email: "not-an-email",
                    password: "password123",
                },
            });
            expect(res.statusCode).toBe(400);
        });

        it("should reject payload missing password", async () => {
            const res = await app.inject({
                method: "POST",
                url: "/test-register",
                payload: {
                    userName: "john_doe",
                    email: "john@example.com",
                },
            });
            expect(res.statusCode).toBe(400);
        });

        it("should reject password shorter than 8 characters", async () => {
            const res = await app.inject({
                method: "POST",
                url: "/test-register",
                payload: {
                    userName: "john_doe",
                    email: "john@example.com",
                    password: "short",
                },
            });
            expect(res.statusCode).toBe(400);
        });

        it("should reject additional properties", async () => {
            const res = await app.inject({
                method: "POST",
                url: "/test-register",
                payload: {
                    userName: "john_doe",
                    email: "john@example.com",
                    password: "password123",
                    extraField: "not_allowed",
                },
            });
            expect(res.statusCode).toBe(400);
        });
    });

    describe("loginSchema", () => {
        it("should accept valid login payload", async () => {
            const res = await app.inject({
                method: "POST",
                url: "/test-login",
                payload: {
                    email: "john@example.com",
                    password: "password123",
                },
            });
            expect(res.statusCode).toBe(200);
            expect(res.json()).toEqual({ ok: true });
        });

        it("should reject login payload missing email", async () => {
            const res = await app.inject({
                method: "POST",
                url: "/test-login",
                payload: {
                    password: "password123",
                },
            });
            expect(res.statusCode).toBe(400);
        });

        it("should reject invalid email format in login", async () => {
            const res = await app.inject({
                method: "POST",
                url: "/test-login",
                payload: {
                    email: "invalid-email",
                    password: "password123",
                },
            });
            expect(res.statusCode).toBe(400);
        });

        it("should reject login payload missing password", async () => {
            const res = await app.inject({
                method: "POST",
                url: "/test-login",
                payload: {
                    email: "john@example.com",
                },
            });
            expect(res.statusCode).toBe(400);
        });

        it("should reject additional properties in login payload", async () => {
            const res = await app.inject({
                method: "POST",
                url: "/test-login",
                payload: {
                    email: "john@example.com",
                    password: "password123",
                    role: "admin",
                },
            });
            expect(res.statusCode).toBe(400);
        });
    });

    describe("updateSchema", () => {
        it("should accept update with only userName", async () => {
            const res = await app.inject({
                method: "PATCH",
                url: "/test-update",
                payload: {
                    userName: "updated_john",
                },
            });
            expect(res.statusCode).toBe(200);
            expect(res.json()).toEqual({ ok: true });
        });

        it("should accept update with only email", async () => {
            const res = await app.inject({
                method: "PATCH",
                url: "/test-update",
                payload: {
                    email: "newemail@example.com",
                },
            });
            expect(res.statusCode).toBe(200);
            expect(res.json()).toEqual({ ok: true });
        });

        it("should accept update with both userName and email", async () => {
            const res = await app.inject({
                method: "PATCH",
                url: "/test-update",
                payload: {
                    userName: "new_name",
                    email: "newemail@example.com",
                },
            });
            expect(res.statusCode).toBe(200);
            expect(res.json()).toEqual({ ok: true });
        });

        it("should reject empty object for update (minProperties: 1)", async () => {
            const res = await app.inject({
                method: "PATCH",
                url: "/test-update",
                payload: {},
            });
            expect(res.statusCode).toBe(400);
        });

        it("should reject invalid email in update payload", async () => {
            const res = await app.inject({
                method: "PATCH",
                url: "/test-update",
                payload: {
                    email: "bad-email",
                },
            });
            expect(res.statusCode).toBe(400);
        });

        it("should reject additional properties in update payload", async () => {
            const res = await app.inject({
                method: "PATCH",
                url: "/test-update",
                payload: {
                    userName: "john",
                    isActive: false,
                },
            });
            expect(res.statusCode).toBe(400);
        });
    });
});
