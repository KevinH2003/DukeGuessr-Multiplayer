import { createServer } from "http"
import { Server } from "socket.io"
import express, { NextFunction, Request, Response } from 'express'
import bodyParser from 'body-parser'
import pino from 'pino'
import expressPinoLogger from 'express-pino-logger'
import { Collection, Db, MongoClient, ObjectId } from 'mongodb'
import session from 'express-session'
import MongoStore from 'connect-mongo'
import { Issuer, Strategy, generators } from 'openid-client'
import passport from 'passport'
import { gitlab } from "./secrets"
// set up Mongo
const mongoUrl = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017'
const client = new MongoClient(mongoUrl)
let db: Db

// set up Express
const app = express()
const server = createServer(app)
const port = parseInt(process.env.PORT) || 7776
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// set up Pino logging
const logger = pino({
  transport: {
    target: 'pino-pretty'
  }
})
app.use(expressPinoLogger({ logger }))

// set up CORS
// app.use(cors({
//   origin: "http://127.0.0.1:" + port,
//   credentials: true,
// }))

// set up session
const sessionMiddleware = session({
  secret: 'please dont figure me out',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false },

  store: MongoStore.create({
    mongoUrl: 'mongodb://127.0.0.1:27017',
    ttl: 14 * 24 * 60 * 60 // 14 days
  })
})
app.use(sessionMiddleware)
declare module 'express-session' {
  export interface SessionData {
    credits?: number
  }
}

app.use(passport.initialize())
app.use(passport.session())
passport.serializeUser((user, done) => {
  console.log("serializeUser", user)
  done(null, user)
})
passport.deserializeUser((user, done) => {
  console.log("deserializeUser", user)
  done(null, user)
})

// set up Socket.IO
const io = new Server(server)

// convert a connect middleware to a Socket.IO middleware
const wrap = (middleware: any) => (socket: any, next: any) => middleware(socket.request, {}, next)
io.use(wrap(sessionMiddleware))

//routes
app.post(
  "/api/logout", 
  (req, res, next) => {
    req.logout((err) => {
      if (err) {
        return next(err)
      }
      res.redirect("/")
    })
  }
)

app.get("/api/user", (req, res) => {
  res.json(req.user || {})
})

client.connect().then(() => {
    logger.info('connected successfully to MongoDB')
    db = client.db("DukeGuessrDB")
  
    Issuer.discover("https://coursework.cs.duke.edu/").then(issuer => {
      const client = new issuer.Client(gitlab)
    
      const params = {
        scope: 'openid profile email',
        nonce: generators.nonce(),
        redirect_uri: 'http://127.0.0.1:7775/login-callback',
        state: generators.state(),
      }
    
      function verify(tokenSet: any, userInfo: any, done: (error: any, user: any) => void) {
        console.log('userInfo', userInfo)
        console.log('tokenSet', tokenSet)
        return done(null, userInfo)
      }
    
      passport.use('oidc', new Strategy({ client, params }, verify))
  
      app.get(
        "/api/login", 
        passport.authenticate("oidc", { failureRedirect: "/api/login" }), 
        (req, res) => res.redirect("/")
      )
      
      app.get(
        "/login-callback",
        passport.authenticate("oidc", {
          successRedirect: "/",
          failureRedirect: "/api/login",
        })
      )    
  
      // start server
      server.listen(port)
      logger.info(`Game server listening on port ${port}`)
    })
  })
