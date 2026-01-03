caching-plan.md  
Netflix Clone (React/TS + Node/Express + MongoDB)

## 1. Overview & Goals
- Reduce latency for TMDB browsing and user data.
- Avoid redundant calls; keep UI responsive.
- Current: no server-side cache; frontend uses RTK Query cache.

## 2. Current State
- **Frontend**: RTK Query caches (tmdbApi, authApi, paymentApi, adminApi, notificationApi). `sessionStorage` only stores JWT/user per tab.
- **Backend**: No Redis/outbox; only Mongo. TMDB is called directly from frontend.
- **Static assets**: Vite build, can leverage CDN/browser cache.

## 3. Proposed Cache Architecture (optional)
- Step 1: keep RTK Query + browser cache.
- Step 2 (when needed): add Redis cache at backend for TMDB popular data:
  - TMDB configuration, genres, popular/trending lists, detail by id.
  - Suggested TTL: config/genres 24h; popular 5–15 min; detail 15–60 min.
- Do NOT long-cache sensitive user data (auth, preferences, watch history) except short RTK Query cache.

## 4. Suggested TTLs (if Redis/backend cache)
- TMDB config/genres: 24h  
- TMDB popular/trending lists: 5–15 min  
- TMDB detail (movie/tv): 15–60 min  
- TMDB search: 5–10 min (or skip if low volume)  
- User/preferences/history: rely on RTK Query and re-fetch after mutations.

## 5. Invalidation
- TMDB: TTL-based; rarely need manual invalidation.
- User-bound: RTK Query invalidation after mutations (preferences, history, subscription).
- If Redis: pattern delete after updates; mostly read-only TMDB so TTL is enough.

## 6. HTTP Caching (browser/CDN)
- Public TMDB-like content: `Cache-Control: public, max-age=300-900` if proxied.
- Private/user data: `private, no-store`.
- Static assets: `immutable` + hashed filenames (Vite).

## 7. Performance Notes
- Lazy routes, code-splitting.
- Debounce TMDB search to avoid quota/limits.
- Reuse RTK Query hooks to avoid duplicate fetch.

## 8. Risks / Limits
- Without Redis: rely on TMDB quota/key; cache only on client.
+- No long cache for watch/history to avoid cross-tab divergence.
- If adding Redis: need deploy/monitor; fallback to bypass cache if Redis fails.

## 9. Future
- Proxy TMDB through backend + Redis cache-aside if needed.
- Add metrics: Redis hit/miss, RTK Query request counts.
- CDN for assets when traffic grows.
caching-plan.md
StreamVerse - Netflix Clone

TABLE OF CONTENTS

Caching Overview
Cache Architecture
Caching Patterns
Cache Key Strategy
TTL Configuration
Cache Invalidation
HTTP Caching
Performance Metrics


1. Caching Overview
1.1 Objectives

Reduce database load by 80%+ for read operations
Improve response times from 500ms to <100ms
Scale horizontally without database bottleneck
Handle traffic spikes during peak hours

1.2 Caching Layers
┌─────────────────────────────────────────────┐
│         Client Browser Cache                 │
│         (HTTP Cache Headers)                 │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│         API Server Cache                     │
│         (Redis / In-Memory)                  │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│         Database (MongoDB)                   │
│         (Source of Truth)                    │
└─────────────────────────────────────────────┘
1.3 Cacheable Data

DATA TYPE           READ FREQUENCY            WRITE FREQUENCY               CACHE PRIORITY
Movie Catalog         Very High                    Low                         Critical
Genre List            Very High                  Very Low                      Critical
User Preferences        High                      Medium                         High
Watch History           High                       High                         Medium
Notifications          Medium                     Medium                         Low
User Session            High                       Low                           High

2. Cache Architecture
2.1 Technology Choice
Option 1: Redis (Recommended for Production)
Pros:

+ Distributed caching across multiple servers
+ Persistence options (AOF/RDB)
+ Advanced data structures (sorted sets, lists)
+ Built-in TTL support
+ Pub/Sub for cache invalidation

Cons:

- Additional infrastructure (Redis server)
- Network latency (minimal)

Option 2: Node.js In-Memory (Current Implementation)
Pros:

+ Zero infrastructure overhead
+ Ultra-fast access (no network)
+ Simple implementation

Cons:

- Not shared across multiple API instances
- Lost on server restart
- Memory limitations

Decision: Start with in-memory, migrate to Redis when scaling horizontally.

2.2 Cache Implementation
In-Memory Cache Service
```
// services/cache.js
class CacheService {
  constructor() {
    this.cache = new Map();
    this.stats = { hits: 0, misses: 0 };
  }

  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {any|null}
   */
  get(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      this.stats.misses++;
      return null;
    }

    // Check TTL expiration
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return item.value;
  }

  /**
   * Set value in cache with TTL
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in seconds
   */
  set(key, value, ttl = 3600) {
    const expiresAt = ttl ? Date.now() + (ttl * 1000) : null;
    this.cache.set(key, { value, expiresAt });
  }

  /**
   * Delete key from cache
   */
  del(key) {
    this.cache.delete(key);
  }

  /**
   * Delete keys matching pattern
   */
  delPattern(pattern) {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear entire cache
   */
  flush() {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0 };
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total * 100).toFixed(2) : 0;
    
    return {
      size: this.cache.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: `${hitRate}%`
    };
  }
}

module.exports = new CacheService();
```

Redis Implementation (Alternative)

```
// services/redisCache.js
const redis = require('redis');
const client = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

client.on('error', (err) => console.error('Redis error:', err));
client.connect();

class RedisCacheService {
  async get(key) {
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  }

  async set(key, value, ttl = 3600) {
    await client.setEx(key, ttl, JSON.stringify(value));
  }

  async del(key) {
    await client.del(key);
  }

  async delPattern(pattern) {
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
    }
  }

  async flush() {
    await client.flushDb();
  }
}

module.exports = new RedisCacheService();
```

3. Caching Patterns
3.1 Cache-Aside (Lazy Loading) Pattern
Most Common Pattern - Used for Movies, Genres, etc.

```
// controllers/movieController.js
const cache = require('../services/cache');

exports.getMovieById = async (req, res) => {
  const { id } = req.params;
  const cacheKey = `movie:${id}`;

  try {
    // 1. Check cache first
    let movie = cache.get(cacheKey);
    
    if (movie) {
      return res.json({
        success: true,
        data: movie,
        cached: true
      });
    }

    // 2. Cache miss - query database
    movie = await Movie.findById(id);
    
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found'
      });
    }

    // 3. Store in cache (TTL: 1 hour)
    cache.set(cacheKey, movie, 3600);

    res.json({
      success: true,
      data: movie,
      cached: false
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

Flow Diagram:

Request → Check Cache → [HIT] → Return Data
              ↓
           [MISS]
              ↓
      Query Database → Store in Cache → Return Data\

3.2 Write-Through Pattern
Used for user preferences (cache must be consistent)

```
exports.updateUserPreferences = async (req, res) => {
  const userId = req.user.id;
  const cacheKey = `preferences:${userId}`;

  try {
    // 1. Update database
    const preferences = await UserPreferences.findOneAndUpdate(
      { userId },
      req.body,
      { new: true, upsert: true }
    );

    // 2. Update cache immediately
    cache.set(cacheKey, preferences, 1800); // 30 min TTL

    res.json({ success: true, data: preferences });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

3.3 Cache Warming
Pre-load popular content into cache
```
// services/cacheWarmer.js
const Movie = require('../models/Movie');
const cache = require('./cache');

async function warmPopularMovies() {
  try {
    // Get top 50 most popular movies
    const popularMovies = await Movie.find()
      .sort({ viewCount: -1 })
      .limit(50)
      .lean();

    // Pre-load into cache
    for (const movie of popularMovies) {
      const cacheKey = `movie:${movie._id}`;
      cache.set(cacheKey, movie, 3600);
    }

    console.log(`Cache warmed with ${popularMovies.length} movies`);
  } catch (error) {
    console.error('Cache warming failed:', error);
  }
}

// Run every 6 hours
setInterval(warmPopularMovies, 6 * 60 * 60 * 1000);

module.exports = { warmPopularMovies };
```

4. Cache Key Strategy
4.1 Key Naming Convention
Format: {entity}:{id}:{sub-entity}:{attribute}

ENTITY              KEY PATTERN                        EXAMPLE
Movie               movie:{id}                         movie:507f1f77bcf86cd799439011
Movie List          movies:list:{page}:{filter}        movies:list:1:genre-action
Genre               genre:{slug}                       genre:action
Genre List          genres:all                         genres:all
User Preferences    preferences:{userId}               preferences:507f1f77bcf86cd799439011
Watch History       watchhistory:{userId}              watchhistory:507f1f77bcf86cd799439011
User Session        session:{userId}                   session:507f1f77bcf86cd799439011

4.2 Key Design Principles

Descriptive: Key should indicate what data it holds
Hierarchical: Use colons for namespace separation
Unique: Include IDs to prevent collisions
Consistent: Same format across the application
Queryable: Support pattern matching for invalidation

4.3 Key Examples

```
// Good key naming
cache.set('movie:12345', movieData);
cache.set('movies:list:1:genre-action', movieList);
cache.set('preferences:user-67890', userPrefs);

// Bad key naming (avoid)
cache.set('m12345', movieData);        // Not descriptive
cache.set('movieList', movieList);     // Not unique
cache.set('user_prefs', userPrefs);    // Inconsistent separator
```

5. TTL Configuration
5.1 TTL Strategy by Data Type

DATA TYPE                   TTL (seconds)               REASONING
Movies                      3600 (1 hour)               Content changes rarely
Genres                      86400 (24 hours)            Very stable data
User Preferences            1800 (30 min)               Changes occasionally
Watch History               600 (10 min)                Updates frequently
Movie Lists (paginated)     1800 (30 min)               Catalog updates periodically
Search Results              900 (15 min)                Dynamic queries
User Sessio                 3600 (1 hour)               Matches JWT expiry
Notifications               300 (5 min)                 Time-sensitive

5.2 TTL Configuration File

```
// config/cache-ttl.js
module.exports = {
  MOVIE_DETAIL: 3600,        // 1 hour
  MOVIE_LIST: 1800,          // 30 minutes
  GENRE_LIST: 86400,         // 24 hours
  USER_PREFERENCES: 1800,    // 30 minutes
  WATCH_HISTORY: 600,        // 10 minutes
  SEARCH_RESULTS: 900,       // 15 minutes
  USER_SESSION: 3600,        // 1 hour
  NOTIFICATIONS: 300,        // 5 minutes
  DEFAULT: 1800              // 30 minutes (fallback)
};
```

5.3 Dynamic TTL

```
const TTL = require('../config/cache-ttl');

// Popular content cached longer
function calculateTTL(viewCount) {
  if (viewCount > 10000) return TTL.MOVIE_DETAIL * 2;  // 2 hours
  if (viewCount > 1000) return TTL.MOVIE_DETAIL;       // 1 hour
  return TTL.MOVIE_DETAIL / 2;                         // 30 minutes
}
```

6. Cache Invalidation
6.1 Invalidation Strategies

Strategy 1: TTL-Based (Automatic)
Best for: Relatively static data (movies, genres)

Cache expires automatically after TTL
No manual intervention needed
Risk of stale data until TTL expires

Strategy 2: Event-Driven (Manual)
Best for: Frequently updated data (preferences, history)

Invalidate on write operations
Always consistent data
Requires careful implementation

Strategy 3: Versioning
Best for: API responses, data schemas

Include version in cache key
Old versions expire naturally
Allows gradual migration

6.2 Invalidation Implementation

```
// controllers/adminController.js
const cache = require('../services/cache');

exports.updateMovie = async (req, res) => {
  const { id } = req.params;

  try {
    // Update database
    const movie = await Movie.findByIdAndUpdate(id, req.body, { new: true });

    // Invalidate specific movie cache
    cache.del(`movie:${id}`);

    // Invalidate all movie lists (pattern matching)
    cache.delPattern('movies:list:*');

    // Optionally: Invalidate genre lists if genre changed
    if (req.body.genres) {
      cache.delPattern('movies:genre:*');
    }

    res.json({ success: true, data: movie });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

6.3 Invalidation Patterns

OPERATION                 INVALIDATION SCOPE              KEY AFFECTED
Create Movie                     Lists                    movies:list:*
Update Movie                Single + Lists                movie:{id}, movies:list:*
Delete Movie                Single + Lists                movie:{id}, movies:list:*
Update Genre                 Genre + Lists                genre:{slug}, movies:genre:*
User Preference Change        Single User                 preferences:{userId}
Bulk Operations               Full Cache                  flush() (use cautiously)

7. HTTP Caching
7.1 HTTP Cache Headers

ETag (Entity Tag)
```
// middleware/etag.js
const crypto = require('crypto');

exports.generateETag = (req, res, next) => {
  const originalSend = res.send;

  res.send = function(data) {
    // Generate ETag from response data
    const etag = crypto
      .createHash('md5')
      .update(JSON.stringify(data))
      .digest('hex');

    res.setHeader('ETag', `"${etag}"`);

    // Check If-None-Match header
    if (req.headers['if-none-match'] === `"${etag}"`) {
      return res.status(304).end(); // Not Modified
    }

    originalSend.call(this, data);
  };

  next();
};
```

Cache-Control Headers
```
// Set cache headers based on route
exports.setCacheHeaders = (req, res, next) => {
  const path = req.path;

  if (path.startsWith('/api/movies')) {
    // Public content, cacheable for 1 hour
    res.setHeader('Cache-Control', 'public, max-age=3600');
  } else if (path.startsWith('/api/watchhistory')) {
    // Private content, no cache
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  } else {
    // Default: short cache
    res.setHeader('Cache-Control', 'public, max-age=300');
  }

  next();
};
```

7.2 HTTP Caching Configuration

ENDPOINT                        CACHE-CONTROL               REASONING
GET /movies                     public, max-age=3600        Public content, 1 hour
GET /movies/:id                 public, max-age=3600        Public content, 1 hour
GET /genres                     public, max-age=86400       Very stable, 24 hours
GET /watchhistory               private, no-cache           User-specific, no cache
GET /preferences                private, no-cache           User-specific, no cache
GET /notifications              private, no-cache           Time-sensitive, no cache

7.3 CDN Caching (Future)

For video content and static assets:
```
// Headers for CDN caching
res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
res.setHeader('CDN-Cache-Control', 'max-age=604800'); // 7 days
```

8. Performance Metrics
8.1 Key Performance Indicators

Metric                      Target          Measurement
Cache Hit Rate              > 80%           hits / (hits + misses)
Response Time (cached)      < 50ms          API monitoring
Response Time (uncached)    < 300ms         API monitoring
Database Load Reduction     > 70%           Query count comparison
Memory Usage                < 500MB         Node.js heap size

8.2 Monitoring Endpoint
```
// routes/monitoring.js
const cache = require('../services/cache');

exports.getCacheStats = (req, res) => {
  const stats = cache.getStats();
  
  res.json({
    success: true,
    data: {
      ...stats,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage()
    }
  });
};
Example Response:
json{
  "success": true,
  "data": {
    "size": 1247,
    "hits": 8543,
    "misses": 1876,
    "hitRate": "82.01%",
    "uptime": 3600,
    "memoryUsage": {
      "heapUsed": 45678912
    }
  }
}
```

8.3 Performance Testing

```
// tests/cache-performance.test.js
const axios = require('axios');

async function testCachePerformance() {
  const movieId = '507f1f77bcf86cd799439011';
  const url = `http://localhost:5000/api/movies/${movieId}`;

  // First request (cache miss)
  const start1 = Date.now();
  await axios.get(url);
  const uncachedTime = Date.now() - start1;

  // Second request (cache hit)
  const start2 = Date.now();
  await axios.get(url);
  const cachedTime = Date.now() - start2;

  console.log(`Uncached: ${uncachedTime}ms`);
  console.log(`Cached: ${cachedTime}ms`);
  console.log(`Improvement: ${((uncachedTime / cachedTime) * 100).toFixed(1)}%`);
}
```

9. Troubleshooting
9.1 Common Issues
Issue 1: Low Cache Hit Rate (< 50%)
Causes:

TTL too short
Cache keys inconsistent
High write frequency

Solutions:

Increase TTL for stable data
Standardize key generation
Use write-through pattern

Issue 2: Stale Data
Causes:

Invalidation not triggered
TTL too long

Solutions:

Add cache invalidation on updates
Implement event-driven invalidation
Reduce TTL

Issue 3: Memory Overflow
Causes:

No TTL set (infinite cache)
Too many cached items

Solutions:

Always set TTL
Implement LRU eviction policy
Migrate to Redis


10. Future Enhancements

10.1. Distributed Caching with Redis Cluster

Horizontal scaling
Shared cache across API instances


10.2. Cache Warming Strategies

Pre-load popular content on startup
Scheduled batch updates


10.3. Advanced Invalidation

Pub/Sub pattern for multi-server invalidation
Dependency-based invalidation


10.4. Cache Compression

Reduce memory usage
Faster serialization


10.5. A/B Testing

Compare cached vs non-cached performance
Optimize TTL values