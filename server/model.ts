import { MongoClient, ObjectId } from "mongodb"

export const MODES = ["west", "east", "gardens", "all"]
export const PHASES = ["guessing", "score-display", "game-over"]

export type Mode = typeof MODES[number]
export type Phase = typeof PHASES[number]
export type Player = string
export type Time = number
export type Id = number

export type Coordinates = {
    lat: number
    long: number
    elev: number
}

export type Guess = {
    timeSubmitted: Time
    coords: Coordinates
}

export type GuessInProgress = Guess | null

export interface StrippedLocation {
    _id: Id
    imageUrl: string
}

export interface Location extends StrippedLocation {
    coords: Coordinates
    eligibleModes: Mode[]
}

export interface GameSetup {
    players: Player[]
    mode: Mode
    locations: Location[]
    numRounds: number
    numPlayers: number
    roundLength: Time
}

export interface GameState extends GameSetup{
    round: number
    playerScores: number[]
    playerGuesses: GuessInProgress[]
    phase: Phase
    roundStart: Time
    currTime: Time
}

export function determineWinner(state: GameState): Player{
    const { players, playerScores } = state;

    // find the index of the maximum score
    const maxScoreIndex = playerScores.reduce((maxIndex, score, currentIndex) => {
        if (score > playerScores[maxIndex]) {
            return currentIndex; 
        } else {
            return maxIndex;
        }
    }, 0);

    // return the player corresponding to the index of the maximum score
    return players[maxScoreIndex];
}

export async function createEmptyGame(players: Player[], mode: Mode, num_rounds: number, roundLength?: Time): Promise<GameState> {
    // Connect to MongoDB
    const mongoUrl = process.env.DB_URL || 'mongodb://127.0.0.1:27775'
    const client = new MongoClient(mongoUrl)
    await client.connect()

    try {
        // Fetch locations from the database
        const db = client.db("DukeGuessrDB")
        const locations: Location[] = await db.collection("locations").find({}).limit(num_rounds).toArray() as any as Location[]

        if (locations.length < num_rounds) {
            console.log("Not enough locations to support ${num_rounds} rounds, setting num_rounds to  max number of locations (${locations.length})")
            num_rounds = locations.length
        }

        // Construct the empty game object
        const emptyGame: GameState = {
            players: players,
            mode: mode,
            locations: locations,
            numRounds: num_rounds,
            numPlayers: players.length,
            roundLength: roundLength || 0, // Default to 0 if roundLength is not provided
            round: 0,
            playerScores: Array(players.length).fill(0), // Initialize player scores with zeros
            playerGuesses: Array(players.length).fill(null), // Initialize player guesses with nulls
            phase: "guessing", // Initial phase is guessing
            roundStart: 0, // Initialize round start time
            currTime: 0 // Initialize current time
        };

        return emptyGame;
    } finally {
        // Close the MongoDB client connection
        await client.close();
    }
}