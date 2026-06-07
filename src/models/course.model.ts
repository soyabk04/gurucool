import mongoose from "mongoose";
import type { Course ,chapter,enrollment} from "../types/courses.type.js";


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

const chapterSchema = new mongoose.Schema<chapter>({
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    videoUrl: {
        type: String,
        required: true
    }
});

const enrollmentSchema = new mongoose.Schema<enrollment>({
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
});

const Chaptermodel = mongoose.model('Chapter', chapterSchema);
const Coursemodel = mongoose.model('Course', courseSchema);
const Enrollmentmodel = mongoose.model('Enrollment', enrollmentSchema);
export { Coursemodel, Chaptermodel, Enrollmentmodel };