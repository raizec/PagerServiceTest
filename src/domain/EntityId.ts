import { v1 as uuidv1 } from 'uuid';

export class EntityId {

  private _id: string;
  constructor() {
    this._id = uuidv1();
  }
  get id(): string {
    return this._id;
  }
}