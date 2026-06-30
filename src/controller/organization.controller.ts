import {createOrganizationService,createGroupService} from "../services/organization.service.js";
import { type Request, type Response } from "express";

const createOrganizationController = async (req: Request, res: Response) => {
    try {
        const orgData = req.body.validOrg;
        const organization = await createOrganizationService(orgData);
        res.status(201).json(organization);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

const createGroupController = async (req: Request, res: Response) => {
    try {
        const grpData = req.body.validGrp;
        const group = await createGroupService(grpData);
        res.status(201).json(group);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};




export { createOrganizationController,createGroupController };
