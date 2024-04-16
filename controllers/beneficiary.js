import { Router } from "express";
import dbQuery from "../utils/db.js";
import { logError } from "../core/functions.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";

//create new routes for authentication
const beneficiaryRouter = Router();

//user must be logged in
beneficiaryRouter.use(isAuthenticated);

//create route for adding a new beneficiary
beneficiaryRouter.post('/add', async (req, res) => {
    try {
        //destructure response
        let { email, legal_name } = req.body;

        //sanitize and trim
        email = email.trim()?.toLowerCase();
        legal_name = legal_name.trim();

        //check if params are empty
        if (!email || !legal_name) {
            return res.status(400).json({
                status: false,
                error: {
                    message: 'Please provide a valid email address and legal name of this beneficiary'
                }
            });
        }

        //validate email address
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                status: false,
                error: {
                    message: 'You have provided an Invalid email address'
                }
            });
        }

        // Check if beneficiary exists already
        const beneficiaryExists = await dbQuery('SELECT * FROM beneficiaries WHERE email = ? AND user_id = ?', [email, req.user.user_id]);

        if (beneficiaryExists && beneficiaryExists.length) {
            return res.status(400).json({
                status: false,
                error: {
                    message: 'This email address is already associated with another beneficiary'
                }
            });
        }

        //get the associated user account
        const userExists = await dbQuery('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);

        if (!userExists || !userExists.length) {
            return res.status(400).json({
                status: false,
                error: {
                    message: 'The beneficiary you are trying to add does not exist'
                }
            });
        }

        //get user's Id and secret from db result
        const { user_id: beneficiary_id } = userExists?.[0] ?? {}

        //check if this user is trying to add himself as a beneficiary
        if (beneficiary_id?.toString() === req.user.user_id.toString()) {
            return res.status(400).json({
                status: false,
                error: {
                    message: 'You cannot add yourself as a beneficiary'
                }
            });
        }

        //save new beneficiary
        const newBeneficiary = await dbQuery('INSERT INTO beneficiaries (user_id, beneficiary_id, email, legal_name) VALUES (?, ?, ?, ?)', [req.user.user_id, beneficiary_id, email, legal_name]);

        //check if operation was successful
        if (newBeneficiary.affectedRows <= 0) {
            return res.status(500).json({
                status: false,
                error: {
                    message: 'We are not able to add this beneficiary now, please contact support'
                }
            });
        }

        return res.status(200).json({
            status: true,
            message: 'Your beneficiary has been added successfully'
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

export default beneficiaryRouter;