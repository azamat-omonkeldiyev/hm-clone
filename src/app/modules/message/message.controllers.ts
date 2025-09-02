import { Request, Response } from 'express';
import Message from './message.model';
import { sendResponse } from '../../../utils/response';

export const sendMessage = async (req: Request, res: Response): Promise<void> => {
    try {
        const { senderId, receiverId, subject, content, type, parentMessageId } = req.body;

        // Prevent sending a message to the same user
        if (senderId === receiverId) {
            return sendResponse({
                res,
                statusCode: 400,
                status: 'error',
                message: 'Sender and receiver cannot be the same.',
            });
        }

        // Create a new message object
        const newMessageData = {
            sender: senderId,
            receiver: receiverId,
            subject,
            content,
            type,
            parentMessageId,
        };

        // Create a new message
        const newMessage = new Message(newMessageData);

        // Save the message to the database
        const savedMessage = await newMessage.save();

        // Send a successful response
        sendResponse({
            res,
            statusCode: 201,
            status: 'success',
            message: 'Message sent successfully',
            data: savedMessage,
        });
    } catch (error) {
        console.error("Error sending message:", error);
        sendResponse({
            res,
            statusCode: 500,
            status: 'error',
            message: 'Failed to send message',
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};

// Get all messages for a user (sender or receiver)
export const getMessages = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId } = req.params;
        // Fetch all messages where the user is either the sender or receiver
        const messages = await Message.find({
            $or: [{ sender: userId }, { receiver: userId }],
        }).populate('sender receiver', 'firstName lastName email');

        // Send success response with fetched messages
        sendResponse({
            res,
            statusCode: 200,
            status: 'success',
            message: 'Messages fetched successfully',
            data: messages,
        });
    } catch (error) {
        console.error("Error fetching messages:", error);
        sendResponse({
            res,
            statusCode: 500,
            status: 'error',
            message: 'Failed to fetch messages',
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};

// Mark a message as read
export const markAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
        const { messageId } = req.params;

        // Find the message by ID and update its 'read' status
        const updatedMessage = await Message.findByIdAndUpdate(
            messageId,
            { read: true },
            { new: true }
        );

        if (!updatedMessage) {
            return sendResponse({
                res,
                statusCode: 404,
                status: 'error',
                message: 'Message not found',
            });
        }

        // Send success response
        sendResponse({
            res,
            statusCode: 200,
            status: 'success',
            message: 'Message marked as read',
            data: updatedMessage,
        });
    } catch (error) {
        console.error("Error marking message as read:", error);
        sendResponse({
            res,
            statusCode: 500,
            status: 'error',
            message: 'Failed to mark message as read',
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};

// Get unread messages for a user
export const getUnreadMessages = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId } = req.params;

        // Fetch all unread messages for the user
        const unreadMessages = await Message.find({
            $or: [{ sender: userId }, { receiver: userId }],
            read: false,
        }).populate('sender receiver', 'name email');

        // Send success response
        sendResponse({
            res,
            statusCode: 200,
            status: 'success',
            message: 'Unread messages fetched successfully',
            data: unreadMessages,
        });
    } catch (error) {
        console.error("Error fetching unread messages:", error);
        sendResponse({
            res,
            statusCode: 500,
            status: 'error',
            message: 'Failed to fetch unread messages',
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};
