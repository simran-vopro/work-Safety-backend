const UserQueries = require("../models/UserQueries");

// POST API to submit a user query
exports.submitQuery = async (req, res) => {
    try {
        const {
            email,
            phone,
            firstName,
            lastName,
            address,
            city,
            company,
            userId,
            message
        } = req.body;

        let documentPath = null;
        if (req.file) {
            documentPath = `/uploads/${req.file.filename}`;
        }

        const newQuery = new UserQueries({
            email,
            phone,
            firstName,
            lastName,
            address,
            city,
            company,
            userId,
            message,
            document: documentPath
        });

        await newQuery.save();
        res.status(201).json({ message: "Query submitted successfully", data: newQuery });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Something went wrong while submitting the query" });
    }
};
