/**
 * Keyword Tracking Infrastructure
 * Based on PRD-PSEO-01 Section 9: Keyword Tracking Setup
 */

export interface IKeywordTracking {
  keyword: string;
  volume: number;
  page: string;
  currentRank: number | null;
  targetRank: number;
  traffic: number;
  conversions: number;
  lastUpdated: Date;
}

export interface IKeywordPerformance {
  keyword: string;
  page: string;
  impressions: number;
  clicks: number;
  ctr: number;
  averagePosition: number;
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  startDate: Date;
  endDate: Date;
}

/**
 * Tracking spreadsheet structure for monitoring keyword performance
 * This data can be exported to CSV or used in a dashboard
 */
export class KeywordTracker {
  private trackingData: Map<string, IKeywordTracking> = new Map();

  /**
   * Add or update a keyword to track
   */
  trackKeyword(data: Omit<IKeywordTracking, 'lastUpdated'>): void {
    this.trackingData.set(data.keyword, {
      ...data,
      lastUpdated: new Date(),
    });
  }

  /**
   * Update ranking for a keyword
   */
  updateRanking(keyword: string, currentRank: number): void {
    const existing = this.trackingData.get(keyword);
    if (existing) {
      this.trackingData.set(keyword, {
        ...existing,
        currentRank,
        lastUpdated: new Date(),
      });
    }
  }

  /**
   * Update traffic for a keyword
   */
  updateTraffic(keyword: string, traffic: number): void {
    const existing = this.trackingData.get(keyword);
    if (existing) {
      this.trackingData.set(keyword, {
        ...existing,
        traffic,
        lastUpdated: new Date(),
      });
    }
  }

  /**
   * Update conversions for a keyword
   */
  updateConversions(keyword: string, conversions: number): void {
    const existing = this.trackingData.get(keyword);
    if (existing) {
      this.trackingData.set(keyword, {
        ...existing,
        conversions,
        lastUpdated: new Date(),
      });
    }
  }

  /**
   * Get tracking data for a keyword
   */
  getKeywordData(keyword: string): IKeywordTracking | undefined {
    return this.trackingData.get(keyword);
  }

  /**
   * Get all tracked keywords
   */
  getAllTrackedKeywords(): IKeywordTracking[] {
    return Array.from(this.trackingData.values());
  }

  /**
   * Get keywords that need attention (not ranking in target position)
   */
  getKeywordsNeedingAttention(): IKeywordTracking[] {
    return Array.from(this.trackingData.values()).filter(
      data => data.currentRank === null || data.currentRank > data.targetRank
    );
  }

  /**
   * Get top performing keywords
   */
  getTopPerformers(limit: number = 10): IKeywordTracking[] {
    return Array.from(this.trackingData.values())
      .filter(data => data.currentRank !== null)
      .sort((a, b) => (a.currentRank || 999) - (b.currentRank || 999))
      .slice(0, limit);
  }

  /**
   * Export to CSV format
   */
  exportToCSV(): string {
    const headers = [
      'Keyword',
      'Volume',
      'Page',
      'Current Rank',
      'Target Rank',
      'Traffic',
      'Conversions',
      'Last Updated',
    ];

    const rows = Array.from(this.trackingData.values()).map(data => [
      data.keyword,
      data.volume.toString(),
      data.page,
      data.currentRank?.toString() || '-',
      data.targetRank.toString(),
      data.traffic.toString(),
      data.conversions.toString(),
      data.lastUpdated.toISOString(),
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }
}

/**
 * Review cadence tracking
 * Based on PRD-PSEO-01 Section 9.3: Review Cadence
 */
export interface IReviewTask {
  timeframe: 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly';
  actions: string[];
  lastReview: Date | null;
  nextReview: Date;
}

export const reviewCadence: IReviewTask[] = [
  {
    timeframe: 'Daily',
    actions: ['Monitor for major ranking drops'],
    lastReview: null,
    nextReview: new Date(),
  },
  {
    timeframe: 'Weekly',
    actions: ['Update ranking positions', 'Update traffic metrics'],
    lastReview: null,
    nextReview: new Date(),
  },
  {
    timeframe: 'Monthly',
    actions: ['Conversion analysis', 'Content updates based on performance'],
    lastReview: null,
    nextReview: new Date(),
  },
  {
    timeframe: 'Quarterly',
    actions: ['Full keyword strategy review', 'Competitor analysis update'],
    lastReview: null,
    nextReview: new Date(),
  },
];
