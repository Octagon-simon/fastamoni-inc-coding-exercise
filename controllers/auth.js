import { Router } from "express";
import dbQuery from "../utils/db.js";
import { compareHashedUserInput, hashUserInput, logError } from "../core/functions.js";
import Jwt from "jsonwebtoken"

//create new routes for authentication
const authRouter = Router();

//modular function for creating a new wallet
const createWallet = async (user_id) => {
    try {

        //check if userId was provided
        if (typeof user_id == 'undefined') throw new Error("A valid user_id must be provided");

        //default wallet name
        const wallet_name = "NGN";

        //check if user has created this wallet already
        const hasCreatedWallet = await dbQuery('SELECT * FROM userWallets WHERE wallet_name = ? AND user_id = ? LIMIT 1', [wallet_name, user_id])

        if (hasCreatedWallet && hasCreatedWallet.length) {
            return {
                status: false,
                error: {
                    message: `This user has ${wallet_name} wallet already`
                }
            }
        }

        //create wallet for this user
        const createWallet = await dbQuery('INSERT INTO userWallets (wallet_name, user_id) VALUES (?, ?)', [wallet_name, user_id])

        //check if operation was successful
        if (createWallet.affectedRows <= 0) {
            return {
                status: false,
                error: {
                    message: `This User's ${wallet_name} wallet was not created, please contact support`
                }
            }
        }

        return {
            status: true,
            message: `User's ${wallet_name} wallet has been created successfully`
        }
    } catch (err) {
        throw new Error(err)
    }
}

authRouter.post('/signup', async (req, res) => {

    try {

        //destructure payload
        let { username = '', email = '', password = '' } = req.body;

        //sanitize and trim
        username = username.trim();
        password = password.trim();
        email = email.trim()?.toLowerCase();

        //check if params are empty
        if (!username || !password || !email) {
            return res.status(400).json({
                status: false,
                error: {
                    message: 'Please provide a username, password and email'
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

        // Check if email address exists already
        const emailExists = await dbQuery('SELECT * FROM users WHERE email = ? OR username = ?', [email, username]);

        if (emailExists && emailExists.length > 0) {
            return res.status(400).json({
                status: false,
                error: {
                    message: 'This username or Email address exists already.',
                }
            });
        }

        //hash user's password
        const hashedPassword = await hashUserInput(password);

        // Create new user
        const createUser = await dbQuery('INSERT INTO users (username, email, secret) VALUES (?, ?, ?)', [username, email, hashedPassword]);

        //destructure response
        const { affectedRows, insertId: user_id } = createUser

        // Check if user was created
        if (affectedRows <= 0) {
            return res.status(500).json({
                status: false,
                error: {
                    message: 'Your account was not created, please contact support'
                }
            });
        }

        //attempt to create wallet for this user
        await createWallet(user_id)

        //return success
        return res.status(200).json({
            status: true,
            message: 'Account created successfully'
        });
    } catch (err) {
        logError(err)
        return res.status(500).json({
            success: false,
            error: {
                message: "A server error has occured, please contact support"
            }
        })
    }
});

authRouter.post('/login', async (req, res) => {
    try {

        //destructure payload
        let { email = '', password = '' } = req.body;

        //sanitize and trim
        email = email.trim();
        password = password.trim();

        //check if params are empty
        if (!password || !email) {
            return res.status(400).json({
                status: false,
                error: {
                    message: 'Please provide a password and email'
                }
            });
        }

        //validate email address
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                status: false,
                error: {
                    //use this response to prevent brute force attacks
                    message: 'Email address or password is incorrect'
                }
            });
        }

        // Check if account exists
        const emailExists = await dbQuery('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);

        if (!emailExists || !emailExists.length) {
            return res.status(400).json({
                status: false,
                error: {
                    message: 'Email address or password is incorrect'
                }
            });
        }

        //get user's Id and secret from db result
        const { user_id, secret } = emailExists?.[0] ?? {}

        //compare the password
        if (await compareHashedUserInput(password, secret) === false) {
            return res.status(400).json({
                status: false,
                error: {
                    message: 'Email address or password is incorrect'
                }
            });
        }

        //sign JWT and send back to the user
        const token = Jwt.sign({ user_id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        return res.status(200).json({
            success: true,
            message: 'You are now logged in',
            data: {
                authToken: token

            }
        });
    } catch (err) {
        logError(err)
        return res.status(500).json({
            success: false,
            error: {
                message: "A server error has occured, please contact support"
            }
        })
    }
});

export default authRouter;