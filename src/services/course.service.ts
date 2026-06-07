import Coursemodel from "../models/course.model.js";

export const createCourse = async (courseData: any) => {
    try {
        const course = new Coursemodel(courseData);
        await course.save();
        return course;
    } catch (error) {
        throw new Error('Error creating course');
    }
};