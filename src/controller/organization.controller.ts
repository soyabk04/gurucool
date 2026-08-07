import { createOrganizationService, createGroupService, getOraganizationConfig, getOrganizationUsersService, getOrganization, getGroup, getOrganizationDetailsService, editOrganizationService } from "../services/organization.service.js";
import { type Request, type Response, type NextFunction } from "express";
import { AppError } from "../errors/AppError.js";

const createOrganizationController = async (req: Request, res: Response, next: NextFunction) => {


        const orgData = req.body.organization;
        const admin = req.body.organization.users;

        const file = req.file;

        orgData.users = undefined
        const organization = await createOrganizationService(orgData, admin, file);
        res.status(201).json(organization);

};
const getOrganizationController = async (req: Request, res: Response) => {
        const userInfo=req.user!;
        const response = await getOrganization(userInfo)
        res.send({
                success: true,
                res: response
        })
}



interface OrganizationParams {
        organizationId: string;
}

export async function getOrganizationDetailsController(
        req: Request<OrganizationParams>,
        res: Response,
        next: NextFunction
) {
        const { organizationId } = req.params;

        if (!organizationId) {
                return next(new AppError("Organization ID is required", 400, "BAD_REQUEST"));
        }
        const result = await getOrganizationDetailsService(organizationId);

        return res.status(200).json(result);
}
const getGroupController = async (req: Request, res: Response, next: NextFunction) => {
        const user = req.user;
        const organizationId = req.query.organizationId as string | undefined
        console.log("organizationId", organizationId)
        if (!user) {
                return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));
        }
        const response = await getGroup(user.userId, organizationId ? organizationId : undefined)
        res.send({
                success: true,
                res: response
        })
}
const getOrganizationUsersController = async (req: Request, res: Response) => {

        const user = req.user;
        if (!user) {
                throw new AppError("User not found", 401, "UNAUTHORIZED");
        }
        const users = await getOrganizationUsersService(user);
        res.status(200).json(users);

};

const createGroupController = async (req: Request, res: Response) => {

        const grpData = req.body.group;
        const coordinators = req.body.group.users;
        const adminData = req.user
        if (!adminData) {
                throw new AppError("Admin user data not found", 401, "UNAUTHORIZED");
        }
        const group = await createGroupService(grpData, coordinators, adminData);
        res.status(201).json(group);

};


const getOrgThemeController = async (req: Request, res: Response) => {
        const domain = req.body.domain
        const response = await getOraganizationConfig(domain)
        res.send({ data: response })

}
const editOrganizationController = async (
        req: Request,
        res: Response,
        next: NextFunction
) => {
        const organizationId = req.params.organizationId as string;

        const data = typeof req.body.organization === "string"
                ? JSON.parse(req.body.organization)
                : req.body.organization;
        const file = req.file;
        const userInfo = req.user;

        if (!userInfo) {
                return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));
        }

        if (!organizationId) {
                return next(new AppError("Organization ID is required", 400, "BAD_REQUEST"));
        }

        if (!data && !file) {
                return next(new AppError("No data provided for update", 400, "BAD_REQUEST"));
        }

        try {
                const result = await editOrganizationService(
                        organizationId,
                        data,
                        file,
                        userInfo!
                );

                return res.status(200).json(result);
        } catch (error) {
                next(error);
        }
};

export {
        getGroupController
        , getOrganizationController
        , getOrgThemeController,
        createOrganizationController,
        createGroupController
        , getOrganizationUsersController,
        editOrganizationController
};
