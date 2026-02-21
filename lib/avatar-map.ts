const AVATAR_MAP: Record<string, any> = {
  'assets/avatars/boy1.png': require('../assets/avatars/boy1.png'),
  'assets/avatars/boy2.png': require('../assets/avatars/boy2.png'),
  'assets/avatars/boy3.png': require('../assets/avatars/boy3.png'),
  'assets/avatars/boy4.png': require('../assets/avatars/boy4.png'),
  'assets/avatars/boy5.png': require('../assets/avatars/boy5.png'),
  'assets/avatars/boy6.png': require('../assets/avatars/boy6.png'),
  'assets/avatars/boy7.png': require('../assets/avatars/boy7.png'),
  'assets/avatars/boy8.png': require('../assets/avatars/boy8.png'),
  'assets/avatars/boy9.png': require('../assets/avatars/boy9.png'),
  'assets/avatars/girl1.png': require('../assets/avatars/girl1.png'),
  'assets/avatars/girl2.png': require('../assets/avatars/girl2.png'),
  'assets/avatars/girl3.png': require('../assets/avatars/girl3.png'),
  'assets/avatars/girl4.png': require('../assets/avatars/girl4.png'),
  'assets/avatars/girl5.png': require('../assets/avatars/girl5.png'),
  'assets/avatars/girl6.png': require('../assets/avatars/girl6.png'),
  'assets/avatars/girl7.png': require('../assets/avatars/girl7.png'),
  'assets/avatars/girl8.png': require('../assets/avatars/girl8.png'),
  'assets/avatars/girl9.png': require('../assets/avatars/girl9.png'),
};

export const BOY_AVATARS = [
  'assets/avatars/boy1.png',
  'assets/avatars/boy2.png',
  'assets/avatars/boy3.png',
  'assets/avatars/boy4.png',
  'assets/avatars/boy5.png',
  'assets/avatars/boy6.png',
  'assets/avatars/boy7.png',
  'assets/avatars/boy8.png',
  'assets/avatars/boy9.png',
];

export const GIRL_AVATARS = [
  'assets/avatars/girl1.png',
  'assets/avatars/girl2.png',
  'assets/avatars/girl3.png',
  'assets/avatars/girl4.png',
  'assets/avatars/girl5.png',
  'assets/avatars/girl6.png',
  'assets/avatars/girl7.png',
  'assets/avatars/girl8.png',
  'assets/avatars/girl9.png',
];

export function getAvatarSource(path: string): any {
  return AVATAR_MAP[path] || null;
}

export default AVATAR_MAP;
