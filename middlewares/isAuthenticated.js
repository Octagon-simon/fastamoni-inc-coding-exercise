import Jwt from "jsonwebtoken"
import { logError } from "../../core/functions.js"

export default async (req, res, next) => {
    try {
        //get the accessToken
        const accessToken = req.headers.authorization ? req.headers.authorization.split(" ")[1] : null;

        //check if the accessToken exists
        if (accessToken) {
            //validate accessToken
            const { userId, loggedInToken } = Jwt.verify(accessToken, process.env.TOKEN_SECRET) ?? {};

            //check if loggedInToken exists
            let cachedToken = await queryCachedData(loggedInToken);

            //all will go well if both logic should return true
            if (!(cachedToken && isJSONString(cachedToken))) {
                return res.status(401).json({
                    success: false,
                    error: {
                        title: "Sign-In Token Is Invalid",
                        type: "SESSION_EXPIRED_LOGGEDIN_TOKEN",
                        devMsg: 'The token provided has expired or is invalid or is not a valid JSON string',
                        message: "Please sign in again with your email address and password"
                    }
                })
            }

            //parse the cached data
            //{userId, email}
            cachedToken = JSON.parse(cachedToken);

            //check if token belongs to this user ID
            if (cachedToken?.userId !== userId) {
                return res.status(401).json({
                    success: false,
                    error: {
                        title: "Sign-In Token Is Invalid",
                        type: "SESSION_EXPIRED_LOGGEDIN_TOKEN",
                        devMsg: 'The token provided has expired or is invalid or is not a valid JSON string',
                        message: "Please sign in again with your email address and password"
                    }
                })
            }

            //Now query the User's document
            const user = await userModel.findById(userId);

            //check if user exists
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: {
                        devMsg: 'accessToken has expired',
                        category: 'AUTHENTICATION_ERROR',
                        //use this to know the navigation screen to render
                        type: "SESSION_EXPIRED_ACCESS_TOKEN",
                        message: "Session Expired. Please login again"
                    }
                })
            } else {
                // check if account is deactivated
                if (user?.isDeactivated) {
                    return res.status(401).json({
                        success: false,
                        error: {
                            title: "Account Deactivated",
                            message: "Your account is deactivated"
                        }
                    })
                }

                //create new object and pass in user info
                req.user = {
                    userId,
                    avatar: user?.avatar ?? "https://res.cloudinary.com/dtil8rna2/image/upload/v1686467845/avatar/defaultAvatar_i5p54d.png",
                    firstName: user?.firstName,
                    lastName: user?.lastName,
                    legalName: user.legalName,
                    userName: user.userName,
                    email: user.email,
                    phone: user.phone,
                    dateOfBirth: user?.dateOfBirth,
                    gender: user?.gender,
                    country: user.country,
                    countryCode: countryCodes[user.country],
                    countryFlag: countryFlags[countryCodes[user.country]] || "",
                    isRestricted: (user.isRestricted) ? true : false,
                    referralCode: user.referralCode,
                    accountType: user.accountType,
                }
                return next();
            }

        } else {
            return res.status(401).json({
                success: false,
                error: {
                    devMsg: 'accessToken has expired',
                    category: 'AUTHENTICATION_ERROR',
                    type: "SESSION_EXPIRED_ACCESS_TOKEN",
                    message: "Session Expired. Please login again"
                }
            })
        }
    } catch (error) {
        if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
            // Handle the expired accessToken error & other validation errors
            return res.status(401).json({
                success: false,
                error: {
                    devMsg: 'accessToken has expired',
                    category: 'AUTHENTICATION_ERROR',
                    type: "SESSION_EXPIRED_ACCESS_TOKEN",
                    message: "Session Expired. Please login again"
                }
            })
        } else {
            logError(error)
            return res.status(500).json({
                success: false,
                error: {
                    title: "Internal Server Error",
                    category: 'SERVER_ERROR',
                    devMsg: 'Please check the error log to debug',
                    message: "A server error has occured, please contact support"
                }
            })
        }
    }
}