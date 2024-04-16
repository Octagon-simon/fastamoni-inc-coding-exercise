import { Router } from "express";

//create new routes for authentication
const authRouter = Router();

authRouter.post('/signup', (req, res) => {

    //destructure payload
    let { username, password } = req.body;  

    connection.query('INSERT INTO users (username, email) VALUES (?, ?)', [username, email], (err, result) => {
        if (err) {
            console.error('Error creating user: ' + err.stack);
            res.status(500).send('Error creating user');
            return;
        }
        res.status(201).send('User created successfully');
    });


});

authRouter.post('/login', (req, res) => {
    const { username, password } = req.body;
    console.log(req.body);
    if (username === 'octagon' && password === '<PASSWORD>') {
        res.status(200).json({
            success: true,
            message: 'Successfully logged in'
        });
    } else {
        res.status(401).json({
            success: false,
            message: 'Invalid credentials'
        });
    }
});