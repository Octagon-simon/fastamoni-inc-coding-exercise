import { Router } from "express";
import dbQuery from "../utils/db.js";
import { hashUserInput, logError } from "../core/functions.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";

//create route 
const accountRouter = Router();

//user must be logged in
accountRouter.use(isAuthenticated)

//modular function for retrieving all wallets and their ID
const getAllWallets = async () => {
    try {
        const wallets = await dbQuery('SELECT * FROM wallets')
        return wallets
    } catch (err) {
        logError(err)
    }
}

//endpoint for creating PIN
accountRouter.post('/createPin', async (req, res) => {
    try {
        //destructure payload
        let { pin } = req.body;

        //check if pin is valid digits
        if (!/[0-9]/.test(Number(pin))) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'PIN must be at least 4 digits'
                }
            })
        }

        //sanitize and validate
        pin = pin.trim();

        //check if pin length is less than 4 digits
        if (pin.length < 4) {
            return res.status(400).json({
                status: false,
                error: {
                    message: 'PIN must be at least 4 digits'
                }
            });
        }

        //confirm if the user has not created a PIN before
        const hasCreatedPIN = await dbQuery('SELECT pin FROM users WHERE user_id = ? AND pin IS NOT NULL LIMIT 1', [req.user.user_id])

        if (hasCreatedPIN && hasCreatedPIN.length) {
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

        if (!updateUser) {
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

//endpoint for creating a new wallet
accountRouter.post('/createWallet', async (req, res) => {
    try {
        //destructure payload
        let { wallet_name } = req.body;

        //sanitize and validate, then convert to uppercase
        wallet_name = wallet_name.trim()?.toUpperCase();

        //check if wallet name is valid
        if (!wallet_name) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Please provide a wallet name'
                }
            })
        }

        //check if wallet name is supported
        const walletIsSupported = await dbQuery('SELECT * FROM wallets WHERE wallet_name = ? LIMIT 1', [wallet_name])

        if (!walletIsSupported || !walletIsSupported.length) {
            return res.status(400).json({
                status: false,
                error: {
                    message: 'The wallet you are trying to create is not currently supported.'
                }
            })
        }

        //get wallet Id
        const { wallet_id } = walletIsSupported[0];

        //check if user has created this wallet already
        const hasCreatedWallet = await dbQuery('SELECT * FROM userWallets WHERE wallet_id = ? AND user_id = ? LIMIT 1', [wallet_id, req.user.user_id])

        if (hasCreatedWallet && hasCreatedWallet.length) {
            return res.status(400).json({
                status: false,
                error: {
                    message: `You have already created ${wallet_name} wallet already`
                }
            });
        }

        //create wallet for this user
        const createWallet = await dbQuery('INSERT INTO userWallets (wallet_id, user_id) VALUES (?, ?)', [wallet_id, req.user.user_id])

        //check if operation was successful
        if (createWallet.affectedRows <= 0) {
            return res.status(500).json({
                status: false,
                error: {
                    message: 'Your wallet was not created, please contact support'
                }
            });
        }

        return res.status(200).json({
            status: true,
            message: 'Your wallet has been created successfully'
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
export default accountRouter;