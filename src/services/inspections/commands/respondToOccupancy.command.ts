import { respondToOccupancy } from '../../../repositories/occupancy.repository.js';
export async function respondToOccupancyRequest(input: Parameters<typeof respondToOccupancy>[0]) { return respondToOccupancy(input); }
