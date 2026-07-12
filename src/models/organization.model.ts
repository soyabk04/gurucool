import mongoose from 'mongoose'
import type { group, organization, orgPurchase } from '../types/organization.type.js'

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
        required: false
    },
    adminUserId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: 'User'
    
    }
})
const groupSchema = new mongoose.Schema<group>({
     name:{
        type:String,
        required:true

     },
     organization:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Organization',
     },
        coordinator:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'User'
        },
        groupCode:{
            type:String,
            required:true       
        }
})


const Organizationmodel = mongoose.model('Organization', organizationSchema);
const Groupmodel= mongoose.model('group',groupSchema)
export { Organizationmodel,Groupmodel };