import { MonitoredService } from "../domain/MonitoredService";

export interface IMonitoredServiceRepo {
  findById(id: string): Promise<MonitoredService>;
  save(monitoredService: MonitoredService): Promise<void>;
}