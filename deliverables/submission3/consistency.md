consistency.md  
Netflix Clone (React/TypeScript + Node/Express + MongoDB)

## 1. Consistency Overview
- Strong consistency for auth/subscription/payment updates; eventual for TMDB metadata, notifications, analytics.
- Sources of truth: Mongo collections `users`, `userpreferences`, `watchhistories`, `notifications`.
- TMDB metadata is read-only, fetched at runtime (not persisted).

## 2. Current State
- No message queue/outbox in production; synchronous REST.
- Frontend caches with RTK Query; sessionStorage stores JWT per tab.
- Mongo unique/indexes enforce some integrity (e.g., watch history compound unique).

## 3. Patterns (planned/optional)
- **Outbox (future)**: ensure DB + event publishing are atomic; worker polls and dispatches (at-least-once).  
  - Schema: `eventType, payload, status(pending|processed|failed), retryCount, createdAt`.  
  - Idempotent handlers; DLQ for failures.  
- **Saga (future)**: orchestrate multi-step flows (payment → subscription pending → admin approve).  
  - Compensating actions: mark payment failed, set subscription inactive.  

## 4. Idempotency
- Use unique constraints where possible: watch history (`userId, movieId, mediaType`), preferences per user.
- If adding outbox: use `eventId` and idempotent consumers; for notifications, store `eventId` to prevent duplicates.
- API mutations should be safe to retry when feasible (upsert patterns for history/preferences).

## 5. Transactions
- Mongo sessions for critical writes (if/when combining multiple writes): e.g., payment record + subscription update + outbox insert.
- Keep transactions short; do not include external calls inside the transaction.

## 6. Data Domains & Consistency
- Auth/Subscription: strong (single write path, admin updates). Frontend gating: block watch unless `subscriptionStatus === "active"`.
- Preferences: strong via direct Mongo writes; RTK Query invalidation after toggle.
- Watch history: upsert progress; uniqueness prevents duplicates; acceptable slight delays for continue-watching lists.
- Notifications: eventual; stored in Mongo; can be delivered async if a worker is added.
- TMDB: eventual; TTL cache if added; runtime fetch now.

## 7. Invalidation & Freshness
- RTK Query handles re-fetch after mutations (preferences/history/subscription changes).
- If Redis cache added for TMDB/popular/config/genres: TTL-based; no manual invalidation normally.

## 8. Failure Handling (future outbox/worker)
- Retry with exponential backoff; max retries then mark failed/DLQ.
- Idempotent consumers; dedupe by eventId.
- Monitoring: count pending/failed; alert on backlog/oldest pending age.

## 9. Testing Consistency (examples to keep in mind)
- Transaction rollback test: ensure no partial writes when error occurs mid-transaction.
- Idempotency test: same mutation/event delivered twice should not duplicate records.

## 10. Risks & Mitigations
- No queue/outbox today → notifications/events may be lost if added naively. Mitigate by introducing outbox before heavy async features.
- Multi-tab divergence (sessionStorage per tab) → re-login or re-fetch `auth/me` as needed.
- TMDB dependency/quota → consider backend proxy + cache if rate limits hit.  
consistency.md
StreamVerse - Netflix Clone

TABLE OF CONTENTS

Consistency Overview
Outbox Pattern Implementation
Saga Pattern for Workflows
Idempotency Mechanisms
Transaction Management
Consistency Guarantees

1. Consistency Overview
1.1 The Consistency Challenge
In distributed systems, maintaining data consistency is challenging:
Problems:

- Database update succeeds, but event publishing fails
- Event published, but consumer crashes before processing
- Duplicate events processed multiple times
- Multi-step workflows fail halfway through

Our Solutions:


+ Outbox Pattern: Atomic database + event publishing
+ Saga Pattern: Coordinated multi-step workflows
+ Idempotency: Safe duplicate event handling
+ Transaction Management: ACID guarantees in MongoDB

1.2 Consistency Models

MODEL                       GUARANTEE       TRADE-OFF                   USE CASE
Strong Consistency          Immediate       Slower, less available      Payment processing
Eventual Consistency        Delayed         Faster, highly available    Notifications, analytics
Causal Consistency          Ordered         Moderate complexity         Watch history

--------------------------------------------------------------------
netflix Strategy:

Critical operations (payments, subscriptions): Strong consistency
Background tasks (notifications, analytics): Eventual consistency


2. Outbox Pattern Implementation
2.1 What is Outbox Pattern?

Problem:
```
// WRONG: Two separate operations
await User.create(userData);           // Could succeed
await eventQueue.publish('UserRegistered');  // Could fail
// Result: Data saved but no event → inconsistency

Solution:
```
// CORRECT: Single transaction
const session = await mongoose.startSession();
session.startTransaction();
try {
  await User.create([userData], { session });
  await Outbox.create([event], { session });  // Same transaction
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
}
// Result: Both succeed or both fail → consistency
```

2.2 Outbox Schema

```
// models/Outbox.js
const mongoose = require('mongoose');

const outboxSchema = new mongoose.Schema({
  eventId: {
    type: String,
    unique: true,
    required: true
  },
  eventType: {
    type: String,
    required: true,
    index: true,
    enum: [
      'UserRegistered',
      'PaymentCompleted',
      'MovieAdded',
      'MovieUpdated',
      'MovieDeleted',
      'MovieWatched'
    ]
  },
  aggregateId: {
    type: String,
    required: true,
    index: true
  },
  payload: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processed', 'failed'],
    default: 'pending',
    index: true
  },
  retryCount: {
    type: Number,
    default: 0
  },
  error: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  processedAt: {
    type: Date
  },
  nextRetryAt: {
    type: Date
  }
});

// Compound index for efficient polling
outboxSchema.index({ status: 1, createdAt: 1 });

module.exports = mongoose.model('Outbox', outboxSchema);
```

2.3 Outbox Publishing Flow

```
sequenceDiagram
    participant API as API Controller
    participant DB as MongoDB
    participant OB as Outbox Table
    participant Worker as Outbox Worker
    participant Handler as Event Handler

    API->>DB: Start Transaction
    API->>DB: Insert/Update Entity
    API->>OB: Insert Event (status=pending)
    DB-->>API: Transaction Commit
    
    Note over Worker: Polling every 5 seconds
    
    Worker->>OB: Query pending events
    OB-->>Worker: Return events
    
    Worker->>Handler: Process event
    Handler-->>Worker: Success
    Worker->>OB: Update status=processed
```

2.4 Outbox Processor Implementation

```
// workers/outboxProcessor.js
const Outbox = require('../models/Outbox');
const eventHandlers = require('./eventHandlers');

class OutboxProcessor {
  constructor(config = {}) {
    this.pollingInterval = config.pollingInterval || 5000; // 5 sec
    this.batchSize = config.batchSize || 100;
    this.maxRetries = config.maxRetries || 3;
    this.isRunning = false;
  }

  async start() {
    this.isRunning = true;
    console.log('[Outbox] Processor started');

    while (this.isRunning) {
      try {
        await this.processBatch();
      } catch (error) {
        console.error('[Outbox] Batch error:', error);
      }
      await this.sleep(this.pollingInterval);
    }
  }

  async processBatch() {
    // Fetch pending or retryable events
    const now = new Date();
    const events = await Outbox.find({
      $or: [
        { status: 'pending' },
        { 
          status: 'pending', 
          nextRetryAt: { $lte: now },
          retryCount: { $lt: this.maxRetries }
        }
      ]
    })
    .sort({ createdAt: 1 })
    .limit(this.batchSize);

    if (events.length === 0) return;

    console.log(`[Outbox] Processing ${events.length} events`);

    // Process events sequentially to maintain order
    for (const event of events) {
      await this.processEvent(event);
    }
  }

  async processEvent(event) {
    const startTime = Date.now();

    try {
      const handler = eventHandlers[event.eventType];

      if (!handler) {
        console.warn(`[Outbox] No handler for: ${event.eventType}`);
        await this.markAsProcessed(event._id, 'no_handler');
        return;
      }

      // Execute handler
      await handler(event.payload);

      // Mark as processed
      await this.markAsProcessed(event._id);

      const duration = Date.now() - startTime;
      console.log(`[Outbox] ✓ ${event.eventType} (${duration}ms)`);
    } catch (error) {
      console.error(`[Outbox] ✗ ${event.eventType}:`, error.message);
      await this.handleFailure(event, error);
    }
  }

  async markAsProcessed(eventId, reason = null) {
    await Outbox.findByIdAndUpdate(eventId, {
      status: 'processed',
      processedAt: new Date(),
      error: reason
    });
  }

  async handleFailure(event, error) {
    const retryCount = event.retryCount + 1;

    if (retryCount >= this.maxRetries) {
      // Move to DLQ (dead letter queue)
      await Outbox.findByIdAndUpdate(event._id, {
        status: 'failed',
        retryCount,
        error: error.message,
        processedAt: new Date()
      });
      console.error(`[Outbox] Failed permanently: ${event.eventId}`);
    } else {
      // Schedule retry with exponential backoff
      const delay = Math.pow(2, retryCount) * 1000; // 2s, 4s, 8s
      const nextRetryAt = new Date(Date.now() + delay);

      await Outbox.findByIdAndUpdate(event._id, {
        retryCount,
        nextRetryAt,
        error: error.message
      });
      console.log(`[Outbox] Retry ${retryCount}/${this.maxRetries} in ${delay}ms`);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  stop() {
    this.isRunning = false;
    console.log('[Outbox] Processor stopped');
  }
}

module.exports = OutboxProcessor;
```

2.5 Starting Outbox Worker

```
// server.js or separate worker.js
const OutboxProcessor = require('./workers/outboxProcessor');

const processor = new OutboxProcessor({
  pollingInterval: 5000,  // 5 seconds
  batchSize: 100,
  maxRetries: 3
});

processor.start();

// Graceful shutdown
process.on('SIGINT', () => {
  processor.stop();
  process.exit(0);
});
```

3. Saga Pattern for Workflows
3.1 What is Saga Pattern?

Saga: A sequence of local transactions, each with a compensating action.

Use Case: Payment Processing Workflow

1. Charge Payment Card
2. Activate User Subscription
3. Send Confirmation Email
4. Update Analytics

If step 3 fails:
→ Compensate: Deactivate subscription
→ Compensate: Refund payment

3.2 Payment Saga Implementation

```
// sagas/paymentSaga.js
const Payment = require('../models/Payment');
const User = require('../models/User');
const notificationService = require('../services/notificationService');
const eventService = require('../services/eventService');

class PaymentSaga {
  async execute(userId, planData) {
    const sagaId = `saga_${Date.now()}`;
    const context = { userId, planData, sagaId };

    try {
      // Step 1: Create payment record
      await this.createPayment(context);

      // Step 2: Activate subscription
      await this.activateSubscription(context);

      // Step 3: Send confirmation
      await this.sendConfirmation(context);

      // Step 4: Publish success event
      await this.publishSuccess(context);

      console.log(`[Saga] ${sagaId} completed successfully`);
      return { success: true, paymentId: context.paymentId };
    } catch (error) {
      console.error(`[Saga] ${sagaId} failed:`, error);
      await this.compensate(context, error);
      throw error;
    }
  }

  async createPayment(context) {
    console.log(`[Saga] Step 1: Create payment`);
    const payment = await Payment.create({
      userId: context.userId,
      plan: context.planData.plan,
      amount: context.planData.amount,
      status: 'pending'
    });
    context.paymentId = payment._id.toString();
    context.step = 1;
  }

  async activateSubscription(context) {
    console.log(`[Saga] Step 2: Activate subscription`);
    await User.findByIdAndUpdate(context.userId, {
      subscriptionStatus: 'active',
      subscriptionPlan: context.planData.plan,
      subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    });
    context.step = 2;
  }

  async sendConfirmation(context) {
    console.log(`[Saga] Step 3: Send confirmation`);
    await notificationService.create({
      userId: context.userId,
      type: 'payment',
      title: 'Payment Successful',
      message: `Your ${context.planData.plan} subscription is now active!`
    });
    context.step = 3;
  }

  async publishSuccess(context) {
    console.log(`[Saga] Step 4: Publish event`);
    await eventService.publish(
      'PaymentCompleted',
      context.paymentId,
      {
        userId: context.userId,
        plan: context.planData.plan,
        amount: context.planData.amount
      }
    );
    context.step = 4;
  }

  async compensate(context, error) {
    console.log(`[Saga] Compensating from step ${context.step}`);

    // Compensate in reverse order
    if (context.step >= 2) {
      await this.deactivateSubscription(context);
    }

    if (context.step >= 1) {
      await this.markPaymentFailed(context, error);
    }

    console.log(`[Saga] Compensation completed`);
  }

  async deactivateSubscription(context) {
    console.log(`[Saga] Compensate: Deactivate subscription`);
    await User.findByIdAndUpdate(context.userId, {
      subscriptionStatus: 'inactive',
      subscriptionPlan: null
    });
  }

  async markPaymentFailed(context, error) {
    console.log(`[Saga] Compensate: Mark payment as failed`);
    if (context.paymentId) {
      await Payment.findByIdAndUpdate(context.paymentId, {
        status: 'failed',
        error: error.message
      });
    }
  }
}

module.exports = new PaymentSaga();
```

3.3 Using the Saga

```
// controllers/paymentController.js
const paymentSaga = require('../sagas/paymentSaga');

exports.processPayment = async (req, res) => {
  try {
    const result = await paymentSaga.execute(req.user.id, {
      plan: req.body.plan,
      amount: req.body.amount
    });

    res.json({ 
      success: true, 
      message: 'Payment processed successfully',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Payment processing failed',
      error: error.message
    });
  }
};
```

3.4 Saga State Diagram
┌─────────────┐
│   Start     │
└──────┬──────┘
       │
       ▼
┌─────────────────┐      ┌──────────────────┐
│ Create Payment  │─────>│ Payment Created  │
└─────────┬───────┘      └──────────────────┘
          │
          ▼
┌──────────────────┐     ┌──────────────────┐
│Activate Subscription│──>│Subscription Active│
└─────────┬────────┘     └──────────────────┘
          │
          ▼
┌──────────────────┐     ┌──────────────────┐
│Send Confirmation │─────>│  Email Sent      │
└─────────┬────────┘     └──────────────────┘
          │
          ▼
┌──────────────────┐
│ Publish Event    │
└─────────┬────────┘
          │
          ▼
┌──────────────────┐
│    Complete      │
└──────────────────┘

[On Failure at any step]
          │
          ▼
┌──────────────────┐
│   Compensate     │ (rollback previous steps)
└──────────────────┘

4. Idempotency Mechanisms
4.1 Why Idempotency Matters

Problem: Event processed twice due to:

Worker crash after processing but before marking as processed
Network retry
Duplicate events in queue

Solution: Make handlers idempotent (same result if called multiple times)

4.2 Idempotency Strategies

Strategy 1: Unique Constraint (Database)

```
// models/Notification.js
const notificationSchema = new mongoose.Schema({
  eventId: {
    type: String,
    unique: true,  // Prevents duplicates
    sparse: true   // Allows null
  },
  userId: {
    type: String,
    required: true
  },
  title: String,
  message: String
});

// Compound unique index
notificationSchema.index({ eventId: 1, userId: 1 }, { unique: true });
```

Handler Implementation:
```
async function handleUserRegistered(payload) {
  const { userId, email, eventId } = payload;

  try {
    // Try to create notification with eventId
    await Notification.create({
      eventId,  // Will fail if duplicate
      userId,
      type: 'info',
      title: 'Welcome!',
      message: `Welcome to netflix, ${email}!`
    });
    console.log(`Notification created for event ${eventId}`);
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error - already processed
      console.log(`Notification already exists for event ${eventId}`);
      return; // Idempotent - no error thrown
    }
    throw error; // Other errors should be retried
  }
}
```

Strategy 2: Check-Then-Act
```
async function handlePaymentCompleted(payload) {
  const { userId, transactionId } = payload;

  // Check if already processed
  const existing = await Notification.findOne({
    userId,
    'metadata.transactionId': transactionId
  });

  if (existing) {
    console.log(`Payment notification already sent for ${transactionId}`);
    return; // Idempotent
  }

  // Create notification
  await Notification.create({
    userId,
    type: 'payment',
    title: 'Payment Successful',
    message: 'Your subscription is now active',
    metadata: { transactionId }
  });
}
```

Strategy 3: Idempotency Key Header (API)
```
// middleware/idempotency.js
const IdempotencyRecord = require('../models/IdempotencyRecord');

exports.checkIdempotency = async (req, res, next) => {
  const idempotencyKey = req.headers['idempotency-key'];

  if (!idempotencyKey) {
    return next(); // No key provided, proceed normally
  }

  // Check if request with this key was already processed
  const existing = await IdempotencyRecord.findOne({ key: idempotencyKey });

  if (existing) {
    // Return cached response
    return res.status(existing.statusCode).json(existing.response);
  }

  // Store original res.json
  const originalJson = res.json.bind(res);

  // Override res.json to cache response
  res.json = async function(data) {
    // Cache the response
    await IdempotencyRecord.create({
      key: idempotencyKey,
      statusCode: res.statusCode,
      response: data,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });

    // Send response
    return originalJson(data);
  };

  next();
};
```

Usage:
```
router.post('/payment', 
  auth.protect, 
  idempotency.checkIdempotency,  // Add middleware
  paymentController.create
);
```

4.3 Idempotency Model

```
// models/IdempotencyRecord.js
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  key: {
    type: String,
    unique: true,
    required: true
  },
  statusCode: Number,
  response: mongoose.Schema.Types.Mixed,
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // TTL: 24 hours
  }
});

module.exports = mongoose.model('IdempotencyRecord', schema);
```

5. Transaction Management
5.1 MongoDB Transactions

Requirements:

MongoDB 4.0+ with replica set
Use session parameter

```
const mongoose = require('mongoose');

async function performTransactionalOperation() {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // All operations within transaction
    const user = await User.create([{
      email: 'user@example.com',
      password: 'hashed'
    }], { session });

    await Outbox.create([{
      eventType: 'UserRegistered',
      aggregateId: user[0]._id,
      payload: { userId: user[0]._id }
    }], { session });

    // Commit transaction
    await session.commitTransaction();
    console.log('Transaction committed');
  } catch (error) {
    // Rollback on error
    await session.abortTransaction();
    console.error('Transaction aborted:', error);
    throw error;
  } finally {
    session.endSession();
  }
}
```

5.2 Transaction Best Practices
Do:

    Keep transactions short
    Use for critical consistency (payments, subscriptions)
    Always use try-catch-finally
    End session in finally block

Don't:

    Include external API calls in transactions
    Hold transactions open for user input
    Nest transactions
    Forget to commit or abort


6. Consistency Guarantees
6.1 Guarantee Levels

OPERATION                        CONSISTENCY LEVEL          MECHANISM
User Registration                     Strong                Transaction + Outbox
Payment Processing                    Strong                Saga + Transaction
Watch History Update                 Eventual               Async event
Cache Invalidation                   Eventual               Event-driven
Notification Delivery                Eventual               Outbox pattern

6.2 Testing Consistency

```
// tests/consistency.test.js
const mongoose = require('mongoose');
const User = require('../models/User');
const Outbox = require('../models/Outbox');

describe('Consistency Tests', () => {
  it('should rollback on failure', async () => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Create user
      await User.create([{ email: 'test@example.com' }], { session });

      // Simulate error in event creation
      throw new Error('Simulated failure');

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
    } finally {
      session.endSession();
    }

    // Verify user was NOT created
    const user = await User.findOne({ email: 'test@example.com' });
    expect(user).toBeNull();
  });
});
```