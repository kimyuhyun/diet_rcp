process.env.NODE_ENV =
    process.env.NODE_ENV && process.env.NODE_ENV.trim().toLowerCase() == "production" ? "production" : "development";


const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const app = express();

app.use(bodyParser.json({ limit: "30000kb" }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "./client/build")));

app.use("/", require("./routes/index"));
app.use("/auth", require("./routes/auth"));

// error handler
app.use((err, req, res, next) => {
    console.log("ENV", process.env.NODE_ENV);

    if (err.code == "EBADCSRFTOKEN") {
        // CSRF token errors 라면 다음과 같이 처리한다.
        res.status(403);
        res.send("토큰이 안맞아요!");
        return;
    }

    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};
    app.locals.hostname = process.env.HOST_NAME;

    if (process.env.NODE_ENV == "development") {
        console.error(err.stack);
        // render the error page
        res.status(err.status || 500);
        res.render("error");
    }
});

app.get("*", function (req, res) {
    res.sendFile(path.join(__dirname, "./client/build/index.html"));
});

module.exports = app;
