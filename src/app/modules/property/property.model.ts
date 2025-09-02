import mongoose, { Schema } from "mongoose";
import { IProperty } from "./property.type";

// Elasticsearch imports (commented out)
// import esClient from "../../config/elasticsearch/elasticsearch";
// import { propertyToESDoc } from "../../../utils/propertyToESDoc";

const PropertySchema: Schema = new Schema({
    title: { type: String, required: true },
    propertyType: { type: String, required: true },
    purpose: { type: String, enum: ["sale", "rent"], required: true },
    price: { type: Number, required: true },
    totalArea: { type: Number, required: true },
    totalUnits: { type: Number, default: 1 },
    totalBedrooms: { type: Number, default: 0 },
    totalBathrooms: { type: Number, default: 0 },
    totalGarages: { type: Number, default: 0 },
    totalKitchens: { type: Number, default: 0 },
    description: { type: String, default: "" },
    location: {
        country: { type: String, required: true },
        city: { type: String, required: true },
        address: { type: String, required: true },
        postalCode: { type: String },
        longitude: { type: Number, required: true },
        latitude: { type: Number, required: true },
    },
    nearbyLocations: {
        locationInMap: { type: String },
        schools: [{
            name: { type: String },
            description: { type: String },
            mapLink: { type: String },
            distance: { type: Number },
        }],
        shops: [{
            name: { type: String },
            description: { type: String },
            mapLink: { type: String },
            distance: { type: Number },
        }],
        commute: [{
            name: { type: String },
            description: { type: String },
            mapLink: { type: String },
            distance: { type: Number },
        }],
    },
    youtubeVideoId: { type: String, default: "" },
    videoDescription: { type: String, default: "" },
    thumbnail: { type: String, default: "" },
    sliderImages: [{ type: String }],
    galleryImages: [{ type: String }],
    amenities: [{ type: String }],
    status: {
        type: String,
        enum: ["approved", "rejected", "pending", "rented", "sold", "deleted"],
        default: "pending",
    },
    featured: { type: Boolean, default: false },
    floorPlans: [{ type: String }],
    virtualTourLink: { type: String },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reviews: [{
        userId: { type: Schema.Types.ObjectId, ref: "User" },
        rating: { type: Number },
        comment: { type: String },
        date: { type: Date, default: Date.now },
    }],
    financingAvailable: { type: Boolean, default: false },
    mortgageEstimates: [{
        downPayment: { type: Number },
        interestRate: { type: Number },
        termYears: { type: Number },
        monthlyPayment: { type: Number },
    }]
}, { timestamps: true });


// Elasticsearch sync on save (commented out)
/*
PropertySchema.post("save", async function (doc) {
  const documentWithId = doc as mongoose.Document & { _id: mongoose.Types.ObjectId };
  const propertyDoc = doc as unknown as mongoose.Document & IProperty;

  await esClient.index({
    index: "properties",
    id: documentWithId._id.toString(),
    document: propertyToESDoc(propertyDoc)
  });
});
*/

// Elasticsearch sync on delete (commented out)
/*
PropertySchema.post("deleteOne", { document: true, query: false }, async function (doc: any) {
  const documentWithId = doc as mongoose.Document & { _id: mongoose.Types.ObjectId };
  await esClient.delete({
    index: "properties",
    id: documentWithId._id.toString(),
  });
});
*/

export default mongoose.model<IProperty>("Property", PropertySchema);
