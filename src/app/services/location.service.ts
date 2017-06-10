import { Injectable } from '@angular/core';
import { Observer } from 'rxjs/Observer';
import { Observable } from 'rxjs/Observable';
import { Http, Jsonp } from '@angular/http';


@Injectable() 
export class GeolocationService {

    constructor(private _jsonp: Jsonp) { }

    getCurrentPosition(): Observable<Position> {
        return new Observable((observer: Observer<Position>) => {
            // Invokes getCurrentPosition method of Geolocation API.
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

    autocompleteCities(name: string) {
        
    }

    

}