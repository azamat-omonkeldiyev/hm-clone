import { Request, Response } from "express";
import Conversation from "./conversation.model";
import Message from "../message/message.model";

// ✅ Create or fetch an existing conversation between two users
export const createConversation = async (req: Request, res: Response) => {
    const { user1Id, user2Id } = req.body;

    try {
        // Check if conversation already exists between these users
        let conversation = await Conversation.findOne({
            participants: { $all: [user1Id, user2Id] },
        });

        if (!conversation) {
            // If no conversation exists, create a new one
            conversation = new Conversation({
                participants: [user1Id, user2Id],
            });
            await conversation.save();
        }

        res.status(201).json(conversation);
    } catch (err) {
        console.error("❌ Error creating conversation:", err);
        res.status(500).json({ message: "Error creating conversation" });
    }
};

// ✅ Send a message in a conversation (WITHOUT SOCKET.IO)
export const sendMessage = async (req: Request, res: Response) => {
    const { sender, receiver, content, conversationId } = req.body;

    try {
        // Create a new message
        const message = new Message({
            sender,
            receiver,
            content,
        });

        const savedMessage = await message.save();

        // Find the conversation and check if it exists
        const conversation = await Conversation.findById(conversationId);

        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }

        // Push the new message to the conversation's messages array
        conversation.messages.push(savedMessage._id);
        conversation.lastMessage = savedMessage._id;

        // Save the updated conversation
        await conversation.save();

        // Respond with the saved message (🔥 NO SOCKET.IO)
        res.status(201).json(savedMessage);
    } catch (err) {
        console.error("❌ Error sending message:", err);
        res.status(500).json({ message: "Error sending message" });
    }
};

// ✅ Get all conversations for a user
export const getConversations = async (req: Request, res: Response) => {
    const { userId } = req.params;

    try {
        const conversations = await Conversation.find({
            participants: userId,
        })
            .populate("participants", "firstName lastName email")
            .populate("messages")
            .populate("lastMessage");

        res.status(200).json(conversations);
    } catch (err) {
        console.error("❌ Error fetching conversations:", err);
        res.status(500).json({ message: "Error fetching conversations" });
    }
};
