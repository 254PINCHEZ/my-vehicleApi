import { getDbPool } from "../db/dbconfig.ts";

interface UserInfo {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  contact_phone: string;
  address: string;
  role: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserResponse {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  contact_phone: string;
  address: string;
  role: string;
  created_at: Date;
  updated_at: Date;
}

export const getAllUsers = async (): Promise<UserResponse[]> => {
  const db = await getDbPool();

  const query = `
    SELECT 
      user_id,
      first_name,
      last_name,
      email,
      contact_phone,
      address,
      role,
      created_at,
      updated_at
    FROM Users
    ORDER BY created_at DESC
  `;

  const result = await db.request().query(query);

  return result.recordset.map((row: any) => ({
    user_id: row.user_id,
    first_name: row.first_name,
    last_name: row.last_name,
    email: row.email,
    contact_phone: row.contact_phone,
    address: row.address,
    role: row.role,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
};

export const getUserById = async (user_id: string): Promise<UserResponse | null> => {
  const db = await getDbPool();

  const query = `
    SELECT 
      user_id,
      first_name,
      last_name,
      email,
      contact_phone,
      address,
      role,
      created_at,
      updated_at
    FROM Users
    WHERE user_id = @user_id
  `;

  const result = await db.request()
    .input("user_id", user_id)
    .query(query);

  if (!result.recordset.length) return null;

  const row = result.recordset[0];

  return {
    user_id: row.user_id,
    first_name: row.first_name,
    last_name: row.last_name,
    email: row.email,
    contact_phone: row.contact_phone,
    address: row.address,
    role: row.role,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
};

export const getUserByEmail = async (email: string): Promise<any> => {
  const db = await getDbPool();
  
  const query = `
    SELECT 
      user_id,
      first_name,
      last_name,
      email,
      contact_phone,
      password,
      role
    FROM Users 
    WHERE email = @email
  `;
  
  const result = await db.request()
    .input("email", email)
    .query(query);

  if (!result.recordset.length) return null;
  
  const row = result.recordset[0];
  return {
    user_id: row.user_id,
    first_name: row.first_name,
    last_name: row.last_name,
    email: row.email,
    contact_phone: row.contact_phone,
    password: row.password,
    role: row.role
  };
};

export const createUser = async (data: {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  contact_phone: string;
  address: string;
  role: string;
}): Promise<string> => {
  const db = await getDbPool();

  const query = `
    INSERT INTO Users (user_id, first_name, last_name, email, password, contact_phone, address, role)
    VALUES (NEWID(), @first_name, @last_name, @email, @password, @contact_phone, @address, @role)
  `;

  const result = await db.request()
    .input("first_name", data.first_name)
    .input("last_name", data.last_name)
    .input("email", data.email)
    .input("password", data.password)
    .input("contact_phone", data.contact_phone)
    .input("address", data.address)
    .input("role", data.role)
    .query(query);

  return result.rowsAffected[0] === 1
    ? "User created successfully ✅"
    : "Failed to create user ❌";
};

export const updateUser = async (
  user_id: string,
  data: {
    first_name: string;
    last_name: string;
    email: string;
    contact_phone: string;
    address: string;
    role: string;
  }
): Promise<UserResponse | null> => {
  const db = await getDbPool();

  const query = `
    UPDATE Users
    SET 
      first_name = @first_name,
      last_name = @last_name,
      email = @email,
      contact_phone = @contact_phone,
      address = @address,
      role = @role,
      updated_at = GETDATE()
    WHERE user_id = @user_id
  `;

  await db.request()
    .input("user_id", user_id)
    .input("first_name", data.first_name)
    .input("last_name", data.last_name)
    .input("email", data.email)
    .input("contact_phone", data.contact_phone)
    .input("address", data.address)
    .input("role", data.role)
    .query(query);

  return await getUserById(user_id);
};

export const deleteUser = async (user_id: string): Promise<string> => {
  const db = await getDbPool();

  const query = "DELETE FROM Users WHERE user_id = @user_id";

  const result = await db.request()
    .input("user_id", user_id)
    .query(query);

  return result.rowsAffected[0] === 1
    ? "User deleted successfully 🗑️"
    : "Failed to delete user ⚠️";
};