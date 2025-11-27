# Tests Directory

## Overview
All testing-related files including unit tests, integration tests, E2E tests, and test utilities.

## Structure

### Unit Tests (`tests/unit/`)
- Individual function and component testing
- Pure function tests with Vitest
- Component unit tests with React Testing Library
- Utility function tests

### Integration Tests (`tests/integration/`)
- API endpoint testing
- Database integration tests
- Service layer testing
- Multi-component integration

### E2E Tests (`tests/e2e/`)
- End-to-end user journey tests
- Browser automation with Playwright
- Critical path testing
- Cross-browser compatibility

### API Tests (`tests/api/`)
- API route testing
- Request/response validation
- Error handling testing
- Performance testing

### Pages (`tests/pages/`)
- Page object models for E2E tests
- Page-specific test utilities
- Component page tests

### Fixtures (`tests/fixtures/`)
- Mock data for testing
- Test database seeds
- Sample files for upload testing
- API response mocks

### Helpers (`tests/helpers/`)
- Test utility functions
- Custom matchers and assertions
- Test setup and teardown helpers
- Mock implementations

## Testing Stack
- **Unit Tests**: Vitest + React Testing Library
- **E2E Tests**: Playwright
- **API Tests**: Playwright API testing
- **Mocking**: Vitest built-in mocking
- **Coverage**: Vitest coverage reports

## Key Files
- `vitest.config.ts` - Unit test configuration
- `playwright.config.ts` - E2E test configuration
- `tests/setup.ts` - Global test setup
- `tests/helpers/test-utils.tsx` - Common test utilities

## Testing Standards
- Write tests for all new features and bug fixes
- Aim for high code coverage (80%+)
- Use descriptive test names that explain the behavior
- Test both happy path and error scenarios
- Use page object model for E2E tests
- Mock external dependencies in unit tests
- Use fixtures for consistent test data

## Commands
- `yarn test` - Run unit tests
- `yarn test:e2e` - Run E2E tests
- `yarn test:api` - Run API tests
- `yarn test:coverage` - Generate coverage report
- `yarn verify:full` - Run all tests + linting + type checking