export class AlertNotFoundException extends Error {
  constructor(alertId: string) {
    super(`Alert not found ${alertId}`);
  }
}