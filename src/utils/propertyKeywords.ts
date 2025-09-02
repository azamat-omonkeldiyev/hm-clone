// utils/propertyKeywords.ts
interface NearbyLocation {
    name: string;
}

interface NearbyLocations {
    schools?: NearbyLocation[];
    shops?: NearbyLocation[];
}

interface Location {
    country?: string;
    city?: string;
    address?: string;
}

interface PropertyDoc {
    title: string;
    propertyType: string;
    purpose: string;
    location?: Location;
    amenities?: string[];
    nearbyLocations?: NearbyLocations;
}

export function generatePropertyKeywords(doc: PropertyDoc): string {
    return [
        doc.title,
        doc.propertyType,
        doc.purpose,
        doc.location?.country,
        doc.location?.city,
        doc.location?.address,
        ...(doc.amenities || []),
        ...(doc.nearbyLocations?.schools?.map((s: NearbyLocation) => s.name) || []),
        ...(doc.nearbyLocations?.shops?.map((s: NearbyLocation) => s.name) || [])
    ].filter(Boolean).join(' ');
}
