import { EntityId } from "./EntityId";

export class MonitoredService {
  private _id: string;
  private _healthy: boolean;

  constructor(id: string) {
    this._id = id;
    this._healthy = true;
  }

  get healthy(): boolean {
    return this._healthy;
  }
  set healthy(isHealthy: boolean) {
    this._healthy = isHealthy;
  }
}