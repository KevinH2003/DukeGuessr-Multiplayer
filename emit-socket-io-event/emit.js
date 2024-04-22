import { io } from 'socket.io-client'

const URL = process.env.URL
if (!URL) {
	console.error("missing URL environment variable")
	process.exit(1)
}

const EVENT = process.env.EVENT || `["guess", "East Campus Lawn"]`
const parsedEvent = JSON.parse(EVENT)

console.log("Connecting to " + URL)
const socket = io(URL, { transports: ['websocket'], timeout: 3000 })

socket.on('connect', () => {
	console.log('Connected to the server at', URL)

	// Emit a test event
	console.log("Emitting event", parsedEvent)
	socket.emit("player-index", parseInt(process.env.INDEX))
	socket.emit(...parsedEvent)
})

socket.on('guess', (data) => {
	console.log('Event received:', data)
})

socket.on('disconnect', (reason) => {
	console.error("Disconnected:", reason)
	process.exit(1)
})

socket.on('connect_error', (reason) => {
	console.error("Error:", reason)
	process.exit(1)
})
