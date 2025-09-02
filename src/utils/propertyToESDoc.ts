import { IProperty } from "../app/modules/property/property.type";
import { generatePropertyKeywords } from "./propertyKeywords";


export function propertyToESDoc(doc: IProperty) {
    return {
        title: doc.title,
        description: doc.description,
        propertyType: doc.propertyType,
        purpose: doc.purpose,
        price: doc.price,
        totalArea: doc.totalArea,
        totalBedrooms: doc.totalBedrooms,
        totalBathrooms: doc.totalBathrooms,
        location: {
            country: doc.location.country,
            city: doc.location.city,
            address: doc.location.address,
            postalCode: doc.location.postalCode,
            longitude: doc.location.longitude,
            latitude: doc.location.latitude,
        },
        amenities: doc.amenities,
        status: doc.status,
        featured: doc.featured,
        nearbySchools: doc.nearbyLocations?.schools?.map(s => s.name) || [],
        nearbyShops: doc.nearbyLocations?.shops?.map(s => s.name) || [],
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        keywords: generatePropertyKeywords(doc),
    };
}
