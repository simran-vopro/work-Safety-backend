const Banner = require("../models/TopBanners");

// Add Banner
exports.addBanner = async (req, res) => {
    try {
        const { title } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: "Banner image is required" });
        }

        const bannerPath = `/topBanners/${file.filename}`;
        const newBanner = new Banner({ title, banner: bannerPath });

        await newBanner.save();
        res.status(201).json({ message: "Banner added", data: newBanner });
    } catch (error) {
        res.status(500).json({ error: "Failed to add banner" });
    }
};

// Get All Banners
exports.getBanners = async (req, res) => {
    try {
        const banners = await Banner.find();
        res.status(200).json({
            data: banners,
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch banners" });
    }
};

// Update Banner
exports.updateBanner = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedBanner = await Banner.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedBanner) {
            return res.status(404).json({ error: "Banner not found" });
        }
        res.status(200).json({ message: "Banner updated", data: updatedBanner });
    } catch (error) {
        res.status(500).json({ error: "Failed to update banner" });
    }
};

// Delete Banner
exports.deleteBanner = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedBanner = await Banner.findByIdAndDelete(id);
        if (!deletedBanner) {
            return res.status(404).json({ error: "Banner not found" });
        }
        res.status(200).json({ message: "Banner deleted" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete banner" });
    }
};
