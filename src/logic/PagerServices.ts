import { IAlertRepo } from "../repos/IAlertRepo";
import { IMonitoredServiceRepo } from "../repos/IMonitoredServiceRepo";
import { IEmailService, ISMSService } from "../notification";
import { MonitoredService } from "../domain/MonitoredService";
import { MonitoredServiceNotFoundException } from "./exceptions/MonitoredServiceNotFoundException";
import { Alert } from "../domain/Alert";
import { AlertNotFoundException } from "./exceptions/AlertNotFoundException";
import { IEscalationPolicyService } from "../services/IEscalationPolicyService";
import { TargetDTO } from "../services/TargetDto";
import { ITimerService } from "../services/ITimerService";

export class PagerServices {
  private _alertRepo: IAlertRepo;
  private _monitoredServiceRepo: IMonitoredServiceRepo;
  private _emailService: IEmailService;
  private _smsService: ISMSService;
  private _escalationPolicyService: IEscalationPolicyService;
  private _timerService: ITimerService;

  constructor(
    alertRepo:IAlertRepo, monitoredServiceRepo: IMonitoredServiceRepo, 
    emailService: IEmailService, smsService: ISMSService, 
    escalationPolicyService: IEscalationPolicyService,
    timerService: ITimerService) {
    this._alertRepo = alertRepo;
    this._monitoredServiceRepo = monitoredServiceRepo;
    this._emailService = emailService;
    this._smsService = smsService;
    this._escalationPolicyService = escalationPolicyService;
    this._timerService = timerService;
  }

  async createAlert(monitoredServiceId: string, alertMessage: string) {
    const service = await this._monitoredServiceRepo.findById(monitoredServiceId);
    if(!service) {
      throw new MonitoredServiceNotFoundException(monitoredServiceId);
    }
    if(service.healthy) {
      await this._updateHealthy(service, false);
      const newAlert = new Alert(monitoredServiceId, alertMessage);
      await this._escaleteAndSetTimeout(newAlert);
    }
  }

  async ackAlert(alertId: string) {
    const alert = await this._alertRepo.findById(alertId);
    if(!alert) {
      throw new AlertNotFoundException(alertId);
    }
    alert.ack = true;
    await this._alertRepo.save(alert);
  }

  async setHealthy(monitoredServiceId: string) {
    const service = await this._monitoredServiceRepo.findById(monitoredServiceId);
    if(!service) {
      throw new MonitoredServiceNotFoundException(monitoredServiceId);
    }
    await this._updateHealthy(service, true);
  }

  async timeout(alertId: string) {
    const alert = await this._getAlert(alertId);
    const monitoredService = await this._getMonitoredService(alert.monitoredServiceId);
    if(!alert.ack && !monitoredService.healthy) {
      await this._escaleteAndSetTimeout(alert);
    }
  }

  private async _getMonitoredService(monitoredServiceId: string): Promise<MonitoredService> {
    const service = await this._monitoredServiceRepo.findById(monitoredServiceId);
    if(!service) {
      throw new MonitoredServiceNotFoundException(monitoredServiceId);
    }
    return Promise.resolve(service);
  }

  private async _getAlert(alertId: string): Promise<Alert> {
    const alert = await this._alertRepo.findById(alertId);
    if(!alert) {
      throw new AlertNotFoundException(alertId);
    }
    return Promise.resolve(alert);
  }

  private async _escaleteAndSetTimeout(alert: Alert) {
    await this._escalateToNextLevel(alert);
    alert.escalationLevel = alert.escalationLevel + 1;
    await this._alertRepo.save(alert);
    await this._timerService.startTimer(alert.id, 15);
  }

  

  private async _updateHealthy(monitoredService: MonitoredService, healthy: boolean) {
    monitoredService.healthy = healthy;
    await this._monitoredServiceRepo.save(monitoredService);
  }

  private async _escalateToNextLevel(alert: Alert) {
    const levels = await this._escalationPolicyService.getMonitoredServiceEscaltionPolicy(alert.monitoredServiceId);
    const nextLevel = alert.escalationLevel + 1;
    if(levels && nextLevel < levels.length) {
      await this._sendNotificationToTarget(levels[nextLevel], alert);
    }
  }

  private async _sendNotificationToTarget(targets: Array<TargetDTO>, alert: Alert) {
    Promise.all(targets.map(
      (target) => {
        if(target.phoneNumber) {
          this._smsService.sendMessage(target.phoneNumber, alert);
          return;
        }
        if(target.email) {
          this._emailService.sendMessage(target.email, alert);
        }
      }));
  }

}