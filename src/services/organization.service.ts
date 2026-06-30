import { EnrollmentModel } from "../models/course.model.js";
import {Groupmodel, Organizationmodel,OrgPurchasemodel} from "../models/organization.model.js";
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

const createGroupService = async (grpData: organization) => {
    try {
        const group = new Groupmodel(grpData);
        await group.save();
        return group;
    } catch (error:any) {
        throw new Error('Error creating organization');
    }
};





export { createOrganizationService, createGroupService};