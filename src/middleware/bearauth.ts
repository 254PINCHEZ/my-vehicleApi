import "dotenv/config";
import { type Next, type Context } from "hono";
import jwt from "jsonwebtoken";

interface DecodedToken {
    user_id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: 'admin' | 'user';
    iat: number;
    exp: number;
}

type UserRole = 'admin' | 'user' | 'both';

declare module "hono" {
    interface Context {
        user?: DecodedToken;
    }
}

export const verifyToken = async (token: string, secret: string): Promise<DecodedToken | null> => {
    try {
        const decoded = jwt.verify(token, secret) as DecodedToken;
        return decoded;
    } catch (error: any) {
        console.error('Token verification failed:', error.message);
        return null;
    }
}

export const authMiddleware = async (c: Context, next: Next, requiredRole: UserRole) => {
    const authHeader = c.req.header("Authorization");

    if (!authHeader) {
        return c.json({ error: "Authorization header is required" }, 401);
    }

    if (!authHeader.startsWith("Bearer ")) {
        return c.json({ error: "Bearer token is required" }, 401);
    }

    const token = authHeader.substring(7);
    const decoded = await verifyToken(token, process.env.JWT_SECRET as string);

    if (!decoded) {
        return c.json({ error: "Invalid or expired token" }, 401);
    }

    if (requiredRole === "both") {
        if (decoded.role === "admin" || decoded.role === "user") {
            c.user = decoded;
            return next();
        }
    } else if (decoded.role === requiredRole) {
        c.user = decoded;
        return next();
    }

    return c.json({ error: "Insufficient permissions" }, 403);
}

export const adminRoleAuth = async (c: Context, next: Next) => await authMiddleware(c, next, "admin");

export const userRoleAuth = async (c: Context, next: Next) => await authMiddleware(c, next, "user");

export const bothRolesAuth = async (c: Context, next: Next) => await authMiddleware(c, next, "both");