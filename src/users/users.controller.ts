import type { Context } from "hono";
import * as userService from "../users/users.service.ts";

// ✅ Get all users
export const getAllUsers = async (c: Context) => {
  try {
    const users = await userService.getAllUsers();
    return c.json(users, 200);
  } catch (error: any) {
    console.error("Error fetching users:", error.message);
    return c.json({ error: "Failed to fetch users" }, 500);
  }
};

// ✅ Get user by ID
export const getUserById = async (c: Context) => {
  const id = c.req.param("user_id");
  if (!id) return c.json({ error: "Invalid user ID" }, 400);

  try {
    const user = await userService.getUserById(id);
    if (!user) return c.json({ error: "User not found" }, 404);
    return c.json(user, 200);
  } catch (error: any) {
    console.error("Error fetching user:", error.message);
    return c.json({ error: "Failed to fetch user" }, 500);
  }
};

// ✅ Create user
export const createUser = async (c: Context) => {
  try {
    const data = await c.req.json();
    const result = await userService.createUser(data);
    return c.json({ message: result }, 201);
  } catch (error: any) {
    console.error("Error creating user:", error.message);
    return c.json({ error: error.message || "Failed to create user" }, 500);
  }
};

// ✅ Update user
export const updateUser = async (c: Context) => {
  const id = c.req.param("user_id");
  if (!id) return c.json({ error: "Invalid user ID" }, 400);

  try {
    const data = await c.req.json();
    const updated = await userService.updateUser(id, data);
    if (!updated) return c.json({ error: "User not found" }, 404);
    return c.json({ message: "User updated successfully" }, 200);
  } catch (error: any) {
    console.error("Error updating user:", error.message);
    return c.json({ error: "Failed to update user" }, 500);
  }
};

// ✅ Delete user
export const deleteUser = async (c: Context) => {
  const id = c.req.param("user_id");
  if (!id) return c.json({ error: "Invalid user ID" }, 400);

  try {
    const result = await userService.deleteUser(id);
    return c.json({ message: result }, 200);
  } catch (error: any) {
    console.error("Error deleting user:", error.message);
    return c.json({ error: "Failed to delete user" }, 500);
  }
};