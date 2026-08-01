import { EnrollmentModel } from "../models/course.model.js";
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
import {assignCourseToOrganization} from "../services/course.service.js";

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

    const existingOrganization = await Organizationmodel.findOne({
        $or: [{ name: orgData.name }, { domain: orgData.domain }],
    });

    if (existingOrganization) {
        throw new AppError(
            "Organization already exists",
            409,
            "ORGANIZATION_EXISTS"
        );
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
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

            const plainPassword = user.password || generatePassword();
            user.password = await hashpass(plainPassword);

            const newUser = new Usermodel(user);
            await newUser.save({ session });

            if (!organization.adminUserId) {
                organization.adminUserId = newUser._id;
            }

            await emailQueue.add("welcome-email", {
                user: newUser,
                password: plainPassword,
                orgName: organization.name,
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
        assignCourseToOrganization(organization._id.toString(), "64a7e1f0c3b5f8b9d6e4a2c1");
        return {
            success: true,
            organization,
            message: "Organization and admin users created successfully",
        };
    } catch (err) {
        await session.abortTransaction();
        throw err;
    } finally {
        session.endSession();
    }
};

export const getOrganization = async () => {
    const organizations = await Organizationmodel.find().select("name domain");

    const result = await Promise.all(
        organizations.map(async (org) => ({
            _id: org._id,
            name: org.name,
            domain: org.domain,
            totalUsers: await Usermodel.countDocuments({
                organization: org._id,
            }),
        }))
    );
    return result


}

const createGroupService = async (
  grpData: group,
  coordinator: User[],
  adminData: { userId: string; role: string }
) => {
  const adminUser = await Usermodel.findById(adminData.userId).select("organization");
  
  if (!adminUser?.organization) {
    throw new AppError(
      "Organization not found",
      404,
      "Group_Problem"
    );
  }

  const organization = await Organizationmodel.findById(adminUser.organization);

  if (!organization) {
    throw new AppError(
      "Organization not found",
      404,
      "Group_Problem"
    );
  }

  // Check duplicate email or employee ID
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
      "User_Problem"
    );
  }

  grpData.groupCode = grpData.groupCode.toUpperCase();
  grpData.organization = organization._id;

  // Create group first
  const group = await Groupmodel.create(grpData);

  // Generate password
  const plainPassword = generatePassword();

  coordinator[0].password = await hashpass(plainPassword);
  coordinator[0].role = "coordinator";
  coordinator[0].organization = organization._id;
  coordinator[0].groupId = group._id;
  // Create coordinator
  const newCoordinator = await Usermodel.create(coordinator[0]);

  // Update group with coordinator
  group.coordinator = newCoordinator._id;
  await group.save();

  // Send welcome email (don't fail the request if email fails)
  try {
    await emailQueue.add("welcome-email", {
      user: newCoordinator,
      password: plainPassword,
      orgName: organization.name,
    });
  } catch (err) {
    console.error("Failed to queue welcome email:", err);
  }

  return {
    success: true,
    message: "Group created successfully",
    group,
    coordinator: {
      _id: newCoordinator._id,
      name: newCoordinator.name,
      email: newCoordinator.email,
      ID: newCoordinator.ID,
    },
  };
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
    const user = await Usermodel.findById(user1.userId);
    if (!user) {
        throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }

    let filter: Record<string, unknown> | null = null;

    if (user.role === "superadmin") {
        filter = {};
    } else if (user.role === "admin") {
        if (!user.organization) {
            throw new AppError(
                "Organization not found",
                404,
                "ORGANIZATION_NOT_FOUND"
            );
        }
        filter = { organization: user.organization };
    } else if (user.role === "coordinator") {
        if (!user.groupId) {
            throw new AppError("Group not found", 404, "GROUP_NOT_FOUND");
        }
        filter = { groupId: user.groupId };
    } else {
        throw new AppError("Forbidden", 403, "FORBIDDEN");
    }

    const users = await Usermodel.find(filter)
        .select("-password -__v -createdAt -updatedAt")
        .populate("groupId", "_id name groupCode")
        .populate("organization", "_id name");

    const userList: UserWithGroupName[] = users.map((u: any) => ({
        ...u.toObject(),
        groupName: u.groupId?.name ?? "",
        organizationName: u.organization?.name ?? "",
        active: u.otpverified,
    }));

    return {
        success: true,
        users: userList,
    };
};

export const getGroup = async (userId: string) => {
    const user = await Usermodel.findById(userId).select("organization");

    if (!user) {
        throw new Error("User not found");
    }

    const groups = await Groupmodel.find({
        organization: user.organization,
    }).select("name coordinator").populate("coordinator", "name");;

    const result = await Promise.all(
        groups.map(async (grp) => ({
            _id: grp._id,
            name: grp.name,
            coordinator: (grp.coordinator as any)?.name,
            totalUsers: await Usermodel.countDocuments({
                groupId: grp._id,
            }),
        }))
    );

    return result;
};
const getOraganizationConfig = async (domain: string) => {
    const organization = await Organizationmodel.findOne({ domain: domain });
    
    if (!organization) {
                throw new AppError(
            "Organization not found",
            404,
            "ORGANIZATION_NOT_FOUND"
        );
    }
    let logoUrl=await getLogo(organization?.logoUrl)
    organization.logoUrl=logoUrl
    return organization;
}
const editOrg=async (userInfo:{userId:string,role:string},file:Express.Multer.File,data:any)=>{
        
}
const getDomains = async (): Promise<string[]> => {
  const organizations = await Organizationmodel
    .find({}, "domain")
    .lean();

  return organizations.map((org) => org.domain);
};
export { createOrganizationService, getDomains,createGroupService,getOraganizationConfig, getOrganizationUsersService };