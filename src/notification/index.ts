import { Alert } from "../domain/Alert";

export interface IEmailService {
  sendMessage(email:string, alert: Alert): Promise<void>;
}

export interface ISMSService {
  sendMessage(phoneNumber:string, alert: Alert): Promise<void>;
}