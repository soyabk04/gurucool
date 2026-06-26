import {z} from "zod";
import mongoose from "mongoose";
import {type Request, type Response, type NextFunction} from "express";
const userSignupValidator =(req: Request, res: Response, next: NextFunction) => {
    const userSchema = z.object({
        name: z.string().min(1, "Name is required"),
        email: z.string().email(),
        password: z.string().min(6, "Password must be at least 6 characters long").optional(),
        role: z.enum(['user', 'superadmin', 'admin', 'coordinator']),
        groupId:z.string().optional(),
        ID: z.string(),
        organization: z
    .string()
    .refine(
      (id) => mongoose.Types.ObjectId.isValid(id),
      "Invalid organization id"
    )
    .transform((id) => new mongoose.Types.ObjectId(id))
    .optional()

    });
    let validUser = [];
    let failedUser= [];
    for(const user of req.body.users)
    {    const validationResult = userSchema.safeParse(user);
    if (!validationResult.success) {
        const errorMessages = validationResult.error.issues.map(issue => issue.message).join(", ");
        failedUser.push({user, error: errorMessages});
        continue;
    }
     validUser.push(validationResult.data);}
    req.body.users = validUser;
    req.body.failedUser=failedUser;
    next();
}
const userSigninValidator =(req: Request, res: Response, next: NextFunction) => {
    const userSchema = z.object({
        email: z.string().email(),
        password: z.string().min(6, "Password must be at least 6 characters long"),
    });
    const validationResult = userSchema.safeParse(req.body);
    if (!validationResult.success) {
        const errorMessages = validationResult.error.issues.map(issue => issue.message).join(", ");
            return res.status(400).send({
                error: errorMessages
            })
    }
    req.body = validationResult.data;
    next();
}
export { userSignupValidator, userSigninValidator };
