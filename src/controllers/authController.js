const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

const generateUserId = async (type) => {
    const prefixMap = {
        "admin": "ADM",
        "normal-user": "NOR",
        "agent": "AGT",
    };

    const prefix = prefixMap[type];
    if (!prefix) throw new Error("Invalid user type");

    const lastUser = await User.find({ type })
        .sort({ createdAt: -1 })
        .limit(1);

    let lastNumber = 0;
    if (lastUser.length && lastUser[0].userId) {
        const lastId = lastUser[0].userId;
        lastNumber = parseInt(lastId.replace(prefix, "")) || 0;
    }

    const newId = `${prefix}${String(lastNumber + 1).padStart(3, "0")}`;
    return newId;
};

exports.signUp = async (req, res) => {
    try {
        const {
            type,
            password,
            email,
            phone,
            firstName,
            lastName,
            address,
            city,
            company
        } = req.body;

        // Validate required fields
        if (!type || !password || !email) {
            return res.status(400).json({ error: "Type, email, and password are required." });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "User with this email already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = await generateUserId(type);

        const newUser = new User({
            userId,
            type,
            email,
            phone,
            firstName,
            lastName,
            address,
            city,
            company,
            password: hashedPassword,
        });

        await newUser.save();

        res.status(201).json({ message: "User registered successfully", data: newUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to register user" });
    }
};



exports.login = async (req, res) => {
    try {
        const { userIdOrEmail, password } = req.body;

        if (!userIdOrEmail || !password) {
            return res.status(400).json({ error: "User ID or Email and password are required" });
        }

        const user = await User.findOne({userId: userIdOrEmail});

        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const token = jwt.sign(
            { userId: user.userId, email: user.email, type: user.type },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(200).json({ message: "Login successful", token, user });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ error: "Login failed" });
    }
};

