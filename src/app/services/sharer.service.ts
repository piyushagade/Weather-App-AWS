import { Injectable, Inject } from '@angular/core';
import { Subject }    from 'rxjs/Subject';

@Injectable()
export class SharerService {
  private notify = new Subject<any>();

  notifyObservable$ = this.notify.asObservable();

  constructor(){}

  public sendWeatherData(data: any) {
      this.notify.next(data);
  }
  
  public sendWeatherHistory(data: any[]) {
    this.notify.next(data);
  }

  public sendCityName(data: any) {
    this.notify.next(data);
  }
  
  public sendLocationDenied(data: any) {
    this.notify.next(data);
  }
}