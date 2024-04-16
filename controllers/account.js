import { Router } from "express";
import dbQuery from "../utils/db.js";
import { hashUserInput, logError } from "../core/functions.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";

//create route 
const accountRouter = Router();

//user must be logged in
accountRouter.use(isAuthenticated)

//endpoint for creating PIN
accountRouter.post('/createPin', async (req, res) => {
    try {
        //destructure payload
        let { pin } = req.body;

        //sanitize and validate
        pin = pin.trim();

        //check if pin is valid digits
        if(!/[0-9]/.test(Number(pin))){
            return res.status(400).json({
                success : false,
                error: {
                    message: 'PIN must be at least 4 digits'
                }
            })
        }

        //check if pin length is less than 4 digits
        if(pin.length < 4){
            return res.status(400).json({
                status: false,
                error: {
                    message: 'PIN must be at least 4 digits'
                }
            });
        }

        //confirm if the user has not created a PIN before
        const hasCreatedPIN = await dbQuery('SELECT pin FROM users WHERE user_id = ? AND pin IS NOT NULL LIMIT 1', [req.user.user_id])

        if(hasCreatedPIN && hasCreatedPIN.length){
            return res.status(400).json({
                status: false,
                error: {
                    message: 'You have already created a PIN'
                }
            });
        }

        //hash PIN
        const hashedPIN = await hashUserInput(pin)

        //update user's details
        const updateUser = await dbQuery('UPDATE users SET pin = ? WHERE user_id = ?', [hashedPIN, req.user.user_id])

        if(!updateUser){
            return res.status(400).json({
                status: false,
                error: {
                    message: 'Sorry, we are not able to create your PIN at the moment'
                }
            })
        }

        return res.status(200).json({
            success: true,
            message: 'Your PIN has been created successfully',
        })
        
    } catch (err) {
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