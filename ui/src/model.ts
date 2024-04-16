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
    numRounds: number
    numPlayers?: number
    roundLength?: Time
}

export interface GameState extends GameSetup{
    locations: Location[]
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

export function createEmptyGame(params: GameSetup, locations: Location[]): GameState {
    const emptyGame: GameState = {
        players: params.players,
        mode: params.mode,
        locations: locations,
        numRounds: params.numRounds,
        numPlayers: params?.numPlayers || params.players?.length,
        roundLength: params?.roundLength || 0, // Default to 0 if roundLength is not provided
        round: 0,
        playerScores: Array(params.players.length).fill(0), // Initialize player scores with zeros
        playerGuesses: Array(params.players.length).fill(null), // Initialize player guesses with nulls
        phase: "guessing", // Initial phase is guessing
        roundStart: 0, // Initialize round start time
        currTime: 0 // Initialize current time
    }
    return emptyGame
}