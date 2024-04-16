import { Router } from "express";
import dbQuery from "../utils/db.js";
import { logError } from "../core/functions.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";

//create new routes for authentication
const walletRouter = Router();

//user must be logged in
walletRouter.use(isAuthenticated);

//create route for adding a new beneficiary
walletRouter.get('/getBalance', async (req, res) => {
    try {

        //destructure payload
        let { wallet_name } = req.query;

        //sanitize and validate, then convert to uppercase
        wallet_name = wallet_name.trim()?.toUpperCase();

        if (!wallet_name) {
            return res.status(400).json({
                status: false,
                error: {
                    message: 'Please provide a valid wallet name'
                }
            });
        }

        //check if wallet exists then return the balance
        const walletExists = await dbQuery('SELECT * FROM userWallets WHERE wallet_name = ? AND user_id = ?', [wallet_name, req.user.user_id]);

        if (!walletExists || !walletExists.length) {
            return res.status(400).json({
                status: false,
                error: {
                    message: 'This wallet does not exist'
                }
            });
        }

        //get db response
        const { balance } = walletExists[0]

        return res.status(200).json({
            status: true,
            data: {
                balance
            }
        });

    } catch (err) {
        logError(err);
        return res.status(500).json({
            success: false,
            error: {
                message: "A server error has occured, please contact support"
            }
        })
    }
})

export default walletRouter;