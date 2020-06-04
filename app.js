//jshint esversion:6
require('dotenv').config()

const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const encrypt = require('mongoose-encryption')

const app = express()

app.set('view engine', 'ejs')

app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: true }))

mongoose.connect('mongodb://localhost:27017/userdb', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})

const userSchema = new mongoose.Schema ({
    email: String,
    password: String
})

userSchema.plugin(encrypt, {
    secret: process.env.SECRET,
    encryptedFields: ['password']
})

const User = new mongoose.model('User', userSchema)


app.route('/')
    .get((req, res) => res.render('home'))

app.route('/login')
    .get((req, res) => res.render('login'))
    .post((req, res) => {
        const username = req.body.username
        const password = req.body.password

        User.findOne(
            {email: username},
            (err, user) => {
                if (err) console.log(err)
                else {
                    if (user && user.password === password) {
                        return res.render('secrets')
                    } else {
                        return res.redirect('/login')
                    }
                }
            }
        )
    })

app.route('/register')
    .get((req, res) => res.render('register'))
    .post((req, res) => {
        const newUser = new User({
            email: req.body.username,
            password: req.body.password
        })

        newUser.save((err) => {
            if (err) console.log(err);
            else return res.render('secrets')
        })
    })

app.listen(3000, () => console.log('Server started on port 3000.'))