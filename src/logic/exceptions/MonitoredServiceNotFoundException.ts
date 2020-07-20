export class MonitoredServiceNotFoundException extends Error {
  constructor(monitoredServiceId: string) {
    super(`Monitored service not found ${monitoredServiceId}`);
  }
}