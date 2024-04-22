import { MongoClient, ObjectId } from 'mongodb'
import { Location, Coordinates, MODES } from './model'

// Connection URL
const url = process.env.MONGO_URL || 'mongodb://localhost:27017'
const client = new MongoClient(url)

const locations: Location[] = [
    {
        _id: 1,
        imageUrl: 'https://dukeguessrbucket.s3.amazonaws.com/IMG_9906.JPG',
        eligibleModes: ['all', 'east'],
        coords: {
            lat: 1,
            long: 1,
            elev: 1,
        },
        name: "East Campus Street"
    },
    {
        _id: 2,
        imageUrl: 'https://dukeguessrbucket.s3.amazonaws.com/IMG_2309.jpg',
        eligibleModes: ['all', 'gardens'],
        coords: {
            lat: 2,
            long: 2,
            elev: 2,
        },
        name: "Gardens Bridge"
    },
    {
        _id: 3,
        imageUrl: 'https://dukeguessrbucket.s3.amazonaws.com/IMG_2300.jpg',
        eligibleModes: ['all', 'west'],
        coords: {
            lat: 3,
            long: 3,
            elev: 3,
        },
        name: "West Campus Lawn"
    },
    {
        _id: 4,
        imageUrl: 'https://dukeguessrbucket.s3.amazonaws.com/IMG_4426.jpg',
        eligibleModes: ['all', 'east'],
        coords: {
            lat: 3,
            long: 3,
            elev: 3,
        },
        name: "Biddle Interior"
    },
    {
        _id: 5,
        imageUrl: 'https://dukeguessrbucket.s3.amazonaws.com/IMG_4425.jpg',
        eligibleModes: ['all', 'east'],
        coords: {
            lat: 3,
            long: 3,
            elev: 3,
        },
        name: "Biddle Exterior"
    },
    {
        _id: 6,
        imageUrl: 'https://dukeguessrbucket.s3.amazonaws.com/IMG_4423.jpg',
        eligibleModes: ['all', 'west'],
        coords: {
            lat: 3,
            long: 3,
            elev: 3,
        },
        name: "Kilgo"
    },
    {
        _id: 7,
        imageUrl: 'https://dukeguessrbucket.s3.amazonaws.com/IMG_1906.JPG',
        eligibleModes: ['all', 'west'],
        coords: {
            lat: 3,
            long: 3,
            elev: 3,
        },
        name: "Penn Pavillion"
    },
    {
        _id: 9,
        imageUrl: 'https://dukeguessrbucket.s3.amazonaws.com/IMG_4420.jpg',
        eligibleModes: ['all', 'west'],
        coords: {
            lat: 3,
            long: 3,
            elev: 3,
        },
        name: "Crowell Quad"
    },
    {
        _id: 10,
        imageUrl: 'https://dukeguessrbucket.s3.amazonaws.com/IMG_4420.jpg',
        eligibleModes: ['all', 'west'],
        coords: {
            lat: 3,
            long: 3,
            elev: 3,
        },
        name: "Crowell Quad"
    },
    {
        _id: 11,
        imageUrl: 'https://dukeguessrbucket.s3.amazonaws.com/IMG_2273.jpg',
        eligibleModes: ['all', 'west'],
        coords: {
            lat: 3,
            long: 3,
            elev: 3,
        },
        name: "Bus Stop"
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