const AuditLog = require("./api/models/AuditLog");
const Admin = require("./api/models/Admin");

const seedAdminUser = async () => {
  try {
    // Check if any users exist
    const userCount = await Admin.countDocuments();

    if (userCount === 0) {
      console.log("> No users found. Creating first admin user...");

      const adminData = {
        firstName: "Admin",
        lastName: "User",
        email: "agbamkingsley+m@gmail.com",
        password: "Admin@CPN$159", // Default password - user should change this
        role: "admin",
        title: "System Administrator",
        area: "Leadership",
        status: "active",
        phone: "+1234567890",
        twoFactorEnabled: false,
      };

      const admin = await Admin.create(adminData);

      // Log the creation
      await AuditLog.create({
        action: "Seed admin user",
        user: admin._id,
        userEmail: admin.email,
        userRole: admin.role,
        details: { source: "system_seed" },
        ipAddress: "127.0.0.1",
        userAgent: "System/Seed",
      });

      console.log("> First admin user created successfully!");
      console.log("> Email:", adminData.email);
      console.log("> Password: Admin@CPN$159");
      console.log("> Please change the password after first login!");
    } else {
      console.log(`> Found ${userCount} existing user(s). Skipping seed.`);
    }

    return true;
  } catch (error) {
    console.error("> Error seeding admin user:", error);
    return false;
  }
};

module.exports = { seedAdminUser };
