const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const math = require("mathjs");
const fs = require("fs");
const readline = require('readline');
const numeric = require('numeric');
const os = require("os");
const fileContent = fs.readFileSync("data.txt", "utf8");
const arr = fileContent.split(os.EOL);
const stream1 = fs.createWriteStream("datapaste.txt");
let y_coef2 = [];
let y_coef3 = [];
let area = [];


function getMatrix(arr) {
    let x = [];
    let y = [];
    arr.forEach(function (v) {
        if (v !== arr[arr.length - 1])
            x = v.split(",");
        else
            y = v.split(",");
    });
    x = math.number(x);
    y = math.number(y);
    return [x, y];
}


function methodLS(k, x, y) {
    let t = math.zeros(x.length, k)._data;
    for (let i = 0; i < x.length; i++) {
        for (let j = k - 1; j >= 0; j--) {
            t[i][j] = math.pow(x[i], j);
        }
    }
    let t_trans = math.transpose(t);
    let g = math.inv(math.multiply(t_trans, t));
    let a = math.multiply(g, t_trans, y);
    return a;
}


function calc_error(x, y, coef2, coef3) {
    let yErr2 = [];
    let yErr3 = [];
    let err2 = 0;
    let err3 = 0;
    for (let i = 0; i < x.length; i++) {
        yErr2.push(polyval(coef2, x[i]));
        yErr3.push(polyval(coef3, x[i]));
    }
    for (let i = 0; i < yErr2.length; i++) {
        err2 += math.square(yErr2[i] - y[i]);
        err3 += math.square(yErr3[i] - y[i]);
    }
    return [err2, err3];
}


function polyval(vec, value) {
    let n = 0;
    let result = 0;
    for (let i = 0; i < vec.length; i++) {
        result += vec[i] * math.pow(value, n);
        n++;
    }
    return result;
}

function main() {
    const data = getMatrix(arr);
    let x = data[0];
    let y = data[1];
    let coef2 = methodLS(2, x, y);
    let coef3 = methodLS(3, x, y);
    console.log("Ax + B = " + coef2[1].toFixed(3) + "x + " + coef2[0].toFixed(3));
    console.log("Ax^2 + Bx + C = " + coef3[2].toFixed(3) + "x^2 + " + coef3[1].toFixed(3) + "x + " + coef3[0].toFixed(3));
    stream1.write("Ax + B = " + coef2[1].toFixed(3) + "x + " + coef2[0].toFixed(3));
    stream1.write("\nAx^2 + Bx + C = " + coef3[2].toFixed(3) + "x^2 + " + coef3[1].toFixed(3) + "x + " + coef3[0].toFixed(3));
    let errors = calc_error(x, y, coef2, coef3);
    let error2 = errors[0];
    let error3 = errors[1];
    console.log("Error Ax + B: " + error2.toFixed(3));
    console.log("Error Ax^2 + Bx + C : " + error3.toFixed(3));
    stream1.write("\n\nError Ax + B: " + error2.toFixed(3));
    stream1.write("\nError Ax^2 + Bx + C : " + error3.toFixed(3));
    area = numeric.linspace(x[0], x[x.length - 1], 30);
    for (let i = 0; i < x.length; i++) {
        y_coef2.push(polyval(coef2, x[i]));
        y_coef3.push(polyval(coef3, x[i]));
    }
    app.get('/', function (req, res) {
        res.sendFile(__dirname + '/index.html');
    });


    io.on('connection', function (socket) {
        io.emit('log', math.round(x, 2), y_coef2, y_coef3, y);
    });


    http.listen(3000, function () {
        console.log('listening on *:3000');
    });
    return 0;
}

main();


