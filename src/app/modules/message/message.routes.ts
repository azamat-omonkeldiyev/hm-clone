import express from 'express';
import { sendMessage, getMessages, markAsRead, getUnreadMessages } from './message.controllers';

const router = express.Router();

// Route to send a message
router.post('/send', sendMessage);

// Route to get all messages for a user (sender or receiver)
router.get('/:userId', getMessages);

// Route to mark a message as read
router.put('/mark-as-read/:messageId', markAsRead);

// Route to get unread messages for a user
router.get('/unread/:userId', getUnreadMessages)

export default router
