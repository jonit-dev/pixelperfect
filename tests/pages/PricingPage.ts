import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class PricingPage extends BasePage {
  // Page header
  readonly pageTitle: Locator;
  readonly pageDescription: Locator;

  // Credit packs section - uses div.mb-16 structure, not <section>
  readonly creditPacksSection: Locator;
  readonly creditPacksTitle: Locator;
  readonly creditPacksDescription: Locator;

  // Subscriptions section
  readonly subscriptionsSection: Locator;
  readonly subscriptionsTitle: Locator;
  readonly subscriptionsDescription: Locator;

  // FAQ section
  readonly faqSection: Locator;
  readonly faqTitle: Locator;

  // Custom plan CTA
  readonly customPlanSection: Locator;
  readonly customPlanTitle: Locator;
  readonly contactSalesButton: Locator;

  constructor(page: Page) {
    super(page);

    // Page header
    this.pageTitle = page.getByRole('heading', { name: 'Simple, Transparent Pricing' });
    this.pageDescription = page.getByText('Choose the plan that fits your needs');

    // Credit packs section - locate by h2 heading "Credit Packs"
    this.creditPacksTitle = page.getByRole('heading', { name: 'Credit Packs' });
    this.creditPacksSection = page.locator('div.mb-16').filter({ has: this.creditPacksTitle });
    this.creditPacksDescription = page.getByText('Buy credits once, use them anytime');

    // Subscriptions section - locate by h2 heading "Monthly Subscriptions"
    this.subscriptionsTitle = page.getByRole('heading', { name: 'Monthly Subscriptions' });
    this.subscriptionsSection = page.locator('div.mb-16').filter({ has: this.subscriptionsTitle });
    this.subscriptionsDescription = page.getByText('Get credits every month');

    // FAQ section
    this.faqTitle = page.getByRole('heading', { name: 'Frequently Asked Questions' });
    this.faqSection = page.locator('div.max-w-3xl').filter({ has: this.faqTitle });

    // Custom plan CTA
    this.customPlanTitle = page.getByRole('heading', { name: 'Need a custom plan?' });
    this.customPlanSection = page.locator('.card').filter({ has: this.customPlanTitle });
    this.contactSalesButton = page.getByRole('link', { name: 'Contact Sales' });
  }

  /**
   * Navigate to the pricing page
   */
  async goto(): Promise<void> {
    await super.goto('/pricing');
  }

  /**
   * Wait for the page to load completely
   */
  async waitForLoad(): Promise<void> {
    await expect(this.pageTitle).toBeVisible();
    await expect(this.creditPacksSection).toBeVisible();
    await expect(this.subscriptionsSection).toBeVisible();
  }

  /**
   * Get a pricing card by name (for credit packs)
   */
  getCreditPackCard(packName: string): PricingCard {
    return new PricingCard(this.page.locator('.card').filter({ hasText: packName }).first());
  }

  /**
   * Get a pricing card by name (for subscriptions)
   */
  getSubscriptionCard(planName: string): PricingCard {
    return new PricingCard(this.page.locator('.card').filter({ hasText: planName }).first());
  }

  /**
   * Get all credit pack cards
   */
  async getAllCreditPackCards(): Promise<PricingCard[]> {
    const cards = this.creditPacksSection.locator('.card');
    const count = await cards.count();
    const result: PricingCard[] = [];

    for (let i = 0; i < count; i++) {
      result.push(new PricingCard(cards.nth(i)));
    }

    return result;
  }

  /**
   * Get all subscription cards
   */
  async getAllSubscriptionCards(): Promise<PricingCard[]> {
    const cards = this.subscriptionsSection.locator('.card');
    const count = await cards.count();
    const result: PricingCard[] = [];

    for (let i = 0; i < count; i++) {
      result.push(new PricingCard(cards.nth(i)));
    }

    return result;
  }

  /**
   * Subscribe to a specific plan
   */
  async subscribeToPlan(planName: string): Promise<void> {
    const card = this.getSubscriptionCard(planName);
    await card.subscribe();
  }

  /**
   * Buy a specific credit pack
   */
  async buyCreditPack(packName: string): Promise<void> {
    const card = this.getCreditPackCard(packName);
    await card.buyNow();
  }

  /**
   * Verify that pricing page structure is correct
   */
  async verifyPageStructure(): Promise<void> {
    await expect(this.pageTitle).toBeVisible();
    await expect(this.pageDescription).toBeVisible();
    await expect(this.creditPacksTitle).toBeVisible();
    await expect(this.creditPacksDescription).toBeVisible();
    await expect(this.subscriptionsTitle).toBeVisible();
    await expect(this.subscriptionsDescription).toBeVisible();
    await expect(this.faqTitle).toBeVisible();
  }

  /**
   * Verify that specific credit packs are available
   */
  async verifyCreditPacksAvailable(packNames: string[]): Promise<void> {
    for (const packName of packNames) {
      const card = this.getCreditPackCard(packName);
      await expect(card.cardLocator).toBeVisible();
      await expect(card.name).toContainText(packName);
    }
  }

  /**
   * Verify that specific subscription plans are available
   */
  async verifySubscriptionPlansAvailable(planNames: string[]): Promise<void> {
    for (const planName of planNames) {
      const card = this.getSubscriptionCard(planName);
      await expect(card.cardLocator).toBeVisible();
      await expect(card.name).toContainText(planName);
    }
  }
}

/**
 * Helper class for individual pricing cards
 */
export class PricingCard {
  readonly cardLocator: Locator;
  readonly name: Locator;
  readonly description: Locator;
  readonly price: Locator;
  readonly interval: Locator;
  readonly credits: Locator;
  readonly features: Locator;
  readonly subscribeButton: Locator;
  readonly recommendedBadge: Locator;

  constructor(cardLocator: Locator) {
    this.cardLocator = cardLocator;
    this.name = cardLocator.locator('.card-title, h2');
    this.description = cardLocator.locator('.text-center.text-sm, p:has-text("Perfect")');
    this.price = cardLocator.locator('.text-4xl, .font-bold');
    this.interval = cardLocator.locator('div:has-text("per")');
    this.credits = cardLocator.locator('div:has-text("credits")');
    this.features = cardLocator.locator('ul.space-y-2');
    this.subscribeButton = cardLocator.locator('.btn');
    this.recommendedBadge = cardLocator.locator('.badge');
  }

  /**
   * Click subscribe/buy button
   */
  async subscribe(): Promise<void> {
    await this.subscribeButton.click();
  }

  /**
   * Click buy now button (alias for subscribe)
   */
  async buyNow(): Promise<void> {
    await this.subscribe();
  }

  /**
   * Check if the card is marked as recommended
   */
  async isRecommended(): Promise<boolean> {
    return await this.recommendedBadge.isVisible();
  }

  /**
   * Get the price amount
   */
  async getPrice(): Promise<string> {
    return (await this.price.textContent()) || '';
  }

  /**
   * Get the interval (month/year)
   */
  async getInterval(): Promise<string | null> {
    const text = await this.interval.textContent();
    return text || null;
  }

  /**
   * Get the number of credits if applicable
   */
  async getCreditsAmount(): Promise<number | null> {
    const text = await this.credits.textContent();
    if (!text) return null;

    const match = text.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  }

  /**
   * Wait for button to not be loading
   */
  async waitForButtonToBeReady(): Promise<void> {
    await this.subscribeButton.waitFor({ state: 'visible' });
    // Wait for loading state to clear if present
    await this.cardLocator.waitFor({ state: 'visible' });
  }

  /**
   * Verify card structure is correct
   */
  async verifyStructure(): Promise<void> {
    await expect(this.name).toBeVisible();
    await expect(this.price).toBeVisible();
    await expect(this.subscribeButton).toBeVisible();
  }
}
