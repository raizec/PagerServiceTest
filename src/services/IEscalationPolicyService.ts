import { TargetDTO } from "./TargetDto";

export interface IEscalationPolicyService {
  /**
   * 
   * @param monitoredServiceId 
   * @returns ordered list of notification targets.
   */
  getMonitoredServiceEscaltionPolicy(monitoredServiceId: string): Promise<Array<Array<TargetDTO>>>;
}