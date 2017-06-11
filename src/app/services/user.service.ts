import { Injectable } from '@angular/core';
import { Http, Jsonp } from '@angular/http'
import { Observable } from 'rxjs/Observable';

@Injectable()
export class UserService{
    server = 'ec2-54-202-210-202.us-west-2.compute.amazonaws.com'

    add = "http://" + this.server + ":3000/favourites/add/**/**";
    get = "http://" + this.server + ":3000/favourites/**";
    remove = "http://" + this.server + ":3000/favourites/remove/**";
    
    constructor(private _jsonp: Jsonp, private _http: Http){}

    // Add data to backend api
    addFavourite(name: string, uid: string){
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