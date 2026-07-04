import mongoose from "mongoose";

export const courseOverviewPipeline = (courseId: string) => {
    const id = new mongoose.Types.ObjectId(courseId);

    return [
        {
            $match: {
                _id: id
            }
        },

        // Total Chapters
        {
            $lookup: {
                from: "chapters",
                localField: "_id",
                foreignField: "courseId",
                as: "chapters"
            }
        },

        // Total Enrollments
        {
            $lookup: {
                from: "enrollments",
                localField: "_id",
                foreignField: "courseId",
                as: "enrollments"
            }
        },

        // Course Progress
        {
            $lookup: {
                from: "courseprogresses",
                localField: "_id",
                foreignField: "courseId",
                as: "progress"
            }
        },

        {
            $addFields: {

                totalChapters: {
                    $size: "$chapters"
                },

                totalEnrollments: {
                    $size: "$enrollments"
                }

            }
        },

        {
            $addFields: {

                averageWatchDuration: {
                    $ifNull: [
                        {
                            $avg: "$progress.watchedDuration"
                        },
                        0
                    ]
                }

            }
        },

        // Calculate progress for each student
        {
            $lookup: {
                from: "courseprogresses",
                let: {
                    courseId: "$_id",
                    totalChapters: "$totalChapters"
                },
                pipeline: [

                    {
                        $match: {
                            $expr: {
                                $eq: [
                                    "$courseId",
                                    "$$courseId"
                                ]
                            }
                        }
                    },

                    {
                        $group: {
                            _id: "$userId",

                            completed: {
                                $sum: {
                                    $cond: [
                                        "$completed",
                                        1,
                                        0
                                    ]
                                }
                            }
                        }
                    },

                    {
                        $project: {

                            progress: {

                                $cond: [
                                    {
                                        $eq: [
                                            "$$totalChapters",
                                            0
                                        ]
                                    },

                                    0,

                                    {
                                        $multiply: [
                                            {
                                                $divide: [
                                                    "$completed",
                                                    "$$totalChapters"
                                                ]
                                            },
                                            100
                                        ]
                                    }

                                ]

                            }

                        }
                    }

                ],
                as: "studentProgress"
            }
        },

        {
            $addFields: {

                averageProgress: {

                    $ifNull: [
                        {
                            $avg: "$studentProgress.progress"
                        },
                        0
                    ]
                },

                completedStudents: {

                    $size: {

                        $filter: {

                            input: "$studentProgress",

                            as: "student",

                            cond: {
                                $eq: [
                                    "$$student.progress",
                                    100
                                ]
                            }

                        }

                    }

                }

            }
        },

        {
            $project: {

                title: 1,

                price: 1,

                totalChapters: 1,

                totalEnrollments: 1,

                averageWatchDuration: {
                    $round: [
                        "$averageWatchDuration",
                        2
                    ]
                },

                averageProgress: {
                    $round: [
                        "$averageProgress",
                        2
                    ]
                },

                completedStudents: 1

            }
        }

    ];
};