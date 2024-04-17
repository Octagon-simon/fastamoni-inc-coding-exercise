## FASTAMONI CODING EXERCISE

The goal of this project is to access my proficiency in software engineering that is related to the daily work that is done at Fastamoni.

## INSTALLATION

Clone or download this repo into your local machine and follow the instructions below to configure the server;

- Import `schema.sql` into your SQL server to create the Database and necessary Tables

- Rename `.env.sample` to `.env` and provide values to the variables that are defined in this file

- Run `npm install` to install the dependencies

- Start the server with `npm run start` and make a call to `http:127.0.0.1:5000` n your browser to confirm if installation is successful.

Below you can see the available endpoints and what they do.

## AVAILABLE ENDPOINTS

> Please note that all endpoints have this base URL `http://127.0.0.1:5000/api`

- `/auth/signup` This endpoint enables a user to sign up on the server. It does not require authentication.

    - Request Method: `POST`

- `/auth/login` This endpoint enables a user to login to his account on the server. It does not require authentication.
    
    - Request Method: `POST`

    - Once a user is logged in, an `accessToken` will be returned and you need to pass in this token to the request header as a bearer token in order to be **authenticated**. For example: `Bearer uytrFGBVCDRUI7654567yGBN8754rg...` 

- `/account/createPIN` This endpoint enables a loggedIn user to create a transaction PIN. It requires authentication.
    
    - Request Method: `POST`
  
    - With this PIN, the user can be able to donate some money to a beneficiary (another user)

- `/wallets/getBalance` This endpoint enables a user to retrieve his wallet balance. It requires authentication.

    - Request Method: `GET`
  
    - Once a user signs up on the server, an `NGN` wallet is automatically created with a default balance of `500,000` and this is enough to test donations to a different user.

- `/donations/create` This endpoint enables a user to create a donation to a different user (beneficiary). It requires authentication

    - Request Method: `POST`

    - Before a donation is created, you must set up a PIN because this PIN will be used to verify and authenticate the user as funds are about to leave his wallet.

- `/donations/getAll` This endpoint enables a user to get the records of all donations he has made.

    - Request Method: `GET`

    - You can filter the records by the date and it supports pagination too. Please refer to `fastaMoni.postman_collection.json` for more information

- `/donations/getSingle` This endpoint enables a user to retrieve a single donation using the ID of the donation.

    - Request Method: `GET`

- `/donations/total` This endpoint enables a user to get the total donations he has made
  
    - Request Method: `GET`

## WHAT YOU CAN DO

Import the collection `fastaMoni.postman_collection.json` into POSTMAN and follow the instructions below

- Signup on the server by creating 2 accounts, one for yourself and the other for a beneficiary.

- Log into your own account and create a PIN

- Once you have created your PIN, head over to the donations endpoint and create a new donation to your beneficiary and when you create 2 or more donations, you will receive an email, with a special thank you message.

- Check your NGN wallet balance to confirm the funds you have left and then login as your beneficiary and check the wallet balance to confirm the funds he received.

## STACK

- NodeJS
- Express
- MySQL
- JWT (for authentication)
- Artillery (for testing)
