// src/services/support.service.ts
import { getDbPool } from "../db/dbconfig.ts";

// Interfaces matching your frontend expectations
export interface SupportTicket {
    ticket_id: number;
    ticket_reference: string;
    customer_name: string;
    customer_email: string;
    subject: string;
    description?: string;
    status: string;
    priority: string;
    category: string;
    created_at: string;
    phone?: string;
    assigned_to?: string;
    customer_id?: number;
    updated_at?: string;
    resolved_at?: string;
}

export interface TicketReply {
    reply_id: number;
    ticket_id: number;
    message: string;
    is_admin: boolean;
    created_by: string;
    created_at: string;
}

export interface SupportStats {
    total_tickets: number;
    open_tickets: number;
    resolved_tickets: number;
    average_response_time: number;
    urgent_tickets: number;
    tickets_by_category: Record<string, number>;
    tickets_by_priority: Record<string, number>;
}

export interface CreateTicketDTO {
    customer_id?: number;
    customer_name: string;
    customer_email: string;
    phone?: string;
    subject: string;
    description: string;
    priority: string;
    category: string;
    status?: string;
}

// ✅ GET ALL SUPPORT TICKETS
export const getAllTickets = async (): Promise<SupportTicket[]> => {
    try {
        console.log('📋 Fetching all support tickets from database...');
        
        const db = await getDbPool();
        
        const query = `
            SELECT 
                st.ticket_id,
                st.ticket_reference,
                st.customer_name,
                st.customer_email,
                st.subject,
                st.description,
                st.status,
                st.priority,
                st.category,
                FORMAT(st.created_at, 'yyyy-MM-dd HH:mm:ss') as created_at,
                st.phone,
                st.assigned_to,
                st.customer_id,
                FORMAT(st.updated_at, 'yyyy-MM-dd HH:mm:ss') as updated_at,
                FORMAT(st.resolved_at, 'yyyy-MM-dd HH:mm:ss') as resolved_at
            FROM SupportTickets st
            ORDER BY 
                CASE 
                    WHEN st.priority = 'urgent' THEN 1
                    WHEN st.priority = 'high' THEN 2
                    WHEN st.priority = 'medium' THEN 3
                    ELSE 4
                END,
                st.created_at DESC
        `;
        
        const result = await db.request().query(query);
        
        console.log(`✅ Found ${result.recordset.length} support tickets`);
        
        return result.recordset.map((row: any) => ({
            ticket_id: row.ticket_id,
            ticket_reference: row.ticket_reference || `TICKET-${String(row.ticket_id).padStart(6, '0')}`,
            customer_name: row.customer_name,
            customer_email: row.customer_email,
            subject: row.subject,
            description: row.description || '',
            status: row.status || 'open',
            priority: row.priority || 'medium',
            category: row.category || 'general',
            created_at: row.created_at || new Date().toISOString(),
            phone: row.phone || undefined,
            assigned_to: row.assigned_to || undefined,
            customer_id: row.customer_id,
            updated_at: row.updated_at,
            resolved_at: row.resolved_at
        }));
    } catch (error: any) {
        console.error('❌ Error in getAllTickets:', error.message);
        console.error('SQL Error:', error);
        
        // Return empty array if table doesn't exist yet
        if (error.message.includes("Invalid object name 'SupportTickets'")) {
            console.warn('⚠️ SupportTickets table does not exist yet');
            return [];
        }
        
        throw error;
    }
};

// ✅ GET TICKET BY ID
export const getTicketById = async (ticketId: string): Promise<SupportTicket | null> => {
    try {
        console.log(`📋 Fetching ticket ${ticketId}...`);
        
        const db = await getDbPool();
        
        const query = `
            SELECT 
                st.ticket_id,
                st.ticket_reference,
                st.customer_name,
                st.customer_email,
                st.subject,
                st.description,
                st.status,
                st.priority,
                st.category,
                FORMAT(st.created_at, 'yyyy-MM-dd HH:mm:ss') as created_at,
                st.phone,
                st.assigned_to,
                st.customer_id,
                FORMAT(st.updated_at, 'yyyy-MM-dd HH:mm:ss') as updated_at,
                FORMAT(st.resolved_at, 'yyyy-MM-dd HH:mm:ss') as resolved_at
            FROM SupportTickets st
            WHERE st.ticket_id = @ticketId
        `;
        
        const request = db.request();
        request.input('ticketId', ticketId);
        
        const result = await request.query(query);
        
        if (result.recordset.length === 0) {
            console.warn(`⚠️ Ticket ${ticketId} not found`);
            return null;
        }
        
        const row = result.recordset[0];
        
        console.log(`✅ Found ticket ${ticketId}`);
        
        return {
            ticket_id: row.ticket_id,
            ticket_reference: row.ticket_reference || `TICKET-${String(row.ticket_id).padStart(6, '0')}`,
            customer_name: row.customer_name,
            customer_email: row.customer_email,
            subject: row.subject,
            description: row.description || '',
            status: row.status || 'open',
            priority: row.priority || 'medium',
            category: row.category || 'general',
            created_at: row.created_at || new Date().toISOString(),
            phone: row.phone || undefined,
            assigned_to: row.assigned_to || undefined,
            customer_id: row.customer_id,
            updated_at: row.updated_at,
            resolved_at: row.resolved_at
        };
    } catch (error: any) {
        console.error(`❌ Error in getTicketById for ticket ${ticketId}:`, error.message);
        throw error;
    }
};

// ✅ GET TICKETS BY CUSTOMER
export const getTicketsByCustomer = async (customerId: string): Promise<SupportTicket[]> => {
    try {
        console.log(`📋 Fetching tickets for customer ${customerId}...`);
        
        const db = await getDbPool();
        
        const query = `
            SELECT 
                st.ticket_id,
                st.ticket_reference,
                st.customer_name,
                st.customer_email,
                st.subject,
                st.description,
                st.status,
                st.priority,
                st.category,
                FORMAT(st.created_at, 'yyyy-MM-dd HH:mm:ss') as created_at,
                st.phone,
                st.assigned_to,
                st.customer_id,
                FORMAT(st.updated_at, 'yyyy-MM-dd HH:mm:ss') as updated_at,
                FORMAT(st.resolved_at, 'yyyy-MM-dd HH:mm:ss') as resolved_at
            FROM SupportTickets st
            WHERE st.customer_id = @customerId
            ORDER BY st.created_at DESC
        `;
        
        const request = db.request();
        request.input('customerId', customerId);
        
        const result = await request.query(query);
        
        console.log(`✅ Found ${result.recordset.length} tickets for customer ${customerId}`);
        
        return result.recordset.map((row: any) => ({
            ticket_id: row.ticket_id,
            ticket_reference: row.ticket_reference || `TICKET-${String(row.ticket_id).padStart(6, '0')}`,
            customer_name: row.customer_name,
            customer_email: row.customer_email,
            subject: row.subject,
            description: row.description || '',
            status: row.status || 'open',
            priority: row.priority || 'medium',
            category: row.category || 'general',
            created_at: row.created_at || new Date().toISOString(),
            phone: row.phone || undefined,
            assigned_to: row.assigned_to || undefined,
            customer_id: row.customer_id,
            updated_at: row.updated_at,
            resolved_at: row.resolved_at
        }));
    } catch (error: any) {
        console.error(`❌ Error in getTicketsByCustomer for customer ${customerId}:`, error.message);
        return [];
    }
};

// ✅ CREATE NEW SUPPORT TICKET
export const createTicket = async (ticketData: CreateTicketDTO): Promise<{ ticket_id: string }> => {
    try {
        console.log('📝 Creating new support ticket...');
        console.log('Ticket data:', ticketData);
        
        const db = await getDbPool();
        
        // Generate ticket reference
        const ticketReference = `TICKET-${Date.now().toString().slice(-6)}`;
        
        const query = `
            INSERT INTO SupportTickets (
                ticket_reference,
                customer_id,
                customer_name,
                customer_email,
                phone,
                subject,
                description,
                status,
                priority,
                category,
                created_at
            )
            OUTPUT INSERTED.ticket_id
            VALUES (
                @ticketReference,
                @customerId,
                @customerName,
                @customerEmail,
                @phone,
                @subject,
                @description,
                @status,
                @priority,
                @category,
                GETDATE()
            )
        `;
        
        const request = db.request();
        request.input('ticketReference', ticketReference);
        request.input('customerId', ticketData.customer_id || null);
        request.input('customerName', ticketData.customer_name);
        request.input('customerEmail', ticketData.customer_email);
        request.input('phone', ticketData.phone || '');
        request.input('subject', ticketData.subject);
        request.input('description', ticketData.description);
        request.input('status', ticketData.status || 'open');
        request.input('priority', ticketData.priority || 'medium');
        request.input('category', ticketData.category || 'general');
        
        const result = await request.query(query);
        
        const ticketId = result.recordset[0].ticket_id;
        
        console.log(`✅ Ticket created successfully with ID: ${ticketId}`);
        
        return { ticket_id: String(ticketId) };
    } catch (error: any) {
        console.error('❌ Error in createTicket:', error.message);
        console.error('SQL Error:', error);
        
        // If table doesn't exist, create it and retry
        if (error.message.includes("Invalid object name 'SupportTickets'")) {
            console.log('🔄 Creating SupportTickets table...');
            await createSupportTicketsTable();
            return createTicket(ticketData);
        }
        
        throw error;
    }
};

// ✅ UPDATE TICKET STATUS
export const updateTicketStatus = async (ticketId: string, status: string): Promise<{ message: string }> => {
    try {
        console.log(`🔄 Updating ticket ${ticketId} status to ${status}...`);
        
        const db = await getDbPool();
        
        const query = `
            UPDATE SupportTickets
            SET 
                status = @status,
                updated_at = GETDATE(),
                resolved_at = CASE 
                    WHEN @status IN ('resolved', 'closed') THEN GETDATE()
                    ELSE resolved_at
                END
            OUTPUT INSERTED.ticket_id
            WHERE ticket_id = @ticketId
        `;
        
        const request = db.request();
        request.input('ticketId', ticketId);
        request.input('status', status);
        
        const result = await request.query(query);
        
        if (result.recordset.length === 0) {
            throw new Error(`Ticket ${ticketId} not found`);
        }
        
        console.log(`✅ Ticket ${ticketId} status updated to ${status}`);
        
        return { message: `Ticket status updated to ${status}` };
    } catch (error: any) {
        console.error(`❌ Error in updateTicketStatus for ticket ${ticketId}:`, error.message);
        throw error;
    }
};

// ✅ UPDATE TICKET PRIORITY
export const updateTicketPriority = async (ticketId: string, priority: string): Promise<{ message: string }> => {
    try {
        console.log(`🔄 Updating ticket ${ticketId} priority to ${priority}...`);
        
        const db = await getDbPool();
        
        const query = `
            UPDATE SupportTickets
            SET 
                priority = @priority,
                updated_at = GETDATE()
            OUTPUT INSERTED.ticket_id
            WHERE ticket_id = @ticketId
        `;
        
        const request = db.request();
        request.input('ticketId', ticketId);
        request.input('priority', priority);
        
        const result = await request.query(query);
        
        if (result.recordset.length === 0) {
            throw new Error(`Ticket ${ticketId} not found`);
        }
        
        console.log(`✅ Ticket ${ticketId} priority updated to ${priority}`);
        
        return { message: `Ticket priority updated to ${priority}` };
    } catch (error: any) {
        console.error(`❌ Error in updateTicketPriority for ticket ${ticketId}:`, error.message);
        throw error;
    }
};

// ✅ ASSIGN TICKET TO ADMIN
export const assignTicket = async (ticketId: string, assignedTo: string): Promise<{ message: string }> => {
    try {
        console.log(`👤 Assigning ticket ${ticketId} to admin ${assignedTo}...`);
        
        const db = await getDbPool();
        
        const query = `
            UPDATE SupportTickets
            SET 
                assigned_to = @assignedTo,
                updated_at = GETDATE()
            OUTPUT INSERTED.ticket_id
            WHERE ticket_id = @ticketId
        `;
        
        const request = db.request();
        request.input('ticketId', ticketId);
        request.input('assignedTo', assignedTo);
        
        const result = await request.query(query);
        
        if (result.recordset.length === 0) {
            throw new Error(`Ticket ${ticketId} not found`);
        }
        
        console.log(`✅ Ticket ${ticketId} assigned to ${assignedTo}`);
        
        return { message: `Ticket assigned to ${assignedTo}` };
    } catch (error: any) {
        console.error(`❌ Error in assignTicket for ticket ${ticketId}:`, error.message);
        throw error;
    }
};

// ✅ DELETE TICKET
export const deleteTicket = async (ticketId: string): Promise<{ message: string }> => {
    try {
        console.log(`🗑️ Deleting ticket ${ticketId}...`);
        
        const db = await getDbPool();
        
        // First delete ticket replies
        const deleteRepliesQuery = `
            DELETE FROM TicketReplies
            WHERE ticket_id = @ticketId
        `;
        
        const deleteTicketQuery = `
            DELETE FROM SupportTickets
            OUTPUT DELETED.ticket_id
            WHERE ticket_id = @ticketId
        `;
        
        const request = db.request();
        request.input('ticketId', ticketId);
        
        // Delete replies first
        await request.query(deleteRepliesQuery);
        
        // Then delete ticket
        const result = await request.query(deleteTicketQuery);
        
        if (result.recordset.length === 0) {
            throw new Error(`Ticket ${ticketId} not found`);
        }
        
        console.log(`✅ Ticket ${ticketId} deleted successfully`);
        
        return { message: `Ticket ${ticketId} deleted successfully` };
    } catch (error: any) {
        console.error(`❌ Error in deleteTicket for ticket ${ticketId}:`, error.message);
        throw error;
    }
};

// ✅ GET TICKET REPLIES
export const getTicketReplies = async (ticketId: string): Promise<TicketReply[]> => {
    try {
        console.log(`💬 Fetching replies for ticket ${ticketId}...`);
        
        const db = await getDbPool();
        
        const query = `
            SELECT 
                tr.reply_id,
                tr.ticket_id,
                tr.message,
                tr.is_admin,
                tr.created_by,
                FORMAT(tr.created_at, 'yyyy-MM-dd HH:mm:ss') as created_at
            FROM TicketReplies tr
            WHERE tr.ticket_id = @ticketId
            ORDER BY tr.created_at ASC
        `;
        
        const request = db.request();
        request.input('ticketId', ticketId);
        
        const result = await request.query(query);
        
        console.log(`✅ Found ${result.recordset.length} replies for ticket ${ticketId}`);
        
        return result.recordset.map((row: any) => ({
            reply_id: row.reply_id,
            ticket_id: row.ticket_id,
            message: row.message,
            is_admin: Boolean(row.is_admin),
            created_by: row.created_by || 'System',
            created_at: row.created_at || new Date().toISOString()
        }));
    } catch (error: any) {
        console.error(`❌ Error in getTicketReplies for ticket ${ticketId}:`, error.message);
        return [];
    }
};

// ✅ ADD REPLY TO TICKET
export const addTicketReply = async (
    ticketId: string, 
    message: string, 
    isAdmin: boolean, 
    createdBy: string
): Promise<{ reply_id: string }> => {
    try {
        console.log(`💬 Adding reply to ticket ${ticketId}...`);
        
        const db = await getDbPool();
        
        // Update ticket's updated_at timestamp
        const updateTicketQuery = `
            UPDATE SupportTickets
            SET updated_at = GETDATE()
            WHERE ticket_id = @ticketId
        `;
        
        const addReplyQuery = `
            INSERT INTO TicketReplies (
                ticket_id,
                message,
                is_admin,
                created_by,
                created_at
            )
            OUTPUT INSERTED.reply_id
            VALUES (
                @ticketId,
                @message,
                @isAdmin,
                @createdBy,
                GETDATE()
            )
        `;
        
        const request = db.request();
        request.input('ticketId', ticketId);
        request.input('message', message);
        request.input('isAdmin', isAdmin);
        request.input('createdBy', createdBy);
        
        // Update ticket
        await request.query(updateTicketQuery);
        
        // Add reply
        const result = await request.query(addReplyQuery);
        
        const replyId = result.recordset[0].reply_id;
        
        console.log(`✅ Reply added successfully with ID: ${replyId}`);
        
        return { reply_id: String(replyId) };
    } catch (error: any) {
        console.error(`❌ Error in addTicketReply for ticket ${ticketId}:`, error.message);
        throw error;
    }
};

// ✅ MARK TICKET AS RESOLVED
export const markAsResolved = async (ticketId: string): Promise<{ message: string }> => {
    return updateTicketStatus(ticketId, 'resolved');
};

// ✅ REOPEN TICKET
export const reopenTicket = async (ticketId: string): Promise<{ message: string }> => {
    return updateTicketStatus(ticketId, 'open');
};

// ✅ GET SUPPORT STATISTICS
export const getSupportStats = async (): Promise<SupportStats> => {
    try {
        console.log('📊 Fetching support statistics...');
        
        const db = await getDbPool();
        
        const query = `
            SELECT 
                COUNT(*) as total_tickets,
                SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open_tickets,
                SUM(CASE WHEN status IN ('resolved', 'closed') THEN 1 ELSE 0 END) as resolved_tickets,
                SUM(CASE WHEN priority = 'urgent' THEN 1 ELSE 0 END) as urgent_tickets
            FROM SupportTickets
        `;
        
        const result = await db.request().query(query);
        const row = result.recordset[0];
        
        // Get tickets by category
        const categoryQuery = `
            SELECT 
                category,
                COUNT(*) as count
            FROM SupportTickets
            GROUP BY category
            ORDER BY count DESC
        `;
        
        const categoryResult = await db.request().query(categoryQuery);
        
        // Get tickets by priority
        const priorityQuery = `
            SELECT 
                priority,
                COUNT(*) as count
            FROM SupportTickets
            GROUP BY priority
            ORDER BY 
                CASE priority
                    WHEN 'urgent' THEN 1
                    WHEN 'high' THEN 2
                    WHEN 'medium' THEN 3
                    WHEN 'low' THEN 4
                    ELSE 5
                END
        `;
        
        const priorityResult = await db.request().query(priorityQuery);
        
        // Calculate average response time (in hours)
        const responseTimeQuery = `
            SELECT 
                AVG(DATEDIFF(HOUR, created_at, resolved_at)) as avg_response_hours
            FROM SupportTickets
            WHERE resolved_at IS NOT NULL
        `;
        
        const responseTimeResult = await db.request().query(responseTimeQuery);
        const avgResponseHours = responseTimeResult.recordset[0]?.avg_response_hours || 0;
        
        // Convert tickets by category to object
        const ticketsByCategory: Record<string, number> = {};
        categoryResult.recordset.forEach((row: any) => {
            ticketsByCategory[row.category] = row.count;
        });
        
        // Convert tickets by priority to object
        const ticketsByPriority: Record<string, number> = {};
        priorityResult.recordset.forEach((row: any) => {
            ticketsByPriority[row.priority] = row.count;
        });
        
        const stats: SupportStats = {
            total_tickets: parseInt(row.total_tickets) || 0,
            open_tickets: parseInt(row.open_tickets) || 0,
            resolved_tickets: parseInt(row.resolved_tickets) || 0,
            average_response_time: parseFloat(avgResponseHours) || 0,
            urgent_tickets: parseInt(row.urgent_tickets) || 0,
            tickets_by_category: ticketsByCategory,
            tickets_by_priority: ticketsByPriority
        };
        
        console.log('✅ Support statistics fetched:', stats);
        
        return stats;
    } catch (error: any) {
        console.error('❌ Error in getSupportStats:', error.message);
        
        // Return default stats if table doesn't exist
        if (error.message.includes("Invalid object name 'SupportTickets'")) {
            return {
                total_tickets: 0,
                open_tickets: 0,
                resolved_tickets: 0,
                average_response_time: 0,
                urgent_tickets: 0,
                tickets_by_category: {},
                tickets_by_priority: {}
            };
        }
        
        throw error;
    }
};

// ✅ SEARCH TICKETS
export const searchTickets = async (
    query: string,
    status?: string,
    priority?: string,
    category?: string
): Promise<SupportTicket[]> => {
    try {
        console.log(`🔍 Searching tickets with query: ${query}...`);
        
        const db = await getDbPool();
        
        let sqlQuery = `
            SELECT 
                st.ticket_id,
                st.ticket_reference,
                st.customer_name,
                st.customer_email,
                st.subject,
                st.description,
                st.status,
                st.priority,
                st.category,
                FORMAT(st.created_at, 'yyyy-MM-dd HH:mm:ss') as created_at,
                st.phone,
                st.assigned_to,
                st.customer_id,
                FORMAT(st.updated_at, 'yyyy-MM-dd HH:mm:ss') as updated_at,
                FORMAT(st.resolved_at, 'yyyy-MM-dd HH:mm:ss') as resolved_at
            FROM SupportTickets st
            WHERE 1=1
        `;
        
        const request = db.request();
        
        // Add search conditions
        if (query) {
            sqlQuery += `
                AND (
                    st.ticket_reference LIKE '%' + @searchQuery + '%' 
                    OR st.customer_name LIKE '%' + @searchQuery + '%'
                    OR st.customer_email LIKE '%' + @searchQuery + '%'
                    OR st.subject LIKE '%' + @searchQuery + '%'
                    OR st.description LIKE '%' + @searchQuery + '%'
                )
            `;
            request.input('searchQuery', query);
        }
        
        if (status) {
            sqlQuery += ` AND st.status = @status`;
            request.input('status', status);
        }
        
        if (priority) {
            sqlQuery += ` AND st.priority = @priority`;
            request.input('priority', priority);
        }
        
        if (category) {
            sqlQuery += ` AND st.category = @category`;
            request.input('category', category);
        }
        
        sqlQuery += ` ORDER BY st.created_at DESC`;
        
        const result = await request.query(sqlQuery);
        
        console.log(`✅ Found ${result.recordset.length} tickets matching search criteria`);
        
        return result.recordset.map((row: any) => ({
            ticket_id: row.ticket_id,
            ticket_reference: row.ticket_reference || `TICKET-${String(row.ticket_id).padStart(6, '0')}`,
            customer_name: row.customer_name,
            customer_email: row.customer_email,
            subject: row.subject,
            description: row.description || '',
            status: row.status || 'open',
            priority: row.priority || 'medium',
            category: row.category || 'general',
            created_at: row.created_at || new Date().toISOString(),
            phone: row.phone || undefined,
            assigned_to: row.assigned_to || undefined,
            customer_id: row.customer_id,
            updated_at: row.updated_at,
            resolved_at: row.resolved_at
        }));
    } catch (error: any) {
        console.error('❌ Error in searchTickets:', error.message);
        return [];
    }
};

// ✅ CREATE SUPPORT TICKETS TABLE (Utility function)
export const createSupportTicketsTable = async (): Promise<void> => {
    try {
        console.log('🔄 Creating SupportTickets table...');
        
        const db = await getDbPool();
        
        const createTableQuery = `
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='SupportTickets' AND xtype='U')
            CREATE TABLE SupportTickets (
                ticket_id INT IDENTITY(1,1) PRIMARY KEY,
                ticket_reference VARCHAR(50) NOT NULL,
                customer_id INT NULL,
                customer_name NVARCHAR(255) NOT NULL,
                customer_email NVARCHAR(255) NOT NULL,
                phone NVARCHAR(50) NULL,
                subject NVARCHAR(500) NOT NULL,
                description NVARCHAR(MAX) NULL,
                status NVARCHAR(50) DEFAULT 'open',
                priority NVARCHAR(50) DEFAULT 'medium',
                category NVARCHAR(100) DEFAULT 'general',
                assigned_to NVARCHAR(255) NULL,
                created_at DATETIME DEFAULT GETDATE(),
                updated_at DATETIME NULL,
                resolved_at DATETIME NULL,
                
                FOREIGN KEY (customer_id) REFERENCES Users(user_id) ON DELETE SET NULL
            )
        `;
        
        const createIndexesQuery = `
            CREATE INDEX idx_supporttickets_status ON SupportTickets(status);
            CREATE INDEX idx_supporttickets_priority ON SupportTickets(priority);
            CREATE INDEX idx_supporttickets_category ON SupportTickets(category);
            CREATE INDEX idx_supporttickets_customer_email ON SupportTickets(customer_email);
            CREATE INDEX idx_supporttickets_created_at ON SupportTickets(created_at);
        `;
        
        await db.request().query(createTableQuery);
        
        try {
            await db.request().query(createIndexesQuery);
        } catch (indexError) {
            // Indexes might already exist, that's OK
            console.log('Indexes already exist or cannot be created');
        }
        
        console.log('✅ SupportTickets table created successfully');
        
        // Also create TicketReplies table
        await createTicketRepliesTable();
    } catch (error: any) {
        console.error('❌ Error creating SupportTickets table:', error.message);
        throw error;
    }
};

// ✅ CREATE TICKET REPLIES TABLE (Utility function)
export const createTicketRepliesTable = async (): Promise<void> => {
    try {
        console.log('🔄 Creating TicketReplies table...');
        
        const db = await getDbPool();
        
        const createTableQuery = `
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='TicketReplies' AND xtype='U')
            CREATE TABLE TicketReplies (
                reply_id INT IDENTITY(1,1) PRIMARY KEY,
                ticket_id INT NOT NULL,
                message NVARCHAR(MAX) NOT NULL,
                is_admin BIT DEFAULT 0,
                created_by NVARCHAR(255) NOT NULL,
                created_at DATETIME DEFAULT GETDATE(),
                
                FOREIGN KEY (ticket_id) REFERENCES SupportTickets(ticket_id) ON DELETE CASCADE
            )
        `;
        
        const createIndexesQuery = `
            CREATE INDEX idx_ticketreplies_ticket_id ON TicketReplies(ticket_id);
            CREATE INDEX idx_ticketreplies_created_at ON TicketReplies(created_at);
        `;
        
        await db.request().query(createTableQuery);
        
        try {
            await db.request().query(createIndexesQuery);
        } catch (indexError) {
            // Indexes might already exist, that's OK
            console.log('TicketReplies indexes already exist or cannot be created');
        }
        
        console.log('✅ TicketReplies table created successfully');
    } catch (error: any) {
        console.error('❌ Error creating TicketReplies table:', error.message);
        throw error;
    }
};