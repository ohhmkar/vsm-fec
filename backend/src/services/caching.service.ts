import NodeCache from 'node-cache';

export const cache = {
  cachingService: new NodeCache({ useClones: false }),
  get<T>(key: string) {
    return this.cachingService.get<T>(key);
  },
  set<T>(key: string, body: T, duration: number | string) {
    return this.cachingService.set<T>(key, body, duration);
  },
  flushAll() {
    this.cachingService.flushAll();
  },
};
