export const MODES = ["west", "east", "gardens", "all"]
export const PHASES = ["guessing", "score-display", "game-over"]

export type Mode = typeof MODES[number]
export type Phase = typeof PHASES[number]
export type Player = string
export type Time = number

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
    locationId: number
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

export function createEmptyGame(players: string[], mode: Mode, num_rounds: number): GameState {
    return null
}