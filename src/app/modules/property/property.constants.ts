export const PROPERTY_SEARCH_FIELDS = [
    "title",
    "propertyType",
    "purpose",
    "description",

    // Nested Location Fields (keep only text fields)
    "location.country",
    "location.city",
    "location.address",

    // Nearby Locations (only name/description if text)
    "nearbyLocations.schools.name",
    "nearbyLocations.schools.description",
    "nearbyLocations.shops.name",
    "nearbyLocations.shops.description",
    "nearbyLocations.commute.name",
    "nearbyLocations.commute.description",
    "reviews.comment"
];
