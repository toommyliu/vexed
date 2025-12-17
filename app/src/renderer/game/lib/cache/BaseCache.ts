/**
 * Base class for simple key-value caches with static access pattern.
 * Provides common Map operations with a consistent API.
 *
 * Note: This is an abstract base to document the shared pattern.
 * Concrete caches (QuestCache, AuraCache) implement their own static Maps
 * since TypeScript static inheritance has limitations.
 */
export abstract class BaseCache { }
