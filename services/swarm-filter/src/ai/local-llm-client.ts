// AI GENERATED BABUSHKA THAT DOESNT REALLY PERFORM WELL
// import { BasicLogger } from "@torus-network/torus-utils/logger";
// import type {
//   Llama,
//   LlamaContext,
//   LlamaJsonSchemaGrammar,
//   LlamaModel,
// } from "node-llama-cpp";
// import { getLlama, LlamaChatSession } from "node-llama-cpp";
// import pLimit from "p-limit";
// import type { z } from "zod";
// import { zodToJsonSchema } from "zod-to-json-schema";
// import { PredictionCheckSchema } from "../schemas/llm-response";

// const logger = BasicLogger.create({ name: "local-llm" });

// export interface LocalLLMConfig {
//   modelPath: string;
//   contextSize?: number;
//   timeout?: number;
//   gpuLayers?: number;
//   poolSize?: number;
// }

// export interface LocalCompletionOptions {
//   temperature?: number;
//   maxTokens?: number;
//   timeout?: number;
// }

// /**
//  * Local LLM Client
//  *
//  * Wraps node-llama-cpp to provide local inference with structured JSON output.
//  * Uses GGUF models for fast, offline prediction filtering.
//  *
//  * The model is loaded once and reused. A pool of contexts allows parallel inference.
//  * Uses p-limit to ensure max N concurrent operations (matching pool size).
//  */
// export class LocalLLMClient {
//   private llama: Llama | null = null;
//   private model: LlamaModel | null = null;
//   private contextPool: LlamaContext[] = [];
//   // Grammar type is complex due to node-llama-cpp's GBNF types
//   // The actual schema is derived from PredictionCheckSchema at runtime
//   private grammar: Awaited<
//     ReturnType<Llama["createGrammarForJsonSchema"]>
//   > | null = null;
//   private limiter: ReturnType<typeof pLimit>;
//   private modelPath: string;
//   private contextSize: number;
//   private defaultTimeout: number;
//   private gpuLayers: number;
//   private poolSize: number;
//   private initialized = false;

//   constructor(config: LocalLLMConfig) {
//     this.modelPath = config.modelPath;
//     this.contextSize = config.contextSize ?? 512;
//     this.defaultTimeout = config.timeout ?? 15000;
//     this.gpuLayers = config.gpuLayers ?? 0;
//     this.poolSize = config.poolSize ?? 8; // Default 8 parallel contexts
//     this.limiter = pLimit(this.poolSize); // Limit concurrent operations
//   }

//   /**
//    * Initialize the model (call once on startup)
//    *
//    * Loads the GGUF model, creates a pool of contexts, and prepares grammar.
//    * This is expensive and should only be done once at application startup.
//    */
//   async initialize(): Promise<void> {
//     if (this.initialized) {
//       return;
//     }

//     try {
//       logger.info(`Loading model from: ${this.modelPath}`);

//       // Get llama instance
//       this.llama = await getLlama();

//       // Load model (expensive, do once)
//       this.model = await this.llama.loadModel({
//         modelPath: this.modelPath,
//         gpuLayers: this.gpuLayers,
//       });
//       logger.info("Model loaded");

//       // Create pool of contexts for parallel inference
//       logger.info(`Creating context pool (size: ${this.poolSize})...`);
//       for (let i = 0; i < this.poolSize; i++) {
//         const context = await this.model.createContext({
//           contextSize: this.contextSize,
//         });
//         this.contextPool.push(context);
//       }
//       logger.info(
//         `Context pool created (${this.poolSize} contexts, ${this.contextSize} tokens each)`,
//       );

//       // Create grammar (do once)
//       const jsonSchema = zodToJsonSchema(PredictionCheckSchema);
//       this.grammar = await this.llama.createGrammarForJsonSchema(
//         jsonSchema as any, // Type assertion needed for node-llama-cpp compatibility
//       );
//       logger.info("Grammar created");

//       this.initialized = true;
//       logger.info(
//         `Initialization complete - ready for ${this.poolSize}x parallel inference`,
//       );
//     } catch (error) {
//       throw new Error(
//         `Failed to initialize local LLM: ${error instanceof Error ? error.message : String(error)}`,
//       );
//     }
//   }

//   /**
//    * Complete with structured JSON output
//    *
//    * Uses grammar constraints to ensure valid JSON responses that conform
//    * to the provided Zod schema. Throws on timeout or failure.
//    * Automatically manages concurrent access using p-limit.
//    *
//    * @param systemPrompt - System message defining the AI's role
//    * @param userPrompt - User message with the actual request
//    * @param outputSchema - Zod schema for validation
//    * @param options - Optional temperature, maxTokens, and timeout overrides
//    * @returns Validated response matching the schema
//    * @throws Error if inference times out or fails
//    */
//   async completeStructured<T>(
//     systemPrompt: string,
//     userPrompt: string,
//     outputSchema: z.ZodType<T>,
//     options?: LocalCompletionOptions,
//   ): Promise<T> {
//     if (!this.initialized || !this.llama) {
//       throw new Error(
//         "LocalLLMClient not initialized. Call initialize() first.",
//       );
//     }

//     const timeout = options?.timeout ?? this.defaultTimeout;
//     const temperature = options?.temperature ?? 0.1;
//     const maxTokens = options?.maxTokens ?? 512;

//     // Use p-limit to ensure max poolSize concurrent operations
//     return this.limiter(async () => {
//       let context: LlamaContext | null = null;

//       try {
//         // Acquire a context from the pool
//         context = this.contextPool.pop() ?? null;
//         if (!context) {
//           logger.error("No contexts available in pool");
//           throw new Error("No contexts available in pool");
//         }

//         // Create a timeout promise
//         const timeoutPromise = new Promise<null>((resolve) => {
//           setTimeout(() => resolve(null), timeout);
//         });

//         // Create the inference promise
//         const inferencePromise = this.runInference(
//           context,
//           systemPrompt,
//           userPrompt,
//           outputSchema,
//           temperature,
//           maxTokens,
//         );

//         // Race between inference and timeout
//         const result = await Promise.race([inferencePromise, timeoutPromise]);

//         if (result === null) {
//           throw new Error("Inference timed out");
//         }

//         return result;
//       } catch (error) {
//         logger.error(
//           `Inference failed: ${error instanceof Error ? error.message : String(error)}`,
//         );
//         throw error;
//       } finally {
//         // Always return context to pool
//         if (context) {
//           this.contextPool.push(context);
//         }
//       }
//     });
//   }

//   /**
//    * Run the actual inference using a context from the pool
//    */
//   private async runInference<T>(
//     context: LlamaContext,
//     systemPrompt: string,
//     userPrompt: string,
//     outputSchema: z.ZodType<T>,
//     temperature: number,
//     maxTokens: number,
//   ): Promise<T | null> {
//     if (!this.grammar) {
//       logger.error("Grammar not initialized");
//       return null;
//     }

//     let sequence = null;

//     try {
//       // Get a sequence from the context
//       sequence = context.getSequence();

//       // Create chat session
//       const session = new LlamaChatSession({
//         contextSequence: sequence,
//       });

//       // Combine system and user prompts
//       const fullPrompt = `${systemPrompt}\n\n${userPrompt}\n\nRespond with valid JSON only:`;

//       // Run inference (fast - no loading/unloading)
//       const response = await session.prompt(fullPrompt, {
//         grammar: this.grammar,
//         temperature,
//         maxTokens,
//       });

//       // Parse and validate JSON
//       const jsonResponse: unknown = JSON.parse(response);
//       const validatedResponse = outputSchema.parse(jsonResponse);

//       return validatedResponse;
//     } catch (error) {
//       logger.error(
//         `Inference error: ${error instanceof Error ? error.message : String(error)}`,
//       );
//       return null;
//     } finally {
//       // CRITICAL: Always dispose sequence before returning context to pool
//       if (sequence) {
//         try {
//           sequence.dispose();
//         } catch (error) {
//           logger.error("Failed to dispose sequence:", error);
//         }
//       }
//     }
//   }

//   /**
//    * Check if the client is initialized
//    */
//   isInitialized(): boolean {
//     return this.initialized;
//   }

//   /**
//    * Dispose of resources
//    */
//   async dispose(): Promise<void> {
//     logger.info("Disposing resources...");
//     for (const context of this.contextPool) {
//       await context.dispose();
//     }
//     this.contextPool = [];
//     if (this.model) {
//       await this.model.dispose();
//       this.model = null;
//     }
//     this.grammar = null;
//     this.llama = null;
//     this.initialized = false;
//     logger.info("Resources disposed");
//   }
// }
