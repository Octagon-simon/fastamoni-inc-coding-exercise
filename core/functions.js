import fs from 'fs';

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

export {
    logError
}