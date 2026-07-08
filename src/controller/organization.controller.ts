import {createOrganizationService,createGroupService,getOrganizationUsersService} from "../services/organization.service.js";
import { type Request, type Response } from "express";

const createOrganizationController = async (req: Request, res: Response) => {

        const orgData = req.body.validOrg;
        const admin=req.body.validOrg.users;
        orgData.users=undefined
        const organization = await createOrganizationService(orgData,admin);
        res.status(201).json(organization);
    
};
const getOrganizationUsersController = async (req: Request, res: Response) => {

        const user = req.user;
        if (!user) {
            throw new Error("User not found");
        }
        const users = await getOrganizationUsersService(user);
        res.status(200).json(users);
    
};

const createGroupController = async (req: Request, res: Response) => {
   
        const grpData = req.body.validGrp;
        const coordinator=req.body.validGrp.users;
        const adminData=req.user
        grpData.users=undefined
        if (!adminData) {
            throw new Error("Admin user data not found");
        }
        const group = await createGroupService(grpData,coordinator,adminData);
        res.status(201).json(group);

};




export { createOrganizationController,createGroupController,getOrganizationUsersController };
