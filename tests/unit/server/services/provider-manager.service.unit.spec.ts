import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AIProvider, ProviderTier } from '@shared/types/provider-adapter.types';
import type {
  IProviderAdapter,
  IProviderConfig,
  IProviderUsage,
  IProviderSelectionContext,
} from '@shared/types/provider-adapter.types';
import type {
  IImageProcessorResult,
  IProcessImageOptions,
} from '@server/services/image-processor.interface';
import type { IUpscaleInput } from '@shared/validation/upscale.schema';

// Mock the provider credit tracker service
const mockGetAllProvidersUsage = vi.fn();
const mockGetProviderLimits = vi.fn();

vi.mock('@server/services/provider-credit-tracker.service', () => ({
  getProviderCreditTracker: vi.fn(() => ({
    getAllProvidersUsage: mockGetAllProvidersUsage,
    getProviderLimits: mockGetProviderLimits,
  })),
}));

// Dynamic import for module under test
async function importProviderManager() {
  return await import('@server/services/provider-manager.service');
}

describe('ProviderManager', () => {
  let mockGeminiAdapter: IProviderAdapter;
  let mockReplicateAdapter: IProviderAdapter;
  let mockStabilityAdapter: IProviderAdapter;

  const geminiConfig: IProviderConfig = {
    provider: AIProvider.GEMINI,
    tier: ProviderTier.FREE,
    priority: 1,
    enabled: true,
    supportedModels: ['standard', 'premium'],
    fallbackProvider: AIProvider.REPLICATE,
    freeTier: {
      dailyRequests: 500,
      monthlyCredits: 15000,
      hardLimit: true,
      resetTimezone: 'UTC',
    },
  };

  const replicateConfig: IProviderConfig = {
    provider: AIProvider.REPLICATE,
    tier: ProviderTier.PAID,
    priority: 2,
    enabled: true,
    supportedModels: ['standard', 'premium', 'ultra'],
  };

  const stabilityConfig: IProviderConfig = {
    provider: AIProvider.STABILITY_AI,
    tier: ProviderTier.FREE,
    priority: 3,
    enabled: false,
    supportedModels: ['standard'],
  };

  const mockImageProcessorResult: IImageProcessorResult = {
    imageUrl: 'https://example.com/result.png',
    mimeType: 'image/png',
    creditsRemaining: 100,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock adapter for Gemini
    mockGeminiAdapter = {
      getConfig: vi.fn(() => geminiConfig),
      getProviderName: vi.fn(() => AIProvider.GEMINI),
      isAvailable: vi.fn(() => Promise.resolve(true)),
      processImage: vi.fn(() => Promise.resolve(mockImageProcessorResult)),
      getUsage: vi.fn(() =>
        Promise.resolve({
          provider: AIProvider.GEMINI,
          todayRequests: 10,
          monthCredits: 100,
          lastDailyReset: new Date().toISOString(),
          lastMonthlyReset: new Date().toISOString(),
          totalRequests: 100,
          totalCredits: 1000,
        })
      ),
      resetCounters: vi.fn(() => Promise.resolve()),
      getProcessor: vi.fn(),
    };

    // Create mock adapter for Replicate
    mockReplicateAdapter = {
      getConfig: vi.fn(() => replicateConfig),
      getProviderName: vi.fn(() => AIProvider.REPLICATE),
      isAvailable: vi.fn(() => Promise.resolve(true)),
      processImage: vi.fn(() => Promise.resolve(mockImageProcessorResult)),
      getUsage: vi.fn(() =>
        Promise.resolve({
          provider: AIProvider.REPLICATE,
          todayRequests: 5,
          monthCredits: 50,
          lastDailyReset: new Date().toISOString(),
          lastMonthlyReset: new Date().toISOString(),
          totalRequests: 50,
          totalCredits: 500,
        })
      ),
      resetCounters: vi.fn(() => Promise.resolve()),
      getProcessor: vi.fn(),
    };

    // Create mock adapter for Stability AI (disabled)
    mockStabilityAdapter = {
      getConfig: vi.fn(() => stabilityConfig),
      getProviderName: vi.fn(() => AIProvider.STABILITY_AI),
      isAvailable: vi.fn(() => Promise.resolve(true)),
      processImage: vi.fn(() => Promise.resolve(mockImageProcessorResult)),
      getUsage: vi.fn(() =>
        Promise.resolve({
          provider: AIProvider.STABILITY_AI,
          todayRequests: 0,
          monthCredits: 0,
          lastDailyReset: new Date().toISOString(),
          lastMonthlyReset: new Date().toISOString(),
          totalRequests: 0,
          totalCredits: 0,
        })
      ),
      resetCounters: vi.fn(() => Promise.resolve()),
      getProcessor: vi.fn(),
    };

    // Mock credit tracker responses
    mockGetAllProvidersUsage.mockResolvedValue({
      [AIProvider.GEMINI]: {
        provider: AIProvider.GEMINI,
        todayRequests: 10,
        monthCredits: 100,
        lastDailyReset: new Date().toISOString(),
        lastMonthlyReset: new Date().toISOString(),
        totalRequests: 100,
        totalCredits: 1000,
      },
      [AIProvider.REPLICATE]: {
        provider: AIProvider.REPLICATE,
        todayRequests: 5,
        monthCredits: 50,
        lastDailyReset: new Date().toISOString(),
        lastMonthlyReset: new Date().toISOString(),
        totalRequests: 50,
        totalCredits: 500,
      },
      [AIProvider.STABILITY_AI]: {
        provider: AIProvider.STABILITY_AI,
        todayRequests: 0,
        monthCredits: 0,
        lastDailyReset: new Date().toISOString(),
        lastMonthlyReset: new Date().toISOString(),
        totalRequests: 0,
        totalCredits: 0,
      },
      [AIProvider.OPENAI]: {
        provider: AIProvider.OPENAI,
        todayRequests: 0,
        monthCredits: 0,
        lastDailyReset: new Date().toISOString(),
        lastMonthlyReset: new Date().toISOString(),
        totalRequests: 0,
        totalCredits: 0,
      },
    });

    mockGetProviderLimits.mockImplementation((provider: AIProvider) => {
      if (provider === AIProvider.GEMINI) {
        return {
          dailyRequests: 500,
          monthlyCredits: 15000,
          hardLimit: true,
          resetTimezone: 'UTC',
        };
      }
      return {
        dailyRequests: 0,
        monthlyCredits: 0,
        hardLimit: false,
        resetTimezone: 'UTC',
      };
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('registerProvider', () => {
    it('should register a provider adapter', async () => {
      const { ProviderManager } = await importProviderManager();
      const manager = new ProviderManager();

      manager.registerProvider(mockGeminiAdapter);

      const allProviders = manager.getAllProviders();
      expect(allProviders).toHaveLength(1);
      expect(allProviders[0]).toBe(mockGeminiAdapter);
    });

    it('should register multiple providers', async () => {
      const { ProviderManager } = await importProviderManager();
      const manager = new ProviderManager();

      manager.registerProvider(mockGeminiAdapter);
      manager.registerProvider(mockReplicateAdapter);
      manager.registerProvider(mockStabilityAdapter);

      const allProviders = manager.getAllProviders();
      expect(allProviders).toHaveLength(3);
    });
  });

  describe('getAllProviders', () => {
    it('should return empty array when no providers registered', async () => {
      const { ProviderManager } = await importProviderManager();
      const manager = new ProviderManager();

      const providers = manager.getAllProviders();
      expect(providers).toEqual([]);
    });

    it('should return all registered providers', async () => {
      const { ProviderManager } = await importProviderManager();
      const manager = new ProviderManager();

      manager.registerProvider(mockGeminiAdapter);
      manager.registerProvider(mockReplicateAdapter);

      const providers = manager.getAllProviders();
      expect(providers).toHaveLength(2);
    });
  });

  describe('getProviderByType', () => {
    it('should return provider by type', async () => {
      const { ProviderManager } = await importProviderManager();
      const manager = new ProviderManager();

      manager.registerProvider(mockGeminiAdapter);

      const provider = manager.getProviderByType(AIProvider.GEMINI);
      expect(provider).toBe(mockGeminiAdapter);
    });

    it('should return undefined for unregistered provider', async () => {
      const { ProviderManager } = await importProviderManager();
      const manager = new ProviderManager();

      const provider = manager.getProviderByType(AIProvider.GEMINI);
      expect(provider).toBeUndefined();
    });

    it('should return correct provider when multiple registered', async () => {
      const { ProviderManager } = await importProviderManager();
      const manager = new ProviderManager();

      manager.registerProvider(mockGeminiAdapter);
      manager.registerProvider(mockReplicateAdapter);

      const gemini = manager.getProviderByType(AIProvider.GEMINI);
      const replicate = manager.getProviderByType(AIProvider.REPLICATE);

      expect(gemini).toBe(mockGeminiAdapter);
      expect(replicate).toBe(mockReplicateAdapter);
    });
  });

  describe('updateProviderConfig', () => {
    it('should log config update for existing provider', async () => {
      const { ProviderManager } = await importProviderManager();
      const manager = new ProviderManager();

      manager.registerProvider(mockGeminiAdapter);

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      manager.updateProviderConfig(AIProvider.GEMINI, {
        enabled: false,
      });

      expect(consoleSpy).toHaveBeenCalledWith('[ProviderManager] Config updated for gemini:', {
        enabled: false,
      });

      consoleSpy.mockRestore();
    });

    it('should not error when updating unregistered provider', async () => {
      const { ProviderManager } = await importProviderManager();
      const manager = new ProviderManager();

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      expect(() => {
        manager.updateProviderConfig(AIProvider.GEMINI, { enabled: false });
      }).not.toThrow();

      consoleSpy.mockRestore();
    });
  });

  describe('getProvider', () => {
    beforeEach(() => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      return () => consoleSpy.mockRestore();
    });

    it('should select provider by priority when all available', async () => {
      const { ProviderManager } = await importProviderManager();
      const manager = new ProviderManager();

      manager.registerProvider(mockGeminiAdapter);
      manager.registerProvider(mockReplicateAdapter);

      const context: IProviderSelectionContext = {
        userId: 'user-123',
        requestedModel: 'standard',
      };

      const selectedProvider = await manager.getProvider(context);

      expect(selectedProvider).toBe(mockGeminiAdapter);
      expect(mockGeminiAdapter.isAvailable).toHaveBeenCalled();
    });

    it('should skip providers that are not available', async () => {
      const { ProviderManager } = await importProviderManager();
      const manager = new ProviderManager();

      // Make Gemini unavailable
      (mockGeminiAdapter.isAvailable as ReturnType<typeof vi.fn>).mockResolvedValue(false);

      manager.registerProvider(mockGeminiAdapter);
      manager.registerProvider(mockReplicateAdapter);

      const context: IProviderSelectionContext = {
        userId: 'user-123',
        requestedModel: 'standard',
      };

      const selectedProvider = await manager.getProvider(context);

      expect(selectedProvider).toBe(mockReplicateAdapter);
    });

    it('should skip providers that do not support requested model', async () => {
      const { ProviderManager } = await importProviderManager();
      const manager = new ProviderManager();

      // Gemini only supports 'standard' and 'premium'
      manager.registerProvider(mockGeminiAdapter);
      manager.registerProvider(mockReplicateAdapter); // Replicate supports 'ultra'

      const context: IProviderSelectionContext = {
        userId: 'user-123',
        requestedModel: 'ultra',
      };

      const selectedProvider = await manager.getProvider(context);

      // Should skip Gemini and select Replicate
      expect(selectedProvider).toBe(mockReplicateAdapter);
    });

    it('should skip disabled providers', async () => {
      const { ProviderManager } = await importProviderManager();
      const manager = new ProviderManager();

      manager.registerProvider(mockStabilityAdapter); // Disabled
      manager.registerProvider(mockGeminiAdapter);

      const context: IProviderSelectionContext = {
        userId: 'user-123',
      };

      const selectedProvider = await manager.getProvider(context);

      expect(selectedProvider).toBe(mockGeminiAdapter);
    });

    it('should select any provider when no model specified', async () => {
      const { ProviderManager } = await importProviderManager();
      const manager = new ProviderManager();

      manager.registerProvider(mockGeminiAdapter);

      const context: IProviderSelectionContext = {
        userId: 'user-123',
      };

      const selectedProvider = await manager.getProvider(context);

      expect(selectedProvider).toBe(mockGeminiAdapter);
    });

    it('should throw error when no providers available', async () => {
      const { ProviderManager } = await importProviderManager();
      const manager = new ProviderManager();

      const context: IProviderSelectionContext = {
        userId: 'user-123',
      };

      await expect(manager.getProvider(context)).rejects.toThrow(
        'No AI providers available. Please try again later.'
      );
    });

    it('should throw error when all providers unavailable', async () => {
      const { ProviderManager } = await importProviderManager();
      const manager = new ProviderManager();

      (mockGeminiAdapter.isAvailable as ReturnType<typeof vi.fn>).mockResolvedValue(false);
      (mockReplicateAdapter.isAvailable as ReturnType<typeof vi.fn>).mockResolvedValue(false);

      manager.registerProvider(mockGeminiAdapter);
      manager.registerProvider(mockReplicateAdapter);

      const context: IProviderSelectionContext = {
        userId: 'user-123',
      };

      await expect(manager.getProvider(context)).rejects.toThrow(
        'No AI providers available. Please try again later.'
      );
    });

    it('should throw error when no providers support requested model', async () => {
      const { ProviderManager } = await importProviderManager();
      const manager = new ProviderManager();

      manager.registerProvider(mockGeminiAdapter);

      const context: IProviderSelectionContext = {
        userId: 'user-123',
        requestedModel: 'unsupported-model',
      };

      await expect(manager.getProvider(context)).rejects.toThrow(
        'No AI providers available. Please try again later.'
      );
    });

    it('should handle providers with empty supported models array', async () => {
      const { ProviderManager } = await importProviderManager();
      const manager = new ProviderManager();

      // Create adapter with empty supported models
      const adapterWithNoModels: IProviderAdapter = {
        getConfig: vi.fn(() => ({
          provider: AIProvider.OPENAI,
          tier: ProviderTier.PAID,
          priority: 1,
          enabled: true,
          supportedModels: [],
        })),
        getProviderName: vi.fn(() => AIProvider.OPENAI),
        isAvailable: vi.fn(() => Promise.resolve(true)),
        processImage: vi.fn(),
        getUsage: vi.fn(() => Promise.resolve({} as IProviderUsage)),
        resetCounters: vi.fn(() => Promise.resolve()),
        getProcessor: vi.fn(),
      };

      manager.registerProvider(adapterWithNoModels);

      const context: IProviderSelectionContext = {
        userId: 'user-123',
        requestedModel: 'any-model',
      };

      await expect(manager.getProvider(context)).rejects.toThrow(
        'No AI providers available. Please try again later.'
      );
    });
  });

  describe('processImage', () => {
    const mockInput: IUpscaleInput = {
      imageUrl: 'https://example.com/image.png',
      config: { qualityTier: 'standard' },
    } as IUpscaleInput;

    const mockOptions: IProcessImageOptions = {
      creditCost: 5,
    };

    it('should process image with selected provider', async () => {
      const { ProviderManager } = await importProviderManager();
      const manager = new ProviderManager();

      manager.registerProvider(mockGeminiAdapter);

      const result = await manager.processImage('user-123', mockInput, mockOptions);

      expect(result).toEqual(mockImageProcessorResult);
      expect(mockGeminiAdapter.processImage).toHaveBeenCalledWith(
        'user-123',
        mockInput,
        mockOptions
      );
    });

    it('should use fallback provider when primary fails', async () => {
      const { ProviderManager } = await importProviderManager();
      const manager = new ProviderManager();

      (mockGeminiAdapter.processImage as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Gemini failed')
      );

      manager.registerProvider(mockGeminiAdapter);
      manager.registerProvider(mockReplicateAdapter);

      const result = await manager.processImage('user-123', mockInput, mockOptions);

      expect(result).toEqual(mockImageProcessorResult);
      expect(mockGeminiAdapter.processImage).toHaveBeenCalled();
      expect(mockReplicateAdapter.processImage).toHaveBeenCalledWith(
        'user-123',
        mockInput,
        mockOptions
      );
    });

    it('should throw error when no fallback available', async () => {
      const { ProviderManager } = await importProviderManager();
      const manager = new ProviderManager();

      const error = new Error('Processing failed');
      (mockGeminiAdapter.processImage as ReturnType<typeof vi.fn>).mockRejectedValue(error);

      // Create adapter without fallback
      const adapterWithoutFallback: IProviderAdapter = {
        getConfig: vi.fn(() => ({
          provider: AIProvider.OPENAI,
          tier: ProviderTier.PAID,
          priority: 1,
          enabled: true,
          supportedModels: ['standard'],
        })),
        getProviderName: vi.fn(() => AIProvider.OPENAI),
        isAvailable: vi.fn(() => Promise.resolve(true)),
        processImage: vi.fn(() => Promise.reject(error)),
        getUsage: vi.fn(() => Promise.resolve({} as IProviderUsage)),
        resetCounters: vi.fn(() => Promise.resolve()),
        getProcessor: vi.fn(),
      };

      manager.registerProvider(adapterWithoutFallback);

      await expect(manager.processImage('user-123', mockInput, mockOptions)).rejects.toThrow(
        'Processing failed'
      );
    });

    it('should not fallback when fallback provider not registered', async () => {
      const { ProviderManager } = await importProviderManager();
      const manager = new ProviderManager();

      const error = new Error('Gemini failed');
      (mockGeminiAdapter.processImage as ReturnType<typeof vi.fn>).mockRejectedValue(error);

      manager.registerProvider(mockGeminiAdapter);
      // Don't register Replicate (the fallback)

      await expect(manager.processImage('user-123', mockInput, mockOptions)).rejects.toThrow(
        'Gemini failed'
      );
    });

    it('should pass quality tier as requested model in context', async () => {
      const { ProviderManager } = await importProviderManager();
      const manager = new ProviderManager();

      manager.registerProvider(mockGeminiAdapter);

      const inputWithPremium: IUpscaleInput = {
        imageUrl: 'https://example.com/image.png',
        config: { qualityTier: 'premium' },
      } as IUpscaleInput;

      await manager.processImage('user-123', inputWithPremium, mockOptions);

      // Verify that Gemini (which supports 'premium') was selected
      expect(mockGeminiAdapter.processImage).toHaveBeenCalled();
    });

    it('should handle options parameter as optional', async () => {
      const { ProviderManager } = await importProviderManager();
      const manager = new ProviderManager();

      manager.registerProvider(mockGeminiAdapter);

      const result = await manager.processImage('user-123', mockInput);

      expect(result).toEqual(mockImageProcessorResult);
      expect(mockGeminiAdapter.processImage).toHaveBeenCalledWith('user-123', mockInput, undefined);
    });

    it('should log processing with provider', async () => {
      const { ProviderManager } = await importProviderManager();
      const manager = new ProviderManager();

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      manager.registerProvider(mockGeminiAdapter);

      await manager.processImage('user-123', mockInput, mockOptions);

      // Check that the processing log was called (among other logs)
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[ProviderManager] Processing with provider: gemini'
      );

      consoleLogSpy.mockRestore();
    });

    it('should log error when processing fails', async () => {
      const { ProviderManager } = await importProviderManager();
      const manager = new ProviderManager();

      const error = new Error('Processing failed');
      (mockGeminiAdapter.processImage as ReturnType<typeof vi.fn>).mockRejectedValue(error);

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      manager.registerProvider(mockGeminiAdapter);
      manager.registerProvider(mockReplicateAdapter);

      await manager.processImage('user-123', mockInput, mockOptions);

      expect(consoleErrorSpy).toHaveBeenCalledWith('[ProviderManager] Error with gemini:', error);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('getProvidersUsage', () => {
    it('should return usage from credit tracker', async () => {
      const { ProviderManager } = await importProviderManager();
      const manager = new ProviderManager();

      const usage = await manager.getProvidersUsage();

      expect(mockGetAllProvidersUsage).toHaveBeenCalled();
      expect(usage).toBeDefined();
      expect(usage[AIProvider.GEMINI]).toBeDefined();
    });
  });

  describe('logAllProvidersUsage', () => {
    it('should log all providers usage', async () => {
      const { ProviderManager } = await importProviderManager();
      const manager = new ProviderManager();

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      manager.logAllProvidersUsage();

      // Wait for the promise to resolve
      await new Promise(resolve => setTimeout(resolve, 0));

      // The implementation logs: '[ProviderManager] All Providers Usage:'
      expect(consoleLogSpy).toHaveBeenCalledWith('[ProviderManager] All Providers Usage:');

      consoleLogSpy.mockRestore();
    });
  });

  describe('getProviderManager singleton', () => {
    it('should return same instance on multiple calls', async () => {
      const { getProviderManager } = await importProviderManager();

      const instance1 = getProviderManager();
      const instance2 = getProviderManager();

      expect(instance1).toBe(instance2);
    });

    it('should return a new ProviderManager instance', async () => {
      const { getProviderManager } = await importProviderManager();

      const manager = getProviderManager();

      expect(manager).toBeDefined();
      expect(manager.getAllProviders()).toEqual([]);
    });
  });
});
