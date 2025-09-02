// src/app/modules/property/property.service.ts

// import { PROPERTY_SEARCH_FIELDS } from "./property.constants";
// import esClient from "../../config/elasticsearch/elasticsearch";
import Property from "./property.model";
import { SortOrder } from "mongoose";


// Utility to build ES query
// const buildESQuery = (queryParams: any) => {
//     const {
//         priceMin,
//         priceMax,
//         bedrooms,
//         bathrooms,
//         propertyType,
//         status,
//         searchQuery,
//         amenities,
//     } = queryParams;

//     const esQuery: any = { bool: { must: [], filter: [] } };

//     // Price range
//     esQuery.bool.filter.push({
//         range: {
//             price: {
//                 gte: parseInt(priceMin, 10) || 0,
//                 lte: isFinite(parseInt(priceMax, 10)) ? parseInt(priceMax, 10) : undefined,
//             },
//         },
//     });

//     if (!isNaN(bedrooms)) esQuery.bool.filter.push({ term: { totalBedrooms: bedrooms } });
//     if (!isNaN(bathrooms)) esQuery.bool.filter.push({ term: { totalBathrooms: bathrooms } });
//     if (propertyType) esQuery.bool.filter.push({ term: { propertyType } });
//     if (status) esQuery.bool.filter.push({ term: { status } });

//     // Text search
//     if (searchQuery) {
//         esQuery.bool.must.push({
//             multi_match: {
//                 query: searchQuery,
//                 fields: PROPERTY_SEARCH_FIELDS,
//                 fuzziness: "auto",
//             },
//         });
//     }

//     // Amenities
//     if (amenities) {
//         if (Array.isArray(amenities)) {
//             esQuery.bool.filter.push({ terms: { amenities } });
//         } else {
//             esQuery.bool.filter.push({ term: { amenities } });
//         }
//     }

//     return esQuery;
// };


export const getAllPropertiesService = async (
    queryParams: any,
    fetchAll: string,
    page: number,
    limit: number,
    skip: number,
    sortBy: string,
    order: "asc" | "desc"
) => {
    const filter: any = {};

    // Optional filters — extend as needed
    if (queryParams.bedrooms) {
        filter.totalBedrooms = parseInt(queryParams.bedrooms);
    }

    if (queryParams.bathrooms) {
        filter.totalBathrooms = parseInt(queryParams.bathrooms);
    }

    if (queryParams.propertyType) {
        filter.propertyType = queryParams.propertyType;
    }

    if (queryParams.priceMin || queryParams.priceMax) {
        filter.price = {
            ...(queryParams.priceMin && { $gte: parseFloat(queryParams.priceMin) }),
            ...(queryParams.priceMax && { $lte: parseFloat(queryParams.priceMax) }),
        };
    }

    if (queryParams.searchQuery) {
        const regex = new RegExp(queryParams.searchQuery, "i");
        filter.$or = [
            { title: regex },
            { description: regex },
            { "location.address": regex },
            { "location.city": regex },
            { "location.country": regex },
        ];
    }



    const sortOption: { [key: string]: SortOrder } = { [sortBy]: order === "desc" ? -1 : 1 };

    const hits = await Property.find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(fetchAll === "true" ? 10000 : limit)
        .lean();

    const total = await Property.countDocuments(filter);

    return {
        hits: hits.map((doc) => ({ id: doc._id, ...doc })),
        total,
    };
};

