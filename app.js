//jshint esversion:6
require('dotenv').config()

const express = require('express')
const bodyParser = require('body-parser')

const mongoose = require('mongoose')

const session = require('express-session')
const passport = require('passport')
const passportLocalMongoose = require('passport-local-mongoose')

const app = express()

app.set('view engine', 'ejs')

app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}))

app.use(passport.initialize())
app.use(passport.session())

mongoose.connect('mongodb://localhost:27017/userdb', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
})

const userSchema = new mongoose.Schema ({
    email: String,
    password: String,
    secret: String
})

userSchema.plugin(passportLocalMongoose)

const User = new mongoose.model('User', userSchema)

passport.use(User.createStrategy())
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

app.route('/')
    .get((req, res) => res.render('home'))


app.get('/logout', (req, res) => {
    req.logout()
    return res.redirect('/')
})

app.route('/login')
    .get((req, res) => res.render('login'))
    .post((req, res) => {
        let username = req.body.username
        let password = req.body.password

        const user = new User({username, password})

        req.login(user, (err) => {
            if (err) console.log(err)
            else {
                passport.authenticate('local')(req, res, () => {
                    return res.redirect('/secrets')
                })
            }
        })
    })

app.route('/register')
    .get((req, res) => res.render('register'))
    .post((req, res) => {
        let username = req.body.username
        let password = req.body.password

        User.register({username}, password, (err, user) => {
            if (err) {
                console.log(err)
                return res.redirect('/register')
            } else {
                passport.authenticate('local')(req, res, () => {
                    return res.redirect('/secrets')
                })
            }
        })
    })

app.route('/secrets')
    .get((req, res) => {
        User.find({'secret': {$ne:null}}, (err, users) => {
            if (err) console.log(err)
            else {
                if (users) {
                    return res.render('secrets', {usersWithSecrets: users})
                }
            }
        })
    })

app.route('/submit')
    .get((req, res) => {
        if (req.isAuthenticated()) {
            return res.render('submit')
        } else {
            return res.redirect('/login')
        }
    })
    .post((req, res) => {
        let secret = req.body.secret
        let user_id = req.user.id

        User.findById(user_id, (err, user) => {
            if (err) console.log(err)
            else {
                if (user) {
                    user.secret = secret
                    user.save(() => {
                        res.redirect('/secrets')
                    })
                }
            }
        })
    })

app.listen(3000, () => console.log('Server started on port 3000.'))