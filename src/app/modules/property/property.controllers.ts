import { Request, Response } from "express";
import mongoose, { Types } from "mongoose";
import { sendResponse } from "../../../utils/response";
import Property from "./property.model";
import { uploadToCloudinary } from "../../../utils/uploadToCloudinary";
import { MulterFiles, UpdatedProperty } from "./property.type";
import { Notification } from "../notification/notification.model";
import { getAllPropertiesService } from "./property.service";
// import esClient from "../../config/elasticsearch/elasticsearch";
// import { propertyToESDoc } from "../../../utils/propertyToESDoc";
// import { PROPERTY_SEARCH_FIELDS } from "./property.constants";


export const createProperty = async (req: Request, res: Response): Promise<void> => {


    try {
        // Ensure files exist
        if (!req.files) {
            return sendResponse({
                res,
                statusCode: 400,
                status: "error",
                message: "Files are missing. Please upload required images.",
            });
        }

        const files = req.files as MulterFiles;

        // Validate and parse location fields
        const location = {
            country: req.body.country,
            city: req.body.city,
            address: req.body.addressDetails,
            latitude: parseFloat(req.body.latitude),
            longitude: parseFloat(req.body.longitude),
        };

        if (!location.country || !location.city || !location.address || isNaN(location.latitude) || isNaN(location.longitude)) {
            return sendResponse({
                res,
                statusCode: 400,
                status: "error",
                message: "Location fields are missing or incomplete.",
            });
        }

        // Upload images to Cloudinary
        const thumbnail = files.thumbnail?.[0]
            ? await uploadToCloudinary(files.thumbnail[0].path, "properties/thumbnails")
            : null;

        const sliderImages = files.sliderImages
            ? await Promise.all(files.sliderImages.map((file) => uploadToCloudinary(file.path, "properties/sliderImages")))
            : [];

        const galleryImages = files.galleryImages
            ? await Promise.all(files.galleryImages.map((file) => uploadToCloudinary(file.path, "properties/galleryImages")))
            : [];

        // Parse other nested fields
        const nearbyLocations = req.body.nearbyLocations ? JSON.parse(req.body.nearbyLocations) : {};
        const amenities = req.body.amenities ? JSON.parse(req.body.amenities) : [];
        const floorPlans = req.body.floorPlans ? JSON.parse(req.body.floorPlans) : [];
        const owner = req.body.userId;
        const reviews = req.body.reviews ? JSON.parse(req.body.reviews) : [];
        const mortgageEstimates = req.body.mortgageEstimates ? JSON.parse(req.body.mortgageEstimates) : [];

        // Construct property data
        const propertyData = {
            title: req.body.title,
            propertyType: req.body.propertyType,
            purpose: req.body.purpose,
            price: parseFloat(req.body.price),
            totalArea: parseFloat(req.body.totalArea),
            totalUnits: parseInt(req.body.totalUnits) || 1,
            totalBedrooms: parseInt(req.body.totalBedroom) || 0,
            totalBathrooms: parseInt(req.body.totalBathroom) || 0,
            totalGarages: parseInt(req.body.totalGarage) || 0,
            totalKitchens: parseInt(req.body.totalKitchen) || 0,
            description: req.body.description,
            location,
            nearbyLocations,
            youtubeVideoId: req.body.youtubeVideoId,
            videoDescription: req.body.videoDescription,
            thumbnail,
            sliderImages,
            galleryImages,
            amenities,
            status: req.body.status || "pending",
            featured: req.body.featured === "true",
            floorPlans,
            virtualTourLink: req.body.virtualTourLink,
            owner,
            reviews,
            financingAvailable: req.body.financingAvailable === "true",
            mortgageEstimates,
        };



        // Save to the database
        const newProperty = new Property(propertyData);
        const savedProperty = await newProperty.save();

        // Respond with success
        sendResponse({
            res,
            statusCode: 201,
            status: "success",
            message: "Property created successfully",
            data: savedProperty,
        });
    } catch (error) {
        console.error("Error creating property:", error);
        sendResponse({
            res,
            statusCode: 500,
            status: "error",
            message: "Failed to create property",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};


// Update a property by ID

export const updateProperty = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const updatedData = req.body;

        // Parse nested fields (if they are strings)
        const fieldsToParse = ["nearbyLocations", "amenities", "reviews"];
        fieldsToParse.forEach((field) => {
            if (updatedData[field] && typeof updatedData[field] === "string") {
                try {
                    updatedData[field] = JSON.parse(updatedData[field]);
                } catch (error) {
                    console.error(`Failed to parse field ${field}:`, error);
                    throw new Error(`Invalid format for field "${field}"`);
                }
            }
        });

        // Construct the location object
        const location = {
            country: updatedData.country,
            city: updatedData.city,
            address: updatedData.addressDetails,
            latitude: parseFloat(updatedData.latitude),
            longitude: parseFloat(updatedData.longitude),
        };

        // Validate the location object
        if (!location.country || !location.city || !location.address || isNaN(location.latitude) || isNaN(location.longitude)) {
            res.status(400).json({ message: "Invalid location data" });
            return
        }

        // Assign location object and remove individual fields
        updatedData.location = location;
        delete updatedData.country;
        delete updatedData.city;
        delete updatedData.latitude;
        delete updatedData.longitude;
        delete updatedData.addressDetails;

        const files = req.files as {
            thumbnail?: Express.Multer.File[];
            sliderImages?: Express.Multer.File[];
            galleryImages?: Express.Multer.File[];
        };

        // Handle thumbnail upload
        if (files?.thumbnail?.[0]) {
            const thumbnailUpload = await uploadToCloudinary(files.thumbnail[0].path, "properties/thumbnails");
            updatedData.thumbnail = thumbnailUpload; // Use uploaded URL
        }

        // Handle slider images upload
        if (files?.sliderImages && files.sliderImages.length > 0) {
            const sliderUploads = await Promise.all(
                files.sliderImages.map((file) => uploadToCloudinary(file.path, "properties/sliderImages"))
            );
            updatedData.sliderImages = sliderUploads; // Use uploaded URLs
        }

        // Handle gallery images upload
        if (files?.galleryImages && files.galleryImages.length > 0) {
            const galleryUploads = await Promise.all(
                files.galleryImages.map((file) => uploadToCloudinary(file.path, "properties/galleryImages"))
            );
            updatedData.galleryImages = galleryUploads; // Use uploaded URLs
        }

        // Update the property in the database
        const updatedProperty = await Property.findByIdAndUpdate(id, updatedData, {
            new: true,
            runValidators: true,
        });

        if (!updatedProperty) {
            res.status(404).json({ message: "Property not found" });
            return
        }

        // Send a success response
        res.status(200).json({
            message: "Property updated successfully",
            data: updatedProperty,
        });
    } catch (error) {
        console.error("Error updating property:", error);
        res.status(500).json({ message: "Failed to update property", error });
    }
};



// Get all properties with search, filter, sort, and optional pagination

export const getAllProperties = async (req: Request, res: Response) => {
    try {
        const fetchAll = req.query.all === "true";
        const page = parseInt(req.query.page as string, 10) || 1;
        const limit = parseInt(req.query.limit as string, 10) || 10;
        const skip = (page - 1) * limit;
        const sortBy = (req.query.sortBy as string) || "createdAt";
        const order = req.query.order === "desc" ? "desc" : "asc";

        // You can pass req.query directly!
        const { hits, total } = await getAllPropertiesService(
            req.query,
            fetchAll.toString(),
            page,
            limit,
            skip,
            sortBy,
            order
        );

        sendResponse({
            res,
            statusCode: 200,
            status: "success",
            message: "Properties fetched successfully",
            data: fetchAll
                ? hits
                : {
                    properties: hits,
                    pagination: {
                        total,
                        page,
                        pages: Math.ceil(total / limit),
                        limit,
                    },
                },
        });
    } catch (error) {
        console.error("Error in getAllProperties:", error);
        sendResponse({
            res,
            statusCode: 500,
            status: "error",
            message: "Failed to fetch properties",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};





// Get a single property by ID
export const getPropertyById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            sendResponse({
                res,
                statusCode: 400,
                status: "error",
                message: "Invalid property ID format",
            });
            return;
        }

        const property = await Property.findById(id).populate('owner', 'firstName lastName email _id');

        if (!property) {
            sendResponse({
                res,
                statusCode: 404,
                status: "error",
                message: "Property not found",
            });
            return;
        }

        sendResponse({
            res,
            statusCode: 200,
            status: "success",
            message: "Property fetched successfully",
            data: property,
        });
    } catch (error) {
        sendResponse({
            res,
            statusCode: 500,
            status: "error",
            message: "Failed to fetch property",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};





// Delete a property by ID
export const deleteProperty = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const deletedProperty = await Property.findByIdAndDelete(id);

        if (!deletedProperty) {
            sendResponse({
                res,
                statusCode: 404,
                status: "error",
                message: "Property not found",
            });
            return;
        }

        sendResponse({
            res,
            statusCode: 200,
            status: "success",
            message: "Property deleted successfully",
        });
    } catch (error) {
        sendResponse({
            res,
            statusCode: 500,
            status: "error",
            message: "Failed to delete property",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

// Get new properties
export const getNewProperties = async (req: Request, res: Response): Promise<void> => {
    try {
        const newProperties = await Property.find().sort({ createdAt: -1 }).limit(10);
        sendResponse({
            res,
            statusCode: 200,
            status: "success",
            message: "New properties fetched successfully",
            data: newProperties,
        });
    } catch (error) {
        sendResponse({
            res,
            statusCode: 500,
            status: "error",
            message: "Failed to fetch new properties",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

// Get featured properties
export const getFeaturedProperties = async (req: Request, res: Response): Promise<void> => {
    try {
        const featuredProperties = await Property.find({ featured: true }).limit(10);
        sendResponse({
            res,
            statusCode: 200,
            status: "success",
            message: "Featured properties fetched successfully",
            data: featuredProperties,
        });
    } catch (error) {
        sendResponse({
            res,
            statusCode: 500,
            status: "error",
            message: "Failed to fetch featured properties",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

// Get paginated properties
export const getPaginatedProperties = async (req: Request, res: Response): Promise<void> => {
    try {
        const page = parseInt(req.query.page as string, 10) || 1;
        const limit = parseInt(req.query.limit as string, 10) || 10;
        const skip = (page - 1) * limit;

        const sortBy = (req.query.sortBy as string) || "createdAt"; // Default sorting field
        const order = req.query.order === "desc" ? -1 : 1; // Default order is ascending

        // Filters
        const priceMin = parseInt(req.query.priceMin as string, 10) || 0;
        const priceMax = parseInt(req.query.priceMax as string, 10) || Infinity;
        const bedrooms = parseInt(req.query.bedrooms as string, 10);
        const bathrooms = parseInt(req.query.bathrooms as string, 10);
        const propertyType = req.query.propertyType as string;
        const searchQuery = req.query.searchQuery as string;

        // Constructing the filter query
        const filter: any = {
            price: { $gte: priceMin, $lte: priceMax },
        };

        if (bedrooms) filter.totalBedrooms = bedrooms;
        if (bathrooms) filter.totalBathrooms = bathrooms;
        if (propertyType) filter.propertyType = propertyType;
        if (searchQuery) {
            filter.$or = [
                { title: { $regex: searchQuery, $options: "i" } },
                { "location.city": { $regex: searchQuery, $options: "i" } },
                { "location.country": { $regex: searchQuery, $options: "i" } },
            ];
        }

        // Fetching filtered and sorted properties
        const properties = await Property.find(filter)
            .sort({ [sortBy]: order })
            .skip(skip)
            .limit(limit);

        const total = await Property.countDocuments(filter);

        sendResponse({
            res,
            statusCode: 200,
            status: "success",
            message: "Paginated properties fetched successfully",
            data: {
                properties,
                pagination: {
                    total,
                    page,
                    pages: Math.ceil(total / limit),
                    limit,
                },
            },
        });
    } catch (error) {
        sendResponse({
            res,
            statusCode: 500,
            status: "error",
            message: "Failed to fetch paginated properties",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

// search property

export const searchProperties = async (req: Request, res: Response): Promise<void> => {
    try {
        const { type, query, minPrice, maxPrice, bedrooms, bathrooms, propertyType } = req.query;

        const filter: any = {};

        // Purpose (sale/rent)
        if (type) {
            filter.purpose = type === "buy" ? "sale" : type;
        }

        // Full-text or partial search in title, description, or location
        if (query) {
            const regex = new RegExp(query as string, "i");
            filter.$or = [
                { title: regex },
                { description: regex },
                { "location.address": regex },
                { "location.city": regex },
                { "location.country": regex },
            ];
        }

        // Price range
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = parseFloat(minPrice as string);
            if (maxPrice) filter.price.$lte = parseFloat(maxPrice as string);
        }

        // Bedrooms filter
        if (bedrooms) {
            filter.totalBedrooms = { $gte: parseInt(bedrooms as string) };
        }

        // Bathrooms filter
        if (bathrooms) {
            filter.totalBathrooms = { $gte: parseInt(bathrooms as string) };
        }

        // Property type
        if (propertyType) {
            filter.propertyType = propertyType;
        }

        const properties = await Property.find(filter)
            .sort({ createdAt: -1 }) // Newest first
            .limit(50)
            .lean();

        if (!properties.length) {
            return sendResponse({
                res,
                statusCode: 200,
                status: "success",
                message: "No properties found matching your search.",
                data: [],
            });
        }

        sendResponse({
            res,
            statusCode: 200,
            status: "success",
            message: "Properties fetched successfully",
            data: properties,
        });
    } catch (error) {
        console.error("❌ Error fetching properties (Mongo):", error);
        sendResponse({
            res,
            statusCode: 500,
            status: "error",
            message: "Failed to fetch properties",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};




//similar properties

export const getSimilarProperties = async (req: Request, res: Response): Promise<void> => {
    try {
        const { propertyId } = req.params;

        // Ensure propertyId is a valid MongoDB ObjectId
        if (!Types.ObjectId.isValid(propertyId)) {
            return sendResponse({
                res,
                statusCode: 400,
                status: "error",
                message: "Invalid property ID",
            });
        }

        // Fetch the current property details
        const currentProperty = await Property.findById(propertyId);
        if (!currentProperty) {
            return sendResponse({
                res,
                statusCode: 404,
                status: "error",
                message: "Property not found",
            });
        }

        let similarProperties = [];
        let attempt = 0;

        // Define the base search criteria
        let priceMin = Number(currentProperty.price) * 0.9; // 10% below price
        let priceMax = Number(currentProperty.price) * 1.1; // 10% above price
        const bedroomMin = Math.max(1, currentProperty.totalBedrooms - 1);
        const bedroomMax = currentProperty.totalBedrooms + 1;
        const bathroomMin = Math.max(1, currentProperty.totalBathrooms - 1);
        const bathroomMax = currentProperty.totalBathrooms + 1;

        while (similarProperties.length < 3 && attempt < 3) {
            const query: Record<string, any> = {
                _id: { $ne: propertyId },
                price: { $gte: priceMin, $lte: priceMax },
                "location.country": currentProperty.location.country,
                "location.city": currentProperty.location.city,
                totalBedrooms: { $gte: bedroomMin, $lte: bedroomMax },
                totalBathrooms: { $gte: bathroomMin, $lte: bathroomMax },
                propertyType: currentProperty.propertyType, // Match property type
                purpose: currentProperty.purpose, // Match sale/rent
            };

            // Adjust search criteria in case of low results
            if (attempt === 1) {
                // Expand price range (±20%) in second attempt
                priceMin = Number(currentProperty.price) * 0.8;
                priceMax = Number(currentProperty.price) * 1.2;
            } else if (attempt === 2) {
                // Remove bedroom and bathroom constraints in final attempt
                delete query.totalBedrooms;
                delete query.totalBathrooms;
            }

            // Fetch similar properties
            similarProperties = await Property.find(query)
                .sort({ price: 1 }) // Sort by price (ascending)
                .limit(5) // Get up to 5 properties
                .lean(); // Improve performance by returning plain objects

            attempt++;
        }

        // If no similar properties found, fetch 3 random properties
        if (similarProperties.length < 3) {
            const randomProperties = await Property.aggregate([
                { $match: { _id: { $ne: new Types.ObjectId(propertyId) } } }, // Exclude current property
                { $sample: { size: 3 } }, // Get 3 random properties
            ]);

            similarProperties = randomProperties;
        }

        // Response
        return sendResponse({
            res,
            statusCode: 200,
            status: "success",
            message: "Similar properties retrieved successfully",
            data: similarProperties,
        });
    } catch (error) {
        console.error("Error fetching similar properties:", error);
        return sendResponse({
            res,
            statusCode: 500,
            status: "error",
            message: "Internal server error",
        });
    }
};

/**
 * Public controller: anyone can filter properties (no login required)
 */

export const findFavoriteProperties = async (req: Request, res: Response): Promise<void> => {
    try {
        const { propertyType, priceMax, city, sort } = req.query;

        const filter: any = {
            status: "approved", // Only show approved listings
        };

        if (propertyType) {
            filter.propertyType = propertyType;
        }

        if (priceMax) {
            const max = parseFloat(priceMax as string);
            if (!isNaN(max)) {
                filter.price = { $lte: max };
            }
        }

        if (city) {
            filter["location.city"] = { $regex: new RegExp(city as string, "i") };
        }

        // Handle sorting
        let sortObj: any = { createdAt: -1 }; // Default: newest first

        if (sort && typeof sort === "string") {
            const [field, direction] = sort.split(":");
            if (field && direction && ["asc", "desc"].includes(direction)) {
                sortObj = { [field]: direction === "asc" ? 1 : -1 };
            }
        }

        const properties = await Property.find(filter)
            .select("title propertyType price location thumbnail totalBedrooms totalBathrooms featured createdAt reviews")
            .populate("owner", "firstName lastName email _id")
            .sort(sortObj)
            .lean();

        const data = properties.map((prop: any) => {
            const avgRating = prop.reviews?.length
                ? Math.round(
                    (prop.reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) /
                        prop.reviews.length) * 10
                ) / 10
                : 0;

            return { ...prop, avgRating };
        });

        sendResponse({
            res,
            statusCode: 200,
            status: "success",
            message: "Properties matched your filters",
            data,
        });
    } catch (error) {
        console.error("Error filtering properties:", error);
        sendResponse({
            res,
            statusCode: 500,
            status: "error",
            message: "Failed to find favorite properties",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

// Get properties by seller ID with optional filters

export const getPropertiesBySeller = async (req: Request, res: Response): Promise<void> => {
    try {
        const { sellerId } = req.params;
        const {
            status,
            search,
            minPrice,
            maxPrice,
            minBedrooms,
            maxBedrooms,
            propertyType,
            purpose,
        } = req.query;

        if (!sellerId) {
            return sendResponse({
                res,
                statusCode: 400,
                status: "error",
                message: "Seller ID is required",
            });
        }

        const query: any = { owner: sellerId };

        // Status filter
        if (status && typeof status === 'string') {
            const allowedStatuses = ['active', 'inactive', 'pending', 'sold'];
            if (!allowedStatuses.includes(status.toLowerCase())) {
                return sendResponse({
                    res,
                    statusCode: 400,
                    status: "error",
                    message: `Invalid status filter. Allowed values are: ${allowedStatuses.join(", ")}`,
                });
            }
            query.status = status.toLowerCase();
        }

        // Search filter (case-insensitive partial match on title, description, city or address)
        if (search && typeof search === 'string') {
            const regex = new RegExp(search, "i");
            query.$or = [
                { title: regex },
                { description: regex },
                { "location.city": regex },
                { "location.address": regex },
            ];
        }

        // Price range filter
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }

        // Bedrooms filter
        if (minBedrooms || maxBedrooms) {
            query.totalBedrooms = {};
            if (minBedrooms) query.totalBedrooms.$gte = Number(minBedrooms);
            if (maxBedrooms) query.totalBedrooms.$lte = Number(maxBedrooms);
        }

        // Property type filter
        if (propertyType && typeof propertyType === "string") {
            query.propertyType = propertyType;
        }

        // Purpose filter (sale/rent)
        if (purpose && typeof purpose === "string") {
            const allowedPurposes = ['sale', 'rent'];
            if (!allowedPurposes.includes(purpose.toLowerCase())) {
                return sendResponse({
                    res,
                    statusCode: 400,
                    status: "error",
                    message: `Invalid purpose filter. Allowed values are: ${allowedPurposes.join(", ")}`,
                });
            }
            query.purpose = purpose.toLowerCase();
        }

        const properties = await Property.find(query);

        sendResponse({
            res,
            statusCode: 200,
            status: "success",
            message: "Properties fetched successfully",
            data: properties,
        });
    } catch (error) {
        console.error("Error fetching seller's properties:", error);
        sendResponse({
            res,
            statusCode: 500,
            status: "error",
            message: "Failed to fetch properties",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

// Get seller dashboard stats
export const getSellerStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const { sellerId } = req.params;

        if (!sellerId) {
            return sendResponse({
                res,
                statusCode: 400,
                status: "error",
                message: "Seller ID is required",
            });
        }

        const totalProperties = await Property.countDocuments({ owner: sellerId });
        const activeProperties = await Property.countDocuments({ owner: sellerId, status: "approved" });
        const pendingApprovals = await Property.countDocuments({ owner: sellerId, status: "pending" });

        // Simulate total earnings (if you have a sales collection, use that)
        const totalEarnings = totalProperties * 1000; // Example calculation

        sendResponse({
            res,
            statusCode: 200,
            status: "success",
            message: "Seller stats fetched successfully",
            data: {
                totalProperties,
                activeProperties,
                pendingApprovals,
                totalEarnings,
            },
        });
    } catch (error) {
        console.error("Error fetching seller stats:", error);
        sendResponse({
            res,
            statusCode: 500,
            status: "error",
            message: "Failed to fetch seller stats",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

// Update property status by seller
export const updatePropertyStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { sellerId, propertyId } = req.params;
        const { status } = req.body;

        if (!["active", "inactive", "pending", "sold"].includes(status)) {
            return sendResponse({
                res,
                statusCode: 400,
                status: "error",
                message: "Invalid status value",
            });
        }

        const updatedProperty = await Property.findOneAndUpdate(
            { _id: propertyId, owner: sellerId },
            { status },
            { new: true }
        );

        if (!updatedProperty) {
            return sendResponse({
                res,
                statusCode: 404,
                status: "error",
                message: "Property not found or you don't have permission to update",
            });
        }

        sendResponse({
            res,
            statusCode: 200,
            status: "success",
            message: "Property status updated successfully",
            data: updatedProperty,
        });
    } catch (error) {
        console.error("Error updating property status:", error);
        sendResponse({
            res,
            statusCode: 500,
            status: "error",
            message: "Failed to update property status",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

// Delete property by seller
export const deletePropertyBySeller = async (req: Request, res: Response): Promise<void> => {
    try {
        const { sellerId, propertyId } = req.params;

        const deletedProperty = await Property.findOneAndDelete({ _id: propertyId, owner: sellerId });

        if (!deletedProperty) {
            return sendResponse({
                res,
                statusCode: 404,
                status: "error",
                message: "Property not found or you don't have permission to delete",
            });
        }

        sendResponse({
            res,
            statusCode: 200,
            status: "success",
            message: "Property deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting property:", error);
        sendResponse({
            res,
            statusCode: 500,
            status: "error",
            message: "Failed to delete property",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

// Get seller earnings
export const getSellerEarnings = async (req: Request, res: Response): Promise<void> => {
    try {
        const { sellerId } = req.params;

        if (!sellerId) {
            return sendResponse({
                res,
                statusCode: 400,
                status: "error",
                message: "Seller ID is required",
            });
        }

        // Simulating earnings calculation (if you have a sales/orders collection, use that)
        const propertiesSold = await Property.find({ owner: sellerId, status: "sold" });
        const totalEarnings = propertiesSold.reduce((sum, prop) => sum + prop.price, 0);

        sendResponse({
            res,
            statusCode: 200,
            status: "success",
            message: "Seller earnings fetched successfully",
            data: {
                totalEarnings,
                propertiesSold: propertiesSold.length,
            },
        });
    } catch (error) {
        console.error("Error fetching seller earnings:", error);
        sendResponse({
            res,
            statusCode: 500,
            status: "error",
            message: "Failed to fetch seller earnings",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};


// mobile app APIs
export const getTotalRevenueBySellers = async (req: Request, res: Response): Promise<void> => {
    try {
        // Aggregation to calculate total revenue by sellers
        const revenueData = await Property.aggregate([
            { $match: { status: "sold" } },
            {
                $group: {
                    _id: "$owner",
                    totalRevenue: { $sum: "$price" },
                    totalPropertiesSold: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: "users",          // Ensure your user collection name is correct (usually 'users')
                    localField: "_id",
                    foreignField: "_id",
                    as: "sellerInfo"
                }
            },
            { $unwind: "$sellerInfo" },
            {
                $project: {
                    _id: 0,
                    sellerId: "$sellerInfo._id",
                    username: "$sellerInfo.username",
                    firstName: "$sellerInfo.firstName",
                    lastName: "$sellerInfo.lastName",
                    email: "$sellerInfo.email",
                    totalRevenue: 1,
                    totalPropertiesSold: 1
                }
            },
            { $sort: { totalRevenue: -1 } }  // Sorting sellers by revenue (descending)
        ]);

        sendResponse({
            res,
            statusCode: 200,
            status: "success",
            message: "Total revenue by sellers fetched successfully.",
            data: revenueData,
        });

    } catch (error) {
        console.error("Error fetching total revenue by sellers:", error);
        sendResponse({
            res,
            statusCode: 500,
            status: "error",
            message: "Failed to fetch total revenue by sellers.",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

export const getTotalPropertiesCount = async (req: Request, res: Response): Promise<void> => {
    try {
        const totalProperties = await Property.countDocuments();

        sendResponse({
            res,
            statusCode: 200,
            status: "success",
            message: "Total properties count fetched successfully",
            data: { totalProperties },
        });
    } catch (error) {
        console.error("Error fetching total properties count:", error);
        sendResponse({
            res,
            statusCode: 500,
            status: "error",
            message: "Failed to fetch total properties count",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

// user app
export const getTopProperties = async (req: Request, res: Response): Promise<void> => {
    try {
        const limit = parseInt(req.query.limit as string, 10) || 10;
        const sortBy = (req.query.sortBy as string) || "featured"; // can be "featured", "price", "createdAt", "rating"

        // Only show active properties
        const filter: any = { status: "approved" };

        // Determine sort order
        let sort: any = {};
        if (sortBy === "price") sort = { price: -1 };
        else if (sortBy === "createdAt") sort = { createdAt: -1 };
        else if (sortBy === "rating") {
            // We can use aggregation for average rating (see below for advanced)
            // For simple, sort by the highest single review rating:
            sort = { "reviews.rating": -1 };
        }
        else sort = { featured: -1, createdAt: -1 }; // default: featured first, then newest

        // Fetch properties
        const properties = await Property.find(filter)
            .sort(sort)
            .limit(limit)
            .select("title propertyType price location thumbnail sliderImages totalBedrooms totalBathrooms featured createdAt reviews") // summary fields
            .populate("owner", "firstName lastName email _id")
            .lean();

        // If you want average rating included, calculate here:
        const data = properties.map((prop: any) => {
            let avgRating = 0;
            if (prop.reviews && prop.reviews.length > 0) {
                avgRating = prop.reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / prop.reviews.length;
            }
            return { ...prop, avgRating: Math.round(avgRating * 10) / 10 };
        });

        sendResponse({
            res,
            statusCode: 200,
            status: "success",
            message: "Top properties fetched successfully",
            data,
        });
    } catch (error) {
        console.error("Error fetching top properties:", error);
        sendResponse({
            res,
            statusCode: 500,
            status: "error",
            message: "Failed to fetch top properties",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

export const getRecommendedProperties = async (req: Request, res: Response): Promise<void> => {
    try {
        // Only show featured and active properties, sorted by newest
        const recommendedProperties = await Property.find({
            status: "approved",
            featured: true,
        })
            .sort({ createdAt: -1 }) // newest first
            .limit(10)
            .select("title propertyType price location thumbnail sliderImages totalBedrooms totalBathrooms featured createdAt")
            .populate("owner", "firstName lastName email _id");

        sendResponse({
            res,
            statusCode: 200,
            status: "success",
            message: "Recommended properties fetched successfully",
            data: recommendedProperties,
        });
    } catch (error) {
        console.error("Error fetching recommended properties:", error);
        sendResponse({
            res,
            statusCode: 500,
            status: "error",
            message: "Failed to fetch recommended properties",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};


// mobile app controllers

export const getAppPropertiesForAdmin = async (req: Request, res: Response): Promise<void> => {
    try {
        const { search, status } = req.query;

        const filter: any = {};

        // Optional: Search by title or seller name
        if (search && typeof search === 'string') {
            const searchRegex = new RegExp(search, 'i');
            filter.$or = [
                { title: { $regex: searchRegex } },
                { "owner.firstName": { $regex: searchRegex } }, // optional if populated
                { "owner.lastName": { $regex: searchRegex } }
            ];
        }

        // Optional: Filter by status (active, pending, approved, etc.)
        if (status && typeof status === 'string' && status !== 'all') {
            filter.status = status;
        }

        const properties = await Property.find(filter)
            .populate('owner', 'firstName lastName email')
            .sort({ createdAt: -1 });

        sendResponse({
            res,
            statusCode: 200,
            status: "success",
            message: "Properties fetched successfully",
            data: properties,
        });

    } catch (error) {
        console.error("Error fetching properties:", error);
        sendResponse({
            res,
            statusCode: 500,
            status: "error",
            message: "Failed to fetch properties",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};




export const editPropertyByAdmin = async (req: Request, res: Response): Promise<void> => {
    try {
        const { propertyId } = req.params;
        const updates = req.body;

        const allowedFields = [
            "title", "price", "description", "status", "featured",
            "propertyType", "purpose", "virtualTourLink", "amenities",
            "location", "youtubeVideoId", "videoDescription"
        ];

        const updatePayload: Record<string, any> = {};

        allowedFields.forEach((field) => {
            if (updates[field] !== undefined) {
                updatePayload[field] = updates[field];
            }
        });

        const updatedProperty = await Property.findByIdAndUpdate(
            propertyId,
            updatePayload,
            { new: true, runValidators: true }
        ).populate("owner", "firstName lastName email");

        if (!updatedProperty) {
            return sendResponse({
                res,
                statusCode: 404,
                status: "error",
                message: "Property not found",
            });
        }

        sendResponse({
            res,
            statusCode: 200,
            status: "success",
            message: "Property updated successfully",
            data: updatedProperty,
        });

    } catch (error) {
        console.error("Error editing property by admin:", error);
        sendResponse({
            res,
            statusCode: 500,
            status: "error",
            message: "Failed to update property",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};


export const searchAndFilterPropertiesPOST = async (req: Request, res: Response): Promise<void> => {
    const {
        search,
        status,
        minPrice,
        maxPrice,
        propertyType,
        city,
        country,
        page = 1,
        limit = 10
    } = req.body;

    try {
        const filter: any = {};

        if (search) {
            const regex = new RegExp(search, 'i');
            filter.$or = [
                { title: { $regex: regex } },
                { "owner.firstName": { $regex: regex } },
                { "owner.lastName": { $regex: regex } }
            ];
        }

        if (status && status !== 'all') filter.status = status;
        if (minPrice) filter.price = { ...filter.price, $gte: Number(minPrice) };
        if (maxPrice) filter.price = { ...filter.price, $lte: Number(maxPrice) };
        if (propertyType) filter.propertyType = propertyType;
        if (city) filter["location.city"] = { $regex: new RegExp(city, 'i') };
        if (country) filter["location.country"] = { $regex: new RegExp(country, 'i') };

        const skip = (Number(page) - 1) * Number(limit);
        const total = await Property.countDocuments(filter);

        const properties = await Property.find(filter)
            .populate('owner', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        sendResponse({
            res,
            statusCode: 200,
            status: "success",
            message: "Filtered properties (POST)",
            data: {
                total,
                page: Number(page),
                pages: Math.ceil(total / Number(limit)),
                properties
            }
        });
    } catch (error) {
        sendResponse({
            res,
            statusCode: 500,
            status: "error",
            message: "POST filter failed",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};


export const approveProperty = async (req: Request, res: Response): Promise<void> => {
    try {
        const { propertyId } = req.params;

        // Approve property
        const updatedProperty = await Property.findByIdAndUpdate(
            propertyId,
            { status: "approved" },
            { new: true, runValidators: true }
        )
            .populate("owner", "firstName lastName email")
            .lean<UpdatedProperty>();

        if (!updatedProperty) {
            return sendResponse({
                res,
                statusCode: 404,
                status: "error",
                message: "Property not found",
            });
        }

        // Create notification for the owner (seller/agent)
        const notification = new Notification({
            title: "Property Approved",
            message: `Your property "${updatedProperty.title}" has been approved and is now live.`,
            userId: updatedProperty.owner._id,
            audience: "seller",
            category: "propertyApproval",
            sent: true,
            sentAt: new Date(),
        });

        await notification.save();

        sendResponse({
            res,
            statusCode: 200,
            status: "success",
            message: "Property approved and notification sent",
            data: updatedProperty,
        });
    } catch (error) {
        console.error("Error approving property:", error);
        sendResponse({
            res,
            statusCode: 500,
            status: "error",
            message: "Failed to approve property",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

// sync property to Elasticsearch after approval

// export const syncAllPropertiesToElastic = async (req: Request, res: Response): Promise<void> => {
//     try {
//         // Fetch all properties from MongoDB
//         const allProperties = await Property.find();
//         let success = 0, fail = 0;

//         // Index each property into ElasticSearch
//         for (const prop of allProperties) {
//             try {

//                 await esClient.index({
//                     index: "properties",
//                     id: (prop._id as mongoose.Types.ObjectId).toString(),
//                     document: propertyToESDoc(prop),
//                 });
//                 success++;
//             } catch (error) {
//                 fail++;
//                 console.error("Elastic sync error for property:", prop._id, error);
//             }
//         }

//         res.json({
//             message: "Property sync to ElasticSearch completed.",
//             successCount: success,
//             failedCount: fail,
//             total: allProperties.length
//         });
//     } catch (error) {
//         console.error("Sync controller error:", error);
//         res.status(500).json({
//             message: "Failed to sync properties to ElasticSearch.",
//             error: error instanceof Error ? error.message : "Unknown error"
//         });
//     }
// };
















