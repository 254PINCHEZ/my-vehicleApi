import { getDbPool } from "../db/dbconfig.ts";

export const registerUser = async (
    first_name: string, 
    last_name: string, 
    email: string, 
    phone: string, 
    password: string
): Promise<string> => {
    const db = getDbPool();
    const query = `
        INSERT INTO Users (user_id, first_name, last_name, email, contact_phone, password, role) 
        OUTPUT INSERTED.* 
        VALUES (NEWID(), @first_name, @last_name, @email, @phone, @password, 'user')
    `;
    
    const result = await db.request()
        .input('first_name', first_name)
        .input('last_name', last_name)
        .input('email', email)
        .input('phone', phone)
        .input('password', password)
        .query(query);
        
    return result.rowsAffected[0] === 1 
        ? "User registered successfully ✅" 
        : "Failed to register user ❌";
}