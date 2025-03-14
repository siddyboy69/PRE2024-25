import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private messages: string[] = [];

  constructor() { }

  addMessage(message: string): void {
    this.messages.push(message);
  }

}

