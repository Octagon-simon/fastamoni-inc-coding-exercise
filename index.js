import express, { json } from 'express';
import dotenv from 'dotenv';
import authRouter from './controllers/auth.js';
import accountRouter from './controllers/account.js';
import walletRouter from './controllers/wallet.js';
import donationRouter from './controllers/donation.js';

//configure access to env variables
dotenv.config();

//create new express app
const app = express();

//set the port number
const port = process.env.PORT || 5000;

//configure app to parse request as JSON
app.use(json());

app.get('/', (req, res) => {
    res.status(200).json({
        success : true,
        message: 'Hello, Planet Earth!'
    })
})

//configure authentication route
app.use('/api/auth/', authRouter);

//configure authentication route
app.use('/api/account/', accountRouter);

//configure beneficiary route
app.use('/api/wallets/', walletRouter);

//configure donations route
app.use('/api/donations/', donationRouter);

app.listen(port, () => {
    console.log(`App is live on port ${port}`);
});