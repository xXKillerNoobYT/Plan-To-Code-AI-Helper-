/**
 * 🎫 Ticket Type Definitions
 * 
 * Defines the structure for tickets used in the AI Use system
 * for human-AI communication and agent coordination.
 */

/**
 * Reply in a ticket conversation thread
 */
export interface TicketReply {
    reply_id: string;           // Unique reply ID (e.g., "RPL-0001")
    author: string;             // "user" or agent name (e.g., "Answer Team")
    content: string;            // Reply message (max 2000 chars)
    clarity_score?: number;     // Optional: Clarity Agent score (0-100)
    created_at: Date;           // Timestamp when reply was created
}

/**
 * Ticket for human-AI communication
 * 
 * Tickets enable bidirectional communication between users and AI agents.
 * Each ticket has a conversation thread with replies, status tracking,
 * and priority assignment.
 */
export interface Ticket {
    ticket_id: string;                              // Unique ID (e.g., "TK-0789")
    type: 'ai_to_human' | 'human_to_ai';           // Communication direction
    status: 'open' | 'in_review' | 'resolved' | 'escalated' | 'rejected'; // Current status
    priority: 1 | 2 | 3;                           // 1=P1 (critical), 2=P2 (high), 3=P3 (medium)
    creator: string;                                // Agent name or "user"
    assignee: string;                               // Team/agent assigned to handle
    task_id?: string;                               // Optional: Linked task ID
    title: string;                                  // Short title (max 200 chars)
    description: string;                            // Initial question/context (max 800 chars)
    thread: TicketReply[];                          // Conversation history
    resolution?: string;                            // Final answer/resolution (when resolved)
    created_at: Date;                               // Creation timestamp
    updated_at: Date;                               // Last update timestamp
}

/**
 * Ticket creation parameters (subset of Ticket for new tickets)
 */
export interface CreateTicketParams {
    type: 'ai_to_human' | 'human_to_ai';
    priority: 1 | 2 | 3;
    creator: string;
    assignee: string;
    task_id?: string;
    title: string;
    description: string;
}

/**
 * Ticket update parameters (for status updates)
 */
export interface UpdateTicketParams {
    ticket_id: string;
    status?: 'open' | 'in_review' | 'resolved' | 'escalated' | 'rejected';
    assignee?: string;
    resolution?: string;
}

/**
 * Reply creation parameters
 */
export interface AddReplyParams {
    ticket_id: string;
    author: string;
    content: string;
    clarity_score?: number;
}
