import jwt from "jsonwebtoken";
import { ATJWTKEY,RTJWTKEY } from "../config/env.config.js";

const generateToken = (payload: object): { accessToken: string; refreshToken: string } => {
       const accessToken = jwt.sign(payload, ATJWTKEY, { expiresIn: "15m" });
       const refreshToken = jwt.sign(payload, RTJWTKEY, { expiresIn: "7d" });
       return { accessToken, refreshToken };
}
const generateAccessToken = (refreshToken: any) => {
    let decoded: any;
    try {
        decoded = jwt.verify(refreshToken, RTJWTKEY);
        let { userId, role } = decoded;
        decoded = { userId, role };
    } catch (error) {
        return null;
    }
    return jwt.sign(decoded, ATJWTKEY, { expiresIn: "15m" });
}
export { generateToken, generateAccessToken };