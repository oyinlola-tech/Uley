import { router } from 'expo-router';
import { useRef, useState } from 'react';
import type { ElementRef } from 'react';
import { Pressable, ScrollView as HorizontalScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenFrame } from '../components/ScreenFrame';
import { WayfindingIllustration } from '../components/WayfindingIllustration';
import { PROPERTY_LISTING_COPY } from '../constants';
import { useMobileTheme } from '../theme';

const welcomeSlides = [
  { eyebrow: 'A BETTER PLACE TO START', title: 'Find a home\nthat feels right.', detail: 'Explore off-campus homes with clear details about who is responsible and what to expect.' },
  { eyebrow: 'SEE BEFORE YOU DECIDE', title: 'Visit first.\nChoose with care.', detail: 'Request an inspection before you apply. Ask your questions and make the decision in your own time.' },
  { eyebrow: 'YOU HAVE A WAY FORWARD', title: 'Know where\nto turn for help.', detail: 'If an accommodation issue is not resolved, keep a record and escalate it through the right channel.' },
];

export default function WelcomePage() {
  const { width } = useWindowDimensions();
  const { colors } = useMobileTheme();
  const styles = createStyles(colors);
  const slidesRef = useRef<ElementRef<typeof HorizontalScrollView>>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const isLastSlide = activeSlide === welcomeSlides.length - 1;

  function updateActiveSlide(event: NativeSyntheticEvent<NativeScrollEvent>) {
    setActiveSlide(Math.round(event.nativeEvent.contentOffset.x / width));
  }

  function continueWelcome() {
    if (isLastSlide) router.push('/role');
    else {
      const nextSlide = activeSlide + 1;
      setActiveSlide(nextSlide);
      slidesRef.current?.scrollTo({ x: width * nextSlide, animated: true });
    }
  }

  return (
    <ScreenFrame scroll={false}>
      <View style={styles.page}>
        <View style={styles.topbar}><Pressable accessibilityRole="button" onPress={() => router.push('/role')}><Text style={styles.skip}>SKIP INTRO</Text></Pressable></View>
        <HorizontalScrollView
          ref={slidesRef}
          horizontal
          pagingEnabled
          snapToInterval={width}
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          onScroll={updateActiveSlide}
          scrollEventThrottle={16}
          onMomentumScrollEnd={updateActiveSlide}
          accessibilityLabel="Uley introduction slides"
        >
          {welcomeSlides.map((slide, index) => <View key={slide.eyebrow} style={[styles.slide, { width }]}>
            <WayfindingIllustration scene={index as 0 | 1 | 2} />
            <View style={styles.copy}>
              <Text style={styles.eyebrow}>{slide.eyebrow}</Text>
              <Text style={styles.title}>{slide.title}</Text>
              <Text style={styles.description}>{slide.detail}</Text>
            </View>
          </View>)}
        </HorizontalScrollView>
        <View style={styles.bottom}>
          <View style={styles.pagination} accessibilityLabel={`Screen ${activeSlide + 1} of ${welcomeSlides.length}`}>
            {welcomeSlides.map((slide, index) => <View key={slide.eyebrow} style={[styles.pageDot, index === activeSlide && styles.activePageDot]} />)}
          </View>
          <PrimaryButton label={isLastSlide ? 'Choose your path' : 'Continue'} onPress={continueWelcome} />
          <Pressable style={styles.browseLink} onPress={() => router.push('/listings')}><Text style={styles.signInAccent}>{PROPERTY_LISTING_COPY.browseWithoutAccount}</Text></Pressable>
          <Pressable style={styles.signInLink} onPress={() => router.push('/login')}><Text style={styles.signInText}>Already have an account? <Text style={styles.signInAccent}>Sign in</Text></Text></Pressable>
        </View>
      </View>
    </ScreenFrame>
  );
}

function createStyles(colors: ReturnType<typeof useMobileTheme>['colors']) { return StyleSheet.create({
  page: { flex: 1, paddingTop: 12 },
  topbar: { minHeight: 53, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  skip: { color: colors.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
  slide: { paddingHorizontal: 20, paddingTop: 16 },
  copy: { paddingTop: 22, paddingHorizontal: 4 },
  eyebrow: { color: colors.trust, fontSize: 9, fontWeight: '800', letterSpacing: 1.6 },
  title: { maxWidth: 360, marginTop: 10, color: colors.ink, fontSize: 36, fontWeight: '800', letterSpacing: -1.8, lineHeight: 41 },
  description: { maxWidth: 360, marginTop: 12, color: colors.muted, fontSize: 13, lineHeight: 21 },
  bottom: { gap: 18, paddingHorizontal: 24, paddingTop: 10, paddingBottom: 12 },
  pagination: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 7 },
  pageDot: { width: 7, height: 7, borderRadius: 5, backgroundColor: '#C8D0DE' },
  activePageDot: { width: 22, backgroundColor: colors.primary },
  signInLink: { alignItems: 'center', paddingVertical: 4 },
  browseLink: { alignItems: 'center', paddingVertical: 1 },
  signInText: { color: colors.muted, fontSize: 11 },
  signInAccent: { color: colors.primary, fontWeight: '800' },
}); }
