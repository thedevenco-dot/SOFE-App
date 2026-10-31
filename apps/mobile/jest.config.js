module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/**/*.spec.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
          noUnusedLocals: false,
          noUnusedParameters: false,
        },
      },
    ],
  },
  moduleNameMapper: {
    '^@sofe/shared$': '<rootDir>/../../packages/shared/src',
    '^react-native$': '<rootDir>/src/test-utils/react-native-mock.ts',
    '^expo-secure-store$': '<rootDir>/src/test-utils/expo-secure-store-mock.ts',
    '^react-native-svg$': '<rootDir>/src/test-utils/react-native-svg-mock.ts',
  },
};
