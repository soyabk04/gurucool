import mongoose from "mongoose";

export const dashboardPipeline = (
    user: any
) => {

    const match: any = {};

    if (user.role === "admin") {

        match.organization = user.organization;

    }

    if (user.role === "coordinator") {

        match.groupId = user.groupId;
        match.organization = user.organization;

    }

    return [

        {
            $match: match
        },

        {
            $facet: {

                students: [

                    {
                        $count: "count"
                    }

                ],

                activeStudents: [

                    {
                        $match: {
                            otpverified: true
                        }
                    },

                    {
                        $count: "count"
                    }

                ],

                organizations: [

                    {
                        $lookup: {

                            from: "organizations",

                            pipeline: [

                                {
                                    $count: "count"
                                }

                            ],

                            as: "organization"

                        }
                    }

                ],

                groups: [

                    {
                        $lookup: {

                            from: "groups",

                            pipeline: [

                                {
                                    $count: "count"
                                }

                            ],

                            as: "groups"

                        }
                    }

                ],

                courses: [

                    {
                        $lookup: {

                            from: "courses",



                            pipeline: [

                                {
                                    $count: "count"
                                }

                            ],

                            as: "courses"

                        }
                    }

                ],

                enrollments: [

                    {
                        $lookup: {

                            from: "enrollments",

                            pipeline: [

                                {
                                    $count: "count"
                                }

                            ],

                            as: "enrollments"

                        }
                    }

                ]

            }

        },

        {

            $project: {

                totalStudents: {

                    $ifNull: [

                        {
                            $arrayElemAt: [
                                "$students.count",
                                0
                            ]
                        },

                        0

                    ]

                },

                activeStudents: {

                    $ifNull: [

                        {
                            $arrayElemAt: [
                                "$activeStudents.count",
                                0
                            ]
                        },

                        0

                    ]

                },

                totalOrganizations: {

                    $ifNull: [

                        {
                            $arrayElemAt: [
                                "$organizations.organization.count",
                                0
                            ]
                        },

                        0

                    ]

                },

                totalGroups: {

                    $ifNull: [

                        {
                            $arrayElemAt: [
                                "$groups.groups.count",
                                0
                            ]
                        },

                        0

                    ]

                },

                totalCourses: {

                    $ifNull: [

                        {
                            $arrayElemAt: [
                                "$courseAssignments.courses.count",
                                0
                            ]
                        },

                        0

                    ]

                },

                totalEnrollments: {

                    $ifNull: [

                        {
                            $arrayElemAt: [
                                "$enrollments.enrollments.count",
                                0
                            ]
                        },

                        0

                    ]

                }

            }

        }

    ];

};