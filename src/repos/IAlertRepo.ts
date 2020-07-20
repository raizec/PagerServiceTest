import { Alert } from "../domain/Alert";

export interface IAlertRepo {
  findById(id: string): Promise<Alert>;
  save(alert: Alert): Promise<string>;
}
