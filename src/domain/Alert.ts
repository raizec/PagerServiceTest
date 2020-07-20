import { EntityId } from "./EntityId";

export class Alert {
  private _id: EntityId;
  private _message: string;
  private _monitoredServiceId: string;
  private _ack: boolean;
  private _escalationLevel: number;

  constructor(monitoredServiceId: string, message: string) {
    this._id = new EntityId();
    this._monitoredServiceId = monitoredServiceId;
    this._message  = message;
    this._ack = false;
    this._escalationLevel = -1;
  }

  get id(): string {
    return this._id.id;
  }

  set ack(ack: boolean) {
    this._ack = ack;
  }

  get ack(): boolean {
    return this._ack;
  }

  get monitoredServiceId(): string {
    return this._monitoredServiceId;
  }

  get escalationLevel(): number {
    return this._escalationLevel;
  }

  set escalationLevel(level: number) {
    this._escalationLevel = level;
  }
}