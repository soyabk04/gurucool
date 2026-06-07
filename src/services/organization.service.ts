import {Organizationmodel,OrgPurchasemodel} from "../models/organization.model.js";
import type { organization, orgPurchase } from "../types/organization.type.js";

const createOrganizationService = async (orgData: organization) => {
    try {
        const organization = new Organizationmodel(orgData);
        await organization.save();
        return organization;
    } catch (error:any) {
        throw new Error('Error creating organization');
    }
};

const createOrgPurchaseService = async (purchaseData: orgPurchase) => {
    try {
        const purchase = new OrgPurchasemodel(purchaseData);
        await purchase.save();
        return purchase;
    } catch (error:any) {
        throw new Error('Error processing purchase');
    }
};


export { createOrganizationService, createOrgPurchaseService };