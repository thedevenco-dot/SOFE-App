export const Platform = {
  OS: 'ios',
  select: (obj: Record<string, unknown>) => obj.ios || obj.default,
};

export const StyleSheet = {
  create: <T>(styles: T): T => styles,
  hairlineWidth: 1,
};

export const processColor = (color: unknown) => color;

export const View = 'View';
export const Text = 'Text';
export const TouchableOpacity = 'TouchableOpacity';
export const Image = 'Image';
export const Modal = 'Modal';
export const TextInput = 'TextInput';
export const ActivityIndicator = 'ActivityIndicator';
export const ScrollView = 'ScrollView';
export const SafeAreaView = 'SafeAreaView';
