const express = require("express");
const cors = require("cors");

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

module.exports = app;