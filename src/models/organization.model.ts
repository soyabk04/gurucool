import mongoose from 'mongoose'
import type { organization, orgPurchase } from '../types/organization.type.js'

const organizationSchema = new mongoose.Schema<organization>({
    name: {
        type: String,
        required: true
    },
    domain: {
        type: String,
        required: true,
        unique: true
    },
    primaryColor: {
        type: String,
        required: true
    },

    secondaryColor: {
        type: String,
        required: true
    },

    logoUrl: {
        type: String,
        required: true
    },
    adminUserId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    }
})

const orgPurchaseSchema = new mongoose.Schema<orgPurchase>({
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',  
    },
    purchaseDate: {
        type: Date,
        default: Date.now
    },
    amount: {
        type: Number,
        required: true
    }
})

const Organizationmodel = mongoose.model('Organization', organizationSchema);
const OrgPurchasemodel = mongoose.model('OrgPurchase', orgPurchaseSchema);
export { Organizationmodel, OrgPurchasemodel };