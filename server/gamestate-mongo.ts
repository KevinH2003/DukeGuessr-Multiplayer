import { MongoClient, ObjectId, InsertOneResult } from "mongodb"
import { Location, GameSetup, GameState, createEmptyGame} from "./model"

const DB = "DukeGuessrDB"
const GAMES_COLLECTION = "games"

export interface MongoGameState extends GameState {
	_id: ObjectId
	version: number
}

export async function setupMongo() {
	const mongoClient = new MongoClient(process.env.MONGO_URL || "mongodb://localhost:27017")
	await mongoClient.connect()

	const db = mongoClient.db(DB)
	const gamesCollection = db.collection(GAMES_COLLECTION)

	return {
		db,
		gamesCollection,
		getGameState: async (gameId: string) => {
			const _id = ObjectId.createFromHexString(gameId)
			return await gamesCollection.findOne({ _id: _id }) as unknown as MongoGameState | null
		},

		tryToUpdateGameState: async (gameId: string, newGameState: MongoGameState) => {
			const _id = ObjectId.createFromHexString(gameId)
			const result = await gamesCollection.replaceOne(
				{ _id: _id, version: newGameState.version },
				{ ...newGameState, version: newGameState.version + 1 },
			)

			if (result.modifiedCount > 0) {
				++newGameState.version
				return true
			} else {
				return false
			}
		},
		newGame: async (params: GameSetup, gameId?: string) => {
			let result: InsertOneResult<Document>
			// Get locations from locations collection
			const locations: Location[] = await db.collection("locations").aggregate([
				{ $sample: { size: params.numRounds } }
				]).toArray() as any as Location[];
		  
			// Check if not enough locations available
			if (locations.length < params.numRounds) {
			  	console.log(`Not enough locations to support ${params.numRounds} rounds, setting num_rounds to max number of locations (${locations.length})`)
			  	params.numRounds = locations.length
			}

			if (typeof(gameId) == "string"){
				const _id = ObjectId.createFromHexString(gameId)
				const existingGame = await gamesCollection.findOne({ _id: _id})

            	if (existingGame && (existingGame?.phase.localeCompare("game-over") == 0)) {
            	    // If the game exists, update it with the new game state
            	    await gamesCollection.updateOne({ _id: _id }, {
            	        $set: { ...createEmptyGame(params, locations) }
            	    });
            	    return gameId; // Return the _id of the existing game
            	} else if (!existingGame){
					result = await gamesCollection.insertOne({_id: ObjectId.createFromHexString(gameId), version: 0, ...createEmptyGame(params, locations)})
					return String(result.insertedId)
				} else{
					console.log("Game Already Exists and In Progress, Setting Random ID")
				}
			}

			result = await gamesCollection.insertOne({_id: new ObjectId(), version: 0, ...createEmptyGame(params, locations)})
			return String(result.insertedId)
		}
	}
}