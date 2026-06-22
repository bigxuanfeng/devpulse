import type { Config } from "jest";

const config: Config = {
  testEnvironment: "jsdom",
  testEnvironmentOptions: {
    url: "http://localhost:3000",
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.json",
      },
    ],
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testMatch: ["**/__tests__/**/*.(ts|tsx)", "**/?(*.)+(spec|test).(ts|tsx)"],
};

export default config;
