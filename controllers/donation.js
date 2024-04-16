import { Router } from "express";
import dbQuery from "../utils/db.js";
import { compareHashedUserInput, logError } from "../core/functions.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";

//create new routes for authentication
const donationRouter = Router();

//user must be logged in
donationRouter.use(isAuthenticated);

//create route for donation
donationRouter.post('/create', async (req, res) => {
    try {

        //destructure payload
        let { email, amount, pin } = req.body;

        //check if params are empty
        if (!email || !amount || !pin) {
            return res.status(400).json({
                status: false,
                error: {
                    message: 'Please provide a valid email address and amount of this donation and your PIN'
                }
            });
        }

        //sanitize and trim
        email = email?.trim()?.toLowerCase();
        amount = amount?.trim();
        pin = pin?.trim();

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

        //validate amount
        if (!/[0-9]/.test(Number(amount))) {
            return res.status(400).json({
                status: false,
                error: {
                    message: 'Amount must be a number'
                }
            });
        }

        //get user's hashed PIN
        const checkPIN = await dbQuery('SELECT pin FROM users WHERE user_id = ? AND pin IS NOT NULL LIMIT 1', [req.user.user_id]);

        if (!checkPIN || !checkPIN.length) {
            return res.status(400).json({
                status: false,
                error: {
                    message: 'You have not created a PIN'
                }
            });
        }

        //get PIN response
        const { pin: hashedPIN } = checkPIN[0];

        //validate PIN
        if (!await compareHashedUserInput(pin, hashedPIN)) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Your PIN is incorrect'
                }
            })
        }

        //get the beneficiary information
        const beneficiaryExists = await dbQuery('SELECT * FROM users WHERE email = ?', [email]);

        if (!beneficiaryExists || !beneficiaryExists.length) {
            return res.status(400).json({
                status: false,
                error: {
                    message: 'This email address is not associated with any beneficiary'
                }
            });
        }

        //get user's Id from db result
        const { user_id: beneficiary_id } = beneficiaryExists?.[0] ?? {}

        //check if this user is trying to send to himself 
        if (beneficiary_id?.toString()?.trim() === req.user.user_id?.toString()?.trim()) {
            return res.status(400).json({
                status: false,
                error: {
                    message: 'You are not allowed to donate money to yourself'
                }
            });
        }

        //create a new donation
        const newDonation = await dbQuery('INSERT INTO donations (user_id, amount, recipient_id) VALUES (?, ?, ?)', [req.user.user_id, amount, beneficiary_id]);

        //check if operation was successful
        if (newDonation.affectedRows <= 0) {
            return res.status(500).json({
                status: false,
                error: {
                    message: 'We are not able to create this donation now, please contact support'
                }
            });
        }

        //Top up recipient's balance
        const updateBalance = await dbQuery('UPDATE userWallets SET balance = balance +? WHERE user_id = ? LIMIT 1', [amount, beneficiary_id]);

        //check if operation was successful
        if (updateBalance.affectedRows <= 0) {
            return res.status(500).json({
                status: false,
                error: {
                    message: 'We are not able to create this donation now, please contact support' //recipient's balance was not updated
                }
            });
        }

        //reconcile donor's balance
        const updateDonorBalance = await dbQuery('UPDATE userWallets SET balance = balance -? WHERE user_id = ? LIMIT 1', [amount, req.user.user_id]);

        //check if operation was successful
        if (updateDonorBalance.affectedRows <= 0) {
            return res.status(500).json({
                status: false,
                error: {
                    message: 'We are not able to create this donation now, please contact support' //donor's balance was not updated
                }
            });
        }

        //update donation status
        const updateDonationStatus = await dbQuery('UPDATE donations SET status = ? WHERE donation_id = ? LIMIT 1', ['success', newDonation.insertId]);

        //check if operation was successful
        if (updateDonationStatus.affectedRows <= 0) {
            return res.status(500).json({
                status: false,
                error: {
                    message: 'We are not able to create this donation now, please contact support' //donation status was not updated
                }
            });
        }

        return res.status(200).json({
            status: true,
            message: 'Your donation has been created successfully'
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

export default donationRouter;