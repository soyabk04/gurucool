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

    const [
        [studentCounts],
        totalOrganizations,
        totalGroups,
        totalCourses,
        totalEnrollments,
    ] = await Promise.all([
        Usermodel.aggregate(pipeline),
        user.role === "superadmin"
            ? Organizationmodel.countDocuments()
            : 1,
        user.role === "superadmin"
            ? Groupmodel.countDocuments()
            : user.role === "admin"
                ? Groupmodel.countDocuments({ organization: user.organization })
                : 1,
        CourseModel.countDocuments(),
        user.role === "superadmin"
            ? EnrollmentModel.countDocuments()
            : user.role === "admin"
                ? EnrollmentModel.countDocuments({ organizationId: user.organization })
                : EnrollmentModel.countDocuments({ groupId: user.groupId }),
    ]);

    return {
        ...studentCounts,
        totalOrganizations,
        totalGroups,
        totalCourses,
        totalEnrollments,
    };

};


export const getCourseOverviewRepository = async (
    courseId: string
) => {

    const [analytics] = await CourseModel.aggregate(
        courseOverviewPipeline(courseId)
    );

    return analytics;

};