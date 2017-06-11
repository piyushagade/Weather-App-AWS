import { Injectable } from '@angular/core';
import { Http, Jsonp } from '@angular/http'
import 'rxjs/Rx';
import { Observable } from 'rxjs/Observable'

@Injectable()
export class GeocoderService{
    server = 'ec2-34-210-238-35.us-west-2.compute.amazonaws.com'

    url_getcoords = "http://" + this.server + ":3000/locate/";
    url_getname = "https://maps.googleapis.com/maps/api/geocode/json?latlng=";

    constructor(private _http: Http){}

    getCoords(name: string){
        return this._http.get(this.url_getcoords + name)
            .map(response => response.json())
            .catch(error => {
                console.log("Error fetching JSON");
                return Observable.throw(error.json())
            });
    }

    getCityName(lat: string, long: string){
        return this._http.get(this.url_getname + lat + "," + long)
            .map(response => response.json())
            .catch(error => {
                console.log("Error fetching JSON");
                return Observable.throw(error.json())
            });
    }
}