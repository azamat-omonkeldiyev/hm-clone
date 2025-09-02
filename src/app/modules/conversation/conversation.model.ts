import mongoose, { Schema } from 'mongoose';
import { IConversation } from './conversation.types';



const conversationSchema = new Schema<IConversation>(
    {
        participants: [
            { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        ],
        messages: [
            { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
        ],
        lastMessage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Message',
        },
        isGroup: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

conversationSchema.virtual('latestMessage', {
    ref: 'Message',
    localField: 'lastMessage',
    foreignField: '_id',
    justOne: true,
});

const Conversation = mongoose.model<IConversation>('Conversation', conversationSchema);

export default Conversation;
