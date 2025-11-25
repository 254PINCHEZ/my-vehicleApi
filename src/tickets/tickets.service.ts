import { getDbPool } from "../db/dbconfig.ts";

// Interfaces

interface UserInfo {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  contact_phone: string;
}

interface AdminInfo {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface TicketResponse {
  ticket_id: string;
  user_id: string;
  subject: string;
  description: string;
  status: string;
  created_at: Date;
  updated_at: Date;

  user: UserInfo;
}


// GET ALL TICKETS

export const getAllTickets = async (): Promise<TicketResponse[]> => {
  const db = await getDbPool();

  const query = `
    SELECT 
      t.ticket_id,
      t.user_id,
      t.subject,
      t.description,
      t.status,
      t.created_at,
      t.updated_at,

      -- User details
      u.first_name AS user_first_name,
      u.last_name AS user_last_name,
      u.email AS user_email,
      u.contact_phone AS user_contact_phone  
    FROM CustomerSupportTickets t
    INNER JOIN Users u ON t.user_id = u.user_id
    ORDER BY t.created_at DESC
  `;

  const result = await db.request().query(query);

  return result.recordset.map((row: any) => ({
    ticket_id: row.ticket_id,
    user_id: row.user_id,
    subject: row.subject,
    description: row.description,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,

    user: {
      user_id: row.user_id,
      first_name: row.user_first_name,
      last_name: row.user_last_name,
      email: row.user_email,
      contact_phone: row.user_contact_phone,
    } 
  }));
};


// GET SINGLE TICKET BY ID

export const getTicketById = async (ticket_id: string): Promise<TicketResponse | null> => {
  const db = await getDbPool();

  const query = `
    SELECT 
      t.ticket_id,
      t.user_id,
      t.subject,
      t.description,
      t.status,
      t.created_at,
      t.updated_at,

      -- User details
      u.first_name AS user_first_name,
      u.last_name AS user_last_name,
      u.email AS user_email,
      u.contact_phone AS user_contact_phone,

   l

    FROM CustomerSupportTickets t
    INNER JOIN Users u ON t.user_id = u.user_id
    WHERE t.ticket_id = @ticket_id
  `;

  const result = await db.request()
    .input("ticket_id", ticket_id)
    .query(query);

  if (!result.recordset.length) return null;

  const row = result.recordset[0];

  return {
    ticket_id: row.ticket_id,
    user_id: row.user_id,
    subject: row.subject,
    description: row.description,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,

    user: {
      user_id: row.user_id,
      first_name: row.user_first_name,
      last_name: row.user_last_name,
      email: row.user_email,
      contact_phone: row.user_contact_phone,
    },
    
  };
};


// CREATE TICKET

export const createTicket = async (data: {
  user_id: string;
  subject: string;
  description: string;
  status: string;
}): Promise<string> => {
  const db = await getDbPool();

  const query = `
    INSERT INTO CustomerSupportTickets (
      ticket_id, 
      user_id, 
      subject, 
      description, 
      status
    )
    VALUES (NEWID(), @user_id, @subject, @description, @status)
  `;

  const result = await db.request()
    .input("user_id", data.user_id)
    .input("subject", data.subject)
    .input("description", data.description)
    .input("status", data.status)
    .query(query);

  return result.rowsAffected[0] === 1
    ? "Support ticket created successfully ✅"
    : "Failed to create support ticket ❌";
};


// UPDATE TICKET

export const updateTicket = async (
  ticket_id: string,
  data: {
    user_id: string;
    subject: string;
    description: string;
    status: string;
    assigned_admin_id?: string;
  }
): Promise<TicketResponse | null> => {
  const db = await getDbPool();

  const query = `
    UPDATE CustomerSupportTickets
    SET 
      user_id = @user_id,
      subject = @subject,
      description = @description,
      status = @status,
      assigned_admin_id = @assigned_admin_id,
      updated_at = GETDATE()
    WHERE ticket_id = @ticket_id
  `;

  await db.request()
    .input("ticket_id", ticket_id)
    .input("user_id", data.user_id)
    .input("subject", data.subject)
    .input("description", data.description)
    .input("status", data.status)
    .input("assigned_admin_id", data.assigned_admin_id || null)
    .query(query);

  return await getTicketById(ticket_id);
};


// DELETE TICKET

export const deleteTicket = async (ticket_id: string): Promise<string> => {
  const db = await getDbPool();

  const query = "DELETE FROM CustomerSupportTickets WHERE ticket_id = @ticket_id";

  const result = await db.request()
    .input("ticket_id", ticket_id)
    .query(query);

  return result.rowsAffected[0] === 1
    ? "Support ticket deleted successfully 🗑️"
    : "Failed to delete support ticket ⚠️";
};