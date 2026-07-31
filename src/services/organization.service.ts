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
import multer from "multer";

const createOrganizationService = async (
    orgData: organization,
    admin: User[],
    file?: Express.Multer.File
) => {
    // Validate input
    if (!admin.length) {
        throw new AppError(
            "At least one admin user is required",
            400,
            "ADMIN_REQUIRED"
        );
    }

    // Check if organization already exists
    const existingOrganization = await Organizationmodel.findOne({
        name: orgData.name,
    });

    if (existingOrganization) {
        throw new AppError(
            "Organization already exists",
            409,
            "ORGANIZATION_EXISTS"
        );
    }

    const organization = new Organizationmodel(orgData);
    

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

    await Promise.all(
        admin.map(async (user) => {
            // Check duplicate email
            const existingUser = await Usermodel.findOne({
                email: user.email,
            });

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
            await newUser.save();

            if (!organization.adminUserId) {
                organization.adminUserId = newUser._id;
            }
            const OrgName = organization.name
            await sendWelcomeEmail(
                newUser,
                plainPassword,
                OrgName
            );
            await organization.save();
        })
    
    );

    

    return {
        success: true,
        organization,
        message: "Organization and admin users created successfully",
    };
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
      user: coordinator[0],
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
            .populate("groupId").select("_id name groupcode")
            .populate("organization").select("_id name");
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