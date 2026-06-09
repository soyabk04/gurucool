import jwt from "jsonwebtoken";

const generateToken = (payload: object): { accessToken: string; refreshToken: string } => {
       const accessToken = jwt.sign(payload, "secretKey", { expiresIn: "15m" });
       const refreshToken = jwt.sign(payload, "secretKey", { expiresIn: "7d" });
       return { accessToken, refreshToken };
}
const generateAccessToken = (payload: any) => {
    let decoded: any;
    try {
        decoded = jwt.verify(payload, "secretKey");
        let { userId, role } = decoded;
        decoded = { userId, role };
    } catch (error) {
        return null;
    }
    return jwt.sign(decoded, "secretKey", { expiresIn: "15m" });
}
export { generateToken, generateAccessToken };