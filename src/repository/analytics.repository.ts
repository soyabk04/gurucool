import { CourseModel } from "../models/course.model.js";
import { Usermodel } from "../models/user.model.js";
import { EnrollmentModel } from "../models/course.model.js";
import { Organizationmodel } from "../models/organization.model.js";
import { Groupmodel } from "../models/organization.model.js";
import { courseOverviewPipeline } from "../pipeline/course.pipeline.js";

import { dashboardPipeline } from "../pipeline/dashboard.pipeline.js";

export const dashboardAnalyticsRepository = async (
    user: any
) => {

    const pipeline = dashboardPipeline(user);

    const [result] = await Usermodel.aggregate(pipeline);

    return result;

};


export const getCourseOverviewRepository = async (
    courseId: string
) => {

    const [analytics] = await CourseModel.aggregate(
        courseOverviewPipeline(courseId)
    );

    return analytics;

};