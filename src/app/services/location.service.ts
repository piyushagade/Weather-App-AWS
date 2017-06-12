/*
    This service gets user's location using google api and forwards the data to HomeComponent
*/

import { Injectable } from '@angular/core';
import { Observer } from 'rxjs/Observer';
import { Observable } from 'rxjs/Observable';
import { Http, Jsonp, RequestOptions } from '@angular/http';
import { Headers } from '@angular/http';
import * as api from '../config/google';


@Injectable() 
export class GeolocationService {
    constructor(private _jsonp: Jsonp, private _http: Http) { }
    
    getCurrentPositionAPI(): Observable<any> {
    let headers = new Headers({ 'Content-Type': 'application/json' });
    let options = new RequestOptions({ headers: headers });
    
    return this._http.post(api.google.gl_url + api.google.key,
        {
            headers: headers
        }).map(response => response.json())
        .catch(error => {
            console.log("Error fetching location");
            return Observable.throw(error.json())
        });
    }
}