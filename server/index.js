const cors = require("cors");
const nextJs = require("next");
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const { seedAdminUser } = require("./seed");

const dev = process.env.NODE_ENV !== "production";
const hostName = dev ? "localhost" : "office.ocofamerica.com";
const PORT = process.env.PORT || 3002;
const app = nextJs({ dev, hostName, PORT });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    const server = express();

    // Middleware
    server.use(cors());
    server.use(bodyParser.json({ limit: "50mb" }));
    server.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

    // MongoDB Connection
    mongoose
      .connect(process.env.MONGODB_URI)
      .then(async () => {
        console.log("> Successfully connected to Campaign Database");
        await seedAdminUser();
      })
      .catch((err) => console.error("> Failed to connect to Database:", err));

    // API Routes
    server.use("/api/audit", require("./api/routes/audit_routes"));
    server.use("/api/auth", require("./api/routes/auth_routes"));
    server.use("/api/admin/auth", require("./api/routes/admin_auth_routes"));
    server.use("/api/users", require("./api/routes/user_routes"));
    server.use("/api/reports", require("./api/routes/report_routes"));
    server.use("/api/media", require("./api/routes/media_routes"));
    server.use("/api/voters", require("./api/routes/voter_routes"));
    server.use("/api/volunteers", require("./api/routes/volunteer_routes"));
    server.use("/api/forms", require("./api/routes/form_routes"));
    server.use("/api/agreements", require("./api/routes/agreement_routes"));
    server.use("/api/fundraising", require("./api/routes/fundraising_routes"));
    server.use("/api/other", require("./api/routes/other_routes"));
    server.use("/api/calendar", require("./api/routes/calendar_routes"));
    server.use("/api/social-media", require("./api/routes/socialMediaRoutes"));

    // Error handling
    server.use((err, req, res, next) => {
      console.error(err);
      res.status(500).json({ error: "Internal Server Error" });
    });

    // Next.js handler
    server.all("*", (req, res) => {
      return handle(req, res);
    });

    // Start server
    server.listen(PORT, (err) => {
      if (err) {
        console.error("> Failed to start server:", err);
        process.exit(1);
      }
      console.log(`> Server running on http://${hostName}:${PORT}`);
    });
  })
  .catch((ex) => {
    console.error(ex.stack);
    process.exit(1);
  });
