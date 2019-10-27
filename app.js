const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const port = 8336;
const morgan = require("morgan");
// Socket initiate stuff
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const db = require('./db/database.js');
const stock = require('./stock');

//routes import
const auth = require('./routes/auth');
const products = require('./routes/products');

app.use(cors());

app.options('*', cors());

app.disable('x-powered-by');
// don't show the log when it is test
if (process.env.NODE_ENV !== 'test') {
    // use morgan to log at command line
    app.use(morgan('combined')); // 'combined' outputs the Apache style LOGs
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/auth", auth);
app.use("/products", products);

//Socket listen stuff
io.on('connection', function (socket) {
    console.info("User connected");
    socket.on('disconnect', function () {
        console.log('user disconnected');
    });
});

setInterval(function () {
    const sql = "select * from products;";
    const sql2 = "update products set startingPoint = ? where id = ?;";
    db.all(sql, (err, rows) => {
        rows.forEach((cake) => {
            db.run(sql2, stock.getStockPrice(cake), cake.id, (err) => {
                if (err) {
                    console.log(err);
                }
            });
            //console.log(stock.getStockPrice(cake));
        });
        io.emit("stocks", rows);
    });
}, 5000);

app.listen(port, () => {
    console.log(`Server listens att port ${port}.`)
});

server.listen(3000, function () {
    console.log('Socket server listen on port:3000');
});