import { Router } from 'express';
import { createConversation, sendMessage, getConversations } from './conversation.controllers';

const router = Router();

// Route to create a conversation between two users
router.post('/create', createConversation);

// Route to send a message in a conversation
router.post('/send', sendMessage);

// Route to get all conversations for a user
router.get('/get/:userId', getConversations);

export default router;
