# Systems Documentation

Detailed documentation for PixelPerfect's subsystems.

## Overview

```mermaid
graph TB
    subgraph "Core Systems"
        AUTH[Authentication]
        PROCESS[Image Processing]
        BILLING[Billing]
        CREDITS[Credits]
    end

    subgraph "Infrastructure"
        RATE[Rate Limiting]
        ERRORS[Error Handling]
    end

    AUTH --> PROCESS
    CREDITS --> PROCESS
    BILLING --> CREDITS
    RATE --> PROCESS
    ERRORS --> PROCESS
```

## System Documents

| Document                                     | Description                                 |
| -------------------------------------------- | ------------------------------------------- |
| [authentication.md](./authentication.md)     | User auth, OAuth, session management        |
| [image-processing.md](./image-processing.md) | AI processing flow, prompts, validation     |
| [billing.md](./billing.md)                   | Stripe integration, subscriptions, webhooks |
| [credits.md](./credits.md)                   | Credit system, transactions, rollover       |
| [rate-limiting.md](./rate-limiting.md)       | Request throttling, tier limits             |
| [error-handling.md](./error-handling.md)     | Error codes, recovery, logging              |

## System Interactions

```mermaid
sequenceDiagram
    participant User
    participant Auth as Authentication
    participant Rate as Rate Limiting
    participant Credits as Credit System
    participant Process as Image Processing
    participant Billing

    User->>Auth: Login
    Auth-->>User: Session Token

    User->>Rate: API Request
    Rate->>Auth: Verify Token
    Auth-->>Rate: User Context

    Rate->>Credits: Check Balance
    Credits-->>Rate: Balance OK

    Rate->>Process: Process Image
    Process->>Credits: Deduct Credit
    Process-->>User: Result

    Note over User,Billing: Upgrade Flow

    User->>Billing: Purchase Plan
    Billing->>Credits: Add Credits
```

## Key Principles

1. **Stateless Processing**: Images are processed in memory, not stored
2. **Credit-First**: Always verify credits before processing
3. **Graceful Degradation**: Fallback providers for AI failures
4. **Atomic Operations**: Credit deductions are transactional
5. **User-Centric Errors**: Clear, actionable error messages
