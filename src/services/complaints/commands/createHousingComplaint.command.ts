import { createOccupancyComplaint } from '../../../repositories/complaintWorkflow.repository.js';
export async function openHousingComplaint(input: Parameters<typeof createOccupancyComplaint>[0]) { return createOccupancyComplaint(input); }
