import { Fragment, useCallback, useEffect, useState } from 'react';
import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Bed, Buildings, MapPin, Shower } from 'phosphor-react-native';
import { PROPERTY_LISTING_COPY, MOBILE_API_ENDPOINTS, MOBILE_NAIRA_FORMATTER } from '../constants';
import { MOBILE_ERROR_MESSAGES } from '../errors';
import type { PublicPropertyListing, PublicPropertyListingResponse, PublicUserAdvertisement } from '../models';
import { AccountRole, RENTAL_PERIOD_LABELS, RentalPeriod } from '../enums';
import { LabeledInput } from '../components/LabeledInput';
import { ScreenFrame } from '../components/ScreenFrame';
import { useMobileTheme } from '../theme';
import { requestUleyApi } from '../auth/api';
import { useUleyAuth } from '../auth/AuthProvider';
import { CommunityAdCard } from '../components/communityAdCard';
import { createPropertyListingsStyles } from '../components/propertyListings.styles';
import { PropertyImageGallery } from '../components/propertyImageGallery';
import * as Location from 'expo-location';

export default function PropertyListingsScreen() {
  const { colors } = useMobileTheme();
  const { accessToken, account } = useUleyAuth();
  const styles = createPropertyListingsStyles(colors);
  const [listingResponse, setListingResponse] = useState<PublicPropertyListingResponse | null>(null);
  const [communityAd, setCommunityAd] = useState<PublicUserAdvertisement | null>(null);
  const [searchText, setSearchText] = useState('');
  const [city, setCity] = useState('');
  const [maximumRentAmount, setMaximumRentAmount] = useState('');
  const [rentalPeriod, setRentalPeriod] = useState<RentalPeriod>(RentalPeriod.YEAR);
  const [minimumBedrooms, setMinimumBedrooms] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [queryString, setQueryString] = useState('');

  const loadPropertyListings = useCallback(async (query: string) => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      setListingResponse(await requestUleyApi<PublicPropertyListingResponse>(`${MOBILE_API_ENDPOINTS.propertyListings}${query}`));
      await loadStudentFeedAd(query, accessToken, account?.userRole === AccountRole.STUDENT, setCommunityAd);
    } catch {
      setErrorMessage(MOBILE_ERROR_MESSAGES.listingsUnavailable);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, account?.userRole]);

  useEffect(() => { void loadPropertyListings(''); }, [loadPropertyListings]);

  function applyPropertyFilters() {
    const parameters = new URLSearchParams();
    if (searchText.trim()) parameters.set('search', searchText.trim());
    if (city.trim()) parameters.set('city', city.trim());
    parameters.set('rentalPeriod', rentalPeriod);
    if (maximumRentAmount.trim()) parameters.set('maximumRentAmount', maximumRentAmount.trim());
    if (minimumBedrooms.trim()) parameters.set('minimumBedrooms', minimumBedrooms.trim());
    const query = parameters.size ? `?${parameters.toString()}` : '';
    setQueryString(query);
    void loadPropertyListings(query);
  }

  function changePropertyPage(pageNumber: number) {
    const parameters = new URLSearchParams(queryString);
    parameters.set('page', String(pageNumber));
    const nextQuery = `?${parameters.toString()}`;
    setQueryString(nextQuery);
    void loadPropertyListings(nextQuery);
  }

  async function findHomesNearMe() {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) { setErrorMessage(PROPERTY_LISTING_COPY.locationPermissionDenied); return; }
    try {
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const parameters = new URLSearchParams(queryString);
      parameters.set('latitude', String(position.coords.latitude));
      parameters.set('longitude', String(position.coords.longitude));
      parameters.set('radiusKm', '10');
      parameters.delete('page');
      const nextQuery = `?${parameters.toString()}`;
      setQueryString(nextQuery);
      await loadPropertyListings(nextQuery);
    } catch { setErrorMessage(PROPERTY_LISTING_COPY.locationPermissionDenied); }
  }

  return <ScreenFrame>
    <View style={styles.page}>
      <Text style={styles.eyebrow}>{PROPERTY_LISTING_COPY.eyebrow}</Text>
      <Text style={styles.title}>{PROPERTY_LISTING_COPY.title}</Text>
      <Text style={styles.description}>{PROPERTY_LISTING_COPY.description}</Text>
      <View style={styles.filters}>
        <LabeledInput label={PROPERTY_LISTING_COPY.areaOrPropertyLabel} placeholder={PROPERTY_LISTING_COPY.searchPlaceholder} value={searchText} onChangeText={setSearchText} returnKeyType="search" />
        <LabeledInput label="City" placeholder={PROPERTY_LISTING_COPY.cityPlaceholder} value={city} onChangeText={setCity} />
        <Text style={styles.filterLabel}>{PROPERTY_LISTING_COPY.rentPeriodLabel}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.periodChoices}>{Object.values(RentalPeriod).map((period) => <Pressable key={period} accessibilityRole="button" accessibilityState={{ selected: rentalPeriod === period }} onPress={() => setRentalPeriod(period)} style={[styles.periodChoice, rentalPeriod === period && styles.periodChoiceSelected]}><Text style={[styles.periodText, rentalPeriod === period && styles.periodTextSelected]}>{RENTAL_PERIOD_LABELS[period]}</Text></Pressable>)}</ScrollView>
        <LabeledInput label={PROPERTY_LISTING_COPY.maximumRentLabel + ' ' + RENTAL_PERIOD_LABELS[rentalPeriod].toLowerCase()} placeholder={PROPERTY_LISTING_COPY.rentPlaceholder} value={maximumRentAmount} onChangeText={setMaximumRentAmount} keyboardType="numeric" />
        <View style={styles.bedroomFilters}><Text style={styles.filterLabel}>{PROPERTY_LISTING_COPY.bedroomsLabel}</Text><View style={styles.bedroomChoices}>{PROPERTY_LISTING_COPY.bedroomFilterValues.map((count) => <Pressable key={count || 'any'} accessibilityRole="button" accessibilityState={{ selected: minimumBedrooms === count }} onPress={() => setMinimumBedrooms(count)} style={[styles.bedroomChoice, minimumBedrooms === count && styles.bedroomChoiceSelected]}><Text style={[styles.bedroomText, minimumBedrooms === count && styles.periodTextSelected]}>{count ? count + '+' : PROPERTY_LISTING_COPY.anyBedroomsLabel}</Text></Pressable>)}</View></View>
        <Pressable accessibilityRole="button" style={styles.searchButton} onPress={applyPropertyFilters}><Text style={styles.searchButtonText}>{PROPERTY_LISTING_COPY.searchButton}</Text></Pressable>
        <Pressable accessibilityRole="button" style={styles.clearButton} onPress={() => { setSearchText(''); setCity(''); setRentalPeriod(RentalPeriod.YEAR); setMaximumRentAmount(''); setMinimumBedrooms(''); setQueryString(''); void loadPropertyListings(''); }}><Text style={styles.clearText}>{PROPERTY_LISTING_COPY.clearFiltersLabel}</Text></Pressable>
        <Text style={styles.locationHelp}>{PROPERTY_LISTING_COPY.nearbyLocationHelp}</Text>
        <Pressable accessibilityRole="button" style={styles.nearbyButton} onPress={() => void findHomesNearMe()}><MapPin size={17} color={colors.primary} weight="bold" /><Text style={styles.nearbyButtonText}>{PROPERTY_LISTING_COPY.useNearbyLocation}</Text></Pressable>
      </View>
      <View style={styles.resultsHeading}><Text style={styles.resultsTitle}>{listingResponse?.pagination.totalCount ?? 0} {PROPERTY_LISTING_COPY.resultCount}</Text></View>
      {isLoading && <Text style={styles.stateText}>{PROPERTY_LISTING_COPY.loading}</Text>}
      {!isLoading && Boolean(errorMessage) && <View style={styles.stateBox}><Text style={styles.stateText}>{errorMessage}</Text><Pressable onPress={() => void loadPropertyListings(queryString)}><Text style={styles.retry}>{PROPERTY_LISTING_COPY.retry}</Text></Pressable></View>}
      {!isLoading && !errorMessage && listingResponse?.listings.length === 0 && <View style={styles.stateBox}><Buildings size={31} color={colors.primary} weight="duotone" /><Text style={styles.emptyTitle}>{PROPERTY_LISTING_COPY.emptyTitle}</Text><Text style={styles.stateText}>{PROPERTY_LISTING_COPY.emptyDetail}</Text></View>}
      {!isLoading && !errorMessage && listingResponse?.listings.map((listing, index) => <Fragment key={listing.id}>{communityAd && index === 2 && <CommunityAdCard ad={communityAd} accessToken={accessToken} onConversation={(id) => router.push({ pathname: '/messages', params: { conversationId: id } })} />}<PropertyListingCard listing={listing} /></Fragment>)}
      {!isLoading && !errorMessage && communityAd && (listingResponse?.listings.length ?? 0) < 3 && <CommunityAdCard ad={communityAd} accessToken={accessToken} onConversation={(id) => router.push({ pathname: '/messages', params: { conversationId: id } })} />}
      {!isLoading && listingResponse && listingResponse.pagination.totalPages > 1 && <View style={styles.pagination}><Pressable disabled={listingResponse.pagination.page <= 1} onPress={() => changePropertyPage(listingResponse.pagination.page - 1)}><Text style={[styles.pageAction, listingResponse.pagination.page <= 1 && styles.disabled]}>Previous</Text></Pressable><Text style={styles.pageCount}>{listingResponse.pagination.page} / {listingResponse.pagination.totalPages}</Text><Pressable disabled={listingResponse.pagination.page >= listingResponse.pagination.totalPages} onPress={() => changePropertyPage(listingResponse.pagination.page + 1)}><Text style={[styles.pageAction, listingResponse.pagination.page >= listingResponse.pagination.totalPages && styles.disabled]}>Next</Text></Pressable></View>}
    </View>
  </ScreenFrame>;
}

async function loadStudentFeedAd(query: string, accessToken: string | null, isStudent: boolean, setAd: (ad: PublicUserAdvertisement | null) => void) {
  setAd(null);
  if (!accessToken || !isStudent) return;
  const city = new URLSearchParams(query).get('city');
  try {
    const result = await requestUleyApi<{ ads: PublicUserAdvertisement[] }>(`${MOBILE_API_ENDPOINTS.userAdvertisements}${city ? `?city=${encodeURIComponent(city)}` : ''}`, undefined, accessToken);
    setAd(result.ads[0] ?? null);
  } catch { setAd(null); }
}

function PropertyListingCard({ listing }: { listing: PublicPropertyListing }) {
  const { colors } = useMobileTheme();
  const styles = createPropertyListingsStyles(colors);
  useEffect(() => { if (listing.sponsored) void recordSponsoredEvent(listing.sponsored.campaignId, 'IMPRESSION'); }, [listing.sponsored]);
  const firstUnit = listing.unitHighlights[0];
  return <View onTouchEnd={() => { if (listing.sponsored) void recordSponsoredEvent(listing.sponsored.campaignId, 'CLICK'); }} style={styles.card}>
    <PropertyImageGallery images={listing.images} propertyName={listing.name} />
    <View style={styles.cardBody}>
      <Text style={styles.verified}>{listing.sponsored ? 'SPONSORED · VERIFIED LISTING' : PROPERTY_LISTING_COPY.verified}</Text>
      {listing.sponsored && <View style={styles.sponsoredNotice}><Text style={styles.sponsoredTitle}>{listing.sponsored.headline}</Text><Text style={styles.sponsoredDescription}>{listing.sponsored.description}</Text></View>}
      <Text style={styles.propertyName}>{listing.name}</Text>
      <Text style={styles.mutedText}>{listing.reviewSummary?.reviewCount ? `★ ${listing.reviewSummary.averageRating?.toFixed(1)} · ${listing.reviewSummary.reviewCount} occupancy-verified ${listing.reviewSummary.reviewCount === 1 ? 'review' : 'reviews'}` : 'No occupancy-verified reviews yet'}</Text>
      <View style={styles.location}><MapPin size={15} color={colors.muted} /><Text style={styles.mutedText}>{listing.neighborhood}, {listing.city}{listing.distanceKm !== undefined ? ` · ${listing.distanceKm.toFixed(1)} km away` : ''}</Text></View>
      <Text numberOfLines={3} style={styles.cardDescription}>{listing.description}</Text>
      <View style={styles.amenities}><Text style={styles.amenity}><Bed size={15} color={colors.muted} /> {firstUnit?.bedrooms ?? 0} bed</Text><Text style={styles.amenity}><Shower size={15} color={colors.muted} /> {firstUnit?.bathrooms ?? 0} bath</Text><Text style={styles.amenity}>{listing.availableUnitCount} available</Text></View>
      <Text style={styles.price}>{MOBILE_NAIRA_FORMATTER.format(listing.startingRentAmount)} <Text style={styles.priceNote}>starting rent · {RENTAL_PERIOD_LABELS[listing.rentalPeriod as RentalPeriod].toLowerCase()}</Text></Text>
      <Pressable accessibilityRole="link" onPress={() => router.push((`/property/${encodeURIComponent(listing.id)}`) as never)}><Text style={styles.reportLink}>View full property details →</Text></Pressable>
      <Pressable accessibilityRole="link" onPress={() => router.push({ pathname: '/messages', params: { propertyId: listing.id } })}><Text style={styles.reportLink}>Message landlord</Text></Pressable>
      <Text style={styles.unitHeading}>Unit prices</Text>{listing.unitHighlights.map((unit) => <Pressable key={unit.id} style={styles.unitChoice} onPress={() => router.push({ pathname: '/inspections', params: { unitId: unit.id, propertyName: listing.name, unitName: unit.name } })}><View><Text style={styles.unitName}>{unit.name} · {unit.bedrooms} bed</Text><Text style={styles.unitFees}>Deposit {MOBILE_NAIRA_FORMATTER.format(unit.securityDeposit)} · Monthly service {MOBILE_NAIRA_FORMATTER.format(unit.monthlyServiceCharge)} · Visit {MOBILE_NAIRA_FORMATTER.format(unit.inspectionFee)}</Text></View><Text style={styles.unitRent}>{MOBILE_NAIRA_FORMATTER.format(unit.rentAmount)} {RENTAL_PERIOD_LABELS[unit.rentalPeriod as RentalPeriod].toLowerCase()} · Visit →</Text></Pressable>)}
      <Pressable accessibilityRole="link" onPress={() => router.push({ pathname: '/report-property', params: { propertyId: listing.id } })}><Text style={styles.reportLink}>Report a problem with this listing</Text></Pressable>
    </View>
  </View>;
}

async function recordSponsoredEvent(campaignId: string, eventType: 'IMPRESSION' | 'CLICK') { try { await requestUleyApi(`${MOBILE_API_ENDPOINTS.sponsoredCampaigns}/${campaignId}${MOBILE_API_ENDPOINTS.sponsoredCampaignEventAction}`, { eventType }); } catch { /* Placement tracking must not interrupt browsing. */ } }

