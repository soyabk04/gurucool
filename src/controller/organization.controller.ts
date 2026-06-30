import {createOrganizationService,createOrgPurchaseService} from "../services/organization.service.js";
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
        const group = await createOrganizationService(grpData);
        res.status(201).json(group);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

const createOrgPurchaseController = async (req: Request, res: Response) => {
    try {
        const purchaseData = req.body;
        const purchase = await createOrgPurchaseService(purchaseData);
        res.status(201).json(purchase);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};
export { createOrganizationController, createOrgPurchaseController,createGroupController };
