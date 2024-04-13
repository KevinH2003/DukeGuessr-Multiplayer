import { MongoClient, ObjectId } from 'mongodb'
import { Location, Coordinates } from './model'

// Connection URL
const url = 'mongodb://localhost:27775'
const client = new MongoClient(url)

const locations: Location[] = [
    {
        _id: 2,
        imageUrl: 'https://dukeguessrbucket.s3.amazonaws.com/09a847de-8f99-49cf-9181-6f71fea2299c.jpeg',
        eligibleModes: ['all', 'west'],
        coords: {
            lat: 1,
            long: 1,
            elev: 1,
        }
    },
    {
        _id: 2,
        imageUrl: 'https://dukeguessrbucket.s3.amazonaws.com/1243a435-49d2-400d-b3e6-46e35517be70.jpeg',
        eligibleModes: ['all', 'east'],
        coords: {
            lat: 2,
            long: 2,
            elev: 2,
        }
    }
]

async function main() {
    await client.connect()
    console.log('Connected successfully to MongoDB')

    const db = client.db("DukeGuessrDB")

    console.log("inserting locations...", await db.collection("locations").insertMany(locations as any))

    process.exit(0)
}
  
main()