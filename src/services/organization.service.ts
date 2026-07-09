import { EnrollmentModel } from "../models/course.model.js";
import { Groupmodel, Organizationmodel, OrgPurchasemodel } from "../models/organization.model.js";
import { Usermodel } from "../models/user.model.js";
import type { organization, orgPurchase, group } from "../types/organization.type.js";
import type { User } from "../types/user.type.js";
import { generatePassword } from "../utils/passwordGenerator.js";
import { hashpass } from "../utils/passwordhash.js";
import { sendWelcomeEmail } from "../utils/sendemail.js";
import { emailQueue } from "../queue/email.queue.js";
import { AppError } from "../errors/AppError.js";
import { error } from "node:console";

const createOrganizationService = async (orgData: organization, admin: User[]) => {
    try {
        const organization = new Organizationmodel(orgData);
        await organization.save();
        await Promise.all(admin.map(async (user) => {
            user.organization = organization._id;
            user.role = "admin";

            const plainPassword = user.password || generatePassword();
            user.password = await hashpass(plainPassword);

            const newUser = new Usermodel(user);
            await newUser.save();

            organization.adminUserId = newUser._id;
            await organization.save();

            await sendWelcomeEmail(newUser, plainPassword, organization.name);
        }));

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


    const adminUser = await Usermodel.findById(adminData.userId);
    const orgId = adminUser?.organization;
    const organization = await Organizationmodel.findById(orgId);
    grpData.groupCode = grpData.groupCode.toUpperCase();
    if (!organization) {
        throw new AppError(
            "Organization not Found",
            404,
            "Group_Problem",
        );
    }

    orgId ? (grpData.organization = orgId) : null;
    const group = await Groupmodel.create(grpData);
    await Promise.all(admin.map(async (user) => {
        user.groupId = group._id;
        user.organization = group.organization;
        user.role = "coordinator";


        const plainPassword = user.password || generatePassword();
        user.password = await hashpass(plainPassword);
        const newUser = await Usermodel.create(user);

        group.coordinator = newUser._id;
        await group.save();
        const useremail = user.email;
        const password = plainPassword

        let orgName = organization.name
        console.log(orgName,organization)
        await emailQueue.add("welcome-email", {
            user,
            password,
            orgName,
        });
    })).catch((err) => {

        throw new AppError(
            "error while creating Group",
            409,
            "Group_Problem",
            err.errmsg
        );
    });

    return { success: true, group, message: "Group and coordinator users created successfully" };

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

const getOraganizationConfig = async (hostname: string) => {
    const organization = await Organizationmodel.findOne({ domain: hostname });
    if (!organization) {
        throw new Error("Organization not found");
    }
    return organization;
}

export { createOrganizationService, createGroupService, getOrganizationUsersService };