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
import { Location, Guess, createEmptyGame, GameSetup, GameState, Coordinates, User, MODES } from "./model"
import { validateRequestBody } from "./utils"
import { emit } from "process"

declare module 'express-session' {
  export interface SessionData {
    credits?: number
  }
}

async function main() {
const HOST = process.env.HOST || "localhost"
const SERVER_PORT = parseInt(process.env.SERVER_PORT) || 7776
const UI_PORT = parseInt(process.env.UI_PORT) || 7775
const DISABLE_SECURITY = process.env.DISABLE_SECURITY || ""

const passportStrategies = [
  ...(DISABLE_SECURITY ? ["disable-security"] : []),
  "disable-security",
  "oidc",
]

const defaultGameSetup: GameSetup = {
  mode: "west",
  numRounds: 5,
}

// set up Express
const app = express()
const server = createServer(app)
const { db, gamesCollection, getGameState, tryToUpdateGameState, newGame } = await setupMongo()
const { socketIoAdapter: adapter } = await setupRedis()
//const io = new Server(server, { adapter })
const io = new Server(server)
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// set up Pino logging
const logger = pino({
  transport: {
    target: 'pino-pretty'
  }
})
//app.use(expressPinoLogger({ logger }))

// set up CORS
// app.use(cors({
//   origin: "http://localhost:" + SERVER_PORT,
//   credentials: true,
// }))

// set up session
const sessionMiddleware = session({
  secret: 'please dont figure me out',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false },

  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URL || 'mongodb://localhost:27017',
    ttl: 14 * 24 * 60 * 60 // 14 days
  })
})

app.use(sessionMiddleware)

app.use(passport.initialize())
app.use(passport.session())
passport.serializeUser((user: User, done) => {
  logger.info("serializeUser " + user.preferred_username)
  done(null, user)
})
passport.deserializeUser((user: User, done) => {
  logger.info("deserializeUser " + user.preferred_username)
  done(null, user)
})

passport.use("disable-security", new CustomStrategy((req, done) => {
  logger.info("trying to disable security...")
  if (req.query.key !== DISABLE_SECURITY) {
    logger.info("disable security failed")
    console.log("you must supply ?key=" + DISABLE_SECURITY + " to log in via DISABLE_SECURITY")
    done(null, false)
  } else {
    //done(null, { name: req.query.name, preferred_username: req.query.preferred_username, roles: [].concat(req.query.role) })
    logger.info("disable security succeeded")
    done(null, { name: req.query.name, preferred_username: req.query.preferred_username })
  }
}))

// convert a connect middleware to a Socket.IO middleware
const wrap = (middleware: any) => (socket: any, next: any) => middleware(socket.request, {}, next)
io.use(wrap(sessionMiddleware))

/*
io.engine.on("connection_error", (err) => {
  console.log(err.req);      // the request object
  console.log(err.code);     // the error code, for example 1
  console.log(err.message);  // the error message, for example "Session ID unknown"
  console.log(err.context);  // some additional error context
});*/

io.on('connection', client => {
  const user = (client.request as any).session?.passport?.user
  logger.info("New socket connection for user: " + JSON.stringify(user.preferred_username))
  
  if (!user) {
    logger.info("Disconnected: User Not Authenticated")
    client.disconnect()
    return
  }

  async function emitGameState(id: string) {
    let state = await getGameState(id)
    logger.info(`Emitting GameState to ${id}`)
    io.to(id).emit(
      "gamestate", 
      state
    )
  }

  let username: string = user.preferred_username
  let gameId: string | null = null

  /*
  client.on("username", (name: string) => {
    username = name
    logger.info("Username Set: " + username)
    client.join(username)
  })*/
  
  client.on("game-id", async (id: string) => {
    gameId = id
    logger.info("Game ID Set: " + gameId)
    client.join(String(gameId))
    //let rooms = client.rooms
    //logger.info('Rooms joined by client: ' + JSON.stringify(rooms))
    let game = await getGameState(gameId)
    if (!game){
      logger.info("Creating new game..." + JSON.stringify(gameId))
      await newGame(defaultGameSetup, gameId)
      game = await getGameState(gameId)
    }
    if (!game.players.includes(username)){
      game.players.push(username)
    }
    await tryToUpdateGameState(gameId, game)
    await emitGameState(gameId)
  })

  client.on("guess", async (coords: Coordinates) => {
    const state = await getGameState(gameId)
    logger.info("Guess received: ", coords)
    //Should eventually do time handling stuff here, for now just put it as 0
    state.playerGuesses[username] = {coords, timeSubmitted: 0} as Guess
    if (await tryToUpdateGameState(gameId, {...state})){
      emitGameState(gameId)
    } else{
      //Error handling
    }

  })

})

app.get('/api/login', passport.authenticate(passportStrategies, {
  successReturnToOrRedirect: "/"
}))

app.get('/api/login-callback', passport.authenticate(passportStrategies, {
  successReturnToOrRedirect: '/',
  failureRedirect: '/',
}))

function checkAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    res.sendStatus(401)
    return
  }
  next()
}

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

{
  const issuer = await Issuer.discover("https://coursework.cs.duke.edu/")
  const client = new issuer.Client(gitlab)

  const params = {
    scope: 'openid profile email',
    nonce: generators.nonce(),
    redirect_uri: `http://${HOST}:${UI_PORT}/api/login-callback`,
    state: generators.state(),

    // this forces a fresh login screen every time
    prompt: "login",
  }

  async function verify(tokenSet: any, userInfo: any, done: any) {
    logger.info("oidc " + JSON.stringify(userInfo))
    // console.log('userInfo', userInfo)
    //userInfo.roles = userInfo.groups.includes(OPERATOR_GROUP_ID) ? ["operator"] : ["customer"]
    return done(null, userInfo)
  }

  passport.use('oidc', new Strategy({ client, params }, verify))
}

app.get("/api/gamemodes", async (req, res) => {
  const gamemodes = MODES
  res.json(gamemodes)
})

app.get("/api/user", (req, res) => {
  res.json(req?.user || {})
})

app.put("/api/game/:gameId?", checkAuthenticated, async (req, res) => {
  //If no gameId, will generate a random gameId and return it
  const requiredAttributes = ['players', 'mode', 'numRounds', 'numPlayers']

  // Check if the request body has all the required attributes
  
  if (!validateRequestBody(req.body, requiredAttributes)) {
    return res.status(400).json({ error: req.body })//error: 'Missing required attributes in the request body, ${req.body}' });
  }
  
  const gameParams = req.body
  
  logger.info("Creating New Game: " + JSON.stringify(gameParams))
  const newGameId: string = await newGame(gameParams, req.params.gameId)
  //res.status(200).json(getGameState(newGameId))
  res.status(200).json(newGameId)
})

app.get("/api/game/:gameId", checkAuthenticated, async (req, res) => {
  res.status(200).json( await getGameState(req.params.gameId))
})

server.listen(SERVER_PORT, () => {
  console.log(`DukeGuessr listening on port: ${SERVER_PORT}`)
})

/*
app.listen(SERVER_PORT, () => {
  console.log(`DukeGuessr listening on port: ${SERVER_PORT}`)
})*/
}
main()