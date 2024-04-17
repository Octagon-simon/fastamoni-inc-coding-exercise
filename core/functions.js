import fs from 'fs';
import bcrypt from 'bcrypt';

// Function to log errors
function logError(error) {
    try {
        // Extract error information
        const errorMessage = `${new Date().toISOString()} - ${error?.message ?? error}\n${error?.stack ?? ''}\n`;

        // Log to a file in development mode
        const errorLogPath = './logs/error.log';

        if (!fs.existsSync(errorLogPath)) {
            fs.writeFileSync(errorLogPath, errorMessage + '\n');
        } else {
            fs.appendFileSync(errorLogPath, errorMessage + '\n');
        }
    } catch (err) {
        console.error('Error logging error:', err);
    }
}

/**
 * This function is responsible for hashing any credentials
 * @param {string} userInput
 * @returns String
 */
const hashUserInput = async (userInput, saltRounds = 10) => {

    if (typeof userInput !== 'string') throw new Error('userInput must be a string');

    if (typeof saltRounds !== 'number') throw new Error('saltRounds must be a number');

    try {
        //hash and return response
        return await bcrypt.hash(userInput, saltRounds)
    } catch (err) {
        throw new Error(`An error occurred while trying to hash the password: ${err.message}`);
    }
}

/**
 * This function is responsible for comparing the userInput against the hashed content
 * @param {string} userInput
 * @param {string} hashedString
 * @returns Boolean 
 */
const compareHashedUserInput = async (userInput, hashedString) => {
    try {
        if (typeof userInput !== 'string') throw new Error('userInput must be a string');

        if (typeof hashedString !== 'string') throw new Error('hashedString must be a string');

        return await bcrypt.compare(userInput, hashedString)
    } catch (err) {
        throw new Error(`An error occurred while trying to hash the password: ${err.message}`);
    }
}

/**
 * This function formats date to 'YYYY-MM-DD'
 * @param {*} inputDate 
 * @returns 
 */
const formatDate = (inputDate) => {
    try {
        const dateObj = new Date(inputDate);

        const year = dateObj.getFullYear();

        const month = String(dateObj.getMonth() + 1).padStart(2, '0');

        const day = String(dateObj.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    } catch (e) {
        throw new Error(e)
    }
}
export {
    compareHashedUserInput,
    formatDate,
    hashUserInput,
    logError
}