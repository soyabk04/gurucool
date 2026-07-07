import { EnrollmentModel } from "../models/course.model.js";
import { Groupmodel, Organizationmodel, OrgPurchasemodel } from "../models/organization.model.js";
import { Usermodel } from "../models/user.model.js";
import type { organization, orgPurchase, group } from "../types/organization.type.js";
import type { User } from "../types/user.type.js";

const createOrganizationService = async (orgData: organization, admin: User[]) => {
    try {
        const organization = new Organizationmodel(orgData);
        await organization.save();
        admin.forEach(async (user) => {
            user.organization = organization._id;
            user.role = "admin";
            const newUser = new Usermodel(user);
            await newUser.save();
            orgData.adminUserId = newUser._id;
            await organization.save();
        }

        )
        return { success: true, organization, message: "Organization and admin users created successfully" }
    } catch (error: any) {
        throw new Error(`message: ${error.message}`);
    }
};

const createGroupService = async (
    grpData: group,
    admin: User[],
    adminData: { userId: string; role: string }
) => {
    try {
        const adminUser = await Usermodel.findById(adminData.userId);
        const orgId = adminUser?.organization;
        const organization = await Organizationmodel.findById(orgId);
        if (!organization) {
            throw new Error("Organization not found");
        }
        orgId ? (grpData.organization = orgId) : null;
        const group = await Groupmodel.create(grpData);

        for (const user of admin) {
            user.groupId = group._id;
            user.organization = group.organization;
            user.role = "coordinator";

            const newUser = await Usermodel.create(user);

            group.coordinator = newUser._id;
            await group.save();
        }

        return { success: true, group, message: "Group and coordinator users created successfully" };
    } catch (error: any) {
        throw new Error(error.message);
    }
};
interface UserWithGroupName extends User {
    groupName?: string;
    organizationName?: string;
    active?: boolean;
}

const getOrganizationUsersService = async (user1: {
    userId: string;
    role: string;
}) => {
    try {
        const userRoleinfo = user1
        const user = await Usermodel.findById(userRoleinfo.userId);
        if (!user) {
            throw new Error("User not found");
        }
        let Id: object | undefined = {}
        if (user.role === "admin") {
            Id = { organization: user.organization };
        }
        if (user.role === "coordinator") {
            Id = { groupId: user.groupId };
        }
        if (!Id) {
            throw new Error("Organization not found for the user");
        }
        const users = await Usermodel.find(Id)
            .select("-password").select("-__v").select("-createdAt").select("-updatedAt")
            .populate("groupId").populate("organization");
        const userList: UserWithGroupName[] = users.map((user: any) => ({
            ...user.toObject(),
            groupName: user.groupId?.name ?? "",
            organizationName: user.organization?.name ?? "",
            active: user.otpverified,
        }))

            ;

        return {
            success: true,
            users: userList,
        };
    } catch (error: any) {
        throw new Error(error.message);
    }
};

const getOraganizationConfig=async (hostname: string)      => {
    
}

export { createOrganizationService, createGroupService, getOrganizationUsersService };