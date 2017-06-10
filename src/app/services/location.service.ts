import { Injectable } from '@angular/core';
import { Observer } from 'rxjs/Observer';
import { Observable } from 'rxjs/Observable';
import { Http, Jsonp, RequestOptions } from '@angular/http';
import {Headers} from '@angular/http';


@Injectable() 
export class GeolocationService {
    gl = "https://www.googleapis.com/geolocation/v1/geolocate?key=";

    constructor(private _jsonp: Jsonp, private _http: Http) { }

    getCurrentPosition(): Observable<Position> {
        return new Observable((observer: Observer<Position>) => {
            navigator.geolocation.getCurrentPosition(
                (position: Position) => {
                    observer.next(position);
                    observer.complete();
                },
                (error: PositionError) => {
                    console.log('Geolocation service: ' + error.message);
                    observer.error(error);
                }
            );
        });
    }

    
    getCurrentPositionAPI(): Observable<any> {
    let headers = new Headers({ 'Content-Type': 'application/json' });
    let options = new RequestOptions({ headers: headers });
    
    return this._http.post(this.gl + 'AIzaSyC0CcQP1oC1XdNMzWDnptETgYOrEId5Zs8',
          {
            headers: headers
          }).map(response => response.json())
          .catch(error => {
                console.log("Error fetching location");
                return Observable.throw(error.json())
            });
    }
}