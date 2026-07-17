import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import { ATJWTKEY,RTJWTKEY } from "../config/env.config.js";
import { isTokenRevoked } from "./tokenStore.js";

const generateToken = (payload: object): { accesstoken: string; refreshtoken: string } => {
       const accesstoken = jwt.sign(payload, ATJWTKEY, { expiresIn: "15m" });
       // Give every refresh token a unique id (jti) so a single token can be
       // individually revoked (e.g. on logout) without invalidating every
       // other session for the user.
       const refreshtoken = jwt.sign({ ...payload, jti: randomUUID() }, RTJWTKEY, { expiresIn: "7d" });
       return { accesstoken, refreshtoken };
}
const generateAccessToken = async (refreshtoken: string) => {
    let decoded: any;
    try {
        decoded = jwt.verify(refreshtoken, RTJWTKEY);
        let { userId, role, jti } = decoded;
        if (jti && (await isTokenRevoked(jti))) {
            return null;
        }
        decoded = { userId, role };
    } catch (error) {
        return null;
    }
    return jwt.sign(decoded, ATJWTKEY, { expiresIn: "15m" });
}
export { generateToken, generateAccessToken };