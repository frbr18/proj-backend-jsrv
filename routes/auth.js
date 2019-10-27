const express = require("express");
const router = express.Router();
const db = require("../db/database.js");

//Password crypting
const bcrypt = require("bcryptjs");
const saltrounds = 10;
const jwt = require("jsonwebtoken");
const secret = process.env.JWT_SECRET || "Av3ryLongS3cretPa$$w0rd";

router.get("/", (req, res) => {
    res.json({
        msg: "test1"
    })
});

router.post("/register", (req, res) => {
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;

    //validation of data
    if (!name) {
        return res.status(500).json({
            status: 500,
            message: "Name is missing"
        });
    }
    if (!email) {
        return res.status(500).json({
            status: 500,
            message: "Email is missing"
        });
    }
    if (!password) {
        return res.status(500).json({
            status: 500,
            message: "Password is missing"
        });
    }

    //Hasing the password
    bcrypt.hash(password, saltrounds, function (err, hash) {
        if (err) {
            return res.status(501).json({
                errors: {
                    status: 501,
                    source: "/register",
                    details: "Bcrypt error"
                }
            });
        }
        const sql = "insert into users (name, email, password, money) values (?, ?, ?, ?);"
        db.run(sql, name, email, hash, 100, (error) => {
            if (error) {
                return res.status(500).json({
                    errors: {
                        status: 500,
                        source: "POST /register",
                        title: "Database error",
                        detail: error.message
                    }
                })
            }
            res.status(201).json({
                success: {
                    status: 200,
                    source: "POST /register",
                    title: "User registered"
                }
            });
        });

    });
});

router.post("/addmoney", (req, res) => {
    const currentMoney = parseInt(req.body.money);
    const addMoney = parseInt(req.body.addMoney);
    const owner = req.body.email;
    const newMoney = parseInt(currentMoney + addMoney);
    console.log(req.body);
    console.log(newMoney);

    const sql = "update users set money = ? where email = ?;";

    if (!currentMoney) {
        return res.status(500).json({
            error: "current money does not exist"
        });
    }

    if (!addMoney) {
        return res.status(500).json({
            error: "add money does not exist"
        });
    }

    if (!owner) {
        return res.status(500).json({
            error: "owner does not exist"
        });
    }

    db.run(sql, parseInt(newMoney), owner, (err) => {
        if (err) {
            return res.status(501).json({
                err
            });
        }
        res.status(200).json({
            success: "money added to account."
        });
    })
});

router.post("/login", (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const sql = "select * from users where email = ?;";
    if (!email) {
        return res.status(500).json({
            status: 500,
            message: "Email is missing"
        });
    }
    if (!password) {
        return res.status(500).json({
            status: 500,
            message: "Password is missing"
        });
    }
    db.get(sql, email, (err, rows) => {
        if (err) {
            return res.status(500).json({
                errors: {
                    status: 500,
                    source: "/login",
                    title: "Database Error",
                    detail: err
                }
            });
        }
        if (rows === undefined) {
            return res.status(401).json({
                errors: {
                    status: 401,
                    source: "/login",
                    title: "User not found",
                    detail: err
                }
            });
        }

        const user = rows;
        bcrypt.compare(password, user.password, (cryptErr, cryptRes) => {
            if (cryptErr) {
                return res.status(500).json({
                    errors: {
                        status: 500,
                        source: "/login",
                        title: "bcrypt error",
                        detail: "bcrypt error"
                    }
                });
            }
            if (cryptRes) {
                let payload = { email: user.email };
                let jwtToken = jwt.sign(payload, secret, { expiresIn: '1h' });

                return res.json({
                    data: {
                        type: "success",
                        message: "User logged in",
                        user: user.email,
                        token: jwtToken,
                        money: user.money
                    }
                });
            }
            return res.status(401).json({
                errors: {
                    status: 401,
                    source: "/login",
                    title: "Wrong password",
                    detail: "Password is incorrect."
                }
            });
        });
    });

});

module.exports = router;