// Dedicated dayjs mock for tests that need to mock the entire import chain
// This file must be imported BEFORE any modules that import dayjs
import { vi } from 'vitest';

vi.mock('dayjs', () => {
  const createMockDayjs = () => ({
    format: vi.fn(() => '2024-01-15'),
    toISOString: vi.fn(() => '2024-01-15T00:00:00.000Z'),
    toDate: vi.fn(() => new Date('2024-01-15')),
    unix: vi.fn(function (this: any, timestamp?: number) {
      // When called as static method dayjs.unix(), return a new instance
      if (this === dayjsMock) {
        return createMockDayjs();
      }
      // When called as instance method, return the timestamp value
      return 1640995200;
    }),
    utc: vi.fn(() => createMockDayjs()),
    add: vi.fn(() => createMockDayjs()),
    subtract: vi.fn(() => createMockDayjs()),
    diff: vi.fn(() => 1),
    isBefore: vi.fn(() => false),
    isAfter: vi.fn(() => true),
    isSame: vi.fn(() => false),
    startOf: vi.fn(() => createMockDayjs()),
    endOf: vi.fn(() => createMockDayjs()),
  });

  const dayjsMock = vi.fn(createMockDayjs) as typeof vi.fn & {
    extend: typeof vi.fn;
    utc: typeof vi.fn;
    unix: typeof vi.fn;
  };
  dayjsMock.extend = vi.fn();
  dayjsMock.utc = vi.fn(createMockDayjs);
  dayjsMock.unix = vi.fn(createMockDayjs); // Static method

  return {
    default: dayjsMock,
  };
});

vi.mock('dayjs/plugin/utc', () => ({
  default: 'utc-plugin',
}));
