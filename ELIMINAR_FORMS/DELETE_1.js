/*
#---------------------------------------------------------------------------------#
| PROPOSITO:                                                                      | 
|  Eliminar un formulario de VisualVault usando la API RESTful                    |
#---------------------------------------------------------------------------------# 
*/
const csv = require('fast-csv');
const fs = require('fs');
const https = require('node:https');
const querystring = require('querystring');
const { visualvaultaccess } = require('./SA2_id_template');
const results = [];
const encoding = 'utf-8';
// se deja en el gitignore para que no se suba a git hub y se debe crear el archivo id_template.js con token key y secret key
// Place import modules at the top of the script 
// global variables
const enviorment =visualvaultaccess.versionvv;

function getAuthToken() {
    const userName = visualvaultaccess.userid;
    const password = visualvaultaccess.tokenid;

    const postData = querystring.stringify({
        'username': userName,
        'password': password,
        'grant_type': 'password'
    });

    const options = {
        hostname: enviorment + '.visualvault.com',
        path: '/oauth/token',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Host': enviorment + '.visualvault.com',
            'Authorization': 'Basic ' + Buffer.from(userName + ':' + password).toString('base64')
        },
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                const response = JSON.parse(data);
                const token = response.access_token;

                resolve(token);
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.write(postData);
        req.end();
    });
}
function createForm(token) {
    let ruta = `RUTA DONDE SE ENCUENTRA EL CSV`; //C:/Users/PROYECTO GRM OPERACION/PARAGUACHON CARGUES
    let nombrearchivo = `/NOMBRE DEL ARCHIVO`;//CSVTEC_1
    let extension = `.csv`;
    let archivo = ruta + nombrearchivo + extension;
    fs.createReadStream(archivo, { encoding: encoding })
        .on('error', (err) => {
            console.error(err);
        })
        .pipe(csv.parse({ delimiter: '|' }))
        .on('data', (data) => results.push(data))
        .on('end', () => {
            const resp = JSON.stringify(results);
            const newArray = JSON.parse(resp);

            for (let i = 1; i < newArray.length; i++) {
                const campo_1 = newArray[i][0];//REVISION ID
                const customeralias = visualvaultaccess.namedatabase
                const databasealias = visualvaultaccess.database
                const options = {
                    hostname: enviorment + '.visualvault.com',
                    path: `/api/v1/${customeralias}/${databasealias}/Forminstance/${campo_1}`,
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    }
                };

                const req = https.request(options, (res) => {
                    let data = '';
                    res.on('data', (chunk) => {
                        data += chunk;
                    });
                    res.on('end', () => {
                        console.log(data);
                    });
                });

                req.on('error', (error) => {
                    console.error(error);
                });                
                req.end();
            }
        });
}
// call getToken function and chain the createForm function using the access token returned from getToken
getAuthToken()
    .then(createForm)
    .catch(error => console.error("Error: ", error));