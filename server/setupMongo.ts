import { MongoClient, ObjectId } from 'mongodb'

// Connection URL
const url = 'mongodb://localhost:27017'
const client = new MongoClient(url)

async function main() {
    await client.connect()
    console.log('Connected successfully to MongoDB')

    const db = client.db("DukeGuessrDB")
  
    process.exit(0)
}
  
main()