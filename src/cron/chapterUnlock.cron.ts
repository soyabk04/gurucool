import cron from "node-cron";
import {
  ChapterAccessDateModel,
  ChapterModel,
  EnrollmentModel,
  CourseModel,
} from "../models/course.model.js";
import { Usermodel } from "../models/user.model.js";
import { sendChapterUnlockedNotification } from "../jobs/email.jobs.js";

function getISTDayRange() {
  const now = new Date();

  const istDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  const startOfDay = new Date(`${istDate}T00:00:00+05:30`);
  const startOfTomorrow = new Date(
    startOfDay.getTime() + 24 * 60 * 60 * 1000
  );

  return {
    startOfDay,
    startOfTomorrow,
    dateKey: istDate,
  };
}

export function startChapterUnlockCron() {
  cron.schedule(
    "0 0 * * *",
    async () => {
      try {
        console.log("Running chapter unlock notification cron...");

        const {
          startOfDay,
          startOfTomorrow,
          dateKey,
        } = getISTDayRange();

        const accessRecords = await ChapterAccessDateModel.find({
          accessDate: {
            $gte: startOfDay,
            $lt: startOfTomorrow,
          },
        }).lean();

        console.log(
          `Found ${accessRecords.length} chapters unlocking today (${dateKey} IST)`
        );

        for (const access of accessRecords) {
          try {
            const enrollment = await EnrollmentModel.findById(
              access.enrollmentId
            ).lean();

            if (!enrollment) {
              console.warn(
                `Enrollment not found: ${access.enrollmentId}`
              );
              continue;
            }

            const user = await Usermodel.findById(
              enrollment.userId
            ).lean();

            if (!user) {
              console.warn(
                `User not found: ${enrollment.userId}`
              );
              continue;
            }

            const chapter = await ChapterModel.findById(
              access.chapterId
            ).lean();

            if (!chapter) {
              console.warn(
                `Chapter not found: ${access.chapterId}`
              );
              continue;
            }

            const course = await CourseModel.findById(
              enrollment.courseId
            ).lean();

            if (!course) {
              console.warn(
                `Course not found: ${enrollment.courseId}`
              );
              continue;
            }

            await sendChapterUnlockedNotification({
              recipient: user.email,
              subject: `New Chapter Unlocked: ${chapter.title}`,
              message: `
                <div style="font-family: Arial, sans-serif;">
                  <h2>Chapter Unlocked 🎉</h2>

                  <p>Hi ${user.name},</p>

                  <p>
                    A new chapter is now available in your course.
                  </p>

                  <p>
                    <strong>Course:</strong> ${course.title}
                  </p>

                  <p>
                    <strong>Chapter:</strong> ${chapter.title}
                  </p>

                  <p>
                    You can now log in to GuruCool and continue learning.
                  </p>

                  <p>
                    Happy learning!
                  </p>
                </div>
              `,
              isHtml: true,
            });

            console.log(
              `Chapter unlock notification queued for ${user.email}`
            );
          } catch (error) {
            console.error(
              `Failed processing chapter ${access.chapterId}:`,
              error
            );
          }
        }
      } catch (error) {
        console.error(
          "Chapter unlock cron failed:",
          error
        );
      }
    },
    {
      timezone: "Asia/Kolkata",
    }
  );

  console.log(
    "Chapter unlock notification cron started - 00:00 IST"
  );
}