export const MODES = ["west", "east", "gardens", "all"]

export type Mode = typeof MODES[number]

export interface GameState {

}

export function createEmptyGame(players: string[], mode: Mode, num_rounds: number): GameState {
    return null
}