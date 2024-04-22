import {Location} from './model'

export function validateRequestBody(body: any, requiredAttributes: string[]): boolean {
    return requiredAttributes.every(attr => attr in body);
}

export function getRandomLocationInputs(locations: Location[], round: number, numLocations: number): Location[]{
    const currentRoundLocation = locations[round]
  
    // Get 3 random locations (excluding the current round location)
    const randomLocations = locations
      .filter(location => location !== currentRoundLocation)
      .sort(() => Math.random() - 0.5) // Shuffle the locations
      .slice(0, numLocations - 1); // Take the first 3 random locations
  
    // Add the current round location to the random locations
    const combinedLocations = [currentRoundLocation, ...randomLocations];
  
    // Shuffle the combined locations again to ensure randomness
    return combinedLocations.sort(() => Math.random() - 0.5);
  };