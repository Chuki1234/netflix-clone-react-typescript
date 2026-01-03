events.md  
Netflix Clone (React/TS + Node/Express + MongoDB)

## 1. Overview
- Current system is synchronous REST; no queue/outbox yet.
- Events are conceptual for audit/notify; notifications are stored in DB only.
- If needed later: add outbox + worker or broker (Kafka/RabbitMQ).

## 2. Event Catalogue (suggested, logical)
- **Auth**: `user.registered`, `user.logged_in`.
- **Subscription/Payment**: `subscription.payment_submitted (pending)`, `subscription.approved`, `subscription.rejected`, `subscription.cancelled`, `subscription.changed_plan`.
- **Preferences**: `preferences.mylist_toggled`, `preferences.like_toggled`.
- **Watch History**: `watch.progress_saved`, `watch.completed`, `watch.deleted`.
- **Notifications**: `notification.created`, `notification.read`.
- **Admin**: `admin.subscription_action` (approve/reject/cancel/update).

## 3. Event Envelope (if implemented)
```json
{
  "eventId": "uuid",
  "eventType": "subscription.approved",
  "timestamp": "ISO-8601",
  "correlationId": "request-id",
  "data": { "userId": "...", "plan": "Premium", "status": "active" },
  "metadata": { "source": "api|worker", "env": "prod|dev" }
}
```

## 4. Current Implementation
- No outbox/queue; notifications stored in Mongo (type/title/message/metadata/isRead).
- Admin approval via REST; frontend re-fetches to update state.

## 5. If Adding Outbox/Worker (minimal)
- Outbox schema: `eventType, payload, status (pending|processed|failed), retryCount, createdAt`.
- Worker polls, publishes (or handles directly), idempotent via `eventId`.
- No compensation needed for notify; ensure idempotency for subscription/preferences/history updates.

## 6. Possible Consumers (future)
- Notifications: create notification, maybe push/email.
- Cache invalidation: delete keys when movie/user data changes.
- Analytics/Recommendations: consume `watch.progress_saved`, `watch.completed`.

## 7. Error Handling
- Retry with backoff; DLQ for failed events.
- Idempotent handlers (by eventId).

## 8. Out of Scope
- No event sourcing, no CQRS, no queue gateway today. This is a light proposal to extend later.
events.md
StreamVerse - Netflix Clone

TABLE OF CONTENTS
Event Architecture Overview
Event Catalog
Event Schema & Contracts
Event Publishing
Event Consumption
Retry & Error Handling
Event Monitoring

1. Event Architecture Overview
1.1 Why Event-Driven Architecture?

Benefits:

+ Decoupling: Services don't need to know about each other
+ Scalability: Async processing prevents blocking
+ Reliability: Outbox pattern ensures delivery
+ Audit Trail: Events serve as system history
+ Future Extensibility: Easy to add new consumers

Use Cases in StreamVerse:

User registration → Send welcome notification
Payment completed → Activate subscription + Send receipt
Movie watched → Update analytics + Recommendations
Admin content update → Invalidate cache + Notify users

1.2 Event Flow Architecture
┌──────────────────────────────────────────────────────────┐
│                    Event Flow                             │
│                                                           │
│  ┌─────────────┐         ┌──────────────┐               │
│  │  Controller │────────>│ Event Service│               │
│  │   (API)     │         │  (Publisher) │               │
│  └─────────────┘         └───────┬──────┘               │
│                                   │                       │
│                          ┌────────▼────────┐             │
│                          │  Outbox Table   │             │
│                          │   (MongoDB)     │             │
│                          └────────┬────────┘             │
│                                   │                       │
│                          ┌────────▼────────┐             │
│                          │ Outbox Worker   │             │
│                          │  (Polling)      │             │
│                          └────────┬────────┘             │
│                                   │                       │
│                          ┌────────▼────────┐             │
│                          │  Event Handler  │             │
│                          │   (Consumer)    │             │
│                          └────────┬────────┘             │
│                                   │                       │
│                    ┌──────────────┼──────────────┐       │
│                    │              │              │       │
│            ┌───────▼──────┐ ┌────▼─────┐ ┌─────▼─────┐ │
│            │ Notification │ │Analytics │ │   Cache   │ │
│            │   Service    │ │ Service  │ │Invalidator│ │
│            └──────────────┘ └──────────┘ └───────────┘ │
└──────────────────────────────────────────────────────────┘

1.3 Event Processing Patterns

Pattern 1: Fire-and-Forget (Notifications)

User Action → Publish Event → Continue
                   ↓
            [Background Processing]
                   ↓
            Send Notification

Pattern 2: Saga (Multi-Step Transaction)

Payment Request → 1. Charge Card
                  2. Activate Subscription
                  3. Send Confirmation
                  4. Update Analytics

2. Event Catalog
2.1 User Domain Events

UserRegistered
Trigger: New user account created
Publisher: authController.register()
Consumers:

Notification Service (send welcome email)
Analytics Service (track signups)

Payload:
```
{
  "eventType": "UserRegistered",
  "aggregateId": "507f1f77bcf86cd799439011",
  "timestamp": "2024-12-31T12:00:00.000Z",
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "role": "user",
    "registrationSource": "web"
  }
}
```

UserDeleted
Trigger: User account deleted by admin
Publisher: adminController.deleteUser()
Consumers:

Cleanup Service (remove watch history, preferences)
Notification Service (send goodbye email)


2.2 Payment Domain Events

PaymentCompleted
Trigger: Successful payment transaction
Publisher: paymentController.processPayment()
Consumers:

Subscription Service (activate plan)
Notification Service (send receipt)
Analytics Service (track revenue)

Payload:
```
{
  "eventType": "PaymentCompleted",
  "aggregateId": "txn_abc123",
  "timestamp": "2024-12-31T12:00:00.000Z",
  "data": {
    "transactionId": "txn_abc123",
    "userId": "507f1f77bcf86cd799439011",
    "plan": "premium",
    "amount": 99900,
    "currency": "VND",
    "paymentMethod": "credit_card"
  }
}
```

PaymentFailed

Trigger: Payment transaction failed
Publisher: paymentController.processPayment()
Consumers:

Notification Service (alert user)
Support Service (flag for review)


2.3 Content Domain Events

MovieAdded
Trigger: New movie added to catalog
Publisher: adminController.createMovie()
Consumers:

Cache Service (warm cache)
Notification Service (notify interested users)
Recommendation Service (update model)

Payload:
```
{
  "eventType": "MovieAdded",
  "aggregateId": "507f1f77bcf86cd799439011",
  "timestamp": "2024-12-31T12:00:00.000Z",
  "data": {
    "movieId": "507f1f77bcf86cd799439011",
    "title": "Inception",
    "genres": ["Action", "Sci-Fi"],
    "releaseYear": 2010,
    "addedBy": "admin_user_id"
  }
}
```

MovieUpdated
Trigger: Movie metadata updated
Publisher: adminController.updateMovie()
Consumers:

Cache Service (invalidate cache)

MovieDeleted
Trigger: Movie removed from catalog
Publisher: adminController.deleteMovie()
Consumers:

Cache Service (invalidate cache)
Cleanup Service (remove watch history)


2.4 Watch History Events

MovieWatched
Trigger: User watches movie (progress updated)
Publisher: watchHistoryController.updateProgress()
Consumers:

Analytics Service (track views)
Recommendation Service (update preferences)

Payload:
```
{
  "eventType": "MovieWatched",
  "aggregateId": "watch_session_123",
  "timestamp": "2024-12-31T12:00:00.000Z",
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "movieId": "507f1f77bcf86cd799439011",
    "progress": 1800,
    "duration": 7200,
    "completed": false,
    "deviceType": "web"
  }
}

MovieCompleted
Trigger: User finishes watching movie
Publisher: watchHistoryController.updateProgress()
Consumers:

Achievement Service (award badges)
Recommendation Service (suggest similar)


3. Event Schema & Contracts
3.1 Standard Event Envelope

All events follow this structure:
```
{
  "eventId": "uuid-v4",
  "eventType": "EventName",
  "eventVersion": "1.0",
  "aggregateId": "entity-id",
  "aggregateType": "User|Movie|Payment|etc",
  "timestamp": "ISO-8601 datetime",
  "correlationId": "request-trace-id",
  "causationId": "parent-event-id",
  "metadata": {
    "userId": "who triggered",
    "source": "api|worker|scheduler",
    "environment": "production|staging"
  },
  "data": {
    // Event-specific payload
  }
}
```

3.2 Event Versioning

Strategy: Include version in eventType or separate field
```
{
  "eventType": "UserRegistered",
  "eventVersion": "1.0",
  "data": { ... }
}
```
Version Compatibility:

v1.0 → v1.1: Backward compatible (add optional fields)
v1.x → v2.0: Breaking change (consumers must update)

3.3 Schema Validation

```
// schemas/eventSchemas.js
const Joi = require('joi');

const baseEventSchema = Joi.object({
  eventType: Joi.string().required(),
  aggregateId: Joi.string().required(),
  timestamp: Joi.date().iso().required(),
  data: Joi.object().required()
});

const userRegisteredSchema = baseEventSchema.keys({
  eventType: Joi.string().valid('UserRegistered'),
  data: Joi.object({
    userId: Joi.string().required(),
    email: Joi.string().email().required(),
    role: Joi.string().valid('user', 'admin').required()
  })
});

module.exports = { userRegisteredSchema };
```

4. Event Publishing
4.1 Event Service

```
// services/eventService.js
const Outbox = require('../models/Outbox');
const { v4: uuidv4 } = require('uuid');

class EventService {
  /**
   * Publish event to outbox (transactional)
   * @param {string} eventType - Event name
   * @param {string} aggregateId - Entity ID
   * @param {object} data - Event payload
   * @param {object} session - MongoDB session (optional for transaction)
   */
  async publish(eventType, aggregateId, data, session = null) {
    const event = {
      eventId: uuidv4(),
      eventType,
      aggregateId,
      timestamp: new Date(),
      payload: data,
      status: 'pending',
      retryCount: 0
    };

    const options = session ? { session } : {};
    await Outbox.create([event], options);

    console.log(`Event published: ${eventType} for ${aggregateId}`);
    return event;
  }

  /**
   * Publish within a transaction
   */
  async publishInTransaction(eventType, aggregateId, data, session) {
    return this.publish(eventType, aggregateId, data, session);
  }
}

module.exports = new EventService();
```

4.2 Publishing Examples

Example 1: User Registration
```
// controllers/authController.js
const eventService = require('../services/eventService');

exports.register = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Create user in database
    const user = await User.create([{
      email: req.body.email,
      password: hashedPassword,
      role: 'user'
    }], { session });

    // 2. Publish event in same transaction
    await eventService.publishInTransaction(
      'UserRegistered',
      user[0]._id.toString(),
      {
        userId: user[0]._id.toString(),
        email: user[0].email,
        role: user[0].role
      },
      session
    );

    // 3. Commit transaction
    await session.commitTransaction();

    res.status(201).json({ success: true, data: user[0] });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};
```

Example 2: Payment Completion
```
// controllers/paymentController.js
exports.processPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Save payment record
    const payment = await Payment.create([{
      userId: req.user.id,
      amount: req.body.amount,
      status: 'completed'
    }], { session });

    // 2. Update user subscription
    await User.findByIdAndUpdate(
      req.user.id,
      { subscriptionStatus: 'active' },
      { session }
    );

    // 3. Publish event
    await eventService.publishInTransaction(
      'PaymentCompleted',
      payment[0]._id.toString(),
      {
        transactionId: payment[0]._id.toString(),
        userId: req.user.id,
        plan: req.body.plan,
        amount: req.body.amount
      },
      session
    );

    await session.commitTransaction();
    res.json({ success: true, data: payment[0] });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};
```

5. Event Consumption
5.1 Outbox Processor (Worker)
```
// workers/outboxProcessor.js
const Outbox = require('../models/Outbox');
const eventHandlers = require('./eventHandlers');

class OutboxProcessor {
  constructor() {
    this.pollingInterval = 5000; // 5 seconds
    this.batchSize = 100;
    this.isRunning = false;
  }

  async start() {
    this.isRunning = true;
    console.log('Outbox processor started');
    
    while (this.isRunning) {
      await this.processBatch();
      await this.sleep(this.pollingInterval);
    }
  }

  async processBatch() {
    try {
      // Fetch pending events (oldest first)
      const events = await Outbox.find({ status: 'pending' })
        .sort({ createdAt: 1 })
        .limit(this.batchSize);

      console.log(`Processing ${events.length} events`);

      for (const event of events) {
        await this.processEvent(event);
      }
    } catch (error) {
      console.error('Batch processing error:', error);
    }
  }

  async processEvent(event) {
    try {
      // Get handler for event type
      const handler = eventHandlers[event.eventType];

      if (!handler) {
        console.warn(`No handler for event type: ${event.eventType}`);
        await this.markAsProcessed(event._id, 'no_handler');
        return;
      }

      // Execute handler
      await handler(event.payload);

      // Mark as processed
      await this.markAsProcessed(event._id);

      console.log(`Event processed: ${event.eventType} (${event._id})`);
    } catch (error) {
      console.error(`Event processing failed: ${event.eventType}`, error);
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
    const maxRetries = 3;

    if (retryCount >= maxRetries) {
      // Move to dead letter queue
      await Outbox.findByIdAndUpdate(event._id, {
        status: 'failed',
        retryCount,
        error: error.message,
        processedAt: new Date()
      });
      console.error(`Event failed after ${maxRetries} retries: ${event._id}`);
    } else {
      // Retry with exponential backoff
      const delay = Math.pow(2, retryCount) * 1000; // 2s, 4s, 8s
      await Outbox.findByIdAndUpdate(event._id, {
        retryCount,
        nextRetryAt: new Date(Date.now() + delay)
      });
      console.log(`Event scheduled for retry in ${delay}ms: ${event._id}`);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  stop() {
    this.isRunning = false;
    console.log('Outbox processor stopped');
  }
}

// Start worker
const processor = new OutboxProcessor();
processor.start();

// Graceful shutdown
process.on('SIGINT', () => {
  processor.stop();
  process.exit(0);
});

module.exports = processor;
```

5.2 Event Handlers
```
// workers/eventHandlers.js
const notificationService = require('../services/notificationService');
const cache = require('../services/cache');

const eventHandlers = {
  /**
   * Handle user registration event
   */
  UserRegistered: async (payload) => {
    const { userId, email } = payload;

    // Send welcome notification
    await notificationService.create({
      userId,
      type: 'info',
      title: 'Welcome to StreamFlix!',
      message: `Thank you for registering, ${email}. Enjoy unlimited streaming!`
    });

    console.log(`Welcome notification sent to ${email}`);
  },

  /**
   * Handle payment completion event
   */
  PaymentCompleted: async (payload) => {
    const { userId, plan, amount } = payload;

    // Send receipt notification
    await notificationService.create({
      userId,
      type: 'payment',
      title: 'Payment Successful',
      message: `Your ${plan} plan subscription (${amount / 100} VND) has been activated.`
    });

    // Invalidate user cache
    cache.del(`user:${userId}`);

    console.log(`Payment confirmation sent to user ${userId}`);
  },

  /**
   * Handle movie added event
   */
  MovieAdded: async (payload) => {
    const { movieId, title } = payload;

    // Invalidate movie list cache
    cache.delPattern('movies:list:*');

    console.log(`Cache invalidated for new movie: ${title}`);
  },

  /**
   * Handle movie updated event
   */
  MovieUpdated: async (payload) => {
    const { movieId } = payload;

    // Invalidate specific movie and lists
    cache.del(`movie:${movieId}`);
    cache.delPattern('movies:list:*');

    console.log(`Cache invalidated for movie: ${movieId}`);
  },

  /**
   * Handle movie watched event
   */
  MovieWatched: async (payload) => {
    const { userId, movieId } = payload;

    // Update analytics (future)
    // await analyticsService.trackView(userId, movieId);

    console.log(`View tracked: user ${userId} watched ${movieId}`);
  }
};

module.exports = eventHandlers;
```

6. Retry & Error Handling
6.1 Retry Strategy

Exponential Backoff:
Retry 1: 2 seconds delay
Retry 2: 4 seconds delay
Retry 3: 8 seconds delay
Max Retries: 3
Formula: delay = 2^retryCount * 1000ms

6.2 Failure Scenarios

SCENARIO                    ACTION                      STATUS
Handler throws error        Retry with backoff          pending
Max retries exceeded        Move to DLQ                 failed
No handler found            Skip processing             processed (with reason)
Network timeout             Retry                       pending
Database error              Retry                       pending

6.3 Dead Letter Queue (DLQ)
Failed events after max retries:
```
// Query failed events
const failedEvents = await Outbox.find({ status: 'failed' });

// Manual reprocessing
async function reprocessFailedEvent(eventId) {
  const event = await Outbox.findById(eventId);
  
  // Reset for retry
  await Outbox.findByIdAndUpdate(eventId, {
    status: 'pending',
    retryCount: 0,
    error: null
  });
  
  console.log(`Event ${eventId} reset for reprocessing`);
}
```

6.4 Idempotency
Key Principle: Processing same event multiple times = same result
```
// Example: Idempotent notification creation
async function createNotificationIdempotent(eventId, userId, data) {
  // Use eventId as idempotency key
  const existing = await Notification.findOne({ 
    eventId,
    userId 
  });

  if (existing) {
    console.log(`Notification already exists for event ${eventId}`);
    return existing; // Skip duplicate
  }

  // Create new notification
  return await Notification.create({
    eventId, // Store event ID
    userId,
    ...data
  });
}
```

7. Event Monitoring
7.1 Monitoring Metrics

Metric                       Description                            Alert Threshold
Pending Events               Events awaiting processing                 > 1000
Failed Events                Events in DLQ                              > 50
Processing Rate              Events/minute                              < 10
Retry Rate                   % events requiring retry                   > 20%
Oldest Pending               Age of oldest event                        > 5 minutes

7.2 Monitoring Endpoint
```
// routes/monitoring.js
exports.getOutboxStats = async (req, res) => {
  const stats = await Outbox.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        oldestEvent: { $min: '$createdAt' }
      }
    }
  ]);

  const pending = stats.find(s => s._id === 'pending')?.count || 0;
  const processed = stats.find(s => s._id === 'processed')?.count || 0;
  const failed = stats.find(s => s._id === 'failed')?.count || 0;

  res.json({
    success: true,
    data: {
      pending,
      processed,
      failed,
      total: pending + processed + failed,
      oldestPending: stats.find(s => s._id === 'pending')?.oldestEvent
    }
  });
};
```

7.3 Alerting Rules
```
// workers/alerting.js
async function checkOutboxHealth() {
  const stats = await Outbox.countDocuments({ status: 'pending' });

  if (stats > 1000) {
    console.error('ALERT: High pending event count:', stats);
    // Send alert to ops team
  }

  const oldestPending = await Outbox.findOne({ status: 'pending' })
    .sort({ createdAt: 1 });

  if (oldestPending) {
    const age = Date.now() - oldestPending.createdAt.getTime();
    const fiveMinutes = 5 * 60 * 1000;

    if (age > fiveMinutes) {
      console.error('ALERT: Oldest pending event is too old:', age / 1000, 'seconds');
    }
  }
}

// Run every minute
setInterval(checkOutboxHealth, 60000);
```

8. Best Practices
8.1 Event Design Principles

Events are facts: Use past tense (UserRegistered, not RegisterUser)
Immutable: Never modify event after publishing
Self-contained: Include all necessary data in payload
Versioned: Plan for schema evolution
Idempotent consumers: Safe to process multiple times

8.2 Do's and Don'ts
 Do:

+ Publish events in database transaction
+ Use descriptive event names
+ Include correlation IDs for tracing
+ Handle failures gracefully
+ Monitor outbox health

 Don't:

- Call external APIs synchronously in controllers
- Block user response on event processing
- Publish events for every database write
- Ignore failed events in DLQ
- Forget to version event schemas


9. Future Enhancements

Message Queue Integration (RabbitMQ/Kafka)

    Replace polling with push-based delivery
    Better scalability and performance


Event Sourcing

    Store all state changes as events
    Rebuild state from event history


CQRS (Command Query Responsibility Segregation)

    Separate read and write models
    Optimize queries independently


Saga Orchestration

    Complex multi-step workflows
    Compensating transactions


Event Replay

    Reprocess historical events
    Useful for debugging and migration