import {type Request, type Response, type NextFunction} from "express";

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const token = authHeader.substring(7);
    // Here you would typically verify the token
    next();
};

const isloggedIn = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.acessToken;
    if (!authHeader) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    next();
}

const notloggedIn = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.acesstoken;

    if (authHeader) {
        return res.status(401).json({ message: "Already logged in" });
    }
    next();
}
export {authMiddleware,isloggedIn,notloggedIn};