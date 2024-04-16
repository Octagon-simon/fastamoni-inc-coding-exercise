import { Router } from "express";
import dbQuery from "../utils/db.js";
import { logError } from "../core/functions.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";

//create route 
const accountRouter = Router();

//user must be logged in
accountRouter.use(isAuthenticated)

//endpoint for creating PIN
accountRouter.post('/createPin', async (req, res) => {
    try{

    }catch(err){
        logError(err)
        return res.status(500).json({
            success: false,
            error: {
                message: "A server error has occured, please contact support"
            }
        })
    }
})

export default accountRouter;