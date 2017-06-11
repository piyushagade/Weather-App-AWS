import { Injectable } from '@angular/core';
import { Http, Jsonp } from '@angular/http'
import { Observable } from 'rxjs/Observable';
import * as config from '../config/aws';

@Injectable()
export class UserService{
    add = "http://" + config.server + ":3000/favourites/add/**/**";
    get = "http://" + config.server + ":3000/favourites/**";
    remove = "http://" + config.server + ":3000/favourites/remove/**";
    
    constructor(private _jsonp: Jsonp, private _http: Http){}

    // Add data to backend api
    addFavourite(name: string, uid: string){
        console.log();

        return this._http.get(this.add.replace("**", uid).replace("**", name))
            .map(response => response.json())
            .catch(error => {
                console.log("Error add to favourites.");
                return Observable.throw(error)
            });
    }

    // Get data from backend api
    getFavourite(uid: string){
        return this._http.get(this.get.replace("**", uid))
            .map(response => response.json())
            .catch(error => {
                console.log("Error fetching JSON");
                return Observable.throw(error.json())
            });
    }

    // Delete data from backend api
    removeFavourite(id: string){
        return this._http.get(this.remove.replace("**", id))
            .map(response => response.json())
            .catch(error => {
                console.log("Error fetching JSON");
                return Observable.throw(error.json())
            });
    }
}