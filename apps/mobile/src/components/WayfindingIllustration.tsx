import Svg, { Circle, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { View } from 'react-native';
import { useMobileTheme } from '../theme';

type WayfindingIllustrationProps = { scene: 0 | 1 | 2 };

export function WayfindingIllustration({ scene }: WayfindingIllustrationProps) {
  const { isDark } = useMobileTheme();
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={getIllustrationDescription(scene)}>
    <Svg width="100%" height={258} viewBox="0 0 360 270">
      <Rect x={2} y={2} width={356} height={266} rx={25} fill={scene === 2 ? (isDark ? '#203BAF' : '#2949D8') : (isDark ? '#1B2938' : '#EAF2E7')} />
      <Circle cx={scene === 2 ? 306 : 295} cy={48} r={31} fill="#F4CE54" />
      {scene === 0 ? <NeighborhoodScene isDark={isDark} /> : scene === 1 ? <ViewingScene /> : <SupportScene />}
    </Svg>
    </View>
  );
}

function NeighborhoodScene({ isDark }: { isDark: boolean }) {
  return <>
    <Path d="M2 192c50-20 76-24 119-12s70 22 108 2 80-18 129 0v86H2z" fill={isDark ? '#284437' : '#C9E1C7'} />
    <Path d="M-5 222c67-46 108-43 168-14s99 31 202-28" fill="none" stroke="#FFF8DF" strokeWidth={31} />
    <Path d="M-5 222c67-46 108-43 168-14s99 31 202-28" fill="none" stroke="#C89D60" strokeWidth={2} strokeDasharray="5 9" />
    <House x={50} y={82} fill="#D77D58" />
    <House x={188} y={58} fill="#FFF8DF" />
    <Circle cx={273} cy={174} r={19} fill="#5F9A72" /><Path d="M273 171v-47m-16 16 16-27 16 27" fill="none" stroke="#286B56" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
    <Rect x={19} y={24} width={112} height={27} rx={13} fill={isDark ? '#314158' : '#fff'} /><Circle cx={35} cy={37} r={5} fill="#5F9A72" /><SvgText x={48} y={41} fontSize={9} fontWeight="700" fill={isDark ? '#F2F5FA' : '#17243B'}>A HOME TO EXPLORE</SvgText>
  </>;
}

function House({ x, y, fill }: { x: number; y: number; fill: string }) {
  return <><Path d={`M${x} ${y + 44}v-46l42-33 42 33v46z`} fill={fill} /><Rect x={x + 15} y={y + 9} width={13} height={14} fill="#91A8ED" /><Rect x={x + 54} y={y + 9} width={13} height={14} fill="#91A8ED" /><Path d={`M${x + 36} ${y + 44}v-21h14v21`} fill="#D77D58" /></>;
}

function ViewingScene() {
  return <>
    <Rect x={2} y={190} width={356} height={78} fill="#DDBB8C" />
    <Rect x={39} y={43} width={84} height={90} rx={8} fill="#fff" /><Rect x={48} y={52} width={66} height={72} rx={5} fill="#91A8ED" /><Line x1={81} y1={52} x2={81} y2={124} stroke="#fff" strokeWidth={5} /><Line x1={48} y1={86} x2={114} y2={86} stroke="#fff" strokeWidth={5} />
    <Rect x={174} y={161} width={141} height={57} rx={12} fill="#fff8df" /><Rect x={185} y={140} width={119} height={28} rx={14} fill="#D77D58" /><Rect x={190} y={194} width={13} height={31} rx={4} fill="#80553B" /><Rect x={285} y={194} width={13} height={31} rx={4} fill="#80553B" />
    <Circle cx={154} cy={145} r={14} fill="#80553B" /><Path d="M139 165q15-13 30 0v52h-30z" fill="#286B56" /><Path d="m141 178-18 22m42-22 14 18" stroke="#80553B" strokeWidth={7} strokeLinecap="round" />
    <Rect x={222} y={37} width={103} height={30} rx={14} fill="#fff" /><SvgText x={239} y={57} fontSize={9} fontWeight="700" fill="#2949D8">INSPECT FIRST</SvgText>
  </>;
}

function SupportScene() {
  return <>
    <Path d="M2 219c51-18 88-21 124-7s68 17 108-2 78-17 124 2v56H2z" fill="#3D5FE0" />
    <House x={42} y={119} fill="#FFF8DF" />
    <Rect x={178} y={83} width={136} height={90} rx={16} fill="#fff" /><Path d="M205 173v17l23-17" fill="#fff" /><Circle cx={201} cy={112} r={7} fill="#5F9A72" /><SvgText x={216} y={116} fontSize={10} fontWeight="700" fill="#17243B">Need a hand?</SvgText><Rect x={195} y={129} width={99} height={5} rx={2.5} fill="#DCE3EF" /><Rect x={195} y={141} width={78} height={5} rx={2.5} fill="#DCE3EF" />
    <Circle cx={298} cy={214} r={22} fill="#F4CE54" /><Path d="m288 214 7 7 14-16" fill="none" stroke="#17243B" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
  </>;
}

function getIllustrationDescription(scene: number) {
  return ['Illustration of a student neighborhood with homes and a walking path', 'Illustration of a student inspecting a room before applying', 'Illustration of a home and support conversation with a resolution check'][scene];
}
