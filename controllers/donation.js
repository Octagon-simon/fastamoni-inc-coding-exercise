import { Router } from "express";
import dbQuery from "../utils/db.js";
import { compareHashedUserInput, formatDate, logError, sendEmail } from "../core/functions.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";

//create new routes for authentication
const donationRouter = Router();

//user must be logged in
donationRouter.use(isAuthenticated);

//function to check if user has made at least 2 donations so we can thank them
const checkDonations = async (user_id) => {
    try {

        //check if userId was provided
        if (typeof user_id == 'undefined') throw new Error("A valid user_id must be provided");

        //get user's donations
        const donations = await dbQuery('SELECT * FROM donations WHERE user_id = ?', [user_id]);

        //check if user has made at least 2 donations
        if (donations.length >= 2) {
            return true;
        } else {
            return false;
        }
    } catch (err) {
        throw err;
    }
}

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

        //return an early response
        res.status(200).json({
            status: true,
            message: 'Your donation has been created successfully'
        });

        //check if user has made at least 2 donations
        if (checkDonations(req.user.user_id)) {
            try {
                //send email to user and thank them for the donation
                await sendEmail({
                    recipientEmail: req.user.email,
                    emailSubject: "Thank you for your donation",
                    emailBody: `Hello ${req.user.username}, thank you for your donation of ${amount} to ${email}.`
                })
            } catch (err) {
                logError(err);
            }
        }

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

//create route to get total donations
donationRouter.get('/total', async (req, res) => {
    try {

        const totalDonations = await dbQuery('SELECT COUNT(*) as total FROM donations WHERE user_id = ?', [req.user.user_id]);

        //get response from db
        const { total } = totalDonations?.[0] || 0

        return res.status(200).json({
            status: true,
            data: {
                totalDonations: total
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

//create route to get all donations 
donationRouter.get('/getAll', async (req, res) => {
    try {

        //destructure query parameters
        let { date, pageNumber, pageSize } = req.query; //2024-04-17

        //sanitize param
        date = date?.trim() || null;

        try {
            if (date) {
                date = formatDate(date) //check if date was provided, then attempt to format it to YYYY-MM-DD
            }
        } catch (err) {
            return res.status(400).json({
                status: false,
                error: {
                    message: 'The date you provided is invalid'
                }
            })
        }

        //convert pageSize param to number
        const pageSizeNumber = Number(pageSize);
        //calculate the offset
        const offset = (pageNumber - 1) * pageSizeNumber;

        //construct the SQL query with pagination
        const query = `
            SELECT  donation_id, amount, status, donation_date, username, email
            FROM donations 
            INNER JOIN users ON users.user_id = donations.recipient_id WHERE donations.user_id = ? 
            ${date ? "AND DATE(donations.donation_date) = ?" : ''}
            LIMIT ?, ?`;

        //query the database
        const donations = await dbQuery(query, [req.user.user_id, date, offset, pageSizeNumber]);

        //construct the SQL query to count total records
        const countQuery = `
            SELECT COUNT(*) AS totalRecords
            FROM donations 
            WHERE user_id = ? 
            ${date ? "AND DATE(donation_date) = ?" : ''}`;

        //query the database to count total records
        const countResult = await dbQuery(countQuery, [req.user.user_id, date]);
        const totalRecords = countResult[0].totalRecords;

        //calculate the total number of pages
        const totalPages = Math.ceil(totalRecords / pageSize);

        //return response
        return res.status(200).json({
            status: true,
            data: {
                donations,
                pagination: {
                    currentPage: pageNumber,
                    pageSize,
                    totalPages
                }
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

//create route to get single donation
donationRouter.get('/getSingle', async (req, res) => {
    try {

        //destructure query parameters
        let { donation_id } = req.query

        //sanitize param
        donation_id = Number(donation_id || 0);

        //check if donation_id is provided and is valid
        if (!donation_id) {
            return res.status(400).json({
                status: false,
                error: {
                    message: 'Please provide a valid donation id'
                }
            })
        }

        //get donation from db
        const donation = await dbQuery('SELECT donation_id, amount, status, donation_date, username, email FROM donations INNER JOIN users ON users.user_id = donations.recipient_id WHERE donations.donation_id = ? LIMIT 1', [donation_id]);

        //get response from db
        const { amount, status, donation_date, username, email } = donation?.[0] || {}

        return res.status(200).json({
            status: true,
            data: {
                donation_id,
                amount,
                status,
                donation_date: formatDate(donation_date),
                username,
                email
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

export default donationRouter;