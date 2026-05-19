const express = require("express");
const cors = require("cors");
const attendanceRoutes = require("./routes/attendance.routes");
const errorMiddleware = require("./middlewares/error.middleware");

const userRoutes = require("./routes/user.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
    res.json({
        status: "OK",
        message: "Backend ejecutandose bien",
    });
});

app.use("/users", userRoutes);
app.use("/attendance", attendanceRoutes);

app.use(errorMiddleware);

module.exports = app;