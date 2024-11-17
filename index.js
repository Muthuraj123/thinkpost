const express = require('express');
const cors = require("cors");
const bodyParser = require("body-parser");
var path = require("path");
var cookieParser = require("cookie-parser");
require('dotenv').config();

const app = express();
app.use(bodyParser.json({ limit: "200mb" }));
app.use(bodyParser.urlencoded({ extended: false }));

app.use(cors());

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept,Authorization,id"
    );
    next();
});
// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

const userRouter = require("./routes/user");
const postRouter = require("./routes/post");
const notificationRouter = require("./routes/notification");

app.use("/user", userRouter);
app.use("/post", postRouter);
app.use("/notification", notificationRouter);

app.listen(process.env.PORT, () => {
    console.log(`Server is running on http://localhost:${process.env.PORT}`);
});