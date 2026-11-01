import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { ArrowLeft, Bed, Buildings, CheckCircle, MapPin, ShieldCheck, Shower, Star } from 'phosphor-react-native';
import { requestUleyApi } from '../../auth/api';
import { ScreenFrame } from '../../components/ScreenFrame';
import { MOBILE_API_ENDPOINTS, MOBILE_NAIRA_FORMATTER } from '../../constants';
import { RENTAL_PERIOD_LABELS, RentalPeriod } from '../../enums';
import { MOBILE_ERROR_MESSAGES } from '../../errors';
import type { PublicPropertyDetail } from '../../models';
import { useMobileTheme } from '../../theme';
import { createPropertyDetailStyles } from '../../components/propertyDetail.styles';

export default function PropertyDetailScreen() {
  const { colors } = useMobileTheme();
  const styles = createPropertyDetailStyles(colors);
  const { propertyId } = useLocalSearchParams<{ propertyId: string }>();
  const [property, setProperty] = useState<PublicPropertyDetail | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    requestUleyApi<PublicPropertyDetail>(`${MOBILE_API_ENDPOINTS.publicPropertyDetail}/${encodeURIComponent(String(propertyId))}`)
      .then((result) => { if (active) setProperty(result); })
      .catch(() => { if (active) setError(MOBILE_ERROR_MESSAGES.listingsUnavailable); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [propertyId]);

  if (loading || error || !property) return <ScreenFrame><View style={styles.state}><Buildings size={34} color={colors.primary} weight="duotone" /><Text style={styles.stateTitle}>{loading ? 'Loading home details…' : 'Home details unavailable'}</Text>{!!error && <Text style={styles.muted}>{error}</Text>}<Pressable accessibilityRole="link" onPress={() => router.replace('/listings')}><Text style={styles.link}>Back to homes</Text></Pressable></View></ScreenFrame>;
  const activeImage = property.images[selectedImage];
  return <ScreenFrame><View style={styles.page}>
    <Pressable accessibilityRole="link" onPress={() => router.back()} style={styles.back}><ArrowLeft size={17} color={colors.ink} /><Text style={styles.backText}>Back to homes</Text></Pressable>
    <View style={styles.titleBlock}><Text style={styles.eyebrow}><ShieldCheck size={14} color={colors.trust} weight="fill" /> VERIFIED HOME</Text><Text style={styles.title}>{property.name}</Text><View style={styles.location}><MapPin size={15} color={colors.muted} /><Text style={styles.muted}>{property.neighborhood}, {property.city}, {property.state}</Text></View><View style={styles.rating}><Star size={15} color="#bf842d" weight="fill" /><Text style={styles.ratingText}>{property.reviewSummary?.reviewCount ? `${property.reviewSummary.averageRating?.toFixed(1)} · ${property.reviewSummary.reviewCount} verified reviews` : 'New to Uley · reviews will appear as students move in'}</Text></View></View>
    <View style={styles.gallery}>{activeImage ? <Image source={{ uri: activeImage.imageUrl }} accessibilityLabel={activeImage.altText || property.name} style={styles.hero} /> : <View style={styles.emptyImage}><Buildings size={42} color={colors.primary} weight="duotone" /></View>}</View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbnails}>{property.images.map((image, index) => <Pressable key={`${image.imageUrl}-${index}`} accessibilityRole="button" accessibilityLabel={`Show photo ${index + 1}`} accessibilityState={{ selected: selectedImage === index }} onPress={() => setSelectedImage(index)}><Image source={{ uri: image.imageUrl }} style={[styles.thumbnail, selectedImage === index && styles.selectedThumbnail]} /></Pressable>)}</ScrollView>
    <View style={styles.panel}><Text style={styles.eyebrow}>THE HOME</Text><Text style={styles.sectionTitle}>A closer look</Text><Text style={styles.description}>{property.description}</Text><View style={styles.facts}><Text style={styles.fact}><Bed size={16} color={colors.primary} /> {Math.max(...property.units.map((unit) => unit.bedrooms))} bedrooms</Text><Text style={styles.fact}><Shower size={16} color={colors.primary} /> {Math.max(...property.units.map((unit) => unit.bathrooms))} bathrooms</Text><Text style={styles.fact}><Buildings size={16} color={colors.primary} /> {property.availableUnitCount} available</Text></View></View>
    <View style={styles.panel}><Text style={styles.eyebrow}>AVAILABLE NOW</Text><Text style={styles.sectionTitle}>Choose a unit</Text>{property.units.map((unit) => <View key={unit.id} style={styles.unit}><View style={styles.unitHeader}><View><Text style={styles.unitName}>{unit.name}</Text><Text style={styles.muted}>{unit.bedrooms} bed · {unit.bathrooms} bath</Text></View><Text style={styles.unitRent}>{MOBILE_NAIRA_FORMATTER.format(unit.rentAmount)}<Text style={styles.muted}> / {RENTAL_PERIOD_LABELS[unit.rentalPeriod as RentalPeriod].toLowerCase()}</Text></Text></View><Text style={styles.fee}>Refundable deposit · {MOBILE_NAIRA_FORMATTER.format(unit.securityDeposit)}</Text><Text style={styles.fee}>Monthly service charge · {MOBILE_NAIRA_FORMATTER.format(unit.monthlyServiceCharge)}</Text><Text style={styles.fee}>Inspection fee · {MOBILE_NAIRA_FORMATTER.format(unit.inspectionFee)}</Text><Pressable style={styles.primaryButton} accessibilityRole="link" onPress={() => router.push({ pathname: '/inspections', params: { unitId: unit.id, propertyName: property.name, unitName: unit.name } })}><Text style={styles.primaryText}>Request an inspection →</Text></Pressable></View>)}</View>
    <View style={styles.panel}><Text style={styles.eyebrow}>LANDLORD</Text><Text style={styles.sectionTitle}>{property.landlord.name}</Text><Text style={styles.verified}><CheckCircle size={15} color={colors.trust} weight="fill" /> Verified landlord · on Uley since {new Date(property.landlord.memberSince).getFullYear()}</Text><Text style={styles.description}>This landlord and property details were reviewed before publication.</Text><Pressable style={styles.secondaryButton} accessibilityRole="link" onPress={() => router.push({ pathname: '/messages', params: { propertyId: property.id } })}><Text style={styles.secondaryText}>Message landlord</Text></Pressable><Pressable accessibilityRole="link" onPress={() => router.push({ pathname: '/report-property', params: { propertyId: property.id } })}><Text style={styles.report}>Report inaccurate information</Text></Pressable></View>
    <View style={styles.panel}><Text style={styles.eyebrow}>STUDENT EXPERIENCE</Text><Text style={styles.sectionTitle}>Resident reviews</Text>{property.reviews.length ? property.reviews.map((review) => <View style={styles.review} key={review.id}><View style={styles.reviewRating}><Star size={14} color="#bf842d" weight="fill" /><Text style={styles.muted}>{review.rating} / 5 · occupancy verified</Text></View><Text style={styles.description}>{review.comment}</Text></View>) : <Text style={styles.muted}>No published resident reviews yet. Reviews come from confirmed occupancies and are checked before appearing.</Text>}</View>
    <View style={styles.privacy}><ShieldCheck size={17} color={colors.trust} /><Text style={styles.muted}>Exact access details are shared during inspection planning. Meet the landlord or assigned caretaker at the agreed time.</Text></View>
  </View></ScreenFrame>;
}
