import mongoose, { Schema, Document, Model } from "mongoose";
import { IUser } from "./users.type";

// Extend the Mongoose Document to include the IUser interface
export interface IUserDocument extends Document, IUser { }

const UserSchema: Schema<IUserDocument> = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: function (this: IUserDocument) {
                return !this.oauth;

            }
        },
        firstName: {
            type: String,
            required: true,
        },
        lastName: {
            type: String,
            required: true,
        },
        phone: {
            type: String,
            trim: true,
            validate: {
                validator: (v: string) => /^[0-9]{10,15}$/.test(v),
                message: (props: { value: string }) => `${props.value} is not a valid phone number!`,
            },
        },
        bio: {
            type: String,
            default: null
        },
        profilePicture: {
            type: String,
            default: null,
        },
        role: {
            type: String,
            enum: ["admin", "user"],
            default: "user",
            required: false,
        },
        subrole: {
            type: [String],
            enum: ["seller", "buyer", "agent"],
            default: ["seller", "buyer"],
        },
        properties: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Property",
            },
        ],


        status: {
            type: String,
            enum: ["active", "inactive", "block", "pending", "deleted"],
            default: "pending",
        },
        lastLogin: {
            type: Date,
            default: null,
        },

        oauth: {
            type: Boolean,
            default: false,
        },
        resetPasswordOtp: { type: String },
        resetPasswordOtpExpire: { type: Date },
        tokenVersion: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

// Index for faster search
UserSchema.index({ email: 1, username: 1 }, { unique: true });
UserSchema.index({ role: 1 });
UserSchema.index({ subrole: 1 });

export const User: Model<IUserDocument> = mongoose.model<IUserDocument>("User", UserSchema);
