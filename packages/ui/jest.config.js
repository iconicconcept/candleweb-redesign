module.exports = {
    preset: 'ts-jest',
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    testPathIgnorePatterns: ['<rootDir>/node_modules/'],
    testEnvironment: 'jsdom',
    moduleNameMapper: {
        '\\.(scss|sass|css)$': 'identity-obj-proxy',
    },
    transform: {
        "^.+\\.tsx?$": ["ts-jest", { tsconfig: "tsconfig.jest.json" }],
      },
}