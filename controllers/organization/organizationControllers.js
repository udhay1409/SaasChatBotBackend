const { prisma } = require("../../config/database");
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { sendEmail, sendEmailWithEnv } = require('../../config/connectSMTP');

// Helper function to update organization usage count
const updateOrganizationUsage = async (organizationId) => {
  try {
    // Get all users in the organization
    const users = await prisma.user.findMany({
      where: { organizationId },
      select: { id: true }
    });

    // Count all chatbots created by users in this organization
    const chatbotCount = await prisma.userChatBot.count({
      where: {
        userId: {
          in: users.map(user => user.id)
        }
      }
    });

    // Update the organization's usage count
    await prisma.organization.update({
      where: { id: organizationId },
      data: { UsageChatbot: chatbotCount }
    });

    return chatbotCount;
  } catch (error) {
    console.error('Error updating organization usage:', error);
    return 0;
  }
};

// Generate unique organization ID
const generateOrganizationId = () => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `ORG-${timestamp}-${randomStr}`.toUpperCase();
};

// Generate dummy password
const generateDummyPassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// Send verification email
const sendVerificationEmail = async (email, contactPerson, organizationName, dummyPassword, verificationToken) => {
  try {
    // Get active email configuration
    const emailConfig = await prisma.emailConfiguration.findFirst({
      where: { isActive: true }
    });

    const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
    
    const emailSubject = `Welcome to ${organizationName} - Verify Your Account`;
    const emailText = `
Hello ${contactPerson},

Welcome to our platform! Your organization "${organizationName}" has been successfully registered.

Your account details:
Email: ${email}
Temporary Password: ${dummyPassword}

Please verify your email address by clicking the link below:
${verificationLink}

After verification, you can login with your temporary password and change it using the "Forgot Password" feature.

Best regards,
The Team
    `;

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px; }
        .content { padding: 20px 0; }
        .credentials { background-color: #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 14px; color: #6c757d; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to Our Platform!</h1>
        </div>
        <div class="content">
            <p>Hello <strong>${contactPerson}</strong>,</p>
            <p>Welcome to our platform! Your organization "<strong>${organizationName}</strong>" has been successfully registered.</p>
            
            <div class="credentials">
                <h3>Your Account Details:</h3>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Temporary Password:</strong> <code>${dummyPassword}</code></p>
            </div>

            <p>Please verify your email address by clicking the button below:</p>
            <a href="${verificationLink}" class="button">Verify Email Address</a>
            
            <p>After verification, you can login with your temporary password and change it using the "Forgot Password" feature for better security.</p>
        </div>
        <div class="footer">
            <p>If you didn't request this account, please ignore this email.</p>
            <p>Best regards,<br>The Team</p>
        </div>
    </div>
</body>
</html>
    `;

    let result;
    if (emailConfig) {
      result = await sendEmail(emailConfig, {
        to: email,
        subject: emailSubject,
        text: emailText,
        html: emailHtml
      });
    } else {
      result = await sendEmailWithEnv({
        to: email,
        subject: emailSubject,
        text: emailText,
        html: emailHtml
      });
    }

    return result;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return { success: false, message: error.message };
  }
};

// Create new organization
const PostOrganization = async (req, res) => {
  try {
    const { name, contactPerson, email, phone, address } = req.body;

    // Validation
    if (!name || !contactPerson || !email || !phone || !address) {
      return res.status(400).json({
        success: false,
        message:
          "All fields are required: name, contactPerson, email, phone, address",
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    // Check if organization with same email already exists
    const existingOrg = await prisma.organization.findFirst({
      where: { email: email },
    });

    if (existingOrg) {
      return res.status(409).json({
        success: false,
        message: "Organization with this email already exists",
      });
    }

    // Check if user with same email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Generate unique organization ID
    let organizationId;
    let isUnique = false;

    while (!isUnique) {
      organizationId = generateOrganizationId();
      const existing = await prisma.organization.findUnique({
        where: { organizationId },
      });
      if (!existing) {
        isUnique = true;
      }
    }

    // Generate dummy password and verification token
    const dummyPassword = generateDummyPassword();
    const hashedPassword = await bcrypt.hash(dummyPassword, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Use transaction to create both organization and user
    const result = await prisma.$transaction(async (tx) => {
      // Create organization
      const organization = await tx.organization.create({
        data: {
          organizationId,
          name: name.trim(),
          contactPerson: contactPerson.trim(),
          email: email.toLowerCase().trim(),
          phone: phone.trim(),
          address: address.trim(),
          chatbotsLimit: 2, // Set default to 2 for organizations
          UsageChatbot: 0, // Default usage chatbot count
        },
      });

      // Create user account for the organization
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase().trim(),
          password: hashedPassword,
          name: contactPerson.trim(),
          role: 'user', // Default role for organization users
          organizationId: organization.id, // Link user to organization
          isActive: true,
          isVerified: false,
          verificationToken: verificationToken,
          provider: 'local',
          // Generate unique googleId for local users to avoid constraint issues
          googleId: `local_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
          // Inherit organization limits
          chatbotsLimit: organization.chatbotsLimit,
          subscription: organization.subscription,
        },
      });

      return { organization, user };
    });

    // Send verification email
    const emailResult = await sendVerificationEmail(
      email.toLowerCase().trim(),
      contactPerson.trim(),
      name.trim(),
      dummyPassword,
      verificationToken
    );

    if (!emailResult.success) {
      console.error('Failed to send verification email:', emailResult.message);
      // Don't fail the organization creation if email fails
    }

    res.status(201).json({
      success: true,
      message: "Organization created successfully. Verification email sent to the contact person.",
      data: {
        organization: result.organization,
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          isVerified: result.user.isVerified,
        },
        emailSent: emailResult.success,
      },
    });
  } catch (error) {
    console.error("Error creating organization:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get all organizations
const Getorganization = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", isActive } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build filter conditions
    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { organizationId: { contains: search, mode: "insensitive" } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    // Get organizations with pagination
    const [organizations, totalCount] = await Promise.all([
      prisma.organization.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: "desc" },
      }),
      prisma.organization.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / parseInt(limit));

    res.status(200).json({
      success: true,
      data: organizations,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCount,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching organizations:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get organization by ID
const GetorganizationById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Organization ID is required",
      });
    }

    const organization = await prisma.organization.findUnique({
      where: { id },
    });

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization not found",
      });
    }

    res.status(200).json({
      success: true,
      data: organization,
    });
  } catch (error) {
    console.error("Error fetching organization:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Update organization
const Putorganization = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, contactPerson, email, phone, address, isActive, chatbotsLimit, subscription } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Organization ID is required",
      });
    }

    // Check if organization exists
    const existingOrg = await prisma.organization.findUnique({
      where: { id },
    });

    if (!existingOrg) {
      return res.status(404).json({
        success: false,
        message: "Organization not found",
      });
    }

    // Prepare update data
    const updateData = {};

    if (name !== undefined) updateData.name = name.trim();
    if (contactPerson !== undefined)
      updateData.contactPerson = contactPerson.trim();
    if (email !== undefined) {
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid email address",
        });
      }

      // Check if email is already used by another organization
      if (email !== existingOrg.email) {
        const emailExists = await prisma.organization.findFirst({
          where: {
            email: email.toLowerCase().trim(),
            id: { not: id },
          },
        });

        if (emailExists) {
          return res.status(409).json({
            success: false,
            message: "Email is already used by another organization",
          });
        }
      }

      updateData.email = email.toLowerCase().trim();
    }
    if (phone !== undefined) updateData.phone = phone.trim();
    if (address !== undefined) updateData.address = address.trim();
    if (isActive !== undefined) updateData.isActive = isActive;
    
    // Update subscription and limits
    if (subscription !== undefined) updateData.subscription = subscription;
    if (chatbotsLimit !== undefined) {
      const limit = parseInt(chatbotsLimit);
      if (limit < 0) {
        return res.status(400).json({
          success: false,
          message: "Chatbots limit cannot be negative",
        });
      }
      updateData.chatbotsLimit = limit;
    }


    // Use transaction to update both organization and related user data
    const result = await prisma.$transaction(async (tx) => {
      // Update organization
      const updatedOrganization = await tx.organization.update({
        where: { id },
        data: updateData,
      });

      // Update related user data if organization data changed
      const userUpdateData = {};
      if (contactPerson !== undefined) userUpdateData.name = contactPerson.trim();
      if (email !== undefined) userUpdateData.email = email.toLowerCase().trim();
      if (isActive !== undefined) userUpdateData.isActive = isActive;
      
      // Sync organization limits to users
      if (chatbotsLimit !== undefined) userUpdateData.chatbotsLimit = parseInt(chatbotsLimit);
      if (subscription !== undefined) userUpdateData.subscription = subscription;

      // Update user if there's data to update
      if (Object.keys(userUpdateData).length > 0) {
        await tx.user.updateMany({
          where: { organizationId: id },
          data: userUpdateData,
        });
      }

      return updatedOrganization;
    });

    res.status(200).json({
      success: true,
      message: "Organization and related user data updated successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error updating organization:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Delete organization (soft delete by setting isActive to false)
const DeleteOrganization = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Organization ID is required",
      });
    }

    // Check if organization exists
    const existingOrg = await prisma.organization.findUnique({
      where: { id },
    });

    if (!existingOrg) {
      return res.status(404).json({
        success: false,
        message: "Organization not found",
      });
    }

    // Soft delete by setting isActive to false
    const deletedOrganization = await prisma.organization.update({
      where: { id },
      data: { isActive: false },
    });

    res.status(200).json({
      success: true,
      message: "Organization deleted successfully",
      data: deletedOrganization,
    });
  } catch (error) {
    console.error("Error deleting organization:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get organization usage statistics
const GetOrganizationUsage = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Organization ID is required",
      });
    }

    // Get organization details
    const organization = await prisma.organization.findUnique({
      where: { id },
    });

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization not found",
      });
    }

    // Get all users in this organization
    const users = await prisma.user.findMany({
      where: { organizationId: id },
      select: { id: true, name: true, email: true, isActive: true },
    });

    // Get chatbot count for all users in the organization
    const chatbotCount = await prisma.userChatBot.count({
      where: {
        userId: {
          in: users.map(user => user.id)
        }
      }
    });

    // Calculate usage statistics
    const usage = {
      organization: {
        id: organization.id,
        name: organization.name,
        subscription: organization.subscription,
        isActive: organization.isActive,
      },
      limits: {
        chatbotsLimit: organization.chatbotsLimit,
        usageChatbot: organization.UsageChatbot,
      },
      current: {
        chatbots: chatbotCount,
        usagebots: 0, // TODO: Implement usage bots tracking when needed
        users: users.length,
        activeUsers: users.filter(user => user.isActive).length,
      },
      usage: {
        chatbotsPercentage: Math.round((chatbotCount / organization.chatbotsLimit) * 100),
        usagebotsPercentage: 0, // TODO: Calculate when usage bots are implemented
      },
      users: users,
    };

    res.status(200).json({
      success: true,
      data: usage,
    });
  } catch (error) {
    console.error("Error fetching organization usage:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  PostOrganization,
  Getorganization,
  GetorganizationById,
  Putorganization,
  DeleteOrganization,
  GetOrganizationUsage,
  updateOrganizationUsage, // Export the helper function
};
