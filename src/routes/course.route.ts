import { Router } from "express";
import { createCourseController } from "../controller/course.controller.js";

const courseRouter = Router();

courseRouter.post("/", createCourseController);

export default courseRouter;