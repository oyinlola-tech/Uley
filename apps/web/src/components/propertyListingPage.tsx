'use client';

import Link from 'next/link';
import { Fragment } from 'react';
import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { BedIcon, BuildingsIcon, MapPinIcon, ShowerIcon } from '@phosphor-icons/react/ssr';
import { WEB_API_BASE_PATH, WEB_API_ENDPOINTS, WEB_AUTH_STORAGE_KEYS } from '../constants';
import { NIGERIAN_NAIRA_FORMATTER, PROPERTY_LISTING_COPY } from '../constants/propertyListing.constant';
import { WEB_ERROR_MESSAGES, getApiResponseErrorMessage } from '../errors';
import { RENTAL_PERIOD_LABELS, RentalPeriod } from '../enums/rentalPeriod.enum';
import type { PublicPropertyListing, PublicPropertyListingResponse, PublicUserAdvertisement } from '../models';
import styles from './propertyListingPage.module.css';
import { PropertyImageGallery } from './propertyImageGallery';
import { CommunityAdCard } from './communityAdCard';

export function PropertyListingPage() {
  const [listingResponse, setListingResponse] = useState<PublicPropertyListingResponse | null>(null);
  const [communityAd, setCommunityAd] = useState<PublicUserAdvertisement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchParameters, setSearchParameters] = useState('');
  const [searchText, setSearchText] = useState('');
  const [city, setCity] = useState('');
  const [rentalPeriod, setRentalPeriod] = useState<RentalPeriod>(RentalPeriod.YEAR);
  const [maximumRentAmount, setMaximumRentAmount] = useState('');
  const [minimumBedrooms, setMinimumBedrooms] = useState('');

  const loadPropertyListings = useCallback(async (parameters: string) => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const response = await fetch(`${WEB_API_BASE_PATH}${WEB_API_ENDPOINTS.propertyListings}${parameters}`, { cache: 'no-store' });
      const responseBody = await response.json() as PublicPropertyListingResponse | { error?: { message?: string }; requestId?: string };
      if (!response.ok) throw new Error('error' in responseBody ? getApiResponseErrorMessage(responseBody.error?.message ?? WEB_ERROR_MESSAGES.requestFailedPleaseRetry, response.status, responseBody.requestId) : WEB_ERROR_MESSAGES.requestFailedPleaseRetry);
      setListingResponse(responseBody as PublicPropertyListingResponse);
      await loadStudentFeedAd(parameters);
    } catch {
      setErrorMessage(WEB_ERROR_MESSAGES.listingsUnavailable);
    } finally {
      setIsLoading(false);
    }
  }, []);

  async function loadStudentFeedAd(parameters: string) {
    setCommunityAd(null);
    const token = window.sessionStorage.getItem(WEB_AUTH_STORAGE_KEYS.accessToken);
    if (!token) return;
    const city = new URLSearchParams(parameters).get('city');
    const query = city ? `?city=${encodeURIComponent(city)}` : '';
    try {
      const response = await fetch(`${WEB_API_BASE_PATH}${WEB_API_ENDPOINTS.userAdvertisements}${query}`, { headers: { authorization: `Bearer ${token}` }, cache: 'no-store' });
      if (!response.ok) return;
      const result = await response.json() as { ads?: PublicUserAdvertisement[] };
      setCommunityAd(result.ads?.[0] ?? null);
    } catch { setCommunityAd(null); }
  }

  useEffect(() => { void loadPropertyListings(''); }, [loadPropertyListings]);

  function submitPropertySearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parameters = new URLSearchParams();
    if (searchText.trim()) parameters.set('search', searchText.trim());
    if (city.trim()) parameters.set('city', city.trim());
    parameters.set('rentalPeriod', rentalPeriod);
    if (maximumRentAmount.trim()) parameters.set('maximumRentAmount', maximumRentAmount.trim());
    if (minimumBedrooms) parameters.set('minimumBedrooms', minimumBedrooms);
    const nextParameters = parameters.size ? `?${parameters.toString()}` : '';
    setSearchParameters(nextParameters);
    void loadPropertyListings(nextParameters);
  }

  function clearPropertyFilters() {
    setSearchText('');
    setCity('');
    setRentalPeriod(RentalPeriod.YEAR);
    setMaximumRentAmount('');
    setMinimumBedrooms('');
    setSearchParameters('');
    void loadPropertyListings('');
  }

  function changePropertyPage(pageNumber: number) {
    const parameters = new URLSearchParams(searchParameters);
    parameters.set('page', String(pageNumber));
    const nextParameters = `?${parameters.toString()}`;
    setSearchParameters(nextParameters);
    void loadPropertyListings(nextParameters);
  }

  function findHomesNearMe() {
    if (!navigator.geolocation) { setErrorMessage(PROPERTY_LISTING_COPY.locationPermissionDenied); return; }
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      const parameters = new URLSearchParams(searchParameters);
      parameters.set('latitude', String(coords.latitude));
      parameters.set('longitude', String(coords.longitude));
      parameters.set('radiusKm', '10');
      parameters.delete('page');
      const nextParameters = `?${parameters.toString()}`;
      setSearchParameters(nextParameters);
      void loadPropertyListings(nextParameters);
    }, () => setErrorMessage(PROPERTY_LISTING_COPY.locationPermissionDenied), { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 });
  }

  return (
    <main className={styles.page}>
      <section className={styles.intro}>
        <div><p className={styles.eyebrow}>{PROPERTY_LISTING_COPY.eyebrow}</p>
          <h1>{PROPERTY_LISTING_COPY.title}</h1>
          <p>{PROPERTY_LISTING_COPY.description}</p></div>
      </section>
      <form className={styles.searchPanel} onSubmit={submitPropertySearch}>
        <label className={styles.searchField}><span>{PROPERTY_LISTING_COPY.searchLabel}</span><input name="search" value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder={PROPERTY_LISTING_COPY.searchPlaceholder} /></label>
        <label className={styles.searchField}><span>{PROPERTY_LISTING_COPY.cityLabel}</span><input name="city" value={city} onChange={(event) => setCity(event.target.value)} placeholder={PROPERTY_LISTING_COPY.cityPlaceholder} /></label>
        <fieldset className={styles.periodField}><legend>{PROPERTY_LISTING_COPY.rentPeriodLabel}</legend><div className={styles.periodChoices}>{Object.values(RentalPeriod).map((period) => <label key={period}><input type="radio" name="rentalPeriod" value={period} checked={rentalPeriod === period} onChange={() => setRentalPeriod(period)} /><span>{RENTAL_PERIOD_LABELS[period]}</span></label>)}</div></fieldset>
        <label className={styles.searchField}><span>{PROPERTY_LISTING_COPY.maximumRentPrefix} {RENTAL_PERIOD_LABELS[rentalPeriod].toLowerCase()}</span><input name="maximumRentAmount" value={maximumRentAmount} onChange={(event) => setMaximumRentAmount(event.target.value)} inputMode="numeric" type="number" min="0" placeholder="500000" /></label>
        <label className={styles.searchField}><span>{PROPERTY_LISTING_COPY.bedroomsLabel}</span><select name="minimumBedrooms" value={minimumBedrooms} onChange={(event) => setMinimumBedrooms(event.target.value)}><option value="">Any</option><option value="1">1+</option><option value="2">2+</option><option value="3">3+</option></select></label>
        <button className={styles.searchButton} type="submit">{PROPERTY_LISTING_COPY.applyFilters}</button>
      </form>
      <div className={styles.nearbySearch}><button type="button" onClick={findHomesNearMe}>{PROPERTY_LISTING_COPY.useNearbyLocation}</button><span>{PROPERTY_LISTING_COPY.nearbyLocationHelp}</span><button type="button" className={styles.clearFilters} onClick={clearPropertyFilters}>{PROPERTY_LISTING_COPY.clearFiltersLabel}</button></div>
      <section className={styles.results} aria-live="polite">
        <div className={styles.resultsHeading}><div><p className={styles.eyebrow}>{PROPERTY_LISTING_COPY.resultsLabel}</p><h2>{listingResponse ? `${listingResponse.pagination.totalCount} published homes` : 'Homes near campus'}</h2></div><span>Landlord and property checks completed</span></div>
        {isLoading && <p className={styles.stateMessage}>{PROPERTY_LISTING_COPY.loading}</p>}
        {!isLoading && errorMessage && <div className={styles.stateMessage}><p>{errorMessage}</p><button className={styles.retryButton} onClick={() => void loadPropertyListings(searchParameters)}>{PROPERTY_LISTING_COPY.retry}</button></div>}
        {!isLoading && !errorMessage && listingResponse?.listings.length === 0 && <div className={styles.emptyState}><BuildingsIcon size={34} weight="duotone" /><h3>{PROPERTY_LISTING_COPY.emptyTitle}</h3><p>{PROPERTY_LISTING_COPY.emptyDetail}</p></div>}
        {!isLoading && !errorMessage && listingResponse && listingResponse.listings.length > 0 && <div className={styles.grid}>{listingResponse.listings.map((listing, index) => <Fragment key={listing.id}>{communityAd && index === 2 && <CommunityAdCard ad={communityAd} />}<PropertyListingCard listing={listing} /></Fragment>)}{communityAd && listingResponse.listings.length < 3 && <CommunityAdCard ad={communityAd} />}</div>}
        {!isLoading && listingResponse && listingResponse.pagination.totalPages > 1 && <div className={styles.pagination}><button disabled={listingResponse.pagination.page <= 1} onClick={() => changePropertyPage(listingResponse.pagination.page - 1)}>Previous</button><span>Page {listingResponse.pagination.page} of {listingResponse.pagination.totalPages}</span><button disabled={listingResponse.pagination.page >= listingResponse.pagination.totalPages} onClick={() => changePropertyPage(listingResponse.pagination.page + 1)}>Next</button></div>}
      </section>
    </main>
  );
}

function PropertyListingCard({ listing }: { listing: PublicPropertyListing }) {
  useEffect(() => {
    if (!listing.sponsored) return;
    const key = `uley-sponsored-impression:${listing.sponsored.campaignId}`;
    if (window.sessionStorage.getItem(key)) return;
    window.sessionStorage.setItem(key, '1');
    void recordSponsoredEvent(listing.sponsored.campaignId, 'IMPRESSION');
  }, [listing.sponsored]);
  const firstUnit = listing.unitHighlights[0];
  return <article className={styles.card} onClick={() => { if (listing.sponsored) void recordSponsoredEvent(listing.sponsored.campaignId, 'CLICK'); }}>
    <div className={styles.image}><PropertyImageGallery images={listing.images} propertyName={listing.name} /></div>
      <div className={styles.cardBody}><div className={styles.cardTopline}><span>{listing.sponsored ? 'SPONSORED · VERIFIED LISTING' : 'VERIFIED LISTING'}</span><span>{listing.availableUnitCount} available</span></div>{listing.sponsored && <aside className={styles.sponsoredNotice}><strong>{listing.sponsored.headline}</strong><span>{listing.sponsored.description}</span></aside>}<h3>{listing.name}</h3>{listing.reviewSummary?.reviewCount ? <p className={styles.location}>★ {listing.reviewSummary.averageRating?.toFixed(1)} · {listing.reviewSummary.reviewCount} occupancy-verified {listing.reviewSummary.reviewCount === 1 ? 'review' : 'reviews'}</p> : <p className={styles.location}>No occupancy-verified reviews yet</p>}<p className={styles.location}><MapPinIcon size={15} />{listing.neighborhood}, {listing.city}{listing.distanceKm !== undefined ? ` · ${listing.distanceKm.toFixed(1)} km away` : ''}</p><p className={styles.description}>{listing.description}</p><div className={styles.amenities}><span><BedIcon size={16} />{firstUnit?.bedrooms ?? 0} bed</span><span><ShowerIcon size={16} />{firstUnit?.bathrooms ?? 0} bath</span></div><div className={styles.price}><strong>{NIGERIAN_NAIRA_FORMATTER.format(listing.startingRentAmount)}</strong><span>starting rent · {RENTAL_PERIOD_LABELS[listing.rentalPeriod as RentalPeriod].toLowerCase()}</span></div><Link className={styles.detailLink} href={`/listings/${listing.id}`}>View full property details <span aria-hidden="true">↗</span></Link><div className={styles.unitChoices}><strong>Unit prices</strong>{listing.unitHighlights.map((unit) => <Link key={unit.id} href={`/inspections?unitId=${unit.id}&propertyName=${encodeURIComponent(listing.name)}&unitName=${encodeURIComponent(unit.name)}`}><span>{unit.name} · {unit.bedrooms} bed</span><b>{NIGERIAN_NAIRA_FORMATTER.format(unit.rentAmount)} {RENTAL_PERIOD_LABELS[unit.rentalPeriod as RentalPeriod].toLowerCase()}<span>Deposit {NIGERIAN_NAIRA_FORMATTER.format(unit.securityDeposit)} · Monthly service {NIGERIAN_NAIRA_FORMATTER.format(unit.monthlyServiceCharge)} · Visit {NIGERIAN_NAIRA_FORMATTER.format(unit.inspectionFee)}</span><span>Request visit ↗</span></b></Link>)}</div><Link className={styles.reportLink} href={`/messages?propertyId=${listing.id}`}>Message landlord</Link><Link className={styles.reportLink} href={`/report-property?propertyId=${listing.id}`}>Report a problem with this listing</Link></div>
  </article>;
}

async function recordSponsoredEvent(campaignId: string, eventType: 'IMPRESSION' | 'CLICK') {
  try { await fetch(`${WEB_API_BASE_PATH}${WEB_API_ENDPOINTS.sponsoredCampaigns}/${campaignId}${WEB_API_ENDPOINTS.sponsoredCampaignEventAction}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ eventType }), keepalive: true }); } catch { /* Event tracking never interrupts listing navigation. */ }
}
