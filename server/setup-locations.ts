import { MongoClient, ObjectId } from 'mongodb'
import { Location, Coordinates, MODES } from './model'

// Connection URL
const url = process.env.MONGO_URL || 'mongodb://localhost:27017'
const client = new MongoClient(url)

const locations: Location[] = [
    {
        _id: 1,
        imageUrl: 'https://dukeguessrbucket.s3.amazonaws.com/09a847de-8f99-49cf-9181-6f71fea2299c.jpeg',
        eligibleModes: ['all', 'east'],
        coords: {
            lat: 1,
            long: 1,
            elev: 1,
        }
    },
    {
        _id: 2,
        imageUrl: 'https://dukeguessrbucket.s3.amazonaws.com/IMG_2309.jpg',
        eligibleModes: ['all', 'gardens'],
        coords: {
            lat: 2,
            long: 2,
            elev: 2,
        }
    },
    {
        _id: 3,
        imageUrl: 'https://dukeguessrbucket.s3.amazonaws.com/IMG_2300.jpg',
        eligibleModes: ['all', 'west'],
        coords: {
            lat: 3,
            long: 3,
            elev: 3,
        }
    },
]


async function main() {
    await client.connect()
    console.log('Connected successfully to MongoDB')

    const db = client.db("DukeGuessrDB")
    console.log("inserting locations...", await db.collection("locations").insertMany(locations as any))

    process.exit(0)
}
  
main()