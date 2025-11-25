import bcrypt from "bcryptjs";
import { type Context } from "hono";
import { getUserByEmail } from "../users/users.service.ts";
import * as authServices from "../Auth/auth.service.ts";
import jwt from "jsonwebtoken";
import dotenv from 'dotenv';
import { sendNotificationEmail } from "../mailler/mailer.ts";

dotenv.config();

interface CreateUserRequest {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    password: string;
}

interface LoginRequest {
    email: string;
    password: string;
}

interface UserPayload {
    user_id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: 'user' | 'admin';
}

export const register = async (c: Context) => {
    const body = await c.req.json() as CreateUserRequest;

    try {
        const emailCheck = await getUserByEmail(body.email);
        if (emailCheck !== null) {
            return c.json({ error: 'Email already exists 😟' }, 400);
        }

        const saltRounds = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(body.password, saltRounds);
        body.password = hashedPassword;

        const result = await authServices.registerUser(body.first_name, body.last_name, body.email, body.phone, body.password);
        
        const emailResult = await sendNotificationEmail(
            body.email, 
            body.first_name, 
            "Welcome to Vehicle Rental 🎊", 
            "Your account has been created successfully! You can now browse and rent vehicles."
        );

        if (result === "User registered successfully ✅") {
            return c.json({ message: result }, 201);
        }
        return c.json({ error: result }, 500);
    } catch (error: any) {
        console.error('Error creating user:', error);
        return c.json({ error: error.message }, 500);
    }
}

export const login = async (c: Context) => {
    const body = await c.req.json() as LoginRequest;
    try {
        const existingUser = await getUserByEmail(body.email);
        if (existingUser === null) {
            return c.json({ error: 'Invalid email or password 😟' }, 400);
        }

        const isPasswordValid = bcrypt.compareSync(body.password, existingUser.password);
        if (!isPasswordValid) {
            return c.json({ error: 'Invalid email or password 😟' }, 400);
        }

        const userType: UserPayload["role"] = existingUser.role === 'admin' ? 'admin' : 'user';
        const payload: UserPayload = {
            user_id: existingUser.user_id,
            first_name: existingUser.first_name,
            last_name: existingUser.last_name,
            email: existingUser.email,
            role: userType
        };

        const secretKey = process.env.JWT_SECRET as string;
        const token = "Bearer " + jwt.sign(payload, secretKey, { expiresIn: '1h' });

        const userInfo: UserPayload = {
            user_id: existingUser.user_id,
            first_name: existingUser.first_name,
            last_name: existingUser.last_name,
            email: existingUser.email,
            role: userType
        };

        return c.json({ 
            message: 'Login successful 🎉', 
            token: token, 
            user: userInfo 
        }, 200);

    } catch (error: any) {
        console.error('Error logging in user:', error);
        return c.json({ error: error.message }, 500);
    }
}

export const verify = async (c: Context) => {
    return c.json({ message: 'Email verification endpoint' }, 200);
}

export const refresh = async (c: Context) => {
    return c.json({ message: 'Token refresh endpoint' }, 200);
}

export const forgotPassword = async (c: Context) => {
    return c.json({ message: 'Forgot password endpoint' }, 200);
}