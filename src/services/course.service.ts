import { ATJWTKEY } from "../config/env.config.js";
import { ChapterModel, GroupCourse, CourseModel, OrganizationCourse, QuestionModel, QuizModel, CourseProgressModel, EnrollmentModel } from "../models/course.model.js";
import mongoose from "mongoose";
import { Usermodel } from "../models/user.model.js";
import type { Enrollment } from "../types/courses.type.js";
import type { Chapter, Course, Question, Quiz } from "../types/courses.type.js";
import { Groupmodel } from "../models/organization.model.js";
import { R2Service } from "../utils/cloudflare.js";
import { AppError } from "../errors/AppError.js";
import { Types } from "mongoose"
import { Organizationmodel } from "../models/organization.model.js";
import { error } from "node:console";
import { getVideoStreamUrl } from "../utils/getVideoUrl.js";


export const createCourse = async (
    courseData: Course,
    userInfo: { userId: string; role: string },
    file: Express.Multer.File
) => {
    const instructor = await Usermodel.findById(userInfo.userId);
    console.log("userInfo.role", userInfo.role);
    if (!instructor) {
        throw new AppError("Instructor not found.", 404, "INSTRUCTOR_NOT_FOUND");
    }
    console.log("userInfo.role", userInfo.role);
    const course = await CourseModel.create({
        ...courseData,
        instructor: instructor._id,
    });
    if (!course) {
        throw new AppError(
            "Failed to create Course",
            500,
            "FAILED_CREATE_COURSE"
        );
    }

    if (file) {
        const key = `Courses/${course._id}/thumbnail`;

        const uploaded = await R2Service.upload(file, key);

        if (!uploaded) {
            throw new AppError(
                "Failed to upload thumbnail of course",
                500,
                "THUMBNAIL_UPLOAD_FAILED"
            );
        }

        course.thumbnail = key;
        await course.save();
    }
    const userOrganization = await Usermodel.findById(userInfo.userId).select("organization");
    if (!userOrganization?.organization) {
        throw new AppError("User does not belong to any organization.", 400, "USER_NO_ORGANIZATION");
    }
    await assignCourseToOrganization(userOrganization.organization.toString(), course._id.toString(), userInfo);
    return { course }

};

export const createChapter = async (
    chapterData: Chapter,
    file?: Express.Multer.File
) => {
    const courseExists = await CourseModel.exists({
        _id: chapterData.courseId,
    });

    if (!courseExists) {
        throw new AppError(
            "Course not found",
            400,
            "COURSE_NOT_FOUND"
        );
    }
    const chapters = await ChapterModel.find({ courseId: chapterData.courseId })
    chapterData.serialNo = chapters.length + 1;
    const chapter = await ChapterModel.create(chapterData);

    if (!chapter) {
        throw new AppError(
            "Failed to create chapter",
            500,
            "FAILED_CREATE_CHAPTER"
        );
    }

    if (file) {
        const key = `Courses/${chapter.courseId}/${chapter._id}/video`;

        const uploaded = await R2Service.upload(file, key);

        if (!uploaded) {
            throw new AppError(
                "Failed to upload chapter video",
                500,
                "VIDEO_UPLOAD_FAILED"
            );
        }

        chapter.videoUrl = key;
        await chapter.save();
    }

    return chapter;
};

export const getCourse = async (courseId: string) => {

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
        throw new AppError(
            "Invalid course id",
            400,
            "INVALID_COURSE_ID"
        );
    }
    const course = await CourseModel.findById(courseId);
    if (!course) {
        throw new AppError(
            "course not found",
            404,
            "COURSE_NOT_FOUND"
        );
    }

    const chapters = await ChapterModel.find({
        courseId: courseId
    }).select("-courseId")
        .select("-videoUrl");
    return {
        success: true,
        course,
        chapters
    }
}
export const getMyCourses = async (userInfo: { userId: string; role: string }) => {

    const myCourses = await EnrollmentModel.find({
        userId: userInfo.userId,
    })
        .populate({
            path: "courseId",
            select: "_id title thumbnail",
        });

    if (myCourses.length === 0) {
        return {
            success: true,
            data: [],
        };
    }
    const courses = myCourses.map((enrollment) => enrollment.courseId)
    return {
        success: true,
        data: courses,
    };
};
export const createQuestion = async (
    questionsData: Question[]
) => {

    if (questionsData.length === 0) {
        throw new Error("Questions array is empty.");
    }

    const quizId = questionsData[0]?.quizId;

    const quizExists = await QuizModel.exists({
        _id: quizId,
    });

    if (!quizExists) {
        throw new Error("Quiz not found.");
    }

    return await QuestionModel.insertMany(questionsData);
};

export const createQuiz = async (
    quizData: Quiz
) => {

    const chapterExists = await ChapterModel.exists({
        _id: quizData.chapterId,
    });

    if (!chapterExists) {
        throw new Error("Chapter not found.");
    }

    return await QuizModel.create(quizData);
};
interface AssignCourseDto {
    courseId: string;
    userIds: string[];
}
export const assignCourseToUsers = async (
    data: AssignCourseDto,
    actor: { userId: string; role: string }
) => {
    const coordinatorId = actor.userId;
    const actorUser = await Usermodel.findById(actor.userId).select(
        "organization groupId role"
    );

    if (!actorUser) {
        throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }

    const course = await CourseModel.findById(data.courseId);

    if (!course) {
        throw new AppError("Course not found.", 404, "COURSE_NOT_FOUND");
    }

    const users = await Usermodel.find({
        _id: { $in: data.userIds },
    });

    if (users.length !== data.userIds.length) {
        throw new AppError(
            "Some users do not exist.",
            400,
            "USERS_NOT_FOUND"
        );
    }

    for (const user of users) {
        if (actor.role === "admin") {
            if (
                !actorUser.organization ||
                user.organization?.toString() !==
                actorUser.organization.toString()
            ) {
                throw new AppError(
                    "Cannot enroll users outside your organization.",
                    403,
                    "FORBIDDEN"
                );
            }
        } else if (actor.role === "coordinator") {
            if (
                !actorUser.groupId ||
                user.groupId?.toString() !== actorUser.groupId.toString()
            ) {
                throw new AppError(
                    "Cannot enroll users outside your group.",
                    403,
                    "FORBIDDEN"
                );
            }
        }

        if (!user.organization || !user.groupId) {
            throw new AppError(
                "User must belong to an organization and group before enrollment.",
                400,
                "USER_NOT_ASSIGNABLE"
            );
        }
    }

    if (actor.role === "admin" && actorUser.organization) {
        const orgAssignment = await OrganizationCourse.findOne({
            organizationId: actorUser.organization,
            courseId: data.courseId,
            status: "active",
        });
        if (!orgAssignment) {
            throw new AppError(
                "This course is not assigned to your organization.",
                403,
                "COURSE_NOT_ASSIGNED"
            );
        }
    }

    if (actor.role === "coordinator" && actorUser.groupId) {
        const groupAssignment = await GroupCourse.findOne({
            groupId: actorUser.groupId,
            courseId: data.courseId,
            status: "active",
        });
        if (!groupAssignment) {
            throw new AppError(
                "This course is not assigned to your group.",
                403,
                "COURSE_NOT_ASSIGNED"
            );
        }
    }

    const chapters = await ChapterModel.find({
        courseId: data.courseId,
    });

    const existingEnrollments = await EnrollmentModel.find({
        courseId: data.courseId,
        userId: { $in: data.userIds },
    });

    const enrolledIds = new Set(
        existingEnrollments.map((e) => e.userId.toString())
    );

    const enrollments = users
        .filter((user) => !enrolledIds.has(user._id.toString()))
        .map((user) => ({
            userId: user._id,
            courseId: data.courseId,
            organizationId: user.organization,
            groupId: user.groupId,
            enrolledBy: coordinatorId,
            status: "active",
            progress: 0,
        }));

    if (enrollments.length === 0) {
        throw new AppError(
            "All selected users are already enrolled.",
            400,
            "ALREADY_ENROLLED"
        );
    }

    await EnrollmentModel.insertMany(enrollments);

    const progressDocs = [];

    for (const enrollment of enrollments) {
        for (const chapter of chapters) {
            progressDocs.push({
                userId: enrollment.userId,
                courseId: enrollment.courseId,
                chapterId: chapter._id,
                watchedDuration: 0,
                completed: false,
            });
        }
    }

    if (progressDocs.length > 0) {
        await CourseProgressModel.insertMany(progressDocs);
    }



    return {
        assigned: enrollments.length,
    };
};
export const getCourses = async (userInfo: { userId: string; role: string }, organizationId?: string) => {
    if (userInfo.role === "superadmin") {
        if (organizationId) {
            const courses = await OrganizationCourse.find({
                organizationId: organizationId,
            }).populate("courseId",);

            return Promise.all(
                courses
                    .filter((item: any) => item.courseId)
                    .map(async (item: any) => ({
                        _id: item.courseId._id,
                        title: item.courseId.title,
                        thumbnail: item.courseId.thumbnail
                            ? await getVideoStreamUrl(item.courseId.thumbnail)
                            : null,
                    }))
            );
        }
        const courses = await CourseModel.find().select("_id title thumbnail");

        return Promise.all(
            courses.map(async (course) => ({
                _id: course._id,
                title: course.title,
                thumbnail: course.thumbnail
                    ? await getVideoStreamUrl(course.thumbnail)
                    : null,
            }))
        );
    }

    if (userInfo.role === "admin") {
        const courses = await OrganizationCourse.find({
            adminId: userInfo.userId,
        }).populate("courseId", "_id title thumbnail");

        return Promise.all(
            courses
                .filter((item: any) => item.courseId)
                .map(async (item: any) => ({
                    _id: item.courseId._id,
                    title: item.courseId.title,
                    thumbnail: item.courseId.thumbnail
                        ? await getVideoStreamUrl(item.courseId.thumbnail)
                        : null,
                }))
        );
    }

    if (userInfo.role === "coordinator") {
        const user = await Usermodel.findById(userInfo.userId).select("groupId");

        const courses = await GroupCourse.find({
            groupId: user?.groupId,
        }).populate("courseId", "_id title thumbnail");

        return Promise.all(
            courses
                .filter((item: any) => item.courseId)
                .map(async (item: any) => ({
                    _id: item.courseId._id,
                    title: item.courseId.title,
                    thumbnail: item.courseId.thumbnail
                        ? await getVideoStreamUrl(item.courseId.thumbnail)
                        : null,
                }))
        );
    }

    if (userInfo.role === "user") {
        const enrollments = await EnrollmentModel.find({
            userId: userInfo.userId,
        })
            .populate("courseId", "_id title thumbnail")
            .lean();

        return Promise.all(
            (enrollments as any[])
                .filter((e) => e.courseId)
                .map(async (e) => ({
                    _id: e.courseId._id,
                    title: e.courseId.title,
                    thumbnail: e.courseId.thumbnail
                        ? await getVideoStreamUrl(e.courseId.thumbnail)
                        : null,
                }))
        );
    }

    return [];
};
export const assignCourseToGroup = async (
    groupId: string,
    courseId: string,
    userInfo: { userId: string; role: string }
) => {
    if (userInfo.role !== "admin") {
        throw new Error("Only admins can assign courses to groups.");
    }

    const group = await Groupmodel.findById(groupId);

    if (!group) {
        throw new Error("Group not found.");
    }

    const organizationCourse = await OrganizationCourse.findOne({
        organizationId: group.organization,
        courseId,
        status: "active",
    });

    if (!organizationCourse) {
        throw new Error(
            "This course has not been assigned to your organization."
        );
    }

    const exists = await GroupCourse.exists({
        groupId,
        courseId,
    });

    if (exists) {
        throw new Error("Course already assigned to this group.");
    }

    const assignment = await GroupCourse.create({
        organizationCourseId: organizationCourse._id,
        organizationId: group.organization,
        groupId,
        courseId,
        assignedBy: userInfo.userId,
    });
    return assignment;
};



export const assignCourseToOrganization = async (
    organizationId: string,
    courseId: string,
    userInfo: { userId: string; role: string }
) => {
    if (userInfo.role !== "superadmin" && userInfo.role !== "admin") {
        throw new Error("Only Super Admin or Admin can assign courses.");
    }

    const [organization, course] = await Promise.all([
        Organizationmodel.findById(organizationId),
        CourseModel.findById(courseId),
    ]);

    if (!organization) {
        throw new Error("Organization not found.");
    }

    if (!course) {
        throw new Error("Course not found.");
    }

    const alreadyAssigned = await OrganizationCourse.exists({
        organizationId,
        courseId,
    });

    if (alreadyAssigned) {
        throw new Error("Course is already assigned to this organization.");
    }

    const assignment = await OrganizationCourse.create({
        organizationId,
        adminId: organization.adminUserId, // admin of this organization
        courseId,
        assignedBy: userInfo.userId,
    });

    return assignment;
};
export const getassignCourseToOrganization = async (userInfo: { userId: string, role: string }) => {
    const filter =
        userInfo.role === "superadmin"
            ? {}
            : userInfo.role === "admin"
                ? {
                    organizationId: (
                        await Usermodel.findById(userInfo.userId).select(
                            "organization"
                        )
                    )?.organization,
                }
                : null;

    if (filter === null || (userInfo.role === "admin" && !filter.organizationId)) {
        throw new AppError("Forbidden", 403, "FORBIDDEN");
    }

    const OrganizationCourses = await OrganizationCourse.find(filter)
        .populate("courseId organizationId");

    const result = await Promise.all(
        OrganizationCourses.map(async (OrganizationCourse) => ({
            _id: OrganizationCourse._id,
            organizationId: OrganizationCourse.organizationId,
            courseId: OrganizationCourse.courseId,
        }))
    );
    return result;
};

export const getassignCourseToGroup = async (userInfo: { userId: string, role: string }) => {
    const user = await Usermodel.findById(userInfo.userId)
    const OrganizationCourses = await GroupCourse.find({ organizationId: user?.organization })
        .populate("courseId groupId");

    const result = await Promise.all(
        OrganizationCourses.map(async (OrganizationCourse) => ({
            _id: OrganizationCourse._id,
            groupId: OrganizationCourse.groupId,
            courseId: OrganizationCourse.courseId,
        }))
    );
    return result



}

export const getOrganizationCourses = async (
    userInfo: { userId: string, role: string }) => {
    const OrganizationCourses = await OrganizationCourse.find({ adminId: userInfo.userId })
        .populate("courseId");

    const result = await Promise.all(
        OrganizationCourses.map(async (OrganizationCourse) => {
            const course = OrganizationCourse.courseId as {
                title?: string;
                _id?: unknown;
            } | null;
            if (!course?._id) {
                return null;
            }
            return {
                title: course.title,
                _id: course._id,
            };
        })
    );
    return result.filter(Boolean);
};

export const getChapter = async (chapterId: string, userInfo: { userId: string, role: string }) => {
    if (!mongoose.Types.ObjectId.isValid(chapterId)) {
        throw new AppError("Invalid chapter id", 400, "INVALID_CHAPTER_ID");
    }

    const chapter = await ChapterModel.findById(chapterId);
    if (!chapter) {
        throw new AppError("Chapter not found", 404, "CHAPTER_NOT_FOUND");
    }

    if (!chapter.videoUrl) {
        throw new AppError("Video not available", 404, "VIDEO_NOT_FOUND");
    }

    if (userInfo.role === "coordinator") {
        const user = await Usermodel.findById(userInfo.userId);
        const courseEn = await GroupCourse.find({
            courseId: chapter.courseId,
            groupId: user?.groupId,
            status: "active",
        });
        if (courseEn.length === 0) {
            throw new AppError("Forbidden", 403, "FORBIDDEN");
        }
    } else if (userInfo.role === "user") {
        const user = await Usermodel.findById(userInfo.userId);
        const courseEn = await EnrollmentModel.find({
            courseId: chapter.courseId,
            userId: user?._id,
            status: "active",
        });
        if (courseEn.length === 0) {
            throw new AppError("Forbidden", 403, "FORBIDDEN");
        }
    } else {
        throw new AppError("Forbidden", 403, "FORBIDDEN");
    }

    const url = await getVideoStreamUrl(chapter.videoUrl);
    return {
        id: chapter._id,
        title: chapter.title,
        videoUrl: url,
    };
};