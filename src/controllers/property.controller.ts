import type { FastifyReply, FastifyRequest } from 'fastify';
import { ValidationError } from '../errors/app.error.js';
import { searchPublicPropertyListings } from '../services/properties/index.js';
import { parsePropertyListingQuery } from '../validations/property.validation.js';

export async function getPublicPropertyListings(
  fastifyRequest: FastifyRequest,
  fastifyReply: FastifyReply,
): Promise<FastifyReply> {
  const parsedQuery = parsePropertyListingQuery(fastifyRequest.query);
  if (!parsedQuery.success) throw new ValidationError();

  const query = parsedQuery.data;
  const listingResults = await searchPublicPropertyListings({
    ...(query.universityId ? { universityId: query.universityId } : {}),
    ...(query.search ? { searchText: query.search } : {}),
    ...(query.city ? { city: query.city } : {}),
    rentalPeriod: query.rentalPeriod,
    ...(query.minimumRentAmount !== undefined ? { minimumRentAmount: query.minimumRentAmount } : {}),
    ...(query.maximumRentAmount !== undefined ? { maximumRentAmount: query.maximumRentAmount } : {}),
    ...(query.minimumBedrooms !== undefined ? { minimumBedrooms: query.minimumBedrooms } : {}),
    ...(query.latitude !== undefined ? { latitude: query.latitude } : {}),
    ...(query.longitude !== undefined ? { longitude: query.longitude } : {}),
    ...(query.radiusKm !== undefined ? { radiusKm: query.radiusKm } : {}),
    page: query.page,
    pageSize: query.pageSize,
    offset: (query.page - 1) * query.pageSize,
  });

  return fastifyReply.code(200).send(listingResults);
}
