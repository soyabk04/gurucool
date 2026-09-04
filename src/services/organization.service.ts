import { EnrollmentModel, OrganizationCourse } from "../models/course.model.js";
import { Groupmodel, Organizationmodel, } from "../models/organization.model.js";
import { Usermodel } from "../models/user.model.js";
import type { organization, orgPurchase, group } from "../types/organization.type.js";
import type { User } from "../types/user.type.js";
import { generatePassword } from "../utils/passwordGenerator.js";
import { hashpass } from "../utils/passwordhash.js";
import { sendWelcomeEmail } from "../utils/sendemail.js";
import { emailQueue } from "../queue/email.queue.js";
import { AppError } from "../errors/AppError.js";
import { R2Service } from "../utils/cloudflare.js";
import { getLogo } from "../utils/getVideoUrl.js";
import mongoose from "mongoose";
import { assignCourseToOrganization } from "../services/course.service.js";

const createOrganizationService = async (
    orgData: organization,
    admin: User[],
    file?: Express.Multer.File
) => {
    if (!admin.length) {
        throw new AppError(
            "At least one admin user is required",
            400,
            "ADMIN_REQUIRED"
        );
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const existingOrganization = await Organizationmodel.findOne({
            $or: [
                { name: orgData.name },
                { domain: orgData.domain },
            ],
        }).session(session);

        if (existingOrganization) {
            throw new AppError(
                "Organization already exists",
                409,
                "ORGANIZATION_EXISTS"
            );
        }

        const [organization] = await Organizationmodel.create([orgData], {
            session,
        });

        for (const user of admin) {
            const existingUser = await Usermodel.findOne({
                email: user.email,
            }).session(session);

            if (existingUser) {
                throw new AppError(
                    `User with email ${user.email} already exists`,
                    409,
                    "EMAIL_EXISTS"
                );
            }

            user.organization = organization._id;
            user.role = "admin";

            const plainPassword =
                user.password || generatePassword();

            user.password = await hashpass(plainPassword);

            const newUser = new Usermodel(user);
            await newUser.save({ session });

            if (!organization.adminUserId) {
                organization.adminUserId = newUser._id;
            }

            await emailQueue.add("welcome-email", {
                user: newUser,
                password: plainPassword,
                organization: organization,
            });
        }

        if (file) {
            const key = `organizations/${organization._id}/branding/logo`;

            const uploaded = await R2Service.upload(file, key);

            if (!uploaded) {
                throw new AppError(
                    "Failed to upload organization logo",
                    500,
                    "LOGO_UPLOAD_FAILED"
                );
            }

            organization.logoUrl = key;
        }

        await organization.save({ session });

        await session.commitTransaction();

        return {
            success: true,
            message: "Organization created successfully",
            data: organization,
        };
    } catch (error) {
        await session.abortTransaction();

        if (error instanceof AppError) {
            throw error;
        }

        throw new AppError(
            "Failed to create organization",
            500,
            "ORGANIZATION_CREATION_FAILED"
        );
    } finally {
        session.endSession();
    }
};

export const getOrganization = async (userInfo: { userId: string, role: string }) => {
    try {
        if (userInfo.role == "admin") {
            const user = await Usermodel.findById(userInfo.userId).populate('organization').lean();
            if (!user) {
                throw new AppError("user not found", 404, "USER_NOT_FOUND")
            }
            return {
                success: true,
                message: "Organizations fetched successfully",
                data: user.organization,
            }
        }
        const organizations = await Organizationmodel.find()
            .select("name domain")
            .lean();

        const data = await Promise.all(
            organizations.map(async (org) => ({
                _id: org._id,
                name: org.name,
                domain: org.domain,
                totalUsers: await Usermodel.countDocuments({
                    organization: org._id,
                }),
            }))
        );

        return {
            success: true,
            message: "Organizations fetched successfully",
            data,
        };
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }

        throw new AppError(
            "Failed to fetch organizations",
            500,
            "ORGANIZATION_FETCH_FAILED"
        );
    }
};

export const getOrganizationDetailsService = async (
    organizationId: string
) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(organizationId)) {
            throw new AppError(
                "Invalid organization id",
                400,
                "INVALID_ORGANIZATION_ID"
            );
        }

        const organization = await Organizationmodel.findById(organizationId)
            .select("name domain logoUrl primaryColor secondaryColor")
            .lean();

        if (!organization) {
            throw new AppError(
                "Organization not found",
                404,
                "ORGANIZATION_NOT_FOUND"
            );
        }
        const stats = await getOrganizationAnalyticsService(organizationId)
        const [users, groups, courses, coordinators] = await Promise.all([
            Usermodel.countDocuments({
                organization: organizationId,
            }),

            Groupmodel.countDocuments({
                organization: organizationId,
            }),

            OrganizationCourse.countDocuments({
                organizationId,
            }),

            Usermodel.countDocuments({
                organization: organizationId,
                role: "coordinator",
            }),
        ]);
        organization.logoUrl = await getLogo(organization.logoUrl);
        return {
            success: true,
            message: "Organization details fetched successfully",
            data: {
                ...organization,
                stats: stats.data
            },
        };
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }

        throw new AppError(
            "Failed to fetch organization details",
            500,
            "ORGANIZATION_DETAILS_FETCH_FAILED"
        );
    }
};

const createGroupService = async (
    grpData: group,
    coordinator: User[],
    adminData: { userId: string; role: string }
) => {
    try {
        if (!coordinator.length) {
            throw new AppError(
                "Coordinator is required",
                400,
                "COORDINATOR_REQUIRED"
            );
        }

        const adminUser = await Usermodel.findById(adminData.userId).select(
            "organization"
        );

        if (!adminUser?.organization) {
            throw new AppError(
                "Organization not found",
                404,
                "ORGANIZATION_NOT_FOUND"
            );
        }

        const organization = await Organizationmodel.findById(
            adminUser.organization
        );

        if (!organization) {
            throw new AppError(
                "Organization not found",
                404,
                "ORGANIZATION_NOT_FOUND"
            );
        }

        const existingUser = await Usermodel.findOne({
            $or: [
                { email: coordinator[0].email },
                { ID: coordinator[0].ID },
            ],
        });

        if (existingUser) {
            throw new AppError(
                "Coordinator with this email or ID already exists",
                409,
                "COORDINATOR_ALREADY_EXISTS"
            );
        }

        grpData.groupCode = grpData.groupCode.toUpperCase();
        grpData.organization = organization._id;

        const createdGroup = await Groupmodel.create(grpData);

        const plainPassword = generatePassword();

        coordinator[0].password = await hashpass(plainPassword);
        coordinator[0].role = "coordinator";
        coordinator[0].organization = organization._id;
        coordinator[0].groupId = createdGroup._id;

        const newCoordinator = await Usermodel.create(coordinator[0]);

        createdGroup.coordinator = newCoordinator._id;
        await createdGroup.save();

        // Don't fail the request if email queue fails
        try {
            await emailQueue.add("welcome-email", {
                user: newCoordinator,
                password: plainPassword,
                organization: organization,
            });
        } catch (error) {
            console.error("Failed to queue welcome email:", error);
        }

        return {
            success: true,
            message: "Group created successfully",
            data: {
                group: createdGroup,
                coordinator: {
                    _id: newCoordinator._id,
                    name: newCoordinator.name,
                    email: newCoordinator.email,
                    ID: newCoordinator.ID,
                },
            },
        };
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }

        throw new AppError(
            "Failed to create group",
            500,
            "GROUP_CREATION_FAILED"
        );
    }
};
export const deleteGroupService = async (
    groupId: string,
    adminData: {
        userId: string;
        role: string;
    }
) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(groupId)) {
            throw new AppError(
                "Invalid group ID",
                400,
                "INVALID_GROUP_ID"
            );
        }

        const adminUser = await Usermodel.findById(
            adminData.userId
        ).select("organization");

        if (!adminUser?.organization) {
            throw new AppError(
                "Organization not found",
                404,
                "ORGANIZATION_NOT_FOUND"
            );
        }

        const group = await Groupmodel.findOne({
            _id: groupId,
            organization: adminUser.organization,
        });

        if (!group) {
            throw new AppError(
                "Group not found",
                404,
                "GROUP_NOT_FOUND"
            );
        }

        // Delete users belonging to this group
        await Usermodel.deleteMany({
            groupId: group._id,
        });

        // Delete the group itself
        await Groupmodel.deleteOne({
            _id: group._id,
        });

        return {
            success: true,
            message:
                "Group and associated users deleted successfully",
        };
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }


        throw new AppError(
            "Failed to delete group",
            500,
            "GROUP_DELETION_FAILED"
        );
    }
};
export const getGroupService = async (
    groupId: string,
    adminData: { userId: string; role: string }
) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(groupId)) {
            throw new AppError(
                "Invalid group ID",
                400,
                "INVALID_GROUP_ID"
            );
        }

        const adminUser = await Usermodel.findById(
            adminData.userId
        ).select("organization");

        if (!adminUser?.organization) {
            throw new AppError(
                "Organization not found",
                404,
                "ORGANIZATION_NOT_FOUND"
            );
        }

        const group = await Groupmodel.findOne({
            _id: groupId,
            organization: adminUser.organization,
        }).populate(
            "coordinator",
            "_id name email ID"
        );

        if (!group) {
            throw new AppError(
                "Group not found",
                404,
                "GROUP_NOT_FOUND"
            );
        }

        return {
            success: true,
            message: "Group fetched successfully",
            data: group,
        };
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }

        console.error("Get group error:", error);

        throw new AppError(
            "Failed to get group",
            500,
            "GROUP_FETCH_FAILED"
        );
    }
};
interface UserWithGroupName extends User {
    groupName?: string;
    organizationName?: string;
    active?: boolean;
}

const getOrganizationUsersService = async (userInfo: {
    userId: string;
    role: string;
}) => {
    try {
        const user = await Usermodel.findById(userInfo.userId);

        if (!user) {
            throw new AppError(
                "User not found",
                404,
                "USER_NOT_FOUND"
            );
        }

        let filter: Record<string, unknown>;

        switch (user.role) {
            case "superadmin":
                filter = {};
                break;

            case "admin":
                if (!user.organization) {
                    throw new AppError(
                        "Organization not found",
                        404,
                        "ORGANIZATION_NOT_FOUND"
                    );
                }

                filter = {
                    organization: user.organization,
                };
                break;

            case "coordinator":
                if (!user.groupId) {
                    throw new AppError(
                        "Group not found",
                        404,
                        "GROUP_NOT_FOUND"
                    );
                }

                filter = {
                    groupId: user.groupId,
                };
                break;

            default:
                throw new AppError(
                    "You are not authorized to perform this action",
                    403,
                    "FORBIDDEN"
                );
        }

        const users = await Usermodel.find(filter)
            .select("-password -__v -createdAt -updatedAt")
            .populate("groupId", "_id name groupCode")
            .populate("organization", "_id name");

        const data: UserWithGroupName[] = users.map((u: any) => ({
            ...u.toObject(),
            groupName: u.groupId?.name ?? "",
            organizationName: u.organization?.name ?? "",
            active: u.otpverified,
        }));

        return {
            success: true,
            message: "Users fetched successfully",
            data,
        };
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }

        throw new AppError(
            "Failed to fetch organization users",
            500,
            "USER_FETCH_FAILED"
        );
    }
};
export const updateGroupService = async (
    groupId: string,
    grpData: Partial<group>,
    coordinator: User[] | undefined,
    adminData: { userId: string; role: string }
) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(groupId)) {
            throw new AppError(
                "Invalid group ID",
                400,
                "INVALID_GROUP_ID"
            );
        }

        const adminUser = await Usermodel.findById(adminData.userId).select(
            "organization role"
        );

        if (!adminUser?.organization) {
            throw new AppError(
                "Organization not found",
                404,
                "ORGANIZATION_NOT_FOUND"
            );
        }

        const organization = await Organizationmodel.findById(
            adminUser.organization
        );

        if (!organization) {
            throw new AppError(
                "Organization not found",
                404,
                "ORGANIZATION_NOT_FOUND"
            );
        }

        const existingGroup = await Groupmodel.findOne({
            _id: groupId,
            organization: organization._id,
        });

        if (!existingGroup) {
            throw new AppError(
                "Group not found",
                404,
                "GROUP_NOT_FOUND"
            );
        }

        /*
         * Update group fields
         */

        if (grpData.groupCode !== undefined) {
            grpData.groupCode = grpData.groupCode.toUpperCase();

            const duplicateGroup = await Groupmodel.findOne({
                _id: { $ne: groupId },
                organization: organization._id,
                groupCode: grpData.groupCode,
            });

            if (duplicateGroup) {
                throw new AppError(
                    "A group with this group code already exists",
                    409,
                    "GROUP_CODE_ALREADY_EXISTS"
                );
            }
        }

        /*
         * Prevent changing organization through update data
         */

        delete (grpData as any).organization;
        delete (grpData as any).coordinator;

        Object.assign(existingGroup, grpData);

        /*
         * Update coordinator if provided
         */

        let updatedCoordinator = null;

        if (coordinator?.length) {
            const coordinatorData = coordinator[0];

            if (!coordinatorData.email || !coordinatorData.ID) {
                throw new AppError(
                    "Coordinator email and ID are required",
                    400,
                    "INVALID_COORDINATOR"
                );
            }

            /*
             * Check whether this coordinator already exists.
             * Exclude the current coordinator of this group.
             */

            const duplicateCoordinator = await Usermodel.findOne({
                $or: [
                    { email: coordinatorData.email },
                    { ID: coordinatorData.ID },
                ],
                _id: {
                    $ne: existingGroup.coordinator,
                },
            });

            if (duplicateCoordinator) {
                throw new AppError(
                    "Coordinator with this email or ID already exists",
                    409,
                    "COORDINATOR_ALREADY_EXISTS"
                );
            }

            /*
             * If the group already has a coordinator,
             * update that user.
             */

            if (existingGroup.coordinator) {
                updatedCoordinator = await Usermodel.findByIdAndUpdate(
                    existingGroup.coordinator,
                    {
                        $set: {
                            name: coordinatorData.name,
                            email: coordinatorData.email,
                            ID: coordinatorData.ID,
                            organization: organization._id,
                            groupId: existingGroup._id,
                            role: "coordinator",
                        },
                    },
                    {
                        new: true,
                        runValidators: true,
                    }
                );
            } else {
                /*
                 * No coordinator currently exists,
                 * so create one.
                 */

                const plainPassword = generatePassword();

                coordinatorData.password =
                    await hashpass(plainPassword);

                coordinatorData.role = "coordinator";
                coordinatorData.organization = organization._id;
                coordinatorData.groupId = existingGroup._id;

                updatedCoordinator = await Usermodel.create(
                    coordinatorData
                );

                existingGroup.coordinator =
                    updatedCoordinator._id;

                /*
                 * Don't fail group update if email queue fails.
                 */

                try {
                    await emailQueue.add("welcome-email", {
                        user: updatedCoordinator,
                        password: plainPassword,
                        organization,
                    });
                } catch (error) {
                    console.error(
                        "Failed to queue welcome email:",
                        error
                    );
                }
            }
        }

        await existingGroup.save();

        /*
         * If coordinator wasn't updated above,
         * fetch the existing one for the response.
         */

        if (!updatedCoordinator && existingGroup.coordinator) {
            updatedCoordinator = await Usermodel.findById(
                existingGroup.coordinator
            ).select("_id name email ID");
        }

        return {
            success: true,
            message: "Group updated successfully",
            data: {
                group: existingGroup,
                coordinator: updatedCoordinator
                    ? {
                          _id: updatedCoordinator._id,
                          name: updatedCoordinator.name,
                          email: updatedCoordinator.email,
                          ID: updatedCoordinator.ID,
                      }
                    : null,
            },
        };
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }

        console.error("Update group error:", error);

        throw new AppError(
            "Failed to update group",
            500,
            "GROUP_UPDATE_FAILED"
        );
    }
};

export const getGroup = async (userId: string, organizationId?: string) => {
    try {
        const user = await Usermodel.findById(userId).select("organization");

        if (!user) {
            throw new AppError(
                "User not found",
                404,
                "USER_NOT_FOUND"
            );
        }

        const groups = await Groupmodel.find({
            organization: organizationId || user.organization,
        })
            .select("name coordinator")
            .populate("coordinator", "name");

        const data = await Promise.all(
            groups.map(async (grp) => ({
                _id: grp._id,
                name: grp.name,
                coordinator: (grp.coordinator as any)?.name ?? null,
                totalUsers: await Usermodel.countDocuments({
                    groupId: grp._id,
                }),
            }))
        );

        return {
            success: true,
            message: "Groups fetched successfully",
            data,
        };
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }

        throw new AppError(
            "Failed to fetch groups",
            500,
            "GROUP_FETCH_FAILED"
        );
    }
};
const getOraganizationConfig = async (domain: string) => {
    try {
        const organization = await Organizationmodel.findOne({ domain });

        if (!organization) {
            throw new AppError(
                "Organization not found",
                404,
                "ORGANIZATION_NOT_FOUND"
            );
        }

        if (organization.logoUrl) {
            organization.logoUrl = await getLogo(organization.logoUrl);
        }

        return {
            success: true,
            message: "Organization configuration fetched successfully",
            data: organization,
        };
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }

        throw new AppError(
            "Failed to fetch organization configuration",
            500,
            "ORGANIZATION_CONFIG_FETCH_FAILED"
        );
    }
};
const getDomains = async () => {
    try {
        const organizations = await Organizationmodel.find({}, "domain").lean();

        const data = organizations.map((org) => org.domain);

        return {
            success: true,
            message: "Organization domains fetched successfully",
            data,
        };
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }

        throw new AppError(
            "Failed to fetch organization domains",
            500,
            "DOMAIN_FETCH_FAILED"
        );
    }
};
const editOrganizationService = async (
    organizationId: string,
    data: Partial<organization>,
    file?: Express.Multer.File,
    userInfo?: { userId: string; role: string }
) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(organizationId)) {
            throw new AppError(
                "Invalid organization id",
                400,
                "INVALID_ORGANIZATION_ID"
            );
        }


        const organization = await Organizationmodel.findById(organizationId);

        if (!organization) {
            throw new AppError(
                "Organization not found",
                404,
                "ORGANIZATION_NOT_FOUND"
            );
        }
        if (organization.adminUserId?.toString() !== userInfo?.userId && userInfo?.role !== "superadmin") {
            throw new AppError(
                "user is not authorized to edit this organization",
                403,
                "FORBIDDEN"
            );
        }

        // Prevent duplicate name/domain
        if (data.name || data.domain) {
            const existing = await Organizationmodel.findOne({
                _id: { $ne: organizationId },
                $or: [
                    ...(data.name ? [{ name: data.name }] : []),
                    ...(data.domain ? [{ domain: data.domain }] : []),
                ],
            });

            if (existing) {
                throw new AppError(
                    "Organization with the same name or domain already exists",
                    409,
                    "ORGANIZATION_ALREADY_EXISTS"
                );
            }
        }

        // Update fields


        if (data.name !== undefined) {
            organization.name = data.name;
        }

        if (data.domain !== undefined) {
            organization.domain = data.domain;
        }

        if (data.primaryColor !== undefined) {
            organization.primaryColor = data.primaryColor;
        }

        if (data.secondaryColor !== undefined) {
            organization.secondaryColor = data.secondaryColor;
        }

        if (file) {
            const key = `organizations/${organization._id}/branding/logo`;

            const uploaded = await R2Service.upload(file, key);

            if (!uploaded) {
                throw new AppError(
                    "Failed to upload organization logo",
                    500,
                    "LOGO_UPLOAD_FAILED"
                );
            }

            organization.logoUrl = key;
        }

        await organization.save();
        return {
            success: true,
            message: "Organization updated successfully",
            data: organization,
        };
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }

        throw new AppError(
            "Failed to update organization",
            500,
            "ORGANIZATION_UPDATE_FAILED"
        );
    }
};


export const getOrganizationAnalyticsService = async (
    organizationId: string
) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(organizationId)) {
            throw new AppError(
                "Invalid organization id",
                400,
                "INVALID_ORGANIZATION_ID"
            );
        }

        const organization = await Organizationmodel.findById(
            organizationId
        ).select("_id");

        if (!organization) {
            throw new AppError(
                "Organization not found",
                404,
                "ORGANIZATION_NOT_FOUND"
            );
        }

        const orgObjectId = new mongoose.Types.ObjectId(
            organizationId
        );

        const [
            users,
            groups,
            courses,
            coordinators,
            enrollments,
            completedEnrollments,
            averageProgressResult,
            enrollmentTrend,
            completionTrend,
            topCourses,
            groupPerformance,
        ] = await Promise.all([
            Usermodel.countDocuments({
                organization: orgObjectId,
            }),

            Groupmodel.countDocuments({
                organization: orgObjectId,
            }),

            OrganizationCourse.countDocuments({
                organizationId: orgObjectId,
            }),

            Usermodel.countDocuments({
                organization: orgObjectId,
                role: "coordinator",
            }),

            EnrollmentModel.countDocuments({
                organizationId: orgObjectId,
            }),

            EnrollmentModel.countDocuments({
                organizationId: orgObjectId,
                status: "completed",
            }),

            EnrollmentModel.aggregate([
                {
                    $match: {
                        organizationId: orgObjectId,
                    },
                },
                {
                    $group: {
                        _id: null,
                        averageProgress: {
                            $avg: "$progress",
                        },
                    },
                },
            ]),

            EnrollmentModel.aggregate([
                {
                    $match: {
                        organizationId: orgObjectId,
                    },
                },
                {
                    $group: {
                        _id: {
                            month: {
                                $month: "$createdAt",
                            },
                        },
                        count: {
                            $sum: 1,
                        },
                    },
                },
                {
                    $sort: {
                        "_id.month": 1,
                    },
                },
            ]),

            EnrollmentModel.aggregate([
                {
                    $match: {
                        organizationId: orgObjectId,
                        status: "completed",
                    },
                },
                {
                    $group: {
                        _id: {
                            month: {
                                $month: "$createdAt",
                            },
                        },
                        count: {
                            $sum: 1,
                        },
                    },
                },
                {
                    $sort: {
                        "_id.month": 1,
                    },
                },
            ]),

            EnrollmentModel.aggregate([
                {
                    $match: {
                        organizationId: orgObjectId,
                    },
                },
                {
                    $group: {
                        _id: "$courseId",
                        enrolled: {
                            $sum: 1,
                        },
                        completed: {
                            $sum: {
                                $cond: [
                                    {
                                        $eq: ["$status", "completed"],
                                    },
                                    1,
                                    0,
                                ],
                            },
                        },
                    },
                },
                {
                    $lookup: {
                        from: "courses",
                        localField: "_id",
                        foreignField: "_id",
                        as: "course",
                    },
                },
                {
                    $unwind: "$course",
                },
                {
                    $project: {
                        _id: 1,
                        title: "$course.title",
                        enrolled: 1,
                        completed: 1,
                        completionRate: {
                            $round: [
                                {
                                    $multiply: [
                                        {
                                            $divide: [
                                                "$completed",
                                                "$enrolled",
                                            ],
                                        },
                                        100,
                                    ],
                                },
                                1,
                            ],
                        },
                    },
                },
                {
                    $sort: {
                        completionRate: -1,
                    },
                },
                {
                    $limit: 5,
                },
            ]),

            EnrollmentModel.aggregate([
                {
                    $match: {
                        organizationId: orgObjectId,
                    },
                },
                {
                    $group: {
                        _id: "$groupId",
                        users: {
                            $sum: 1,
                        },
                        averageProgress: {
                            $avg: "$progress",
                        },
                    },
                },
                {
                    $lookup: {
                        from: "groups",
                        localField: "_id",
                        foreignField: "_id",
                        as: "group",
                    },
                },
                {
                    $unwind: "$group",
                },
                {
                    $project: {
                        _id: 1,
                        name: "$group.name",
                        users: 1,
                        averageProgress: {
                            $round: ["$averageProgress", 1],
                        },
                    },
                },
            ]),
        ]);

        const averageProgress =
            averageProgressResult[0]?.averageProgress ?? 0;

        const completionRate =
            enrollments === 0
                ? 0
                : Number(
                    (
                        (completedEnrollments /
                            enrollments) *
                        100
                    ).toFixed(1)
                );

        return {
            success: true,
            message:
                "Organization analytics fetched successfully",
            data: {
                overview: {
                    users,
                    groups,
                    courses,
                    coordinators,
                },

                learning: {
                    enrollments,
                    completedEnrollments,
                    averageProgress: Number(
                        averageProgress.toFixed(1)
                    ),
                    completionRate,
                },

                enrollmentTrend,

                completionTrend,

                topCourses,

                groupPerformance,

                recentActivity: [],
            },
        };
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }

        throw new AppError(
            "Failed to fetch organization analytics",
            500,
            "ANALYTICS_FETCH_FAILED"
        );
    }
};
export { createOrganizationService, getDomains, createGroupService, getOraganizationConfig, getOrganizationUsersService, editOrganizationService };