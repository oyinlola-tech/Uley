import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Buildings, CaretLeft, CaretRight } from 'phosphor-react-native';
import { useMobileTheme } from '../theme';

type GalleryImage = { imageUrl: string; altText: string };

export function PropertyImageGallery({ images, propertyName }: { images: GalleryImage[]; propertyName: string }) {
  const { colors } = useMobileTheme();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const currentImage = images[selectedImageIndex];
  const styles = createStyles(colors);
  if (!currentImage) return <View style={styles.empty}><Buildings size={37} color={colors.primary} weight="duotone" /></View>;
  const moveImage = (direction: number) => setSelectedImageIndex((selected) => (selected + direction + images.length) % images.length);
  return <View>
    <View style={styles.heroContainer}>
    <Image source={{ uri: currentImage.imageUrl }} accessibilityLabel={currentImage.altText || propertyName} style={styles.hero} />
    {images.length > 1 && <View style={styles.controls}><Pressable accessibilityRole="button" accessibilityLabel="Previous photo" onPress={() => moveImage(-1)}><CaretLeft size={21} color="#fff" weight="bold" /></Pressable><Text style={styles.counter}>{selectedImageIndex + 1} / {images.length}</Text><Pressable accessibilityRole="button" accessibilityLabel="Next photo" onPress={() => moveImage(1)}><CaretRight size={21} color="#fff" weight="bold" /></Pressable></View>}
    </View>
    {images.length > 1 && <View style={styles.thumbnails}>{images.map((image, index) => <Pressable key={`${image.imageUrl}-${index}`} accessibilityRole="button" accessibilityLabel={`Show photo ${index + 1}`} accessibilityState={{ selected: selectedImageIndex === index }} onPress={() => setSelectedImageIndex(index)}><Image source={{ uri: image.imageUrl }} style={[styles.thumbnail, selectedImageIndex === index && styles.selectedThumbnail]} /></Pressable>)}</View>}
  </View>;
}

function createStyles(colors: ReturnType<typeof useMobileTheme>['colors']) { return StyleSheet.create({
  hero: { width: '100%', height: 190, backgroundColor: colors.softBlue },
  heroContainer: { position: 'relative' },
  empty: { height: 190, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.softBlue },
  controls: { position: 'absolute', top: 76, left: 10, right: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 7, borderRadius: 9, backgroundColor: '#10231dcc' },
  counter: { color: '#fff', fontSize: 11, fontWeight: '700' },
  thumbnails: { flexDirection: 'row', gap: 6, padding: 8 },
  thumbnail: { width: 50, height: 38, borderRadius: 5 },
  selectedThumbnail: { borderWidth: 2, borderColor: colors.primary },
}); }
