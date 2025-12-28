import '@testing-library/jest-dom'

// グローバルモック
global.fetch = jest.fn()

// localStorage モック
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock