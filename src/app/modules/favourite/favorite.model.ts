import { Schema, model, Document, Types } from 'mongoose';

interface IFavorite extends Document {
    userId: Types.ObjectId;
    propertyId: Types.ObjectId;
}

const favoriteSchema = new Schema<IFavorite>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        propertyId: {
            type: Schema.Types.ObjectId,
            ref: 'Property',
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// Prevent duplicate favorites
favoriteSchema.index({ userId: 1, propertyId: 1 }, { unique: true });

const Favorite = model<IFavorite>('Favorite', favoriteSchema);

export default Favorite;
export type { IFavorite };
