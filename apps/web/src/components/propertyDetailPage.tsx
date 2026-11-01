'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeftIcon, BedIcon, BuildingsIcon, CheckCircleIcon, ClockIcon, MapPinIcon, ShieldCheckIcon, ShowerIcon, StarIcon } from '@phosphor-icons/react/ssr';
import { WEB_API_BASE_PATH, WEB_API_ENDPOINTS } from '../constants';
import { NIGERIAN_NAIRA_FORMATTER } from '../constants/propertyListing.constant';
import { RENTAL_PERIOD_LABELS, RentalPeriod } from '../enums/rentalPeriod.enum';
import { WEB_ERROR_MESSAGES } from '../errors';
import type { PublicPropertyDetail } from '../models';
import styles from './propertyDetailPage.module.css';

export function PropertyDetailPage({ propertyId }: { propertyId: string }) {
  const [property, setProperty] = useState<PublicPropertyDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  useEffect(() => {
    let active = true;
    fetch(`${WEB_API_BASE_PATH}${WEB_API_ENDPOINTS.publicPropertyDetail}/${encodeURIComponent(propertyId)}`, { cache: 'no-store' })
      .then((response) => { if (!response.ok) throw new Error(); return response.json() as Promise<PublicPropertyDetail>; })
      .then((result) => { if (active) setProperty(result); })
      .catch(() => { if (active) setHasError(true); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [propertyId]);

  if (isLoading) return <main className={styles.page}><p className={styles.state}>Loading verified home details…</p></main>;
  if (hasError || !property) return <main className={styles.page}><div className={styles.state}><BuildingsIcon size={34} /><h1>Home details unavailable</h1><p>{WEB_ERROR_MESSAGES.listingsUnavailable}</p><Link href="/listings">Back to homes</Link></div></main>;

  return <main className={styles.page}>
    <Link className={styles.back} href="/listings"><ArrowLeftIcon size={16} /> Back to homes</Link>
    <div className={styles.heading}><div><p className={styles.eyebrow}><ShieldCheckIcon size={15} weight="fill" /> VERIFIED HOME</p><h1>{property.name}</h1><p className={styles.location}><MapPinIcon size={17} />{property.neighborhood}, {property.city}, {property.state}</p></div><div className={styles.rating}>{property.reviewSummary?.reviewCount ? <><StarIcon size={18} weight="fill" /> <strong>{property.reviewSummary.averageRating?.toFixed(1)}</strong><span>{property.reviewSummary.reviewCount} verified reviews</span></> : <span>New to Uley · reviews coming as students move in</span>}</div></div>
    <PropertyDetailGallery images={property.images} propertyName={property.name} />
    <div className={styles.contentGrid}>
      <div className={styles.mainColumn}>
        <section className={styles.section}><p className={styles.eyebrow}>THE HOME</p><h2>A closer look</h2><p className={styles.description}>{property.description}</p><div className={styles.facts}><span><BedIcon size={18} />{Math.max(...property.units.map((unit) => unit.bedrooms))} bedrooms available</span><span><ShowerIcon size={18} />{Math.max(...property.units.map((unit) => unit.bathrooms))} bathrooms</span><span><BuildingsIcon size={18} />{property.availableUnitCount} available units</span></div></section>
        <section className={styles.section}><p className={styles.eyebrow}>AVAILABLE NOW</p><h2>Choose a unit</h2><div className={styles.units}>{property.units.map((unit) => <article className={styles.unit} key={unit.id}><div><h3>{unit.name}</h3><p>{unit.bedrooms} bed · {unit.bathrooms} bath</p></div><div className={styles.cost}><strong>{NIGERIAN_NAIRA_FORMATTER.format(unit.rentAmount)}</strong><span>per {RENTAL_PERIOD_LABELS[unit.rentalPeriod as RentalPeriod].toLowerCase()}</span></div><dl><div><dt>Refundable deposit</dt><dd>{NIGERIAN_NAIRA_FORMATTER.format(unit.securityDeposit)}</dd></div><div><dt>Monthly service charge</dt><dd>{NIGERIAN_NAIRA_FORMATTER.format(unit.monthlyServiceCharge)}</dd></div><div><dt>Inspection fee</dt><dd>{NIGERIAN_NAIRA_FORMATTER.format(unit.inspectionFee)}</dd></div></dl><Link className={styles.visit} href={`/inspections?unitId=${unit.id}&propertyName=${encodeURIComponent(property.name)}&unitName=${encodeURIComponent(unit.name)}`}>Request an inspection <span aria-hidden="true">→</span></Link></article>)}</div></section>
        <section className={styles.section}><p className={styles.eyebrow}>STUDENT EXPERIENCE</p><h2>Reviews from residents</h2>{property.reviews.length ? <div className={styles.reviews}>{property.reviews.map((review) => <article className={styles.review} key={review.id}><div className={styles.stars} aria-label={`${review.rating} out of 5 stars`}>{Array.from({ length: 5 }, (_, index) => <StarIcon key={index} size={14} weight={index < review.rating ? 'fill' : 'regular'} />)}</div><p>{review.comment}</p><span>Occupancy verified · {new Date(review.createdAt).toLocaleDateString('en-NG', { month: 'long', year: 'numeric' })}</span></article>)}</div> : <p className={styles.emptyReviews}>No published resident reviews yet. Reviews come from confirmed occupancies and are checked before appearing.</p>}</section>
      </div>
      <aside className={styles.sidebar}><div className={styles.trustCard}><div className={styles.landlord}><span className={styles.avatar}>{property.landlord.name.slice(0, 1).toUpperCase()}</span><div><span>Listed by</span><strong>{property.landlord.name}</strong><small><CheckCircleIcon size={14} weight="fill" /> Verified landlord</small></div></div><p>Landlord verification and this property’s submitted details were reviewed before publication.</p><p className={styles.member}><ClockIcon size={14} /> On Uley since {new Date(property.landlord.memberSince).getFullYear()}</p><Link href={`/messages?propertyId=${property.id}`} className={styles.message}>Message landlord</Link><Link href={`/report-property?propertyId=${property.id}`} className={styles.report}>Report inaccurate information</Link></div><p className={styles.privacy}><ShieldCheckIcon size={17} /> Exact home access details are shared during inspection planning. Meet the landlord or assigned caretaker at the agreed time.</p></aside>
    </div>
  </main>;
}

function PropertyDetailGallery({ images, propertyName }: { images: PublicPropertyDetail['images']; propertyName: string }) {
  const [selected, setSelected] = useState(0);
  const image = images[selected];
  return <section className={styles.gallery} aria-label={`${propertyName} photos`}>
    {image ? <div className={styles.hero}><Image src={image.imageUrl} alt={image.altText || propertyName} fill priority sizes="(max-width: 800px) 100vw, 70vw" unoptimized /></div> : <div className={styles.noPhoto}><BuildingsIcon size={45} weight="duotone" /></div>}
    <div className={styles.thumbnails}>{images.slice(0, 8).map((photo, index) => <button type="button" key={`${photo.imageUrl}-${index}`} onClick={() => setSelected(index)} aria-label={`Show photo ${index + 1}`} aria-pressed={selected === index}><Image src={photo.imageUrl} alt="" fill sizes="140px" unoptimized /></button>)}{images.length > 8 && <span>+{images.length - 8} more</span>}</div>
  </section>;
}
