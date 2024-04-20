import { MongoClient, ObjectId } from "mongodb"

export const MODES = ["all", "west", "east", "gardens"]
export const PHASES = ["guessing", "score-display", "game-over"]

export type Mode = typeof MODES[number]
export type Phase = typeof PHASES[number]
export type Player = string
export type Time = number
export type Id = number

export interface User {
    sub: string
    sub_legacy: string
    name: string
    nickname: string
    preferred_username: string
    email: string
    email_verified: boolean
    profile: string
    picture: string
    groups: string[]
}

export type Coordinates = {
    lat: number
    long: number
    elev: number
}

export type Guess = {
    timeSubmitted: Time
    coords: Coordinates
}

//export type GuessInProgress = Guess | null

export type PlayerGuesses = {
    [key: Player]: Guess
}

export type PlayerScores = {
    [key: Player]: number
}

export interface StrippedLocation {
    _id: Id
    imageUrl: string
}

export interface Location extends StrippedLocation {
    coords: Coordinates
    eligibleModes: Mode[]
}

export interface GameSetup {
    mode: Mode
    numRounds: number
    players?: Player[]
    numPlayers?: number
    roundLength?: Time
}

export interface GameState extends GameSetup{
    players: Player[]
    locations: Location[]
    round: number
    playerScores: PlayerScores
    playerGuesses: PlayerGuesses
    phase: Phase
    roundStart: Time
    currTime: Time
}

export function determineWinner(state: GameState): Player | undefined {
    const { players, playerScores } = state;

    // find the key of the maximum score
    const maxScoreKey = Object.keys(playerScores).reduce((maxKey, key) => {
        if (playerScores[key] > playerScores[maxKey]) {
            return key;
        } else {
            return maxKey;
        }
    }, Object.keys(playerScores)[0]); // Initialize with the first key

    // return the player corresponding to the key of the maximum score
    return players.find(player => player === maxScoreKey);
}

export function createEmptyGame(params: GameSetup, locations: Location[]): GameState {
    const emptyGame: GameState = {
        players: [],
        mode: params.mode,
        locations: locations,
        numRounds: params.numRounds,
        numPlayers: params?.numPlayers || -1,
        roundLength: params?.roundLength || -1, 
        round: 0,
        playerScores: {}, 
        playerGuesses: {}, 
        phase: "guessing", // Initial phase is guessing
        roundStart: 0, 
        currTime: 0,
    }
    return emptyGame
}