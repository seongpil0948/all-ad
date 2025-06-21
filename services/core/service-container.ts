/**
 * Simple Dependency Injection Container for Services
 * Manages service instances and their dependencies
 */
export class ServiceContainer {
  private static instance: ServiceContainer;
  private services = new Map<string, any>();
  private factories = new Map<string, () => any>();
  private singletons = new Map<string, any>();

  private constructor() {}

  static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }

    return ServiceContainer.instance;
  }

  /**
   * Register a service factory
   */
  register<T>(
    token: string,
    factory: () => T,
    options?: { singleton?: boolean },
  ): void {
    this.factories.set(token, factory);

    if (options?.singleton) {
      // Pre-create singleton instances
      this.singletons.set(token, factory());
    }
  }

  /**
   * Register a value directly
   */
  registerValue<T>(token: string, value: T): void {
    this.services.set(token, value);
  }

  /**
   * Get a service instance
   */
  get<T>(token: string): T {
    // Check for direct values first
    if (this.services.has(token)) {
      return this.services.get(token) as T;
    }

    // Check for singletons
    if (this.singletons.has(token)) {
      return this.singletons.get(token) as T;
    }

    // Create from factory
    const factory = this.factories.get(token);

    if (!factory) {
      throw new Error(`Service "${token}" not registered`);
    }

    return factory() as T;
  }

  /**
   * Check if a service is registered
   */
  has(token: string): boolean {
    return (
      this.services.has(token) ||
      this.factories.has(token) ||
      this.singletons.has(token)
    );
  }

  /**
   * Clear all registrations (useful for testing)
   */
  clear(): void {
    this.services.clear();
    this.factories.clear();
    this.singletons.clear();
  }
}

// Export singleton instance
export const container = ServiceContainer.getInstance();
