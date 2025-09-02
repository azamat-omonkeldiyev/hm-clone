import express from "express";
import {
    getAllProperties,
    getPropertyById,
    createProperty,
    updateProperty,
    deleteProperty,
    getNewProperties,
    getFeaturedProperties,
    getPaginatedProperties,
    searchProperties,
    getSimilarProperties,
    getPropertiesBySeller,
    getTotalRevenueBySellers,
    getTotalPropertiesCount,
    getSellerStats,
    getTopProperties,
    getRecommendedProperties,
    findFavoriteProperties,
    approveProperty,
    editPropertyByAdmin,
    searchAndFilterPropertiesPOST
} from "./property.controllers";
import upload from "../../middleware/multer";

const router = express.Router();
// Property routes
router.get("/", getAllProperties);
router.get("/seller/:sellerId", getPropertiesBySeller);
router.get("/seller-stats/:sellerId", getSellerStats);
router.get("/paginated", getPaginatedProperties);
router.get("/new", getNewProperties);
router.get("/featured", getFeaturedProperties);
router.get("/search", searchProperties);
router.get("/total-revenue", getTotalRevenueBySellers); //app
router.get("/total-properties", getTotalPropertiesCount); //app
router.get("/top-properties", getTopProperties); //app
router.get("/recommended-properties", getRecommendedProperties); //app
router.get("/:id", getPropertyById);
router.get("/similar-prop/:propertyId", getSimilarProperties);
router.get("/favorites/find", findFavoriteProperties);
router.get("/favorites/find", findFavoriteProperties);
// mobile app
router.put('/:propertyId/edit', editPropertyByAdmin);
router.put('/:propertyId/approve', approveProperty);
router.post('/search-filter', searchAndFilterPropertiesPOST);

// CRUD operations
router.post("/create", upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "sliderImages", maxCount: 20 },
    { name: "galleryImages", maxCount: 20 },
]), createProperty);
router.put("/:id", upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "sliderImages", maxCount: 20 },
    { name: "galleryImages", maxCount: 20 },
]), updateProperty);
router.delete("/:id", deleteProperty);

export default router;
