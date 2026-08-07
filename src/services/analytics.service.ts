import { Usermodel } from "../models/user.model.js";

import mongoose, { Types } from "mongoose";
import { Groupmodel } from "../models/organization.model.js";
import { CourseModel, EnrollmentModel } from "../models/course.model.js";
import { Organizationmodel } from "../models/organization.model.js";
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
    organizationId: mongoose.Types.ObjectId
): Promise<CompletionDistribution[]> {

    const result = await EnrollmentModel.aggregate([

        {
            $match: {
                organizationId,
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
        result.map(item => [item._id, item.value])
    );

    return [

        {
            name: "Completed",
            value: map.get("completed") ?? 0,
        },

        {
            name: "In Progress",
            value: map.get("active") ?? 0,
        },

        {
            name: "Not Started",
            value: map.get("pending") ?? 0,
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
                                                        $eq: [
                                                            "$$e.status",
                                                            "completed"
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
                            $eq: [
                              "$$enrollment.status",
                              "completed",
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
    userInfo:{userId: string, role: string}
) {
    const user = await Usermodel.findById(
        userInfo.userId,
    )
    if (!user) {
        throw new Error("User not found");
    }

    const organizationId = user.organization;
    if (!organizationId) {
        throw new Error("User does not belong to any organization");
    }
    const organization = await Organizationmodel.findById(
        organizationId,
        "name primaryColor secondaryColor logoUrl"
    ).lean();

    if (!organization) {
        throw new Error("Organization not found");
    }

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
    };}