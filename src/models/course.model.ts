import mongoose from "mongoose";
import type { Course } from "../types/courses.type.js";


const courseSchema = new mongoose.Schema<Course>({
    title: {
        type: String,
        required: true,},
    description: {
        type: String,
        required: true
    },
    thumbnail: {
        type: String,
        required: true},
    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    price: {
        type: Number,
        required: true
    },
    category: {
        type: String,
        required: true
},
level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true
}, 
}, {
    timestamps: true,
  });
const Coursemodel = mongoose.model('Course', courseSchema);
export default Coursemodel;