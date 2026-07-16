import { success } from "zod";
import { createOrganizationService, createGroupService, getOrganizationUsersService, getOrganization, getGroup } from "../services/organization.service.js";
import { type Request, type Response, type NextFunction } from "express";

const createOrganizationController = async (req: Request, res: Response, next: NextFunction) => {

                
                const orgData = req.body.organization;
                const admin = req.body.organization.users;
                
                const file: Express.Multer.File = req.file!
                
                orgData.users = undefined
                const organization = await createOrganizationService(orgData, admin, file);
                res.status(201).json(organization);

};
const getOrganizationController= async (req:Request,res:Response)=>{
        const user=req.user;
        const response=await getOrganization()
        if(response){
           res.send({
                success:true,
                res:response
           })
        }
}
const getGroupController= async (req:Request,res:Response,next:NextFunction)=>{
        const user=req.user!;
        if(!user){
           next()
        }
        const response=await getGroup(user?.userId)
        if(response){
           res.send({
                success:true,
                res:response
           })
        }
}
const getOrganizationUsersController = async (req: Request, res: Response) => {

        const user = req.user;
        if (!user) {
                throw new Error("User not found");
        }
        const users = await getOrganizationUsersService(user);
        res.status(200).json(users);

};

const createGroupController = async (req: Request, res: Response) => {

        const grpData = req.body.group;
        const coordinators = req.body.group.users;
        const adminData = req.user
        if (!adminData) {
                throw new Error("Admin user data not found");
        }
        const group = await createGroupService(grpData, coordinators, adminData);
        res.status(201).json(group);

};




export { getGroupController,getOrganizationController,createOrganizationController, createGroupController, getOrganizationUsersController };
