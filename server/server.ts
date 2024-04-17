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
import { Location, Guess, createEmptyGame, GameSetup, GameState } from "./model"
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


// set up Express
const app = express()
const server = createServer(app)
const { db, gamesCollection, getGameState, tryToUpdateGameState, newGame } = await setupMongo()
const { socketIoAdapter: adapter } = await setupRedis()
const io = new Server(server, { adapter })
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
passport.serializeUser((user, done) => {
  console.log("serializeUser", user)
  done(null, user)
})
passport.deserializeUser((user, done) => {
  console.log("deserializeUser", user)
  done(null, user)
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


passport.use("disable-security", new CustomStrategy((req, done) => {
  logger.info("trying to disable security...\n\n\n\n\n\n\n\n\n")
  if (req.query.key !== DISABLE_SECURITY) {
    logger.info("disable security failed\n\n\n\n\n")
    console.log("you must supply ?key=" + DISABLE_SECURITY + " to log in via DISABLE_SECURITY")
    done(null, false)
  } else {
    //done(null, { name: req.query.name, preferred_username: req.query.preferred_username, roles: [].concat(req.query.role) })
    logger.info("disable security succeeded\n\n\n\n\n")
    done(null, { name: req.query.name, preferred_username: req.query.preferred_username })
  }
}))

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

// convert a connect middleware to a Socket.IO middleware
const wrap = (middleware: any) => (socket: any, next: any) => middleware(socket.request, {}, next)
io.use(wrap(sessionMiddleware))

io.on('connection', client => {
  function emitGameState(id: string) {
    let state = getGameState(id)
    client.to(id).emit(
      "game-state", 
      state
    )
  }

  console.log("New client")

  let gameId: string | null = null
  let username: string | null = null

  client.on("game-id", (id: string) => {
    gameId = id
    console.log("Game ID Set: ", gameId)
    client.join(gameId)
  })
  client.on("username", (name: string) => {
    username = name
    console.log("Username Set: ", username)
    client.join(username)
  })

  client.on("guess", async (guess: Guess) => {
    const state = await getGameState(gameId)
    state.playerGuesses[username] = guess
    if (tryToUpdateGameState(gameId, {...state})){
      emitGameState(gameId)
    } else{
      //Error handling
    }

  })

  client.on("guess", async (guess: Guess) => {
    const state = await getGameState(gameId)
    state.playerGuesses[username] = guess
    tryToUpdateGameState(gameId, {...state})
  })

})


app.get("/api/user", (req, res) => {
  res.json(req.user || {})
})

app.put("/api/game/:gameId?", checkAuthenticated, async (req, res) => {
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

app.get("/api/game/:gameId", checkAuthenticated, async (req, res) => {
  res.status(200).json( await getGameState(req.params.gameId))
})

app.listen(SERVER_PORT, () => {
  console.log(`DukeGuessr listening on port: ${SERVER_PORT}`)
})
}


main()