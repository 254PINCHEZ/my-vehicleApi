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

// ✅ Update user (PUT - full update)
export const updateUser = async (c: Context) => {
  const id = c.req.param("user_id");
  if (!id) return c.json({ error: "Invalid user ID" }, 400);

  try {
    const data = await c.req.json();
    
    // Validate required fields for PUT
    const requiredFields = ['first_name', 'last_name', 'email', 'contact_phone', 'address', 'role'];
    for (const field of requiredFields) {
      if (!data[field]) {
        return c.json({ error: `${field} is required for full update` }, 400);
      }
    }

    const updated = await userService.updateUser(id, data);
    if (!updated) return c.json({ error: "User not found" }, 404);
    return c.json({ message: "User updated successfully", user: updated }, 200);
  } catch (error: any) {
    console.error("Error updating user:", error.message);
    return c.json({ error: "Failed to update user" }, 500);
  }
};

// ✅ Update user partially (PATCH - partial update)
export const patchUser = async (c: Context) => {
  const id = c.req.param("user_id");
  if (!id) return c.json({ error: "Invalid user ID" }, 400);

  try {
    const data = await c.req.json();
    
    // Validate at least one field is provided
    const allowedFields = ['first_name', 'last_name', 'email', 'contact_phone', 'address', 'role'];
    const providedFields = Object.keys(data);
    
    if (providedFields.length === 0) {
      return c.json({ error: "No fields to update" }, 400);
    }

    // Validate only allowed fields are provided
    const invalidFields = providedFields.filter(field => !allowedFields.includes(field));
    if (invalidFields.length > 0) {
      return c.json({ error: `Invalid fields: ${invalidFields.join(', ')}` }, 400);
    }

    // Validate email if provided
    if (data.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        return c.json({ error: "Invalid email format" }, 400);
      }
    }

    const updated = await userService.patchUser(id, data);
    if (!updated) return c.json({ error: "User not found" }, 404);
    
    return c.json({ 
      message: "User updated successfully", 
      user: updated 
    }, 200);
  } catch (error: any) {
    console.error("Error updating user:", error.message);
    return c.json({ error: "Failed to update user" }, 500);
  }
};

// ✅ Update user role only (PATCH - specific endpoint)
export const updateUserRole = async (c: Context) => {
  const id = c.req.param("user_id");
  if (!id) return c.json({ error: "Invalid user ID" }, 400);

  try {
    const data = await c.req.json();
    
    console.log('🔧 PATCH /user-status/:user_id - Request received');
    console.log('🔧 User ID:', id);
    console.log('🔧 Request data:', data);
    
    // Validate role field
    if (!data.role) {
      console.error('❌ Role field is missing');
      return c.json({ error: "Role field is required" }, 400);
    }

    // Validate role value - UPDATED: Changed from 'staff' to 'user'
    const validRoles = ['admin', 'customer', 'user'];
    if (!validRoles.includes(data.role)) {
      console.error(`❌ Invalid role value: ${data.role}`);
      return c.json({ 
        error: `Invalid role value. Must be one of: ${validRoles.join(', ')}` 
      }, 400);
    }

    console.log(`✅ Valid role received: ${data.role}`);
    console.log(`✅ Calling service to update user ${id}`);
    
    const updated = await userService.updateUserRole(id, data);
    
    if (!updated) {
      console.error(`❌ User not found: ${id}`);
      return c.json({ error: "User not found" }, 404);
    }
    
    console.log('✅ User role updated successfully');
    return c.json({ 
      message: "User role updated successfully", 
      user: updated 
    }, 200);
  } catch (error: any) {
    console.error("❌ Error updating user role:", error.message);
    console.error("❌ Error details:", error);
    return c.json({ error: `Failed to update user role: ${error.message}` }, 500);
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

// ✅ Change password (for customer role)
export const changePassword = async (c: Context) => {
  try {
    const user = c.get('user');
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const data = await c.req.json();
    
    if (!data.currentPassword || !data.newPassword) {
      return c.json({ error: "Current password and new password are required" }, 400);
    }

    // TODO: Implement password change logic
    return c.json({ message: "Password changed successfully" }, 200);
  } catch (error: any) {
    console.error("Error changing password:", error.message);
    return c.json({ error: "Failed to change password" }, 500);
  }
};