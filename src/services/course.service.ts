import {Chaptermodel, Coursemodel} from "../models/course.model.js";

export const createCourse = async (courseData: any) => {
    try {
        const course = new Coursemodel(courseData);
        await course.save();
        return course;
    } catch (error) {
        throw new Error('Error creating course');
    }
};

export const createChapter = async (chapterData: any) => {
    try {
        const chapter = new Chaptermodel(chapterData);
        await chapter.save();
        return chapter;
    } catch (error) {
        throw new Error('Error creating chapter');
    }
};
