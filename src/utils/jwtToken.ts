import jwt from "jsonwebtoken";
import { ATJWTKEY,RTJWTKEY } from "../config/env.config.js";

const generateToken = (payload: object): { accesstoken: string; refreshtoken: string } => {
       const accesstoken = jwt.sign(payload, ATJWTKEY, { expiresIn: "15m" });
       const refreshtoken = jwt.sign(payload, RTJWTKEY, { expiresIn: "7d" });
       return { accesstoken, refreshtoken };
}
const generateAccessToken = (refreshtoken: string) => {
    let decoded: any;
    try {
        decoded = jwt.verify(refreshtoken, RTJWTKEY);
        let { userId, role } = decoded;
        decoded = { userId, role };
    } catch (error) {
        return null;
    }
    return jwt.sign(decoded, ATJWTKEY, { expiresIn: "15m" });
}
export { generateToken, generateAccessToken };