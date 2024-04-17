-- Create Database
CREATE DATABASE IF NOT EXISTS fastMoni;

-- Use Database
USE fastMoni;

-- Create Users Table
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    secret VARCHAR(255) NOT NULL,
    pin VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create User Wallets Table
CREATE TABLE IF NOT EXISTS userWallets (
    wallet_id INT AUTO_INCREMENT PRIMARY KEY,
    wallet_name VARCHAR(5) NOT NULL,
    user_id INT NOT NULL,
    balance DECIMAL(10, 2) DEFAULT 500000,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);


-- -- Create Beneficiaries Table
-- CREATE TABLE IF NOT EXISTS beneficiaries (
--     id INT AUTO_INCREMENT PRIMARY KEY,
--     user_id INT NOT NULL,
--     beneficiary_id INT NOT NULL,
--     email VARCHAR(100) NOT NULL,
--     legal_name VARCHAR(100) NOT NULL,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     FOREIGN KEY (user_id) REFERENCES users(user_id),
--     FOREIGN KEY (beneficiary_id) REFERENCES users(user_id)
-- );

-- Create Donations Table
CREATE TABLE IF NOT EXISTS donations (
    donation_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(10) DEFAULT 'pending',
    donation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    recipient_id INT NOT NULL, -- Opposite of donor_id which is our user_id, representing the recipient of the donation
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (recipient_id) REFERENCES users(user_id)
);


-- mysql -u octagon -p < schema.sql