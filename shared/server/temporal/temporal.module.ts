import { Module, Provider } from '@nestjs/common';
import { TemporalModule, TemporalService } from 'nestjs-temporal-core';

export const getTemporalModule = (
  isWorkers: boolean,
  path?: string,
  activityClasses?: any[],
) => {
  // If TEMPORAL_ADDRESS is not set, return a module with a null TemporalService
  if (!process.env.TEMPORAL_ADDRESS) {
    const nullTemporalServiceProvider: Provider = {
      provide: TemporalService,
      useValue: null,
    };

    @Module({
      providers: [nullTemporalServiceProvider],
      exports: [TemporalService],
      global: true,
    })
    class NullTemporalModule {}
    return NullTemporalModule;
  }

  return TemporalModule.register({
    isGlobal: true,
    connection: {
      address: process.env.TEMPORAL_ADDRESS,
      namespace: process.env.TEMPORAL_NAMESPACE || 'default',
    },
    taskQueue: 'main',
    ...(isWorkers
      ? {
          worker: {
            workflowsPath: path!,
            activityClasses: activityClasses!,
            autoStart: true,
            workerOptions: {
              maxConcurrentActivityTaskExecutions: 24,
            },
          },
        }
      : {}),
  });
};
