# Twitter Account Scraper Architecture

## Core Architecture Philosophy

The system implements a self-healing, work-stealing job queue architecture where work units create other work units as side effects. The worker polls three queues in strict priority order, processing whatever work is available, and each work unit can spawn new units that get picked up in future iterations. This creates a cascading effect where tracking a single user triggers a chain of work: tweet scraping, thread context gathering, and profile hydration, all happening asynchronously and in parallel across multiple workers.

## The Main Loop and Priority System

The `runScraper` loop attempts work in strict priority order: first jobs, then incomplete users, then suggestions. This ordering is deliberate - jobs represent work in progress that should be completed to free resources, incomplete users unlock additional context for existing data, and suggestions create entirely new work. If no work is available in any queue, the worker sleeps for 60 seconds before polling again. Each iteration runs in a single database transaction, so any failure causes a complete rollback, leaving the work unit in the queue for the next worker to retry. The `FOR UPDATE SKIP LOCKED` pattern allows multiple workers to process different rows concurrently without blocking each other, providing natural horizontal scalability.

## User Suggestion Entry Flow

External systems add usernames to `twitter_user_suggestions`, marking them as candidates for tracking. When `processNextSuggestion` picks up a suggestion, it locks the row, fetches the user profile from Twitter's API, and calls `upsertUserInfo` with `tracked=true` and the original username. If the user is available, `upsertUserInfo` stores their complete profile in `twitter_users`, soft-deletes the suggestion by setting `deletedAt`, and critically, creates a query job with `query="from:username"` and `userId`. This query job is the entry point into the scraping system - it represents the mandate to fetch all tweets from this user. The job is stateless; all progress tracking happens in `twitter_users.oldestTrackedTweet`.

## Query Job Cursor Advancement Mechanism

Query jobs implement a sophisticated backward-scrolling algorithm that survives crashes and restarts. When `processNextJob` picks up a cursor search, it first retrieves `oldestTrackedTweet` from `twitter_users`. If this value exists, it appends ` max_id:${oldestTrackedTweet - 1n}` to the query string. This is the key to continuity: Twitter's Advanced Search API will return tweets with IDs strictly less than `max_id`, effectively saying "give me the next page of older tweets from where I left off." On the first iteration, `oldestTrackedTweet` is NULL, so we search without `max_id`, getting the newest ~20 tweets. After processing, `createJobsForNewTweets` updates `oldestTrackedTweet` to the smallest ID in that batch. On the second iteration, we append `max_id:${oldestTrackedTweet - 1}`, fetching the next older batch. This continues, walking backward through time, until `has_next_page=false` and `tweets.length=0`, at which point we delete the job.

## Boundary Tracking State Management

The `oldestTrackedTweet` and `newestTrackedTweet` fields in `twitter_users` serve as persistent cursors that survive process restarts. These boundaries are updated exclusively by `createJobsForNewTweets`, which is only called after cursor search (query jobs), never after thread jobs. This is critical: we only want to track boundaries for tweets from tracked users, not random context tweets. When processing a batch of tweets, we find the minimum ID (`lowestId` - oldest tweet) and maximum ID (`highestId` - newest tweet). The SQL `LEAST` function ensures `oldestTrackedTweet` only moves toward smaller IDs (older), and `GREATEST` ensures `newestTrackedTweet` only moves toward larger IDs (newer). The WHERE clause containing the comparison checks means we only execute the UPDATE if boundaries would actually expand, avoiding unnecessary writes. The use of `COALESCE` handles the initial NULL case - if `oldestTrackedTweet` is NULL, it treats it as infinity and accepts any value.

## Thread Job Creation and Context Gathering

When `createJobsForNewTweets` processes a batch of tweets from a query job, it examines each tweet to see if it's a reply. If a tweet has `inReplyToId` and `conversationId`, it checks whether the parent tweet already exists in `scraped_tweet`. If the parent is missing, it creates a thread job with `conversationId` (the thread root), `originalReplyId` (this tweet's ID), and `nextReplyId` (the parent's ID we need to fetch). Crucially, it also opportunistically creates a stub user if `inReplyToUserId` exists. This stub has `id=inReplyToUserId` and `tracked=false`. The `onConflictDoNothing` makes this safe if the user already exists. This stub creation is the hook that triggers future profile hydration - the stub sits in `twitter_users` with `username=NULL`, waiting to be discovered by `processNextIncompleteUsers`.

## Thread Job Traversal Logic

Thread jobs implement an upward walk through reply chains, one step at a time. When `processNextJob` enters phase 2 (no cursor jobs available), it retrieves up to 20 thread jobs in a batch. For each job, it first checks if `nextReplyId` already exists in `scraped_tweet` - if so, another branch or iteration already fetched it, so we call `finishThreadScraping` to delete the job and avoid redundant work. For jobs where the parent doesn't exist, we batch all the `nextReplyId` values and call `getByIds` once, fetching all parents in a single API call. For each fetched tweet, if it's not found or has no `inReplyToId` (meaning it's the thread root or a deleted tweet), we delete the job via `finishThreadScraping`. If the tweet exists and has `inReplyToId`, we update the job to set `nextReplyId = tweet.inReplyToId`, advancing the traversal one step up the chain. On the next iteration, we'll fetch that parent, and continue until we hit a root or existing tweet. All fetched tweets are stored via `insertTweets`, which is a simple upsert with no additional logic.

## Stub User Hydration Lifecycle

Stub users are incomplete `twitter_users` rows with an ID but `username=NULL`. They get created as side effects when thread jobs discover reply parents. The `processNextIncompleteUsers` function is specifically designed to hydrate these stubs. It retrieves up to 100 incomplete users at once (batch sizing for API efficiency - Twitter charges 10 credits per user instead of 18 for batches over 100). The query prioritizes `tracked=true` first (using `ORDER BY tracked DESC`), then oldest `updatedAt`, ensuring important users get hydrated first. It calls `batchGetInfo` with all the IDs, receives profiles, and updates each user via `upsertUserInfo`. Critically, it preserves the original `tracked` status from the stub. If the stub was `tracked=false`, it stays `false`, so no query job gets created. This is correct behavior: these are context tweet authors, not explicitly tracked users. If an incomplete user happens to be `tracked=true` (maybe manually inserted), then after hydration it will create a query job.

## Edge Case: Multiple Branches Converge

Consider a thread where alice and bob both reply to charlie's tweet. When we scrape alice (tracked), we create a thread job to fetch charlie's tweet. When we scrape bob (also tracked), we create another thread job to fetch the same charlie tweet. The first job executes, fetches charlie's tweet, and stores it in `scraped_tweet`. The second job executes in a later iteration, checks if `nextReplyId` (charlie's tweet) exists, finds it, and immediately calls `finishThreadScraping` to delete itself. No duplicate API call, no wasted work. The `unique(conversationId, originalReplyId)` constraint on thread jobs ensures we can't create duplicate jobs for the same reply chain, but different replies in the same thread get different jobs, which then converge when they reach shared parents.

## Edge Case: Context Author Becomes Tracked

Suppose charlie's tweet (fetched as context via thread job) sits in `scraped_tweet` with `authorId=charlie_id`. Charlie might not be in `twitter_users` at all if `inReplyToUserId` was missing, or charlie might be a stub (username=NULL). Later, someone adds charlie to suggestions. `processNextSuggestion` fetches charlie's profile and creates a query job. The query job starts scraping charlie's tweets. When it encounters charlie's existing tweet (previously fetched as context), `insertTweets` performs an upsert, updating all fields including `updatedAt`. The tweet exists in the database twice in a sense - once as context (from alice's thread traversal) and once as tracked (from charlie's query job). But they're the same row, just updated. The boundaries tracking still works correctly because `createJobsForNewTweets` only runs for query jobs, so charlie's `oldestTrackedTweet` gets set properly regardless of previously existing context tweets.

## Edge Case: Thread Traversal Crosses Tracked Boundary

Alice (tracked) replies to bob (not tracked) who replies to charlie (tracked). Alice's query job creates a thread job to fetch bob's tweet. Thread job fetches bob's tweet successfully, stores it. Bob's tweet is also a reply, so the thread job updates `nextReplyId` to charlie's tweet and continues. Next iteration fetches charlie's tweet. If charlie is tracked and we already scraped her tweets, charlie's tweet already exists, so `finishThreadScraping` deletes the job. If charlie hasn't been scraped yet, we fetch and store her tweet as context. Later, when charlie gets tracked and her query job runs, her existing tweets get updated via upsert. The system gracefully handles partial data - you can have context tweets from users who later become tracked, and the data just gets enriched over time.

## The Job Deletion Signal

When a job gets deleted, it signals completion. For query jobs, deletion means "we've scraped all available tweets for this user up to this point in time." For thread jobs, deletion means "we've reached the root or an existing tweet in this reply chain." This deletion is the observable signal that applications can use to determine completeness. To check if a conversation's context is fully gathered, query `SELECT COUNT(*) FROM twitter_scraping_jobs WHERE conversationId = X`. If count is zero, all thread jobs for that conversation have completed, meaning all reply chains have been walked to their terminus. This doesn't mean we have the complete thread (some tweets might be deleted or inaccessible), but it means we've exhausted all available paths.

## Concurrency and Worker Coordination

Multiple workers can run `runScraper` simultaneously against the same database. The `FOR UPDATE SKIP LOCKED` ensures workers don't fight over the same rows. When worker A locks a job, worker B's query skips that row and takes the next one. This provides natural load balancing - workers automatically distribute across available work. If 100 thread jobs exist and 5 workers are running, each worker grabs ~20 jobs per iteration (batch size). The transaction boundaries ensure atomicity - if worker A crashes mid-transaction, its locks release, its transaction rolls back, and worker B can pick up the same job. The use of `onConflictDoNothing` for job creation makes concurrent insertion safe - if two workers both try to create the same thread job (rare race condition), one succeeds and the other silently fails.

## The Self-Healing Property

The system automatically recovers from arbitrary failures. If a worker crashes mid-cursor-search, the query job remains in the database, `oldestTrackedTweet` is already persisted from the previous iteration, and the next worker continues from `max_id:${oldestTrackedTweet - 1}`. If a thread job fails mid-traversal, it remains at its current `nextReplyId`, and the next iteration fetches that parent again (idempotent due to upsert). If the entire system shuts down for maintenance and restarts days later, workers poll, find existing jobs, and resume exactly where they left off. There's no coordinator, no master, no single point of failure - just workers polling a shared queue and making progress.

## Resource Management and Backpressure

The system has no explicit backpressure mechanism, which could be problematic at scale. If suggestions arrive faster than workers can process, the queues grow unbounded. If a user has millions of tweets, the query job continues iteration after iteration, potentially monopolizing worker attention. The daily limit tracking (currently commented out) was probably meant to address this, but without it, the system will keep fetching. The batch processing (100 incomplete users, 20 thread jobs) provides some natural batching to amortize API costs, but doesn't prevent overload. In production, you'd want to add rate limiting on API calls, fairness scheduling (round-robin between query jobs instead of FIFO), and maximum iteration caps.

## The Clever Bits

The use of SQL `LEAST` and `GREATEST` with conditional WHERE clauses is elegant - it pushes all the comparison logic into the database, making it atomic and correct by construction. The opportunistic stub user creation is smart - best-effort data quality improvement without blocking if information is missing. The separation of tracked vs. context tweets via the `tracked` flag on users rather than a field on tweets is clean - the tweet's relationship to tracking is determined by its author, not stored redundantly. The batch processing of thread jobs (up to 20 at once with a single `getByIds` call) is a performance optimization that significantly reduces API overhead compared to one-at-a-time processing.

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      EXTERNAL INPUT                             │
│              twitter_user_suggestions                           │
│              (username, wallet, tracked=true)                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────────┐
        │   processNextSuggestion()          │
        │   - Lock suggestion row            │
        │   - Fetch profile from Twitter API │
        │   - Call upsertUserInfo()          │
        └────────────┬───────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────┐
        │   upsertUserInfo()                 │
        │   - Insert/update twitter_users    │
        │   - Soft-delete suggestion         │
        │   - Create QUERY JOB               │
        └────────────┬───────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────────────────────────┐
        │   twitter_scraping_jobs (Query Job Created)            │
        │   - userId: user's ID                                  │
        │   - query: "from:username"                             │
        │   - cursor: NULL initially                             │
        └────────────┬───────────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────────────────────────┐
        │   processNextJob() - Phase 1: Query Job               │
        │   - Lock query job                                     │
        │   - Get oldestTrackedTweet from twitter_users          │
        │   - If exists: append "max_id:{oldest-1}"              │
        │   - Call advancedSearch()                              │
        └────────────┬───────────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────────────────────────┐
        │   insertTweets()                                       │
        │   - Upsert tweets to scraped_tweet                     │
        │   - Simple upsert, no side effects                     │
        └────────────┬───────────────────────────────────────────┘
                     │
                     ▼
        ┌─────────────────────────────────────────────────────────┐
        │   createJobsForNewTweets()                              │
        │   1. Find min/max tweet IDs in batch                    │
        │   2. For each reply tweet:                              │
        │      - Check if parent exists                           │
        │      - If missing: create THREAD JOB                    │
        │      - If inReplyToUserId: create STUB USER             │
        │   3. Update oldestTrackedTweet/newestTrackedTweet       │
        └────────────┬────────────────────────────────────────────┘
                     │
        ┌────────────┴────────────────────────────────┐
        │                                             │
        ▼                                             ▼
┌────────────────────────────┐      ┌─────────────────────────────┐
│   Thread Job Created       │      │   Stub User Created         │
│   - conversationId         │      │   - id: parent author ID    │
│   - originalReplyId        │      │   - username: NULL          │
│   - nextReplyId: parent ID │      │   - tracked: false          │
└────────────┬───────────────┘      └────────────┬────────────────┘
             │                                    │
             │                                    ▼
             │               ┌─────────────────────────────────────┐
             │               │ processNextIncompleteUsers()        │
             │               │ - Lock up to 100 stub users         │
             │               │ - Batch fetch profiles              │
             │               │ - Hydrate username, profile fields  │
             │               │ - Preserve tracked=false            │
             │               │ - NO query job created              │
             │               └─────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│   processNextJob() - Phase 2: Thread Jobs                       │
│   - Lock up to 20 thread jobs                                   │
│   - For each: check if nextReplyId exists                       │
│   - If exists: finishThreadScraping() (another branch got it)   │
│   - Batch fetch all missing parents with getByIds()             │
│   - For each fetched tweet:                                     │
│     * If not found or is root: finishThreadScraping()           │
│     * If has parent: update job nextReplyId = parent's parent   │
│   - Call insertTweets() for all fetched parents                 │
└─────────────────────────────────────────────────────────────────┘
             │
             ▼
        (Loop continues until job deleted)


┌─────────────────────────────────────────────────────────────────┐
│                    JOB COMPLETION SIGNALS                        │
├─────────────────────────────────────────────────────────────────┤
│ Query Job Deleted When:                                         │
│   - has_next_page = false AND tweets.length = 0                 │
│   → Means: scraped all available tweets for user                │
│                                                                  │
│ Thread Job Deleted When:                                        │
│   - Parent tweet already exists (another branch reached it)     │
│   - Parent tweet not found (deleted/unavailable)                │
│   - Parent tweet is root (no inReplyToId)                       │
│   → Means: walked reply chain to terminus                       │
└─────────────────────────────────────────────────────────────────┘
```

## Worker Priority and Execution Order

```
┌──────────────────────────────────────────────────────────────┐
│                    runScraper() Main Loop                    │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────┐
        │   Start Database Transaction        │
        └──────────────┬──────────────────────┘
                       │
        ┌──────────────▼──────────────────────┐
        │   Priority 1: processNextJob()      │
        │   - Query jobs (cursor search)      │
        │   - Thread jobs (batch of 20)       │
        └──────────────┬──────────────────────┘
                       │
                  ┌────┴─────┐
                  │          │
               Found     Not Found
                  │          │
                  ▼          ▼
              Return   ┌─────────────────────────────────┐
               True    │ Priority 2:                     │
                       │ processNextIncompleteUsers()    │
                       │ - Batch of up to 100            │
                       └──────────┬──────────────────────┘
                                  │
                             ┌────┴─────┐
                             │          │
                          Found     Not Found
                             │          │
                             ▼          ▼
                         Return   ┌──────────────────────────┐
                          True    │ Priority 3:              │
                                  │ processNextSuggestion()  │
                                  │ - Single suggestion      │
                                  └──────────┬───────────────┘
                                             │
                                        ┌────┴─────┐
                                        │          │
                                     Found     Not Found
                                        │          │
                                        ▼          ▼
                                    Return     Return
                                     True      False
                                        │          │
                                        ▼          ▼
                                    Commit    Sleep 60s
                                 Transaction
```

## State Transitions and Invariants

**twitter_users Lifecycle:**

1. Created as stub (id only, username=NULL, tracked=false) by thread job
2. Hydrated by processNextIncompleteUsers (gains username, profile data)
3. Or created directly by suggestion (id, username, all profile data, tracked=true)
4. If tracked=true, query job gets created once
5. oldestTrackedTweet/newestTrackedTweet updated by query jobs only

**twitter_scraping_jobs Lifecycle:**

1. Query job created when tracked user is added
2. Query job iterates, updating oldestTrackedTweet each time
3. Query job deleted when no more tweets available
4. Thread job created when query job finds reply with missing parent
5. Thread job walks up chain, one step per iteration
6. Thread job deleted when reaching root, existing tweet, or not found

**scraped_tweet Lifecycle:**

1. Created by insertTweets (from query or thread job)
2. Updated by insertTweets if already exists (upsert)
3. Never deleted (permanent storage)
4. Can be enriched over time as context becomes tracked

**Invariants:**

- Every tracked user in twitter_users has at most one query job
- Every reply chain has at most one thread job per branch
- oldestTrackedTweet never increases (only moves toward smaller IDs)
- newestTrackedTweet never decreases (only moves toward larger IDs)
- Stub users always have tracked=false
- Context tweets never create query jobs
- Thread jobs never create other thread jobs (only query jobs do)
