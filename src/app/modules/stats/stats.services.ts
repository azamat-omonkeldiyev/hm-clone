import Property from "../property/property.model";
import { User } from "../user/users.model";


export const getUserCountsData = async () => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [totalUsers, newUsers] = await Promise.all([
        User.countDocuments({ deleted: false }),
        User.countDocuments({ createdAt: { $gte: sevenDaysAgo }, deleted: false }),
    ]);

    return {
        totalUsers,
        newUsersLast7Days: newUsers,
    };
};

export const getTotalRevenueBySellersData = async () => {
    return await Property.aggregate([
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
                from: "users",
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
        { $sort: { totalRevenue: -1 } }
    ]);
};

export const getTotalPropertiesCountData = async () => {
    const count = await Property.countDocuments();
    return { totalProperties: count };
};
