import { createServer } from "http"
import { Server } from "socket.io"
import express, { NextFunction, Request, Response } from 'express'
import bodyParser from 'body-parser'
import pino from 'pino'
import expressPinoLogger from 'express-pino-logger'
import session from 'express-session'
import MongoStore from 'connect-mongo'
import { Issuer, Strategy, generators } from 'openid-client'
import passport from 'passport'
import { Strategy as CustomStrategy } from "passport-custom"
import { gitlab } from "./secrets"
import { setupMongo } from "./gamestate-mongo"
import { setupRedis } from "./redis"
import { Location, GameSetup, createEmptyGame } from "./model"
import { validateRequestBody } from "./utils"

declare module 'express-session' {
  export interface SessionData {
    credits?: number
  }
}

async function main() {
const DISABLE_SECURITY = !!process.env.DISABLE_SECURITY

// set up Express
const app = express()
const server = createServer(app)
const { db, gamesCollection, getGameState, tryToUpdateGameState, newGame } = await setupMongo()
const { socketIoAdapter: adapter } = await setupRedis()
const io = new Server(server, { adapter })
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

app.put("/api/game/:gameId?", async (req, res) => {
  //If no gameId, will generate a random gameId and return it
  const requiredAttributes = ['players', 'mode', 'numRounds'];

  // Check if the request body has all the required attributes
  
  if (!validateRequestBody(req.body, requiredAttributes)) {
    return res.status(400).json({ error: req.body })//error: 'Missing required attributes in the request body, ${req.body}' });
  }
  
  const gameParams = req.body

  // Get locations from locations collection
  const locations: Location[] = await db.collection("locations").aggregate([
      { $sample: { size: parseInt(gameParams.numRounds) } }
    ]).toArray() as any as Location[];
  
  // Check if not enough locations available
  if (locations.length < gameParams.numRounds) {
    console.log("Not enough locations to support ${num_rounds} rounds, setting num_rounds to max number of locations (${locations.length})")
    gameParams.numRounds = locations.length
  }
  
  const newGameId: string = await newGame(gameParams, locations, req.params.gameId)
  //res.status(200).json(getGameState(newGameId))
  res.status(200).json(newGameId)
})

app.get("/api/game/:gameId", async (req, res) => {
  res.status(200).json( await getGameState(req.params.gameId))
})

if (DISABLE_SECURITY) {
  passport.use("oidc", new CustomStrategy((req, done) => done(null, { preferred_username: req.query.user, roles: req.query.role })))
} else{
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
}

}

main()