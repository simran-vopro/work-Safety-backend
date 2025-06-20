const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const generateUserId = require("../utils/generateUserId");

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

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
            return res.status(400).json({ message: "Type, email, and password are required." });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User with this email already exists" });
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
        res.status(500).json({ message: "Failed to register user" });
    }
};



exports.login = async (req, res) => {
    try {
        const { userIdOrEmail, password, type } = req.body;

        console.log(req.body);

        if (!userIdOrEmail || !password || !type) {
            return res.status(400).json({ message: "User ID or Email and password are required" });
        }

        const user = await User.findOne({ userId: userIdOrEmail });



        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        if (type != user.type) {
            return res.status(403).json({ message: `Access denied for ${user.type}` });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid Password" });
        }

        const token = jwt.sign(
            { userId: user.userId, email: user.email, type: user.type },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        const data = { token, user }

        res.status(200).json({ message: "Login successful", data });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Login failed" });
    }
};


exports.editUser = async (req, res) => {
    try {
        const {
            email,
            phone,
            firstName,
            lastName,
            address,
            city,
            company
        } = req.body;

        const userId = req.user.userId;


        if (!userId) {
            return res.status(400).json({ message: "User ID is required" });
        }

        if (!email || email.trim() === "") {
            return res.status(400).json({ message: "Email is required" });
        }

        const updateData = {
            email,
            phone,
            firstName,
            lastName,
            address,
            city,
            company
        };

        const user = await User.findOneAndUpdate(
            { userId },
            updateData,
            { new: true, runValidators: true }
        );

        // if (!user) {
        //     return res.status(400).json({ message: "User not found" });
        // }

        res.status(200).json({ message: "Profile updated successfully", data: user });
    } catch (error) {
        console.error("Update Error:", error);
        res.status(500).json({ message: "Failed to update profile" });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const userId = req.user.userId; // assuming verifyToken sets req.user
        const { currentPassword, newPassword } = req.body;



        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: "Both current and new passwords are required" });
        }

        const user = await User.findOne({ userId });


        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;


        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({
                message:
                    "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.",
            });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Current password is incorrect" });
        }


        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedPassword;
        await user.save();

        res.status(200).json({ message: "Password changed successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }

}

exports.getAllEndUsers = async (req, res) => {
    try {
        const users = await User.find({ type: 'user' }).select('-password');
        res.status(200).json({ data: users });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch users', error });
    }
};

exports.editUserByAdmin = async (req, res) => {
    try {
        const { userId } = req.params;
        const updateData = req.body;

        const updatedUser = await User.findOneAndUpdate({ userId }, updateData, {
            new: true,
            runValidators: true,
        }).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User updated successfully', data: updatedUser });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update user', error });
    }
};


exports.toggleUserStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const { isActive } = req.body; // true or false

        const updatedUser = await User.findOneAndUpdate(
            { userId },
            { isActive },
            { new: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        const status = isActive ? 'enabled' : 'disabled';
        res.json({ message: `User ${status} successfully`, data: updatedUser });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update user status', error });
    }
};


exports.deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const deletedUser = await User.findOneAndDelete({ userId });

        if (!deletedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete user', error });
    }
};
