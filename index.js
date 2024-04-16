import express, { json } from 'express';
import dotenv from 'dotenv';
import authRouter from './controllers/auth.js';
import accountRouter from './controllers/account.js';
import beneficiaryRouter from './controllers/beneficiary.js';
import walletRouter from './controllers/wallet.js';
import donationRouter from './controllers/donation.js';

//configure access to env variables
dotenv.config();

//create new express app
const app = express();

//configure app to parse request as JSON
app.use(json());

//configure authentication route
app.use('/api/auth/', authRouter);

//configure authentication route
app.use('/api/account/', accountRouter);

//configure beneficiary route
app.use('/api/wallets/', walletRouter);

//configure donations route
app.use('/api/donations/', donationRouter);


//configure beneficiary route
app.use('/api/beneficiary/', beneficiaryRouter);

app.get('/', (req, res) => {
    res.send('Hello Planet Earth!');
});


app.listen(5000, () => {
    console.log('Example app listening on port 5000!');
});