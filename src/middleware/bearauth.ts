import "dotenv/config";
import { type Next, type Context } from "hono";
import jwt from "jsonwebtoken";

interface DecodedToken {
    user_id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: 'admin' | 'user' | 'customer';
    iat: number;
    exp: number;
}

type UserRole = 'admin' | 'user' | 'customer' | 'both';

declare module "hono" {
    interface Context {
        user?: DecodedToken;
    }
}

export const verifyToken = async (token: string, secret: string): Promise<DecodedToken | null> => {
    try {
        console.log('🔐 Verifying token...');
        console.log('Token length:', token.length);
        console.log('Secret exists:', !!secret);
        console.log('Secret length:', secret?.length);
        
        const decoded = jwt.verify(token, secret) as DecodedToken;
        
        console.log('✅ Token verified successfully');
        console.log('Decoded user:', {
            user_id: decoded.user_id,
            email: decoded.email,
            role: decoded.role,
            exp: new Date(decoded.exp * 1000).toISOString(),
            iat: new Date(decoded.iat * 1000).toISOString()
        });
        
        // Check if token is expired
        const currentTime = Math.floor(Date.now() / 1000);
        if (decoded.exp && decoded.exp < currentTime) {
            console.error('❌ Token expired');
            console.log('Expiry:', new Date(decoded.exp * 1000).toISOString());
            console.log('Current:', new Date(currentTime * 1000).toISOString());
            return null;
        }
        
        return decoded;
    } catch (error: any) {
        console.error('❌ Token verification failed:', error.message);
        console.error('Error name:', error.name);
        
        if (error.name === 'TokenExpiredError') {
            console.error('Token expired at:', error.expiredAt);
        } else if (error.name === 'JsonWebTokenError') {
            console.error('JWT Error:', error.message);
        } else if (error.name === 'NotBeforeError') {
            console.error('Token not active until:', error.date);
        }
        
        return null;
    }
}

export const authMiddleware = async (c: Context, next: Next, requiredRole: UserRole) => {
    console.log('\n🔐 Auth Middleware Triggered');
    console.log('Path:', c.req.path);
    console.log('Method:', c.req.method);
    
    const authHeader = c.req.header("Authorization");

    if (!authHeader) {
        console.error('❌ No Authorization header');
        return c.json({ error: "Authorization header is required" }, 401);
    }

    console.log('Auth Header:', authHeader.substring(0, 30) + '...');
    
    if (!authHeader.startsWith("Bearer ")) {
        console.error('❌ Invalid auth header format');
        console.log('Expected "Bearer " prefix');
        return c.json({ error: "Bearer token is required" }, 401);
    }

    const token = authHeader.substring(7);
    console.log('Token extracted (first 50 chars):', token.substring(0, 50) + '...');
    
    // Check if JWT_SECRET is set
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        console.error('❌ JWT_SECRET is not set in environment variables');
        return c.json({ error: "Server configuration error" }, 500);
    }

    const decoded = await verifyToken(token, secret);

    if (!decoded) {
        console.error('❌ Token verification failed');
        return c.json({ error: "Invalid or expired token" }, 401);
    }

    console.log('✅ User authenticated:', decoded.email);
    console.log('User role:', decoded.role);
    console.log('Required role:', requiredRole);

    // Handle 'both' role (for backward compatibility)
    if (requiredRole === "both") {
        if (decoded.role === "admin" || decoded.role === "user" || decoded.role === "customer") {
            c.user = decoded;
            console.log('✅ Access granted for role: both');
            return next();
        }
    }
    // Handle 'customer' role specifically
    else if (requiredRole === "customer") {
        if (decoded.role === "customer" || decoded.role === "admin") {
            // Allow admins to access customer routes too (optional - remove if not needed)
            c.user = decoded;
            console.log('✅ Access granted for role: customer (or admin)');
            return next();
        }
    }
    // Handle exact role match
    else if (decoded.role === requiredRole) {
        c.user = decoded;
        console.log(`✅ Access granted for role: ${requiredRole}`);
        return next();
    }

    console.error(`❌ Insufficient permissions. User role: ${decoded.role}, Required: ${requiredRole}`);
    return c.json({ error: "Insufficient permissions" }, 403);
}

export const adminRoleAuth = async (c: Context, next: Next) => {
    console.log('\n🔐 Admin Role Auth Middleware');
    return await authMiddleware(c, next, "admin");
}

export const userRoleAuth = async (c: Context, next: Next) => {
    console.log('\n🔐 User Role Auth Middleware');
    return await authMiddleware(c, next, "user");
}

export const customerRoleAuth = async (c: Context, next: Next) => {
    console.log('\n🔐 Customer Role Auth Middleware');
    return await authMiddleware(c, next, "customer");
}

export const bothRolesAuth = async (c: Context, next: Next) => {
    console.log('\n🔐 Both Roles Auth Middleware');
    return await authMiddleware(c, next, "both");
}

// Optional: Combined middleware for multiple roles
export const adminOrCustomerAuth = async (c: Context, next: Next) => {
    console.log('\n🔐 Admin or Customer Role Auth Middleware');
    const authHeader = c.req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return c.json({ error: "Bearer token is required" }, 401);
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET;
    
    if (!secret) {
        return c.json({ error: "Server configuration error" }, 500);
    }

    const decoded = await verifyToken(token, secret);
    
    if (!decoded) {
        return c.json({ error: "Invalid or expired token" }, 401);
    }

    if (decoded.role === "admin" || decoded.role === "customer") {
        c.user = decoded;
        return next();
    }

    return c.json({ error: "Insufficient permissions" }, 403);
}