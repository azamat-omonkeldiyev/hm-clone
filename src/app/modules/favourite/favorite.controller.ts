import { Request, Response } from 'express';
import { Types } from 'mongoose';
import Favorite from './favorite.model';
import Property from '../property/property.model';
import { User } from '../user/users.model';
import { sendResponse } from '../../../utils/response';

// Add a property to favorites
export const addFavorite = async (req: Request, res: Response) => {
    try {
        const { userId, propertyId } = req.body;

        // Validate ObjectIds
        if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(propertyId)) {
            return sendResponse({
                res,
                statusCode: 400,
                status: 'error',
                message: 'Invalid userId or propertyId.',
            });
        }

        const userObjectId = new Types.ObjectId(userId);
        const propertyObjectId = new Types.ObjectId(propertyId);

        // Check if the user exists
        const userExists = await User.exists({ _id: userObjectId });
        if (!userExists) {
            return sendResponse({
                res,
                statusCode: 404,
                status: 'error',
                message: 'User does not exist.',
            });
        }

        // Check if the property exists
        const propertyExists = await Property.exists({ _id: propertyObjectId });
        if (!propertyExists) {
            return sendResponse({
                res,
                statusCode: 404,
                status: 'error',
                message: 'Property does not exist.',
            });
        }

        // Check if the favorite already exists
        const existingFavorite = await Favorite.findOne({ userId: userObjectId, propertyId: propertyObjectId });
        if (existingFavorite) {
            return sendResponse({
                res,
                statusCode: 400,
                status: 'error',
                message: 'Property is already in favorites.',
            });
        }

        // Add the property to favorites
        const favorite = new Favorite({ userId: userObjectId, propertyId: propertyObjectId });
        await favorite.save();

        sendResponse({
            res,
            statusCode: 201,
            status: 'success',
            message: 'Property added to favorites.',
            data: favorite,
        });
    } catch (error) {
        sendResponse({
            res,
            statusCode: 500,
            status: 'error',
            message: 'Error adding property to favorites.',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};

// Get all favorites for a user

export const getFavorites = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const {
            search,
            propertyType,
            purpose,
            minPrice,
            maxPrice,
            bedrooms,
            bathrooms,
        } = req.query;

        // Validate ObjectId
        if (!Types.ObjectId.isValid(userId)) {
            return sendResponse({
                res,
                statusCode: 400,
                status: 'error',
                message: 'Invalid userId.',
            });
        }

        const userObjectId = new Types.ObjectId(userId);

        // Check if user exists
        const userExists = await User.exists({ _id: userObjectId });
        if (!userExists) {
            return sendResponse({
                res,
                statusCode: 404,
                status: 'error',
                message: 'User does not exist.',
            });
        }

        // Build dynamic filter
        const searchFilter: any = {};

        if (search) {
            searchFilter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { location: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ];
        }

        if (propertyType) searchFilter.propertyType = propertyType;
        if (purpose) searchFilter.purpose = purpose;
        if (bedrooms) searchFilter.totalBedrooms = Number(bedrooms);
        if (bathrooms) searchFilter.totalBathrooms = Number(bathrooms);
        if (minPrice || maxPrice) {
            searchFilter.price = {};
            if (minPrice) searchFilter.price.$gte = Number(minPrice);
            if (maxPrice) searchFilter.price.$lte = Number(maxPrice);
        }

        // Fetch and populate favorites with filters
        const favorites = await Favorite.find({ userId: userObjectId }).populate({
            path: 'propertyId',
            match: searchFilter,
        });

        // Remove unmatched populated results
        const filteredFavorites = favorites.filter((fav) => fav.propertyId !== null);

        return sendResponse({
            res,
            statusCode: 200,
            status: 'success',
            message: 'Favorites fetched successfully.',
            data: filteredFavorites,
        });
    } catch (error) {
        return sendResponse({
            res,
            statusCode: 500,
            status: 'error',
            message: 'Error fetching favorites.',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};


// Remove a property from favorites
export const removeFavorite = async (req: Request, res: Response) => {
    try {
        const { userId, propertyId } = req.body;

        // Validate ObjectIds
        if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(propertyId)) {
            return sendResponse({
                res,
                statusCode: 400,
                status: 'error',
                message: 'Invalid userId or propertyId.',
            });
        }

        const userObjectId = new Types.ObjectId(userId);
        const propertyObjectId = new Types.ObjectId(propertyId);

        // Check if the user exists
        const userExists = await User.exists({ _id: userObjectId });
        if (!userExists) {
            return sendResponse({
                res,
                statusCode: 404,
                status: 'error',
                message: 'User does not exist.',
            });
        }

        // Check if the property exists
        const propertyExists = await Property.exists({ _id: propertyObjectId });
        if (!propertyExists) {
            return sendResponse({
                res,
                statusCode: 404,
                status: 'error',
                message: 'Property does not exist.',
            });
        }

        // Remove the favorite
        const result = await Favorite.findOneAndDelete({ userId: userObjectId, propertyId: propertyObjectId });
        if (!result) {
            return sendResponse({
                res,
                statusCode: 404,
                status: 'error',
                message: 'Favorite not found.',
            });
        }

        sendResponse({
            res,
            statusCode: 200,
            status: 'success',
            message: 'Property removed from favorites.',
        });
    } catch (error) {
        sendResponse({
            res,
            statusCode: 500,
            status: 'error',
            message: 'Error removing property from favorites.',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
