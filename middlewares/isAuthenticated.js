import Jwt from "jsonwebtoken"
import { logError } from "../core/functions.js"
import dbQuery from "../utils/db.js";

export default async (req, res, next) => {
    try {
        //get the accessToken
        const accessToken = req.headers.authorization ? req.headers.authorization.split(" ")[1] : null;

        //check if the accessToken exists
        if (accessToken) {

            //validate accessToken
            const { user_id } = Jwt.verify(accessToken, process.env.JWT_SECRET) ?? {};

            //Now query the User's document
            const user = await dbQuery('SELECT * FROM users WHERE user_id = ? LIMIT 1', [user_id])

            if (!user || !user.length) {
                return res.status(400).json({
                    status: false,
                    error: {
                        message: 'Session ID is invalid'
                    }
                });
            }

            //destructure user information
            const { username, email } = user[0]

            //create new object and pass in user info for easy user Identification
            req.user = {
                user_id,
                username,
                email,
            }
            return next();
        }
    } catch (error) {
        if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
            // Handle the expired accessToken error & other validation errors
            return res.status(401).json({
                success: false,
                error: {
                    message: "Session Expired. Please login again"
                }
            })
        } else {
            logError(error)
            return res.status(500).json({
                success: false,
                error: {
                    message: "A server error has occured, please contact support"
                }
            })
        }
    }
}