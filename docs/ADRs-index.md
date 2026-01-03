ADRs/index.md  
Netflix Clone (React/TypeScript + Node/Express + MongoDB)

Purpose: track key architecture decisions and their rationale.

ADR template  
- Title: `ADR-XXX: …`  
- Status: Proposed | Accepted | Deprecated | Superseded  
- Date, Deciders, Context, Decision, Consequences.  

Decisions (current)
- ADR-001: MongoDB (document DB) vs relational — Accepted.  
  Flexible schema for TMDB-style metadata; JSON-friendly; fewer joins. Trade-off: no cross-collection ACID (use sessions).  
- ADR-002: JWT auth (stateless) vs server sessions — Accepted.  
  Scales horizontally; no session store; trade-off: revocation before expiry is hard → short TTL.  
- ADR-003: React + TypeScript SPA — Accepted. Ecosystem, component model, type safety.  
- ADR-004: Express/Node backend — Accepted. Non-blocking I/O, shared JS stack.  
- ADR-005: Cache-aside; start with client (RTK Query), optional Redis later — Accepted. Simple start; TTL controls staleness.  
- ADR-006: Pagination for lists — Accepted. Protect perf/bandwidth; consistent UX.  
- ADR-007: RBAC with roles `user`/`admin` — Accepted. Simple, covers admin dashboard/approvals.  
- ADR-008: Saga (orchestration) for multi-step flows (payment → pending → approve) — Proposed/Future.  
- ADR-009: Outbox + worker for reliable events/notifications — Proposed/Future.  
- ADR-010: Docker for environment consistency — Accepted.  

Status definitions  
- Proposed: under discussion.  
- Accepted: approved/implemented or in progress.  
- Deprecated: no longer recommended.  
- Superseded: replaced by newer ADR.  

Process  
1) Identify the decision/option.  
2) Draft ADR from template (`docs/ADRs/ADR-TEMPLATE.md`).  
3) Review/approve.  
4) Implement.  
5) Revisit quarterly or before major changes.  

Add a new ADR  
- Copy template → `ADR-0xx-topic.md`.  
- Add entry here with status/date/location.  

Related docs  
- SAD, system-vision, security-spec, caching-plan, events, consistency, runbook.  
ADRs/index.md
StreamVerse - Netflix Clone

Purpose: Track important architectural decisions and their rationale
----------------------------------------------------------------------------
ADR FORMAT
Each ADR follows this structure:

# ADR-XXX: [Title]

**Status:** [Proposed | Accepted | Deprecated | Superseded]
**Date:** YYYY-MM-DD
**Deciders:** [Names/Roles]
**Context:** What problem are we solving?
**Decision:** What did we decide?
**Consequences:** What are the trade-offs?

INDEX OF DECISIONS
Core Architecture
ADR-001: Use MongoDB over Relational Database

Status: Accepted
Date: 2025-12-15
Location: docs/ADRs/ADR-001-mongodb.md

Summary:
Chose MongoDB (document database) instead of PostgreSQL for primary data store due to flexible schema requirements for movie metadata and better horizontal scaling capabilities.
Key Decision Factors:

Flexible schema for varied movie metadata
Better performance for nested data (watch history with movie refs)
Native JSON support matches API responses
Horizontal scaling with sharding

Trade-offs:

+ Faster development with schema flexibility
- No ACID transactions across collections (mitigated with sessions)


ADR-002: Implement Outbox Pattern for Event Reliability

Status: Accepted
Date: 2025-12-20
Location: docs/ADRs/ADR-002-outbox-pattern.md

Summary:
Implement Outbox pattern to ensure reliable event publishing even if message queue is down, guaranteeing at-least-once delivery.
Key Decision Factors:

Guarantees event delivery (at-least-once)
Survives system crashes
Decouples event publishing from business transaction
Industry-proven pattern

Trade-offs:

+ Reliable event delivery
+ Transactional consistency
- Additional complexity (worker process)
- Eventual consistency (slight delay)


ADR-003: JWT Authentication over Server-Side Sessions

Status: Accepted
Date: 2025-12-18
Location: docs/ADRs/ADR-003-jwt-auth.md

Summary:
Use JWT (JSON Web Tokens) instead of server-side sessions for API authentication to enable stateless, horizontally scalable architecture.
Key Decision Factors:

Stateless: No session store required
Scalable: Works across multiple API servers
Mobile-friendly: Easy to store in client
Industry standard for REST APIs

Trade-offs:

+ Horizontal scaling without session stickiness
+ Reduced server memory
- Cannot invalidate tokens before expiry
- Token size larger than session cookie

Mitigation: Short TTL (24h) + refresh token mechanism

ADR-004: Cache-Aside Pattern with Redis/In-Memory
Status: Accepted
Date: 2025-12-22
Location: docs/ADRs/ADR-004-caching-strategy.md

Summary:
Implement cache-aside (lazy loading) pattern starting with in-memory cache, with migration path to Redis for distributed caching.
Key Decision Factors:

Only cache what's needed (self-managing)
Stale data acceptable for movies (not real-time)
TTL prevents infinite growth
Industry standard caching pattern

Trade-offs:

+ 80%+ cache hit rate reduces DB load
+ Faster response times (< 50ms from cache)
- Cache invalidation complexity
- Potential stale data (mitigated with TTL)

Implementation Notes:

Start with Node.js in-memory cache
Migrate to Redis when horizontal scaling needed
Use consistent cache key naming convention


TECHNOLOGY CHOICES

ADR-005: Node.js/Express for Backend
Status: Accepted
Date: 2025-12-10
Location: docs/ADRs/ADR-005-nodejs-backend.md

Summary:
Use Node.js with Express framework for backend API instead of Java/Spring or .NET.
Key Decision Factors:

Non-blocking I/O ideal for high-concurrency streaming
JavaScript throughout stack (full-stack developers)
Large ecosystem (npm packages)
Lightweight and fast startup

Trade-offs:

+ High performance for I/O-bound operations
+ Easy to find developers
- Single-threaded (mitigated with clustering)
- Callback complexity (mitigated with async/await)


ADR-006: React/TypeScript for Frontend

Status: Accepted
Date: 2025-12-10
Location: docs/ADRs/ADR-006-react-frontend.md

Summary:
Use React with TypeScript for frontend SPA instead of Vue or Angular.
Key Decision Factors:

Large community and ecosystem
Component-based architecture
TypeScript adds type safety
Virtual DOM performance

Trade-offs:

+ Mature ecosystem with many libraries
+ Type safety with TypeScript
- Boilerplate code
- Learning curve for beginners


EVENT-DRIVEN ARCHITECTURE

ADR-007: Custom Event Bus over RabbitMQ/Kafka (Initial)
Status: Accepted (Temporary)
Date: 2025-12-20
Location: docs/ADRs/ADR-007-event-bus.md

Summary:
Start with custom event bus (Outbox + polling worker) instead of RabbitMQ/Kafka for MVP, with migration path to proper message queue.
Key Decision Factors:

Simpler initial setup (no additional infrastructure)
Sufficient for current scale (< 1000 TPS)
Easier to understand and debug
Can migrate later without code changes

Trade-offs:

+ No additional infrastructure cost
+ Simpler deployment
- Polling overhead (5 second intervals)
- Limited throughput

Future Migration: Plan to migrate to RabbitMQ when:

Event volume > 1000 TPS
Need for complex routing
Multiple consumer groups required


ADR-008: Saga Pattern for Multi-Step Workflows

Status: Accepted
Date: 2025-12-23
Location: docs/ADRs/ADR-008-saga-pattern.md

Summary:
Implement Saga pattern (orchestration) for complex multi-step workflows like payment processing instead of distributed transactions.
Key Decision Factors:

MongoDB doesn't support distributed transactions
Compensating actions for rollback
Clear workflow visibility
Industry standard for microservices

Trade-offs:

+ Works across multiple databases/services
+ Clear failure handling with compensations
- More complex than simple transactions
- Eventual consistency


SECURITY
ADR-009: Bcrypt for Password Hashing

Status: Accepted
Date: 2025-12-18
Location: docs/ADRs/ADR-009-password-hashing.md

Summary:
Use bcrypt with 10 rounds for password hashing instead of SHA-256 or other algorithms.
Key Decision Factors:

Specifically designed for password hashing
Adaptive (can increase rounds as hardware improves)
Automatic salt generation
Industry best practice

Trade-offs:

+ Secure against rainbow table attacks
+ Configurable work factor
- Slower than SHA (intentional - prevents brute force)


ADR-010: Role-Based Access Control (RBAC)

Status: Accepted
Date: 2025-12-18
Location: docs/ADRs/ADR-010-rbac.md

Summary:
Implement simple RBAC with two roles (user, admin) instead of complex permission system.
Key Decision Factors:

Sufficient for current requirements
Easy to implement and understand
Standard middleware pattern
Can extend to ABAC later if needed

Trade-offs:

+ Simple and maintainable
+ Clear authorization logic
- Less granular than ABAC
- Role explosion if too many roles


PERFORMANCE

ADR-011: Pagination for Large Result Sets
Status: Accepted
Date: 2025-12-22
Location: docs/ADRs/ADR-011-pagination.md

Summary:
Implement cursor-based pagination with default limit of 20 items for all list endpoints.
Key Decision Factors:

Prevents memory overflow
Improves response time
Better user experience (progressive loading)
Standard REST API practice

Trade-offs:

+ Consistent performance regardless of data size
+ Lower bandwidth usage
- Additional complexity in frontend


ADR-012: Lean Queries with Mongoose

Status: Accepted
Date: 2025-12-22
Location: docs/ADRs/ADR-012-lean-queries.md

Summary:
Use .lean() for read-only queries to improve performance by returning plain JavaScript objects instead of Mongoose documents.
Key Decision Factors:

30-40% performance improvement
Reduced memory usage
No need for Mongoose methods on read-only data

Trade-offs:

+ Faster queries
+ Less memory
- No Mongoose virtuals or methods
- Must be careful not to modify


DEPLOYMENT

ADR-013: Docker for Containerization
Status: Accepted
Date: 2025-12-25
Location: docs/ADRs/ADR-013-docker.md

Summary:
Use Docker for containerization to ensure consistent environments across development, staging, and production.
Key Decision Factors:

Environment consistency
Easy local development setup
Scalability (Kubernetes-ready)
Industry standard

Trade-offs:

+ "Works on my machine" eliminated
+ Easy scaling
- Additional learning curve
- Overhead for simple deployments


Decision Status Definitions

Status                  Meaning
Proposed                Under discussion, not yet approved
Accepted                Approved and being implemented
Deprecated              No longer recommended, but may still be in use
Superseded              Replaced by a newer decision

Decision Process

Identify Problem: What decision needs to be made?
Research Options: Evaluate alternatives
Stakeholder Input: Discuss with team
Document ADR: Create new ADR file
Review: Get approval from architecture team
Implement: Execute the decision
Monitor: Track consequences and learnings


Creating New ADRs

Template Location
docs/ADRs/ADR-TEMPLATE.md

Naming Convention
ADR-XXX-short-title.md
Example: ADR-014-graphql-api.md

How to Create
```
# Copy template
cp docs/ADRs/ADR-TEMPLATE.md docs/ADRs/ADR-014-your-topic.md

# Edit with your content
nano docs/ADRs/ADR-014-your-topic.md

# Add to index (this file)
```

Reviewing ADRs
ADRs should be reviewed:

Quarterly: Check if decisions still valid
Before Major Changes: Ensure alignment
Post-Incident: Learn from production issues

Last Review Date: December 31, 2025
Next Review: January 3, 2026

Related Documents

Software Architecture Document: docs/SAD.md
System Vision: docs/System-Vision.md
Technical Specifications: docs/specs/