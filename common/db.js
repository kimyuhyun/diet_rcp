require("dotenv").config();
const maria = require("mysql");

const option = {
    host: process.env.DB_HOST,
    post: process.env.DB_SERVER_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    dateStrings: "date",
    charset: "utf8mb4",
};

const conn = maria.createConnection(option);

module.exports = conn;
module.exports.connAccount = option;
