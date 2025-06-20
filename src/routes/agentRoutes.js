const express = require('express');
const router = express.Router();
const agentController = require("../controllers/agentConroller"); // Typo fixed: 'agentConroller' → 'agentController'
const auth = require('../middlewares/auth');

// Middleware to restrict access to admin users
const adminOnly = (req, res, next) => {
    if (req.user?.type !== 'admin') {
        return res.status(403).json({ message: 'Access denied: Admins only' });
    }
    next();
};

// All routes below are protected by auth and adminOnly middleware
// Get all agents
router.get('/', auth, adminOnly, agentController.getAllAgents);


// Create new agent
router.post('/', auth, adminOnly, agentController.createAgent);

// Edit agent details
router.put('/:userId', auth, adminOnly, agentController.editAgent);

// Enable/disable agent
router.put('/:userId/status', auth, adminOnly, agentController.toggleAgentStatus);

// Change agent password
router.put('/:userId/password', auth, adminOnly, agentController.changeAgentPassword);

// Delete agent
router.delete('/:userId', auth, adminOnly, agentController.deleteAgent);


module.exports = router;
