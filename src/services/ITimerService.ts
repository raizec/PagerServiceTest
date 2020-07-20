export interface ITimerService {
  /**
   * 
   * @param id alert id
   * @param period timer duration (minutes)
   */
  startTimer(id: string, period: number): Promise<void>;
}