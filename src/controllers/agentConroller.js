const User = require("../models/User");
const bcrypt = require("bcryptjs");

exports.getAllAgents = async (req, res) => {
    try {
        const agents = await User.find({ type: 'agent' });
        res.json({ data: agents });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch agents', error: err.message });
    }
};

exports.createAgent = async (req, res) => {
    try {
        const { userId, email, phone, firstName, lastName, password, address } = req.body;



        const existingAgent = await User.findOne({ userId });
        if (existingAgent) {
            return res.status(400).json({ message: 'Agent with this userId already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const agent = new User({
            type: 'agent',
            userId,
            email,
            phone,
            firstName,
            lastName,
            password: hashedPassword,
            address: address
        });

        await agent.save();

        res.status(201).json({ message: 'Agent created successfully', data: agent });
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Failed to create agent', error: err.message });
    }
};

exports.editAgent = async (req, res) => {
    try {
        const { userId } = req.params;
        const updateData = req.body;

        const updatedAgent = await User.findOneAndUpdate(
            { userId, type: 'agent' },
            updateData,
            { new: true }
        );

        if (!updatedAgent) {
            return res.status(404).json({ message: 'Agent not found' });
        }

        res.json({ message: 'Agent updated successfully', data: updatedAgent });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update agent', error: err.message });
    }
};

exports.toggleAgentStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const { isActive } = req.body;

        const updated = await User.findOneAndUpdate(
            { userId, type: 'agent' },
            { isActive },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ message: 'Agent not found' });
        }

        res.json({ message: `Agent ${isActive ? 'enabled' : 'disabled'} successfully`, data: updated });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update agent status', error: err.message });
    }
};

exports.changeAgentPassword = async (req, res) => {
    try {
        const { userId } = req.params;
        const { newPassword } = req.body;

        console.log("agent userId ==> ", userId, newPassword);

        if (!newPassword) {
            return res.status(400).json({ message: "New password is required" });
        }

        const agent = await User.findOne({ userId });
        if (!agent) {
            return res.status(404).json({ message: "Agent not found" });
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const updated = await User.findOneAndUpdate(
            { userId, type: 'agent' },
            { password: hashedPassword },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ message: 'Agent not found' });
        }

        res.json({ message: 'Agent password updated successfully' });
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Failed to change password', error: err.message });
    }
};


exports.deleteAgent = async (req, res) => {
    try {
        const { userId } = req.params;
        console.log("deleteAgent ===> ", req.params)
        const deletedUser = await User.findOneAndDelete({ userId, type: 'agent' });

        if (!deletedUser) {
            return res.status(404).json({ message: 'Agent not found' });
        }

        res.json({ message: 'Agent deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete agent', error });
    }
};
