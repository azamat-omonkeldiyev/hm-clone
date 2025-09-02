import { Document } from "mongoose";

export interface IProperty extends Document {
    title: string;
    propertyType: string;
    purpose: "sale" | "rent";
    price: number;
    totalArea: number;
    totalUnits: number;
    totalBedrooms: number;
    totalBathrooms: number;
    totalGarages: number;
    totalKitchens: number;
    description: string;
    location: {
        country: string;
        city: string;
        address: string;
        postalCode?: string;
        longitude?: number;
        latitude?: number;
    };
    nearbyLocations: {
        locationInMap?: string; // Optional
        schools: {
            name: string;
            description?: string; // Optional
            mapLink?: string; // Optional
            distance: number;
        }[];
        shops: {
            name: string;
            description?: string; // Optional
            mapLink?: string; // Optional
            distance: number;
        }[];
        commute: {
            name: string;
            description?: string; // Optional
            mapLink?: string; // Optional
            distance: number;
        }[];
    };
    youtubeVideoId?: string;
    videoDescription?: string;
    thumbnail: File | null;
    sliderImages: File[];
    galleryImages: File[];
    amenities: string[];
    status: "approved" | "rejected" | "pending" | "rented" | "sold" | "deleted";
    featured: boolean;
    floorPlans?: string[];
    virtualTourLink?: string;
    owner: string;
    reviews?: {
        userId: string;
        rating: number;
        comment: string;
        date: Date;
    }[];
    financingAvailable: boolean;
    mortgageEstimates?: {
        downPayment: number;
        interestRate: number;
        termYears: number;
        monthlyPayment: number;
    }[];
    createdAt?: Date;
    updatedAt?: Date;
}

export interface MulterFiles {
    thumbnail?: Express.Multer.File[];
    sliderImages?: Express.Multer.File[];
    galleryImages?: Express.Multer.File[];
}

interface Owner {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
}

export interface UpdatedProperty {
    _id: string;
    title: string;
    owner: Owner;
    // add any other needed fields here
}

