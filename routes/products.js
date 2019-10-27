const express = require("express");
const router = express.Router();
const db = require("../db/database.js");

router.get("/", (req, res) => {
    const sql = "Select * from products;";

    db.all(sql, (error, rows) => {
        if (error) {
            return res.status(501).json({
                error: {
                    status: 501,
                    details: "Database error"
                }
            })
        }
        res.status(200).json(rows);
    })
});

router.post("/buy", (req, res) => {
    const sql = "insert into stocks (owner, product) values (?, ?);";
    console.log(req.body);
    const owner = req.body.owner;
    const product = req.body.product;
    const newMoney = req.body.newMoney;

    if (newMoney < 0) {
        return res.status(500).json({
            message: "Not enough money"
        });
    }

    if (!owner) {
        return res.status(400).json({
            error: "Owner not found"
        });
    }

    if (!product) {
        return res.status(400).jso({
            error: "Product not found"
        });
    }

    db.run(sql, owner, product, (err) => {
        if (err) {
            return res.status(500).json({
                error: "Database error",
                err: err
            });
        }

        const sql2 = "update users set money = ? where email = ?;";
        db.run(sql2, newMoney, owner, (err) => {
            return res.status(200).json({
                success: "Stock added to database"
            });
        })

    })
});

router.post("/stocks", (req, res) => {
    const email = req.body.owner;
    const sql = "select * from stocks where owner = ?;";
    console.log(req.body.owner);
    if (!email) {
        return res.status(400).json({
            error: {
                message: "GET /stocks email not found"
            }
        });
    }

    db.all(sql, email, (err, rows) => {
        if (err) {
            return res.status(500).json(err);
        }
        res.status(200).json(rows);
    });
});

router.post("/sell", (req, res) => {
    const sql = "select * from stocks where owner = ? and product = ?;";
    const owner = req.body.owner;
    const product = req.body.product;
    const newMoney = req.body.newMoney;

    if (!owner) {
        return res.status(400).json({
            error: "Owner not found"
        });
    }

    if (!product) {
        return res.status(400).jso({
            error: "Product not found"
        });
    }

    db.all(sql, owner, product, (err, rows) => {
        if (err) {
            return res.status(500).json({
                error: "Database error",
                err: err
            });
        }

        if (rows.length) {
            const stockId = rows[0].id;
            const sql2 = "delete from stocks where id = ?;";
            db.run(sql2, stockId, (err) => {
                if (err) {
                    return res.status(500).json({
                        error: {
                            message: "Database error",
                            err: err
                        }
                    })
                }
                const sql3 = "update users set money = ? where email = ?;";
                db.run(sql3, newMoney, owner, (err) => {
                    if (err) {
                        return res.status(500).json({
                            error: {
                                message: "Database error update money",
                                err: err
                            }
                        })
                    }
                    return res.status(200).json({
                        success: "Stock sold"
                    });
                })
            });
        } else {
            return res.status(401).json({
                message: "Stock not found"
            });
        }
    });
});

module.exports = router;