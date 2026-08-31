import { Usermodel } from "../models/user.model.js";

import mongoose, { Types } from "mongoose";
import { Groupmodel } from "../models/organization.model.js";
import { CourseModel, EnrollmentModel } from "../models/course.model.js";
import { Organizationmodel } from "../models/organization.model.js";
import { GroupCourse } from "../models/course.model.js";
import { DashboardStats } from "../types/analytics.type.js";
import { StudentActivity, EnrollmentTrend, CompletionDistribution, PopularCourse } from "../types/analytics.type.js";


export async function getDashboardStats(
    organizationId: mongoose.Types.ObjectId
): Promise<DashboardStats> {

    const thirtyDaysAgo = new Date();

    thirtyDaysAgo.setDate(
        thirtyDaysAgo.getDate() - 30
    );

    const [

        totalStudents,

        totalCoordinators,

        totalGroups,

        totalCourses,

        totalEnrollments,

        activeStudents,

        progress,

        completion,

    ] = await Promise.all([

        Usermodel.countDocuments({

            organization: organizationId,

            role: "user",

        }),

        Usermodel.countDocuments({

            organization: organizationId,

            role: "coordinator",

        }),

        Groupmodel.countDocuments({

            organization: organizationId,

        }),

        CourseModel.countDocuments(),

        EnrollmentModel.countDocuments({

            organizationId,

        }),

        EnrollmentModel.distinct("userId", {

            organizationId,

            updatedAt: {

                $gte: thirtyDaysAgo,

            },

        }),

        EnrollmentModel.aggregate([

            {

                $match: {

                    organizationId,

                },

            },

            {

                $group: {

                    _id: null,

                    averageProgress: {

                        $avg: "$progress",

                    },

                },

            },

        ]),

        EnrollmentModel.aggregate([

            {

                $match: {

                    organizationId,

                },

            },

            {

                $group: {

                    _id: null,

                    total: {

                        $sum: 1,

                    },

                    completed: {

                        $sum: {

                            $cond: [

                                {

                                    $eq: [

                                        "$status",

                                        "completed",

                                    ],

                                },

                                1,

                                0,

                            ],

                        },

                    },

                },

            },

        ]),

    ]);

    const averageProgress =
        progress[0]?.averageProgress ?? 0;

    const completionRate =
        completion.length === 0
            ? 0
            : Math.round(
                (completion[0].completed /
                    completion[0].total) *
                100
            );

    return {

        totalStudents,

        totalCoordinators,

        totalGroups,

        totalCourses,

        totalEnrollments,

        activeStudents:

            activeStudents.length,

        averageProgress:

            Math.round(averageProgress),

        completionRate,

    };
}

export async function getStudentActivity(
    organizationId: mongoose.Types.ObjectId
): Promise<StudentActivity[]> {

    const start = new Date();

    start.setDate(start.getDate() - 29);

    const activity = await EnrollmentModel.aggregate([

        {
            $match: {
                organizationId,
                updatedAt: {
                    $gte: start,
                },
            },
        },

        {
            $group: {

                _id: {

                    date: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$updatedAt",
                        },
                    },

                    user: "$userId",
                },
            },
        },

        {
            $group: {

                _id: "$_id.date",

                activeStudents: {
                    $sum: 1,
                },
            },
        },

        {
            $sort: {
                _id: 1,
            },
        },

        {
            $project: {

                _id: 0,

                day: "$_id",

                activeStudents: 1,
            },
        },

    ]);

    return activity;
}
export async function getEnrollmentTrend(
    organizationId: mongoose.Types.ObjectId
): Promise<EnrollmentTrend[]> {

    return EnrollmentModel.aggregate([

        {
            $match: {
                organizationId,
            },
        },

        {
            $group: {

                _id: {

                    month: {
                        $dateToString: {
                            format: "%b",
                            date: "$createdAt",
                        },
                    },
                },

                enrollments: {
                    $sum: 1,
                },
            },
        },

        {
            $project: {

                _id: 0,

                month: "$_id.month",

                enrollments: 1,
            },
        },

        {
            $sort: {
                month: 1,
            },
        },

    ]);
}


export async function getCompletionDistribution(
    organizationId: Types.ObjectId
): Promise<any[]> {

    const enrollments = await EnrollmentModel.find({
        organizationId,
    }).select(
        "_id userId groupId progress status"
    );

    console.log(
        "ENROLLMENTS:",
        JSON.stringify(enrollments, null, 2)
    );

    const [result] =
        await EnrollmentModel.aggregate([

            {
                $match: {
                    organizationId,
                },
            },

            {
                $group: {
                    _id: null,

                    completed: {
                        $sum: {
                            $cond: [
                                {
                                    $gte: [
                                        "$progress",
                                        100,
                                    ],
                                },
                                1,
                                0,
                            ],
                        },
                    },

                    inProgress: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        {
                                            $gt: [
                                                "$progress",
                                                0,
                                            ],
                                        },
                                        {
                                            $lt: [
                                                "$progress",
                                                100,
                                            ],
                                        },
                                    ],
                                },
                                1,
                                0,
                            ],
                        },
                    },

                    notStarted: {
                        $sum: {
                            $cond: [
                                {
                                    $eq: [
                                        "$progress",
                                        0,
                                    ],
                                },
                                1,
                                0,
                            ],
                        },
                    },
                },
            },
        ]);

    console.log("COMPLETION RESULT:", result);

    return [
        {
            name: "Completed",
            value: result?.completed ?? 0,
        },
        {
            name: "In Progress",
            value: result?.inProgress ?? 0,
        },
        {
            name: "Not Started",
            value: result?.notStarted ?? 0,
        },
    ];
}


export async function getPopularCourses(
    organizationId: mongoose.Types.ObjectId
): Promise<PopularCourse[]> {

    return EnrollmentModel.aggregate([

        {
            $match: {
                organizationId,
            },
        },

        {
            $group: {

                _id: "$courseId",

                students: {
                    $sum: 1,
                },
            },
        },

        {
            $sort: {
                students: -1,
            },
        },

        {
            $limit: 5,
        },

        {
            $lookup: {

                from: "courses",

                localField: "_id",

                foreignField: "_id",

                as: "course",
            },
        },

        {
            $unwind: "$course",
        },

        {
            $project: {

                _id: 0,

                id: "$course._id",

                name: "$course.title",

                students: 1,
            },
        },

    ]);
}

export async function getGroupsOverview(
    organizationId: Types.ObjectId
) {

    return Groupmodel.aggregate([

        {
            $match: {
                organization: organizationId
            }
        },

        {
            $lookup: {
                from: "users",

                localField: "coordinator",

                foreignField: "_id",

                as: "coordinator"
            }
        },

        {
            $lookup: {
                from: "enrollments",

                localField: "_id",

                foreignField: "groupId",

                as: "enrollments"
            }
        },

        {
            $project: {

                _id: 1,

                name: 1,

                coordinator: {
                    $ifNull: [
                        {
                            $arrayElemAt: [
                                "$coordinator.name",
                                0
                            ]
                        },
                        "Not Assigned"
                    ]
                },

                students: {
                    $size: "$enrollments"
                },

                progress: {
                    $round: [
                        {
                            $avg: "$enrollments.progress"
                        },
                        0
                    ]
                },

                completion: {
                    $round: [
                        {
                            $multiply: [

                                {

                                    $divide: [

                                        {

                                            $size: {
                                                $filter: {

                                                    input: "$enrollments",

                                                    as: "e",

                                                    cond: {
                                                        $gte: [
                                                            "$$e.progress",
                                                            100
                                                        ]
                                                    }
                                                }
                                            }

                                        },

                                        {

                                            $max: [
                                                {
                                                    $size: "$enrollments"
                                                },
                                                1
                                            ]

                                        }

                                    ]

                                },

                                100

                            ]
                        },

                        0

                    ]
                }

            }

        },

        {
            $sort: {
                students: -1
            }
        }

    ]);

}
export async function getRecentActivities(
  organizationId: Types.ObjectId
) {
  return EnrollmentModel.aggregate([
    {
      $match: {
        organizationId,
      },
    },

    {
      $sort: {
        updatedAt: -1,
      },
    },

    {
      $limit: 10,
    },

    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },

    {
      $lookup: {
        from: "courses",
        localField: "courseId",
        foreignField: "_id",
        as: "course",
      },
    },

    {
      $project: {
        _id: 1,

        user: {
          $arrayElemAt: ["$user.name", 0],
        },

        action: {
          $cond: [
            {
              $eq: ["$status", "completed"],
            },
            "completed",
            "enrolled",
          ],
        },

        target: {
          $arrayElemAt: ["$course.title", 0],
        },

        createdAt: "$updatedAt",
      },
    },
  ]);
}
export async function getCoordinatorPerformance(
    organizationId: Types.ObjectId
) {

    return Groupmodel.aggregate([

        {
            $match: {
                organization: organizationId
            }
        },

        {
            $lookup: {
                from: "users",

                localField: "coordinator",

                foreignField: "_id",

                as: "coordinator"
            }
        },

        {
            $lookup: {
                from: "enrollments",

                localField: "_id",

                foreignField: "groupId",

                as: "enrollments"
            }
        },

        {

            $project: {

                name: {
                    $arrayElemAt: [
                        "$coordinator.name",
                        0
                    ]
                },

                students: {
                    $size: "$enrollments"
                },

                progress: {
                    $round: [
                        {
                            $avg: "$enrollments.progress"
                        },
                        0
                    ]
                }

            }

        },

        {

            $sort: {
                progress: -1
            }

        }

    ]);

}

export async function getTopGroups(
    organizationId: Types.ObjectId
) {

    return Groupmodel.aggregate([

        {
            $match: {
                organization: organizationId
            }
        },

        {
            $lookup: {
                from: "enrollments",

                localField: "_id",

                foreignField: "groupId",

                as: "enrollments"
            }
        },

        {

            $project: {

                name: 1,

                progress: {
                    $avg: "$enrollments.progress"
                }

            }

        },

        {

            $sort: {
                progress: -1
            }

        },

        {

            $limit: 5

        }

    ]);

}


export async function getLowestGroups(
  organizationId: Types.ObjectId
) {
  return Groupmodel.aggregate([
    {
      $match: {
        organization: organizationId,
      },
    },

    {
      $lookup: {
        from: "enrollments",
        localField: "_id",
        foreignField: "groupId",
        as: "enrollments",
      },
    },

    {
      $lookup: {
        from: "users",
        localField: "coordinator",
        foreignField: "_id",
        as: "coordinator",
      },
    },

    {
      $project: {
        _id: 1,

        name: 1,

        coordinator: {
          $ifNull: [
            {
              $arrayElemAt: ["$coordinator.name", 0],
            },
            "Not Assigned",
          ],
        },

        students: {
          $size: "$enrollments",
        },

        progress: {
          $round: [
            {
              $ifNull: [
                {
                  $avg: "$enrollments.progress",
                },
                0,
              ],
            },
            0,
          ],
        },

        completion: {
          $round: [
            {
              $multiply: [
                {
                  $divide: [
                    {
                      $size: {
                        $filter: {
                          input: "$enrollments",
                          as: "enrollment",
                          cond: {
                            $gte: [
                              "$$enrollment.progress",
                              100,
                            ],
                          },
                        },
                      },
                    },
                    {
                      $max: [
                        {
                          $size: "$enrollments",
                        },
                        1,
                      ],
                    },
                  ],
                },
                100,
              ],
            },
            0,
          ],
        },
      },
    },

    // Ignore empty groups
    {
      $match: {
        students: {
          $gt: 0,
        },
      },
    },

    {
      $sort: {
        progress: 1,
      },
    },

    {
      $limit: 5,
    },
  ]);
}

export async function getDashboardService(
    userInfo: { userId: string; role: string }
) 
{
    console.log("🔥 DASHBOARD SERVICE START");

    const user = await Usermodel.findById(
        userInfo.userId,
    );

    console.log("🔥 USER:", user?._id);

    if (!user) {
        throw new Error("User not found");
    }

    const organizationId = user.organization;

    console.log(
        "🔥 ORGANIZATION ID:",
        organizationId
    );

    if (!organizationId) {
        throw new Error(
            "User does not belong to any organization"
        );
    }

    const organization = await Organizationmodel.findById(
        organizationId,
        "name primaryColor secondaryColor logoUrl"
    ).lean();

    if (!organization) {
        throw new Error("Organization not found");
    }

    console.log(
        "🔥 BEFORE DASHBOARD PROMISES"
    );

    const [
        stats,
        studentActivity,
        enrollmentTrend,
        completion,
        popularCourses,
        groups,
        recentActivities,
        coordinatorPerformance,
        topGroups,
        lowestGroups,
    ] = await Promise.all([
        getDashboardStats(organizationId),

        getStudentActivity(organizationId),

        getEnrollmentTrend(organizationId),

        getCompletionDistribution(organizationId),

        getPopularCourses(organizationId),

        getGroupsOverview(organizationId),

        getRecentActivities(organizationId),

        getCoordinatorPerformance(organizationId),

        getTopGroups(organizationId),

        getLowestGroups(organizationId),
    ]);

    console.log(
        "🔥 AFTER DASHBOARD PROMISES"
    );

    console.log(
        "🔥 COMPLETION:",
        completion
    );

    return {
        organization,

        stats,

        charts: {
            studentActivity,
            enrollmentTrend,
            completion,
            popularCourses,
        },

        groups,

        recentActivities,

        coordinatorPerformance,

        topGroups,

        lowestGroups,
    };
}




// ============================================================
// Types
// ============================================================

export interface CoordinatorDashboardStats {
    totalStudents: number;
    activeStudents: number;
    totalCourses: number;
    totalEnrollments: number;
    averageProgress: number;
    completionRate: number;
}

export interface CoordinatorStudentActivity {
    day: string;
    activeStudents: number;
}

export interface CoordinatorCoursePerformance {
    id: Types.ObjectId;
    name: string;
    students: number;
    progress: number;
    completed: number;
    completionRate: number;
}

export interface CoordinatorCompletionDistribution {
    name: string;
    value: number;
}

export interface StudentAttention {
    id: Types.ObjectId;
    name: string;
    email: string;
    course: string;
    progress: number;
    status: string;
    updatedAt: Date;
}

export interface CoordinatorRecentActivity {
    _id: Types.ObjectId;
    user: string;
    action: string;
    target: string;
    progress: number;
    createdAt: Date;
}


// ============================================================
// Get Coordinator Group
// ============================================================

async function getCoordinatorGroup(
    coordinatorId: string
) {
    const coordinatorObjectId =
        new mongoose.Types.ObjectId(coordinatorId);

    const group = await Groupmodel
        .findOne({
            coordinator: coordinatorObjectId,
        })
        .lean();

    if (!group) {
        throw new Error(
            "Coordinator is not assigned to any group"
        );
    }

    return group;
}


// ============================================================
// Dashboard Stats
// ============================================================

export async function getCoordinatorDashboardStats(
    groupId: Types.ObjectId
): Promise<CoordinatorDashboardStats> {

    const thirtyDaysAgo = new Date();

    thirtyDaysAgo.setDate(
        thirtyDaysAgo.getDate() - 30
    );


    const [
        totalStudents,
        activeStudents,
        totalCourses,
        totalEnrollments,
        progress,
        completion,
    ] = await Promise.all([

        // ----------------------------------------------------
        // Total Students
        // ----------------------------------------------------

        Usermodel.countDocuments({
            groupId,
            role: "user",
        }),


        // ----------------------------------------------------
        // Active Students
        // ----------------------------------------------------

        EnrollmentModel.distinct("userId", {
            groupId,
            updatedAt: {
                $gte: thirtyDaysAgo,
            },
        }),


        // ----------------------------------------------------
        // Total Courses
        // ----------------------------------------------------

        GroupCourse.countDocuments({
            groupId,
            status: "active",
        }),


        // ----------------------------------------------------
        // Total Enrollments
        // ----------------------------------------------------

        EnrollmentModel.countDocuments({
            groupId,
        }),


        // ----------------------------------------------------
        // Average Progress
        // ----------------------------------------------------

        EnrollmentModel.aggregate([
            {
                $match: {
                    groupId,
                },
            },

            {
                $group: {
                    _id: null,

                    averageProgress: {
                        $avg: "$progress",
                    },
                },
            },
        ]),


        // ----------------------------------------------------
        // Completion
        // ----------------------------------------------------

        EnrollmentModel.aggregate([
            {
                $match: {
                    groupId,
                },
            },

            {
                $group: {
                    _id: null,

                    total: {
                        $sum: 1,
                    },

                    completed: {
                        $sum: {
                            $cond: [
                                {
                                    $gte: [
                                        "$progress",
                                        100,
                                    ],
                                },

                                1,
                                0,
                            ],
                        },
                    },
                },
            },
        ]),
    ]);


    const averageProgress =
        progress[0]?.averageProgress ?? 0;


    const completionRate =
        completion.length === 0
            ? 0
            : Math.round(
                (
                    completion[0].completed /
                    completion[0].total
                ) * 100
            );


    return {
        totalStudents,

        activeStudents:
            activeStudents.length,

        totalCourses,

        totalEnrollments,

        averageProgress:
            Math.round(averageProgress),

        completionRate,
    };
}


// ============================================================
// Student Activity - Last 30 Days
// ============================================================

export async function getCoordinatorStudentActivity(
    groupId: Types.ObjectId
): Promise<CoordinatorStudentActivity[]> {

    const start = new Date();

    start.setDate(
        start.getDate() - 29
    );


    const activity =
        await EnrollmentModel.aggregate([

            // ------------------------------------------------
            // Only this group
            // ------------------------------------------------

            {
                $match: {
                    groupId,

                    updatedAt: {
                        $gte: start,
                    },
                },
            },


            // ------------------------------------------------
            // One activity per student per day
            // ------------------------------------------------

            {
                $group: {
                    _id: {
                        date: {
                            $dateToString: {
                                format: "%Y-%m-%d",
                                date: "$updatedAt",
                            },
                        },

                        user: "$userId",
                    },
                },
            },


            // ------------------------------------------------
            // Count students
            // ------------------------------------------------

            {
                $group: {
                    _id: "$_id.date",

                    activeStudents: {
                        $sum: 1,
                    },
                },
            },


            // ------------------------------------------------
            // Sort
            // ------------------------------------------------

            {
                $sort: {
                    _id: 1,
                },
            },


            // ------------------------------------------------
            // Response shape
            // ------------------------------------------------

            {
                $project: {
                    _id: 0,

                    day: "$_id",

                    activeStudents: 1,
                },
            },
        ]);


    return activity;
}


// ============================================================
// Course Performance
// ============================================================

export async function getCoordinatorCoursePerformance(
    groupId: Types.ObjectId
): Promise<CoordinatorCoursePerformance[]> {

    return EnrollmentModel.aggregate([

        // ----------------------------------------------------
        // Only this group
        // ----------------------------------------------------

        {
            $match: {
                groupId,
            },
        },


        // ----------------------------------------------------
        // Group by course
        // ----------------------------------------------------

        {
            $group: {

                _id: "$courseId",

                students: {
                    $sum: 1,
                },

                progress: {
                    $avg: "$progress",
                },

                completed: {
                    $sum: {
                        $cond: [
                            {
                                $eq: [
                                    "$status",
                                    "completed",
                                ],
                            },

                            1,
                            0,
                        ],
                    },
                },
            },
        },


        // ----------------------------------------------------
        // Course information
        // ----------------------------------------------------

        {
            $lookup: {
                from: "courses",

                localField: "_id",

                foreignField: "_id",

                as: "course",
            },
        },


        {
            $unwind: "$course",
        },


        // ----------------------------------------------------
        // Calculate completion rate
        // ----------------------------------------------------

        {
            $project: {

                _id: 0,

                id: "$course._id",

                name: "$course.title",

                students: 1,

                progress: {
                    $round: [
                        "$progress",
                        0,
                    ],
                },

                completed: 1,

                completionRate: {
                    $round: [
                        {
                            $multiply: [
                                {
                                    $divide: [
                                        "$completed",
                                        {
                                            $max: [
                                                "$students",
                                                1,
                                            ],
                                        },
                                    ],
                                },

                                100,
                            ],
                        },

                        0,
                    ],
                },
            },
        },


        // ----------------------------------------------------
        // Highest enrollment first
        // ----------------------------------------------------

        {
            $sort: {
                students: -1,
            },
        },
    ]);
}


// ============================================================
// Completion Distribution
// ============================================================

export async function getCoordinatorCompletionDistribution(
    groupId: Types.ObjectId
): Promise<CoordinatorCompletionDistribution[]> {

    const result =
        await EnrollmentModel.aggregate([

            {
                $match: {
                    groupId,
                },
            },


            {
                $group: {

                    _id: "$status",

                    value: {
                        $sum: 1,
                    },
                },
            },
        ]);


    const map = new Map(
        result.map(item => [
            item._id,
            item.value,
        ])
    );


    return [

        {
            name: "Completed",

            value:
                map.get("completed") ?? 0,
        },

        {
            name: "In Progress",

            value:
                map.get("active") ?? 0,
        },

        {
            name: "Not Started",

            value:
                map.get("pending") ?? 0,
        },
    ];
}


// ============================================================
// Students Needing Attention
// ============================================================

export async function getStudentsNeedingAttention(
    groupId: Types.ObjectId
): Promise<StudentAttention[]> {

    return EnrollmentModel.aggregate([

        // ----------------------------------------------------
        // Low progress students
        // ----------------------------------------------------

        {
            $match: {

                groupId,

                status: "active",

                progress: {
                    $lt: 30,
                },
            },
        },


        // ----------------------------------------------------
        // Student
        // ----------------------------------------------------

        {
            $lookup: {
                from: "users",

                localField: "userId",

                foreignField: "_id",

                as: "user",
            },
        },


        {
            $unwind: "$user",
        },


        // ----------------------------------------------------
        // Course
        // ----------------------------------------------------

        {
            $lookup: {
                from: "courses",

                localField: "courseId",

                foreignField: "_id",

                as: "course",
            },
        },


        {
            $unwind: "$course",
        },


        // ----------------------------------------------------
        // Response
        // ----------------------------------------------------

        {
            $project: {

                _id: "$user._id",

                name: "$user.name",

                email: "$user.email",

                course: "$course.title",

                progress: 1,

                status: 1,

                updatedAt: 1,
            },
        },


        // ----------------------------------------------------
        // Lowest progress first
        // ----------------------------------------------------

        {
            $sort: {
                progress: 1,
            },
        },


        // ----------------------------------------------------
        // Limit results
        // ----------------------------------------------------

        {
            $limit: 10,
        },
    ]);
}


// ============================================================
// Recent Activities
// ============================================================

export async function getCoordinatorRecentActivities(
    groupId: Types.ObjectId
): Promise<CoordinatorRecentActivity[]> {

    return EnrollmentModel.aggregate([

        // ----------------------------------------------------
        // Group only
        // ----------------------------------------------------

        {
            $match: {
                groupId,
            },
        },


        // ----------------------------------------------------
        // Most recent first
        // ----------------------------------------------------

        {
            $sort: {
                updatedAt: -1,
            },
        },


        // ----------------------------------------------------
        // Latest 10
        // ----------------------------------------------------

        {
            $limit: 10,
        },


        // ----------------------------------------------------
        // User
        // ----------------------------------------------------

        {
            $lookup: {
                from: "users",

                localField: "userId",

                foreignField: "_id",

                as: "user",
            },
        },


        // ----------------------------------------------------
        // Course
        // ----------------------------------------------------

        {
            $lookup: {
                from: "courses",

                localField: "courseId",

                foreignField: "_id",

                as: "course",
            },
        },


        // ----------------------------------------------------
        // Response
        // ----------------------------------------------------

        {
            $project: {

                _id: 1,

                user: {
                    $arrayElemAt: [
                        "$user.name",
                        0,
                    ],
                },

                action: {
                    $cond: [

                        {
                            $eq: [
                                "$status",
                                "completed",
                            ],
                        },

                        "completed",

                        "enrolled",
                    ],
                },

                target: {
                    $arrayElemAt: [
                        "$course.title",
                        0,
                    ],
                },

                progress: 1,

                createdAt: "$updatedAt",
            },
        },
    ]);
}


// ============================================================
// Coordinator Dashboard Service
// ============================================================

export async function getCoordinatorDashboardService(
    userInfo: {
        userId: string;
        role: string;
    }
) {

    // --------------------------------------------------------
    // Validate role
    // --------------------------------------------------------

    if (userInfo.role !== "coordinator") {
        throw new Error(
            "Only coordinators can access this dashboard"
        );
    }


    // --------------------------------------------------------
    // Get coordinator's group
    // --------------------------------------------------------

    const group =
        await getCoordinatorGroup(
            userInfo.userId
        );


    const groupId =
        group._id as Types.ObjectId;


    // --------------------------------------------------------
    // Run dashboard queries concurrently
    // --------------------------------------------------------

    const [
        stats,
        studentActivity,
        coursePerformance,
        completion,
        studentsNeedingAttention,
        recentActivities,
    ] = await Promise.all([

        getCoordinatorDashboardStats(
            groupId
        ),

        getCoordinatorStudentActivity(
            groupId
        ),

        getCoordinatorCoursePerformance(
            groupId
        ),

        getCoordinatorCompletionDistribution(
            groupId
        ),

        getStudentsNeedingAttention(
            groupId
        ),

        getCoordinatorRecentActivities(
            groupId
        ),
    ]);


    // --------------------------------------------------------
    // Return dashboard
    // --------------------------------------------------------

    return {

        group: {
            id: group._id,

            name: group.name,

            groupCode: group.groupCode,
        },

        stats,

        charts: {

            studentActivity,

            coursePerformance,

            completion,
        },

        studentsNeedingAttention,

        recentActivities,
    };
}




//userDashboard
// ============================================================
// Types
// ============================================================

export interface UserDashboardStats {
    totalCourses: number;
    completedCourses: number;
    activeCourses: number;
    averageProgress: number;
    completionRate: number;
}

export interface UserCourse {
    id: Types.ObjectId;
    name: string;
    progress: number;
    status: string;
    updatedAt: Date;
}

export interface UserCompletionDistribution {
    name: string;
    value: number;
}

export interface UserRecentActivity {
    _id: Types.ObjectId;
    action: string;
    target: string;
    progress: number;
    createdAt: Date;
}


// ============================================================
// Dashboard Stats
// ============================================================

export async function getUserDashboardStats(
    userId: Types.ObjectId
): Promise<UserDashboardStats> {

    const [
        totalCourses,
        completedCourses,
        activeCourses,
        progress,
    ] = await Promise.all([

        // ----------------------------------------------------
        // Total enrolled courses
        // ----------------------------------------------------

        EnrollmentModel.countDocuments({
            userId,
        }),


        // ----------------------------------------------------
        // Completed courses
        // ----------------------------------------------------

        EnrollmentModel.countDocuments({
            userId,
            progress: {
                $gte: 100,
            },
        }),


        // ----------------------------------------------------
        // Active courses
        // ----------------------------------------------------

        EnrollmentModel.countDocuments({
            userId,
            progress: {
                $lt: 100,
            },
        }),


        // ----------------------------------------------------
        // Average progress
        // ----------------------------------------------------

        EnrollmentModel.aggregate([

            {
                $match: {
                    userId,
                },
            },

            {
                $group: {

                    _id: null,

                    averageProgress: {
                        $avg: "$progress",
                    },
                },
            },
        ]),
    ]);


    const averageProgress =
        progress[0]?.averageProgress ?? 0;


    const completionRate =
        totalCourses === 0
            ? 0
            : Math.round(
                (completedCourses / totalCourses) * 100
            );


    return {
        totalCourses,

        completedCourses,

        activeCourses,

        averageProgress:
            Math.round(averageProgress),

        completionRate,
    };
}


// ============================================================
// My Courses
// ============================================================

export async function getUserCourses(
    userId: Types.ObjectId
): Promise<UserCourse[]> {

    return EnrollmentModel.aggregate([

        // ----------------------------------------------------
        // Only this user's enrollments
        // ----------------------------------------------------

        {
            $match: {
                userId,
            },
        },


        // ----------------------------------------------------
        // Get course
        // ----------------------------------------------------

        {
            $lookup: {

                from: "courses",

                localField: "courseId",

                foreignField: "_id",

                as: "course",
            },
        },


        {
            $unwind: "$course",
        },


        // ----------------------------------------------------
        // Response
        // ----------------------------------------------------

        {
            $project: {

                _id: 0,

                id: "$course._id",

                name: "$course.title",

                progress: 1,

                status: 1,

                updatedAt: 1,
            },
        },


        // ----------------------------------------------------
        // Most recently updated first
        // ----------------------------------------------------

        {
            $sort: {
                updatedAt: -1,
            },
        },
    ]);
}


// ============================================================
// Completion Distribution
// ============================================================

export async function getUserCompletionDistribution(
    userId: Types.ObjectId
): Promise<UserCompletionDistribution[]> {

    const result =
        await EnrollmentModel.aggregate([

            {
                $match: {
                    userId,
                },
            },

            {
                $group: {

                    _id: "$status",

                    value: {
                        $sum: 1,
                    },
                },
            },
        ]);


    const map = new Map(
        result.map(item => [
            item._id,
            item.value,
        ])
    );


    return [

        {
            name: "Completed",

            value:
                map.get("completed") ?? 0,
        },

        {
            name: "progress",

            value:
                map.get("active") ?? 0,
        },
    ];
}


// ============================================================
// Recent Activity
// ============================================================

export async function getUserRecentActivities(
    userId: Types.ObjectId
): Promise<UserRecentActivity[]> {

    return EnrollmentModel.aggregate([

        // ----------------------------------------------------
        // Only this user's enrollments
        // ----------------------------------------------------

        {
            $match: {
                userId,
            },
        },


        // ----------------------------------------------------
        // Most recent first
        // ----------------------------------------------------

        {
            $sort: {
                updatedAt: -1,
            },
        },


        // ----------------------------------------------------
        // Latest 10
        // ----------------------------------------------------

        {
            $limit: 10,
        },


        // ----------------------------------------------------
        // Course
        // ----------------------------------------------------

        {
            $lookup: {

                from: "courses",

                localField: "courseId",

                foreignField: "_id",

                as: "course",
            },
        },


        // ----------------------------------------------------
        // Response
        // ----------------------------------------------------

        {
            $project: {

                _id: 1,

                action: {
                    $cond: [

                        {
                            $eq: [
                                "$status",
                                "completed",
                            ],
                        },

                        "completed",

                        "enrolled",
                    ],
                },

                target: {
                    $arrayElemAt: [
                        "$course.title",
                        0,
                    ],
                },

                progress: 1,

                createdAt: "$updatedAt",
            },
        },
    ]);
}


// ============================================================
// User Dashboard Service
// ============================================================

export async function getUserDashboardService(
    userInfo: {
        userId: string;
        role: string;
    }
) {

    // --------------------------------------------------------
    // Validate role
    // --------------------------------------------------------

    if (userInfo.role !== "user") {
        throw new Error(
            "Only users can access this dashboard"
        );
    }


    // --------------------------------------------------------
    // Validate ObjectId
    // --------------------------------------------------------

    if (
        !mongoose.Types.ObjectId.isValid(
            userInfo.userId
        )
    ) {
        throw new Error("Invalid user ID");
    }


    const userId =
        new mongoose.Types.ObjectId(
            userInfo.userId
        );


    // --------------------------------------------------------
    // Make sure user exists
    // --------------------------------------------------------

    const user = await Usermodel
        .findById(userId)
        .select("_id name email")
        .lean();


    if (!user) {
        throw new Error("User not found");
    }


    // --------------------------------------------------------
    // Run dashboard queries concurrently
    // --------------------------------------------------------

    const [
        stats,
        courses,
        completion,
        recentActivities,
    ] = await Promise.all([

        getUserDashboardStats(
            userId
        ),

        getUserCourses(
            userId
        ),

        getUserCompletionDistribution(
            userId
        ),

        getUserRecentActivities(
            userId
        ),
    ]);


    // --------------------------------------------------------
    // Return dashboard
    // --------------------------------------------------------

    return {

        user: {
            id: user._id,
            name: user.name,
            email: user.email,
        },

        stats,

        courses,

        charts: {
            completion,
        },

        recentActivities,
    };
}

