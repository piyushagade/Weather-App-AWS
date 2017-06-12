/*
    This services does two things:
        1. Get suggestions as user keys in a new location name.
        2. Get city name from the user's latitude and longitude
*/

import { Injectable } from '@angular/core';
import { Http, Jsonp } from '@angular/http'
import 'rxjs/Rx';
import { Observable } from 'rxjs/Observable'
import * as config from '../config/aws';
import * as api from '../config/google';

@Injectable()
export class GeocoderService{

    constructor(private _http: Http){}

    getSuggestions(name: string){
        return this._http.get("http://" + config.server + ":3000/locate/" + name)
            .map(response => response.json())
            .catch(error => {
                console.log("Error fetching JSON");
                return Observable.throw(error.json())
            });
    }

    getCityName(lat: string, long: string){
        return this._http.get("http://" + config.server + ":3000/locate/" + lat + "," + long)
            .map(response => response.json())
            .catch(error => {
                console.log("Error fetching JSON");
                return Observable.throw(error.json())
            });
    }
}