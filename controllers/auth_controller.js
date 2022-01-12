var jwt = require('jsonwebtoken');
var secret = "secret";
var md5 = require('md5');
var { Users } = require('../models/db')

function generateAccessToken(username, email) {
    const payload = { "username": username };
    return jwt.sign(payload, secret);
}

function authenticateToken(req, res, next) {
    const token = req.cookies.authToken;
    if (token == null)
        return res.redirect('/login')

    jwt.verify(token, secret, (err, user) => {
        if (err) return res.sendStatus(403)
        req.user = user
        Users.findAll({ where: { username: req.user.username } })
        .then((count) => {
            if (count.length == 0) {
                res.clearCookie('authToken', '')
                res.redirect('/login');
            } else {
                next()
            }
        })       
    })
}

const register_get = (req, res) => {
    res.render('register.ejs');
}

const userList = ["vulnlabAdmin"] // Registered users in real application they will use database.

const register_post = (req, res) => {
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;
    // In real application they will use database to do the following check.
    Users.findAll({ where: { username: username } })
        .then((count) => {
            if (count.length != 0) {
                res.status(403).send("User already registerd!")
            } else {
                if (username !== '' & password !== '' & email !== '') {
                    Users.create({ username: username, email: email, password: md5(password) });
                    const token = generateAccessToken(username, email);
                    res.cookie('authToken', token);
                    res.send(token);
                } else {
                    res.status(400).send("username, password and email can not be null");
                }
            }
        })
}

const logout_get = (req, res) => {
    res.clearCookie('authToken', '')
    res.redirect('/login');
}

const login_get = (req, res) => {
    res.render("login");
}

const login_post = (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    if (username !== '' & password !== '') {
        Users.findOne({ where: { username: username, password: md5(password) } })
            .then(user => {
                if (user) {
                    const token = generateAccessToken(username, user.email);
                    res.cookie('authToken', token);
                    res.send(token);
                }
                else {
                    
                    res.status(403).send("Invalid username/password.");
                }
            })
    } else {
        res.status(400).send();
    }
}

module.exports = {
    register_get,
    register_post,
    authenticateToken,
    logout_get,
    login_get,
    login_post
}