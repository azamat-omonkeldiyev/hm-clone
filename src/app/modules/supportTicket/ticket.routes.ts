import { Router } from 'express';
import {
    createTicket,
    getAllTickets,
    getTicketById,
    updateTicketStatus,
    replyToTicket,
    deleteTicket,
    assignAgentToTicket,
    getTicketsByStatus
} from './ticket.controllers';
import { verifyToken } from '../../middleware/auth.middleware';


const router = Router();

// Create a new ticket (Authenticated users)
router.post('/', verifyToken, createTicket);

// Get all tickets (Admin)
router.get('/', verifyToken, getAllTickets);

// Get single ticket details (Admin/User)
router.get('/:id', verifyToken, getTicketById);

// Update ticket status (Admin)
router.patch('/:id/status', verifyToken, updateTicketStatus);

// Reply to a ticket (Admin/User)
router.post('/:id/reply', verifyToken, replyToTicket);

// Delete ticket (Admin)
router.delete('/:id', verifyToken, deleteTicket);

router.put('/:id/assign-agent', assignAgentToTicket);
router.get('/filter/by-status', getTicketsByStatus);

export default router;
