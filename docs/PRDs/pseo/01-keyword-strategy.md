# pSEO Sub-PRD 01: Keyword Strategy & Content Planning

## Document Info

| Field           | Value                        |
| --------------- | ---------------------------- |
| **Document ID** | PRD-PSEO-01                  |
| **Parent PRD**  | [00-index.md](./00-index.md) |
| **Status**      | Implemented                  |
| **Priority**    | P0 - Foundation              |
| **Owner**       | Marketing + Engineering      |
| **Implemented** | 2025-12-01                   |

---

## 1. Overview

This document defines the complete keyword strategy for myimageupscaler.com's programmatic SEO implementation, including keyword research methodology, intent classification, prioritization framework, and content mapping.

### 1.1 Objectives

1. Identify and categorize all target keywords from research data
2. Map keywords to page types and URL structures
3. Define content requirements for each keyword tier
4. Establish keyword tracking and monitoring approach

### 1.2 Data Sources

| Source                        | Location                    | Records         |
| ----------------------------- | --------------------------- | --------------- |
| Google Keyword Planner Export | `/app/seo/keywords.csv`     | 1,340+ keywords |
| Top Keywords Export           | `/app/seo/top_keywords.csv` | 100+ keywords   |
| Competitor Keyword Analysis   | Research                    | 500+ keywords   |

---

## 2. Keyword Taxonomy

### 2.1 Volume Tiers

```
Tier 1: Critical     (500,000+ monthly searches)  →  15 keywords
Tier 2: High         (50,000 monthly searches)    →  35 keywords
Tier 3: Medium       (5,000 monthly searches)     →  85 keywords
Tier 4: Long-tail    (500 monthly searches)       →  200+ keywords
Tier 5: Ultra-tail   (<500 monthly searches)      →  1,000+ keywords
```

### 2.2 Intent Classification

| Intent Type       | Description               | Example Keywords                                | Target Page Type          |
| ----------------- | ------------------------- | ----------------------------------------------- | ------------------------- |
| **Transactional** | Ready to use a tool       | "free ai upscaler", "upscale image now"         | /tools/, /free/           |
| **Comparison**    | Evaluating options        | "best ai upscaler", "topaz vs vanceai"          | /compare/                 |
| **Informational** | Learning/research         | "how to upscale images", "what is ai upscaling" | /guides/                  |
| **Commercial**    | Pre-purchase research     | "ai upscaler pricing", "topaz alternatives"     | /compare/, /alternatives/ |
| **Navigational**  | Looking for specific tool | "myimageupscaler.com upscaler", "bigjpg"        | Homepage, /tools/         |

### 2.3 Modifier Categories

| Modifier Type | Examples                                | Volume Impact              |
| ------------- | --------------------------------------- | -------------------------- |
| **Format**    | jpeg, png, webp, heic, raw              | High - underserved         |
| **Scale**     | 2x, 4x, 8x, 16x, 4k, 8k, hd             | High - specific intent     |
| **Price**     | free, cheap, affordable, premium        | Very High - high intent    |
| **Quality**   | best, top, professional, high-quality   | Medium - comparison        |
| **Location**  | online, offline, desktop, mobile        | Medium - platform specific |
| **Use Case**  | ecommerce, real estate, anime, gaming   | Medium - vertical specific |
| **Action**    | upscale, enhance, enlarge, improve, fix | High - intent signals      |

---

## 3. Tier 1 Keywords (Critical Priority)

### 3.1 500K+ Monthly Searches

| Keyword                  | Monthly Searches | Competition | CPC Range   | Target Page                     | Content Priority |
| ------------------------ | ---------------- | ----------- | ----------- | ------------------------------- | ---------------- |
| image upscaler           | 500,000          | Low (10)    | $0.04-$0.73 | /tools/ai-image-upscaler        | P0               |
| ai photo enhancer        | 500,000          | Low (21)    | $0.09-$1.71 | /tools/ai-photo-enhancer        | P0               |
| ai image enhancer        | 500,000          | Low (15)    | $0.11-$1.72 | /tools/ai-image-enhancer        | P0               |
| ai image upscaler        | 500,000          | Low (15)    | $0.07-$1.63 | /tools/ai-image-upscaler        | P0               |
| ai upscale               | 500,000          | Low (13)    | $0.12-$2.65 | /tools/ai-image-upscaler        | P0               |
| photo quality enhancer   | 500,000          | Low (12)    | $0.03-$0.78 | /tools/photo-quality-enhancer   | P0               |
| image quality enhancer   | 500,000          | Low (12)    | $0.03-$0.78 | /tools/image-quality-enhancer   | P0               |
| picture quality enhancer | 500,000          | Low (12)    | $0.03-$0.78 | /tools/picture-quality-enhancer | P0               |
| photo enhancer online    | 500,000          | Low (8)     | $0.02-$0.46 | /free/free-photo-enhancer       | P0               |
| image enhancer online    | 500,000          | Low (8)     | $0.02-$0.46 | /free/free-image-enhancer       | P0               |
| image clarity enhancer   | 500,000          | Low (12)    | $0.03-$0.78 | /tools/image-clarity-enhancer   | P1               |
| upscaler                 | 500,000          | Low (8)     | $0.06-$1.58 | /tools/ai-image-upscaler        | P0               |
| upsize an image          | 5,000,000        | Low (2)     | $0.04-$1.40 | /guides/how-to-upsize-images    | P0               |
| pic enhancer online      | 500,000          | Low (8)     | $0.02-$0.46 | /free/free-photo-enhancer       | P1               |
| photo online enhancer    | 500,000          | Low (8)     | $0.02-$0.46 | /free/free-photo-enhancer       | P1               |

### 3.2 Tier 1 Content Requirements

Each Tier 1 keyword page MUST include:

| Section               | Min Words | Requirements                               |
| --------------------- | --------- | ------------------------------------------ |
| Hero + Introduction   | 200       | Clear value prop, primary CTA, demo access |
| "What Is" Explanation | 300       | Technical but accessible, unique angle     |
| How It Works          | 250       | 4-6 steps with visuals, interactive demo   |
| Key Features          | 400       | 6-8 features, comparison to alternatives   |
| Benefits              | 300       | User-focused, ROI/time savings             |
| Use Cases             | 300       | 4-6 industry applications                  |
| FAQ                   | 400       | 6-8 questions, schema markup               |
| Related Tools         | 100       | Internal links, cross-sell                 |
| **Total Minimum**     | **2,250** | Plus images, CTAs, trust signals           |

---

## 4. Tier 2 Keywords (High Priority)

### 4.1 50K Monthly Searches

| Keyword                            | Competition | YoY Change | Target Page                                 | Notes                     |
| ---------------------------------- | ----------- | ---------- | ------------------------------------------- | ------------------------- |
| ai upscale image                   | Low (18)    | 0%         | /tools/ai-image-upscaler                    | Variation of T1           |
| ai enhance image                   | Low (20)    | 0%         | /tools/ai-image-enhancer                    | Variation of T1           |
| image resolution enhancer          | Low (22)    | 0%         | /scale/upscale-to-4k                        | Scale-specific            |
| ai image enlarger                  | Low (23)    | +900%      | /tools/ai-image-enlarger                    | Trending                  |
| photo quality enhancer online free | Low (15)    | 0%         | /free/free-photo-enhancer                   | High intent               |
| free ai photo enhancer             | Medium (48) | -90%       | /free/free-ai-photo-enhancer                | Declining but high volume |
| ai picture enhancer                | Low (31)    | 0%         | /tools/ai-picture-enhancer                  | Variation                 |
| upscale ai                         | Low (17)    | 0%         | /tools/ai-image-upscaler                    | Variation                 |
| ai image enhancer free             | Low (18)    | 0%         | /free/free-ai-image-enhancer                | High intent               |
| upscale photo                      | Low (19)    | 0%         | /tools/ai-photo-upscaler                    | Variation                 |
| img upscaler com                   | Low (8)     | 0%         | /compare/myimageupscaler.com-vs-imgupscaler | Brand comparison          |
| image upscaler 4k                  | Low (7)     | 0%         | /scale/upscale-to-4k                        | Scale-specific            |
| hd photo enhancer                  | Low (25)    | 0%         | /scale/upscale-to-hd                        | Scale-specific            |
| ai expand image                    | Low (12)    | 0%         | /tools/ai-image-expander                    | Different feature         |
| ai enhance image free              | Low (20)    | 0%         | /free/free-ai-image-enhancer                | High intent               |
| free image resolution enhancer     | Low (25)    | 0%         | /free/free-resolution-enhancer              | High intent               |
| upscale image ai                   | Low (15)    | 0%         | /tools/ai-image-upscaler                    | Variation                 |
| image upscaler free                | Low (10)    | 0%         | /free/free-image-upscaler                   | High intent               |
| ai image upscaler free             | Low (19)    | 0%         | /free/free-ai-upscaler                      | High intent               |
| image enhancer ai                  | Low (11)    | 0%         | /tools/ai-image-enhancer                    | Variation                 |
| upscale image online               | Low (12)    | 0%         | /free/free-image-upscaler                   | Online intent             |
| ai enhance photo                   | Low (33)    | +900%      | /tools/ai-photo-enhancer                    | Trending                  |
| enhance image ai                   | Low (18)    | 0%         | /tools/ai-image-enhancer                    | Variation                 |
| upscale image free                 | Low (16)    | 0%         | /free/free-image-upscaler                   | High intent               |
| ai enhance image free              | Low (20)    | 0%         | /free/free-ai-image-enhancer                | High intent               |

### 4.2 Tier 2 Content Requirements

| Section             | Min Words | Requirements                    |
| ------------------- | --------- | ------------------------------- |
| Hero + Introduction | 150       | Clear value prop, primary CTA   |
| Core Explanation    | 250       | Focused on specific angle       |
| How It Works        | 200       | 4 steps with visuals            |
| Key Features        | 300       | 4-6 features relevant to intent |
| Use Cases           | 200       | 3-4 applications                |
| FAQ                 | 300       | 5-6 questions                   |
| **Total Minimum**   | **1,400** |                                 |

---

## 5. Tier 3 Keywords (Medium Priority)

### 5.1 5K Monthly Searches

| Keyword                      | Competition | Intent     | Target Page                              |
| ---------------------------- | ----------- | ---------- | ---------------------------------------- |
| best ai image upscaler       | Medium (44) | Comparison | /compare/best-ai-image-upscalers         |
| best ai upscaler             | Medium (40) | Comparison | /compare/best-ai-upscalers               |
| ai image resolution enhancer | Medium (41) | Feature    | /scale/upscale-to-4k                     |
| ai photo enhancement         | Medium (53) | Generic    | /tools/ai-photo-enhancer                 |
| image enlarger online        | Medium (40) | Online     | /free/free-image-enlarger                |
| picture resolution enhancer  | Medium (34) | Feature    | /scale/upscale-to-hd                     |
| ai enlarge image             | Low (24)    | Action     | /tools/ai-image-enlarger                 |
| upscale an image             | Medium (39) | Action     | /guides/how-to-upscale-images            |
| improve image quality ai     | Medium (36) | Solution   | /tools/ai-image-enhancer                 |
| clip drop image upscaler     | Medium (66) | Brand      | /compare/myimageupscaler.com-vs-clipdrop |
| photo resolution enhancer    | Medium (32) | Feature    | /scale/upscale-to-4k                     |
| ai resolution upscaler       | Medium (37) | Feature    | /tools/ai-resolution-upscaler            |
| ai increase resolution       | Medium (39) | Action     | /scale/upscale-to-4k                     |
| ai improve image quality     | Medium (44) | Solution   | /tools/ai-image-enhancer                 |
| upres image                  | Medium (47) | Action     | /tools/ai-image-upscaler                 |
| best image upscaler          | Medium (40) | Comparison | /compare/best-image-upscalers            |
| ai photo enhance             | Low (24)    | Action     | /tools/ai-photo-enhancer                 |
| photo enlarger online        | Low (19)    | Online     | /free/free-photo-enlarger                |
| picture upscaler             | Low (11)    | Generic    | /tools/ai-picture-upscaler               |
| enhance picture quality free | Low (32)    | Free       | /free/free-picture-enhancer              |

### 5.2 Tier 3 Content Requirements

| Section           | Min Words | Requirements               |
| ----------------- | --------- | -------------------------- |
| Introduction      | 100       | Quick value prop           |
| Main Content      | 400       | Focused on specific intent |
| How To / Steps    | 150       | 3-4 steps                  |
| FAQ               | 200       | 4-5 questions              |
| **Total Minimum** | **850**   |                            |

---

## 6. Trending Keywords (Growth Opportunities)

### 6.1 Keywords with +900% YoY Growth

| Keyword                     | Current Volume | Growth | Priority | Opportunity                     |
| --------------------------- | -------------- | ------ | -------- | ------------------------------- |
| image upscaler              | 500,000        | +900%  | Critical | Massive growth, low competition |
| upscaler                    | 500,000        | +900%  | Critical | Generic term, capture early     |
| ai image enlarger           | 50,000         | +900%  | High     | Feature-specific growth         |
| ai image upscaler 4k        | 5,000          | +900%  | High     | Resolution-specific             |
| best free ai photo enhancer | 5,000          | +900%  | High     | High-intent free seekers        |
| ai enhance image quality    | 5,000          | +900%  | High     | Quality-focused                 |
| resolution enhancer free    | 5,000          | +900%  | Medium   | Free intent                     |
| hd image upscaler           | 500            | +900%  | Medium   | Lower volume but growing        |
| online ai image upscaler    | 500            | +900%  | Medium   | Online platform preference      |
| ai picture upscaling        | 5,000          | +900%  | Medium   | Gerund variation                |

### 6.2 Trending Keyword Strategy

1. **Create dedicated pages immediately** for all +900% growth keywords
2. **Monitor weekly** for continued growth
3. **Expand content** as volume increases
4. **Target featured snippets** for informational queries
5. **Build backlinks** to trending topic pages

---

## 7. Keyword-to-Page Mapping

### 7.1 Canonical Page Assignments

Each keyword maps to exactly ONE canonical page to avoid keyword cannibalization.

```yaml
# /tools/ai-image-upscaler (Primary upscaler page)
primary_keyword: "ai image upscaler"
secondary_keywords:
  - "image upscaler"
  - "ai upscale"
  - "upscaler"
  - "ai upscale image"
  - "upscale image ai"
  - "image upscaler ai"
  - "upscale ai"

# /tools/ai-photo-enhancer (Primary enhancer page)
primary_keyword: "ai photo enhancer"
secondary_keywords:
  - "photo enhancer ai"
  - "ai enhance photo"
  - "photo ai enhancer"
  - "enhance photo ai"
  - "ai photo enhance"

# /free/free-image-upscaler (Free tool page)
primary_keyword: "free image upscaler"
secondary_keywords:
  - "image upscaler free"
  - "upscale image free"
  - "free upscale image"
  - "online image upscaler free"
  - "image upscaler online free"

# /scale/upscale-to-4k (4K resolution page)
primary_keyword: "upscale to 4k"
secondary_keywords:
  - "image upscaler 4k"
  - "4k image upscaler"
  - "ai image upscaler 4k"
  - "upscale image to 4k"
  - "4k upscaler"

# /compare/best-ai-upscalers (Comparison page)
primary_keyword: "best ai upscaler"
secondary_keywords:
  - "best ai image upscaler"
  - "best image upscaler"
  - "top ai upscalers"
  - "best upscaler"
```

### 7.2 Cannibalization Prevention Rules

1. **One primary keyword per page** - No two pages target the same primary
2. **Secondary keywords don't overlap** between pages of same category
3. **Cross-category is OK** - `/tools/` and `/free/` can share some secondaries
4. **Monitor Search Console** - Check for pages competing for same queries
5. **Consolidate if needed** - Merge underperforming pages

---

## 8. Content Gap Analysis

### 8.1 Competitor Content Gaps

| Gap                       | Competitor Coverage | Our Opportunity       |
| ------------------------- | ------------------- | --------------------- |
| WebP upscaling            | None                | First-mover advantage |
| AVIF format               | None                | Emerging format       |
| RAW photo enhancement     | Topaz only          | Professional market   |
| HEIC conversion + upscale | Limited             | iOS user market       |
| Batch processing guides   | Limited             | E-commerce focus      |
| API documentation         | VanceAI only        | Developer market      |
| Print-ready upscaling     | None                | Photography market    |
| Game asset upscaling      | None                | Gaming market         |
| Medical imaging           | None                | Professional niche    |

### 8.2 Content Opportunities by Category

| Category         | # Pages | Content Focus             | Unique Angle                    |
| ---------------- | ------- | ------------------------- | ------------------------------- |
| **Formats**      | 8       | Format-specific upscaling | Technical depth + compatibility |
| **Scale**        | 7       | Resolution targets        | Use case + quality examples     |
| **Use Cases**    | 10      | Industry verticals        | ROI + workflow integration      |
| **Compare**      | 15      | Tool comparisons          | Honest + comprehensive          |
| **Alternatives** | 10      | Competitor alternatives   | Better option positioning       |
| **Guides**       | 20      | Educational content       | Step-by-step + expert tips      |

---

## 9. Keyword Tracking Setup

### 9.1 Tools & Configuration

| Tool                      | Purpose               | Configuration                 |
| ------------------------- | --------------------- | ----------------------------- |
| **Google Search Console** | Ranking + impressions | Verify domain, submit sitemap |
| **Amplitude**             | Conversion tracking   | Track signup by landing page  |
| **Custom Dashboard**      | Keyword position      | Weekly scraping (ethical)     |

### 9.2 Tracking Spreadsheet Structure

```
| Keyword | Volume | Page | Current Rank | Target Rank | Traffic | Conversions |
|---------|--------|------|--------------|-------------|---------|-------------|
| ai image upscaler | 500K | /tools/ai-image-upscaler | - | Top 5 | 0 | 0 |
```

### 9.3 Review Cadence

| Timeframe     | Actions                              |
| ------------- | ------------------------------------ |
| **Daily**     | Monitor for major ranking drops      |
| **Weekly**    | Update ranking positions, traffic    |
| **Monthly**   | Conversion analysis, content updates |
| **Quarterly** | Full keyword strategy review         |

---

## 10. Content Production Pipeline

### 10.1 Writing Process

```mermaid
flowchart LR
    A[Keyword Assignment] --> B[Research & Outline]
    B --> C[First Draft]
    C --> D[SEO Review]
    D --> E[Edit & Optimize]
    E --> F[Add Media]
    F --> G[Technical Review]
    G --> H[Publish]
    H --> I[Index & Monitor]
```

### 10.2 Quality Checklist

Before publishing any pSEO content:

- [ ] Primary keyword in H1, first paragraph, meta title
- [ ] Secondary keywords distributed naturally (1-2% density)
- [ ] Unique content (not duplicated from other pages)
- [ ] Minimum word count met for tier
- [ ] FAQ section with schema markup
- [ ] Internal links to 3+ related pages
- [ ] External links to 1-2 authoritative sources
- [ ] Images with descriptive alt text
- [ ] Clear CTAs above and below fold
- [ ] Mobile-friendly formatting

---

## 11. Implementation Checklist

### Phase 1 (Weeks 1-2)

- [ ] Import and validate keyword CSV data
- [ ] Create keyword-to-page mapping document
- [ ] Set up tracking spreadsheet
- [ ] Write content for Tier 1 keywords (15 pages)
- [ ] Implement canonical URL strategy

### Phase 2 (Weeks 3-4)

- [ ] Write content for Tier 2 keywords (35 pages)
- [ ] Create format-specific pages (8)
- [ ] Create scale-specific pages (7)
- [ ] Internal linking audit

### Phase 3 (Weeks 5-8)

- [ ] Write Tier 3 content (50+ pages)
- [ ] Expand FAQ sections
- [ ] Add comparison tables
- [ ] Build first backlinks

### Phase 4 (Weeks 9-12)

- [ ] Long-tail keyword expansion
- [ ] Content refresh based on performance
- [ ] A/B test headlines and CTAs
- [ ] Quarterly strategy review

---

## Appendix A: Full Keyword List Export

See `/app/seo/keywords.csv` for complete keyword data including:

- Keyword
- Currency (CAD)
- Avg. monthly searches
- Three month change
- YoY change
- Competition
- Competition (indexed value)
- Top of page bid (low range)
- Top of page bid (high range)
- Monthly search trends (Nov 2024 - Oct 2025)

---

## Document Changelog

| Version | Date       | Author           | Changes                                               |
| ------- | ---------- | ---------------- | ----------------------------------------------------- |
| 1.0     | 2025-12-01 | Development Team | Initial keyword strategy                              |
| 1.1     | 2025-12-01 | Development Team | Implemented: keyword types, mappings, tiers, tracking |

## Implementation Summary

### Created Infrastructure (2025-12-01)

1. **Type Definitions** (`lib/seo/types.ts`)
   - IKeyword interface for keyword data
   - IKeywordTier for volume tier classification
   - IKeywordIntent for intent classification
   - IKeywordPageMapping for canonical URL assignments
   - IPageTemplate for page generation

2. **Keyword Mappings** (`lib/seo/keyword-mappings.ts`)
   - 20+ canonical page mappings
   - Primary and secondary keyword assignments
   - Content requirements per page
   - Helper functions for querying mappings

3. **Tier System** (`lib/seo/keyword-tiers.ts`)
   - 5-tier volume classification
   - Word count requirements per tier
   - Helper functions for tier lookup

4. **Tracking System** (`lib/seo/tracking.ts`)
   - KeywordTracker class for monitoring
   - Performance tracking interfaces
   - Review cadence definitions
   - CSV export functionality

5. **Module Exports** (`lib/seo/index.ts`)
   - Centralized exports for all SEO functionality

### Data Sources Validated

- ✅ `/app/seo/keywords.csv` - 1,340 keywords (UTF-16 encoded)
- ✅ `/app/seo/top_keywords.csv` - 103 top keywords (UTF-16 encoded)

### Next Steps

- Proceed to PRD-PSEO-02: URL Architecture
- Begin implementing dynamic routes for mapped pages
- Set up sitemap generation
