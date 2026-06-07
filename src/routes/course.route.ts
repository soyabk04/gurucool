import { Router } from "express";
import { createChapterController, createCourseController } from "../controller/course.controller.js";

const courseRouter = Router();

courseRouter.post("/", createCourseController);
courseRouter.post("/chapter", createChapterController);

export default courseRouter;