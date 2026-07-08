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

                }

            }

        }

    ];

};