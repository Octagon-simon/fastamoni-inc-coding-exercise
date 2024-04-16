import { Router } from "express";
import dbQuery from "../utils/db.js";
import { logError } from "../core/functions.js";
import bcrypt from 'bcrypt';
import Jwt from "jsonwebtoken"

//create new routes for authentication
const authRouter = Router();

//define modular functions

/**
 * This function is responsible for hashing the password of the user
 * @param {string} password 
 * @returns String
 */
const hashPassword = async (password) => {
    try {
        const saltRounds = 10;
        //hash and return response
        return await bcrypt.hash(password, saltRounds)
    } catch (err) {
        throw new Error(`An error occurred while trying to hash the password: ${err.message}`);
    }
}

/**
 * This function is responsible for comparing the password of the user against the stored password
 * @param {string} userPassword 
 * @param {string} hashedPassword 
 * @returns Boolean 
 */
const comparePassword = async (userPassword, hashedPassword) => {
    try {
        return await bcrypt.compare(userPassword, hashedPassword)
    } catch (err) {
        throw new Error(`An error occurred while trying to hash the password: ${err.message}`);
    }
}

authRouter.post('/signup', async (req, res) => {

    try {

        //destructure payload
        let { username = '', email = '', password = '' } = req.body;

        //sanitize and trim
        username = username.trim();
        password = password.trim();
        email = email.trim();

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
        const hashedPassword = await hashPassword(password);

        // Create new user
        const createUser = await dbQuery('INSERT INTO users (username, email, secret) VALUES (?, ?, ?)', [username, email, hashedPassword]);

        // Check if user was created
        if (createUser.affectedRows <= 0) { // If no rows were affected
            return res.status(500).json({
                status: false,
                error: {
                    message: 'Your account was not created, please contact support'
                }
            });
        }

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
        if(await comparePassword(password, secret) === false){
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
            data : {
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