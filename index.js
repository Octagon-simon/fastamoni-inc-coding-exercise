import express from 'express';
import dotenv from 'dotenv';

//configure access to env variables
dotenv.config();

//create new express app
const app = express();


app.get('/', (req, res) => {
    res.send('Hello World!');
});


app.listen(5000, () => {
    console.log('Example app listening on port 5000!');
});