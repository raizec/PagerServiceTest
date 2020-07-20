import { PagerServices } from "../../src/logic/PagerServices"
import { mock } from 'jest-mock-extended';
import { IAlertRepo } from "../../src/repos/IAlertRepo";
import { IMonitoredServiceRepo } from "../../src/repos/IMonitoredServiceRepo";
import { IEscalationPolicyService } from "../../src/services/IEscalationPolicyService";
import { ITimerService } from "../../src/services/ITimerService";
import { ISMSService, IEmailService } from "../../src/notification";
import { MonitoredService } from "../../src/domain/MonitoredService";
import { Alert } from "../../src/domain/Alert";


const serviceId = 'service1';
const alertId = 'alert1';
const alertMessage = 'service down';

describe('Given healthy monitored service', () => {

  const mockedAlertRepo = mock<IAlertRepo>();
  const mockedMonitoredServiceRepo = mock<IMonitoredServiceRepo>();
  const mockedEscaltionPolicyService = mock<IEscalationPolicyService>();
  const mockedTimerService = mock<ITimerService>();
  const mockedSMSService = mock<ISMSService>();
  const mockedEmailService = mock<IEmailService>();
  const pagerServices = new PagerServices(
    mockedAlertRepo, mockedMonitoredServiceRepo, 
    mockedEmailService, mockedSMSService, mockedEscaltionPolicyService, mockedTimerService);

  test('Monitored Service becomes Unhealthy', async () => {
    
    const service = new MonitoredService(serviceId);
    const monitoredServiceRepoSpy: jest.SpyInstance = jest
        .spyOn(mockedMonitoredServiceRepo, 'findById')
        .mockResolvedValue(service);
    
    const escalatonPolycyServiceSpy: jest.SpyInstance = jest
        .spyOn(mockedEscaltionPolicyService, 'getMonitoredServiceEscaltionPolicy').mockResolvedValue([[{email: 'myemail@gmail.com'}]]);
    const timerServiceSpy: jest.SpyInstance = jest
        .spyOn(mockedTimerService, 'startTimer').mockResolvedValue();
    const emailServiceSpy: jest.SpyInstance = jest
        .spyOn(mockedEmailService, 'sendMessage').mockResolvedValue();
    const smsServiceSpy: jest.SpyInstance = jest
        .spyOn(mockedSMSService, 'sendMessage').mockResolvedValue();
    let alert!: Alert;
    const alertRepoSpy: jest.SpyInstance = jest
        .spyOn(mockedAlertRepo, 'save').mockImplementation(
          async (newAlert) => {
          alert = newAlert;
          return Promise.resolve(newAlert.id);
        });
    
    expect(service.healthy).toEqual(true);
    await pagerServices.createAlert(serviceId, alertMessage);
    expect(monitoredServiceRepoSpy).toBeCalledTimes(1);
    expect(monitoredServiceRepoSpy).toBeCalledWith(serviceId);
    expect(service.healthy).toEqual(false);
    expect(alertRepoSpy).toBeCalledTimes(1);
    expect(emailServiceSpy).toBeCalledTimes(1);
    expect(emailServiceSpy).toBeCalledWith('myemail@gmail.com', alert);
    expect(smsServiceSpy).toBeCalledTimes(0);
    expect(escalatonPolycyServiceSpy).toBeCalledTimes(1);
    expect(timerServiceSpy).toBeCalledTimes(1);
    expect(timerServiceSpy).toBeCalledWith(alert.id, 15);
  });
});

  describe('Given unhealthy monitored service', () => {
    const mockedAlertRepo = mock<IAlertRepo>();
    const mockedMonitoredServiceRepo = mock<IMonitoredServiceRepo>();
    const mockedEscaltionPolicyService = mock<IEscalationPolicyService>();
    const mockedTimerService = mock<ITimerService>();
    const mockedSMSService = mock<ISMSService>();
    const mockedEmailService = mock<IEmailService>();
    const pagerServices = new PagerServices(
      mockedAlertRepo, mockedMonitoredServiceRepo, 
      mockedEmailService, mockedSMSService, mockedEscaltionPolicyService, mockedTimerService);
    
    const service = new MonitoredService(serviceId);
    service.healthy = false;
    let timerServiceSpy: jest.SpyInstance;
    let emailServiceSpy: jest.SpyInstance;
    let smsServiceSpy: jest.SpyInstance;
    let escalationPolicyServiceSpy: jest.SpyInstance;

  
    beforeEach(async () => {
      jest
        .spyOn(mockedMonitoredServiceRepo, 'findById')
        .mockResolvedValue(service);
      timerServiceSpy = jest
          .spyOn(mockedTimerService, 'startTimer').mockResolvedValue();
      emailServiceSpy = jest
          .spyOn(mockedEmailService, 'sendMessage').mockResolvedValue();
      smsServiceSpy = jest
          .spyOn(mockedSMSService, 'sendMessage').mockResolvedValue();

      escalationPolicyServiceSpy = jest
        .spyOn(mockedEscaltionPolicyService, 'getMonitoredServiceEscaltionPolicy').mockResolvedValue(
          [[{email: 'level1@gmail.com'}], 
          [{email: 'level2@gmail.com'}, {phoneNumber: 'level2_phone'}]
    ]);
    });
  
    afterEach(async () => {
      jest.resetAllMocks();
    });

    test('the Pager notifies all targets of the next level of the escalation policy', async () => {
      const alert: Alert = new Alert(serviceId, alertMessage);
      alert.escalationLevel = 0;
      
      
      
      const alertRepoSpy: jest.SpyInstance = jest
          .spyOn(mockedAlertRepo, 'findById').mockResolvedValue(alert);
      
      await pagerServices.timeout(alert.id);
      expect(alertRepoSpy).toBeCalledTimes(1);
      expect(alertRepoSpy).toBeCalledWith(alert.id);
      expect(timerServiceSpy).toBeCalledTimes(1);
      expect(timerServiceSpy).toBeCalledWith(alert.id, 15);
      expect(service.healthy).toEqual(false);
      expect(emailServiceSpy).toBeCalledTimes(1);
      expect(emailServiceSpy).toBeCalledWith('level2@gmail.com', alert);
      expect(smsServiceSpy).toBeCalledTimes(1);
      expect(smsServiceSpy).toBeCalledWith('level2_phone', alert);
    });

    test('when the Pager receives the Acknowledgement and later an Acknowledgement timeout, the Pager doesnt notify any Target and doesnt set an acknowledgement delay', async () => {
      const alert: Alert = new Alert(serviceId, alertMessage);
      
      const alertRepoSpy: jest.SpyInstance = jest
          .spyOn(mockedAlertRepo, 'findById').mockResolvedValue(alert);
      const alertRepoSpySave: jest.SpyInstance = jest
          .spyOn(mockedAlertRepo, 'save').mockResolvedValue(alert.id);
      
      await pagerServices.ackAlert(alert.id);
      expect(alertRepoSpy).toBeCalledTimes(1);
      expect(alertRepoSpy).toBeCalledWith(alert.id);
      expect(alertRepoSpySave).toBeCalledTimes(1);
      expect(service.healthy).toEqual(false);
      await pagerServices.timeout(alert.id);
      expect(service.healthy).toEqual(false);
      expect(escalationPolicyServiceSpy).toBeCalledTimes(0);
      expect(emailServiceSpy).toBeCalledTimes(0);
      expect(smsServiceSpy).toBeCalledTimes(0);
    });

    test('when the Pager receives an Alert the Pager doesnt notify any Target and doesnt set an acknowledgement delay', async () => {
      const alert: Alert = new Alert(serviceId, alertMessage);
      const alertRepoSpy: jest.SpyInstance = jest
          .spyOn(mockedAlertRepo, 'save').mockResolvedValue(alert.id);
      
      await pagerServices.createAlert(serviceId, alertMessage);
      expect(alertRepoSpy).toBeCalledTimes(0);
      expect(service.healthy).toEqual(false);
      expect(escalationPolicyServiceSpy).toBeCalledTimes(0);
      expect(emailServiceSpy).toBeCalledTimes(0);
      expect(smsServiceSpy).toBeCalledTimes(0);
    });

    test('when the Pager receives a Healthy event and later receives the Acknowledgement Timeout, then the Monitored Service becomes Healthy, the Pager doesnt notify any Target and doesnt set an acknowledgement delay', async () => {
      const alert: Alert = new Alert(serviceId, alertMessage);
      const alertRepoSpy: jest.SpyInstance = jest
          .spyOn(mockedAlertRepo, 'findById').mockResolvedValue(alert);
      
      await pagerServices.setHealthy(serviceId);
      expect(service.healthy).toEqual(true);
      await pagerServices.timeout(alert.id);
      expect(service.healthy).toEqual(true);
      expect(escalationPolicyServiceSpy).toBeCalledTimes(0);
      expect(emailServiceSpy).toBeCalledTimes(0);
      expect(smsServiceSpy).toBeCalledTimes(0);
    });


});