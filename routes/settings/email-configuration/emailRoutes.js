const express = require('express');
const { 
    getEmail,
    postEmail,
    putEmail,
    testEmail
} = require("../../../controllers/Settings/emailConfiguration/emailControllers");

const router = express.Router();

// GET /api/dashboard/email-configuration
router.get('/', getEmail);

// POST /api/dashboard/email-configuration
router.post('/', postEmail);

// PUT /api/dashboard/email-configuration/:id
router.put('/:id', putEmail);

// POST /api/dashboard/email-configuration/test
router.post('/test', testEmail);

module.exports = router;