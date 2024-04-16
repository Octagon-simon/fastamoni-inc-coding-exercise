import express, { json } from 'express';
import dotenv from 'dotenv';
import authRouter from './controllers/auth.js';
import accountRouter from './controllers/account.js';

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

app.get('/', (req, res) => {
    res.send('Hello World!');
});


app.listen(5000, () => {
    console.log('Example app listening on port 5000!');
});