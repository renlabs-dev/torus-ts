import type { BaseSwarmMemoryApiClient } from "../client.js";
import { ListTasksResponseSchema } from "../schemas/task.js";
import type { Task } from "../schemas/task.js";
import { SWARM_ENDPOINTS } from "../utils/constants.js";

/**
 * Tasks endpoint for SwarmMemory API
 *
 * Provides methods to interact with task data in SwarmMemory:
 * - List tasks with their status and priority
 * - Tasks represent work items like scraping tweets or finding predictions
 *
 * @example
 * ```ts
 * const client = new SwarmMemory({ mnemonic: '...' });
 *
 * // List all tasks
 * const tasks = await client.tasks.list();
 *
 * // Filter for tweet scraping tasks
 * const scrapeTasks = tasks.filter(
 *   task => task.task_type === 'ScrapeAllTweetsOfUser'
 * );
 * ```
 */
export class TasksEndpoint {
  constructor(readonly client: BaseSwarmMemoryApiClient) {}

  /**
   * List all tasks from SwarmMemory
   *
   * Tasks represent work items that need to be processed, such as:
   * - ScrapeAllTweetsOfUser: Fetch all tweets from a specific user
   * - ScrapeAllTweetsOfCashtag: Fetch all tweets for a cashtag
   * - FindAllPredictionsOfUser: Find predictions by a user
   * - FindAllPredictionsOfTopic: Find predictions on a topic
   *
   * @returns Array of Task objects with status, priority, and work details
   */
  async list(): Promise<Task[]> {
    return this.client.get(
      SWARM_ENDPOINTS.TASKS_LIST,
      {},
      ListTasksResponseSchema,
    );
  }

  /**
   * Get pending tasks sorted by priority
   *
   * @returns Array of pending tasks sorted by priority (highest first)
   */
  async getPending(): Promise<Task[]> {
    const tasks = await this.list();
    return tasks
      .filter((task) => task.status === "Pending")
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * Get tasks for scraping user tweets
   *
   * @returns Array of ScrapeAllTweetsOfUser tasks
   */
  async getUserScrapeTasks(): Promise<Task[]> {
    const tasks = await this.list();
    return tasks.filter((task) => task.task_type === "ScrapeAllTweetsOfUser");
  }

  /**
   * Get tasks for scraping cashtag tweets
   *
   * @returns Array of ScrapeAllTweetsOfCashtag tasks
   */
  async getCashtagScrapeTasks(): Promise<Task[]> {
    const tasks = await this.list();
    return tasks.filter(
      (task) => task.task_type === "ScrapeAllTweetsOfCashtag",
    );
  }
}
