//const api = 'http://127.0.0.1:8000/api/'
const { app } = window.require('@electron/remote')
var fs = window.require('fs'),
   p = window.require('path'),    
    filePath = p.join(__dirname, 'config.json');

    const path = app.getAppPath() + '/config.json'



/* fs.readFile(path, {encoding: 'utf-8'}, function(err,data){
    if (!err) {
        console.log('received data: ' + data);
        //let d = data;
        api = data.api_base
    } else {
        console.log(err);
    }
}); */

let data = fs.readFileSync(path,{encoding: 'utf-8'});
console.log(data);
console.log(typeof(data));
let api = JSON.parse(data).api_base;

//const data = require(path+'/config.json');


function set_header(token = null){
    try {
        console.log(token);
        if ( token == null){
            var obj = {
                'Content-Type': 'application/json',
            }
        } else {
            var obj = {
                'Content-Type': 'application/json',
                'Authorization' : 'Bearer '+token
            }
        }
        
        console.log(obj);
        return obj
    } catch (error) {
        console.log(error);
        
    }
   
}


export async function get_token(username = null , password = null){

    let body = {
        username,
        password
    }

    let headers = set_header();

    let options = {
        method : 'post',
        body : JSON.stringify(body),
        headers : headers
    }

    

    let preResp = await fetch(api + 'token', options);
    if (preResp.ok){
        console.log('got token');
        var resp = await preResp.json();
        let access = resp.access;
        let refresh = resp.refresh;
        sessionStorage.setItem('refreshToken',refresh);
        sessionStorage.setItem('accessToken',access);
        resp = await isLogged();
        return resp;
    }else{
        return false;
    }
    
    
}


export async function register(username = null, email = null , password = null){

    let body = {
        email,
        username,
        password
    }

    let headers = set_header();

    let options = {
        method : 'post',
        body : JSON.stringify(body),
        headers : headers
    }

    

    let preResp = await fetch(api + 'register', options);
    
    if (preResp.ok) {
        let nextresp = await get_token(username,password);
        return nextresp;

    }else{
        return false
    }
    

}



export async function refreshToken(){
    let refresh = sessionStorage.getItem('refreshToken');
    let headers = set_header();
    let options = {
        method : 'post',
        body : JSON.stringify({
            refresh
        }),
        headers : headers

    }

    let preResp = await fetch(api + 'token/refresh' , options);
    if (preResp.ok){
        let resp = await preResp.json();
        let access = resp.access;
        sessionStorage.setItem('accessToken',access);
        return true;

    }else{
        console.log('need to login');
        return false;
    }


}

export async function set_vidiq_account(url,username = null , password = null){
    let access = sessionStorage.getItem('accessToken');
    let headers = set_header(access);

    let body = {
        email : username,
        password : password
    }

    let options  = {
        method : 'post',
        body : JSON.stringify(body),
        headers : headers
    }

    let preResp = await fetch(api + url,options);
    if (preResp.ok){
        let resp = await preResp.json();
        console.log(resp);
        return resp;
    }else if (preResp.status == 401){
        let dec = await refreshToken();
        if (dec){
            set_vidiq_account(url,username,password);
        }else{
            
            return false;
        }
    }else {
        console.log('other errors');
        return false;
    }

}


export async function postReq(url,body){
    let access = sessionStorage.getItem('accessToken');
    let headers = set_header(access);

    /* let body = {
        title,
        keywords
    } */

    let options  = {
        method : 'post',
        body : JSON.stringify(body),
        headers : headers
    }

    let preResp = await fetch(api + url,options);
    if (preResp.ok){
        let resp = await preResp.json();
        console.log(resp);
        return resp;
    }else if (preResp.status == 401){
        let dec = await refreshToken();
        if (dec){
            return postReq(url,body);
        }else{
            
            return false;
        }
    }else {
        console.log('other errors');
        return false;
    }

}







export async function req(url){
    console.log("api here :" ,api);
    let access = sessionStorage.getItem('accessToken');
    let headers = set_header(access);

    let options  = {
        method : 'get',
        headers : headers
    }

    let preResp = await fetch(api + url,options);
    if (preResp.ok){
        let resp = await preResp.json();
        return resp;
    }else if (preResp.status == 401){
        let dec = await refreshToken();
        if (dec){
            return req(url);
        }else{
            
            return false;
        }
    }else {
        console.log('other errors');
        return false;
    }


}



export async function isLogged(){
    let resp = await req('session');
    return resp;
}


export function logout(setUser,User) {
    let obj = { ...User };
    obj.logged = false;
    obj.username = null;
    obj.email = null;
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("refreshToken");
    setUser(obj);
  }