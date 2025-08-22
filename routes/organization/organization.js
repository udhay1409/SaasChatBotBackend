const express = require("express");
const {
  PostOrganization,
  Getorganization,
  GetorganizationById,
  Putorganization,
  DeleteOrganization,
  GetOrganizationUsage
} = require("../../controllers/organization/organizationControllers");
const { authenticateToken } = require("../../middleware/auth");

const router = express.Router();

// Public routes (no authentication required)
router.post("/register", PostOrganization); // Public organization registration

// Protected routes (authentication required)
router.use(authenticateToken);

// Organization routes (authenticated users only)
router.post("/postorganization", PostOrganization);
router.get("/getorganization", Getorganization);
router.get("/getorganizationbyid/:id", GetorganizationById);
router.get("/getorganizationusage/:id", GetOrganizationUsage);
router.put("/putorganization/:id", Putorganization);
router.delete("/deleteorganization/:id", DeleteOrganization);

module.exports = router;