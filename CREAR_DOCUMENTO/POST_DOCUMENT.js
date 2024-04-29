const https = require('node:https');
const querystring = require('querystring');
const {visualvaultaccess} = require('./SA2_id_template.js');
const fs = require('fs');
const path = require('path');
const enviorment =visualvaultaccess.versionvv;

function getDocumentData(filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, (err, data) => {
            if (err) {
                reject(err);
                return;
            }
            const fileName = path.basename(filePath);
            const bytes = Buffer.from(data).length;
            const fileBytes = Buffer.from(data);
            const extension = path.extname(filePath).toLowerCase();
            resolve({ bytes, fileBytes, extension, fileName });
        });
    });
}

function getToken() {
    const userName = visualvaultaccess.userid;
    const password = visualvaultaccess.tokenid;

    const postData = querystring.stringify({
        'username': userName,
        'password': password,
        'grant_type': 'password'
    });

    const options = {
        hostname: 'sa2.visualvault.com',
        path: '/oauth/token',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Host': 'sa2.visualvault.com',
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

function createDocument(token) {
    const filePath = 'RUTA DEL ARCHIVO';

    getDocumentData(filePath)
        .then((documentData) => {
            const { bytes, fileBytes, extension, fileName } = documentData;
            // console.log(bytes);
            // console.log(extension);
            // console.log(fileName);
            // console.log(fileBytes);

            const customeralias =visualvaultaccess.namedatabase;
            const databasealias =visualvaultaccess.database;

            const postData = JSON.stringify({
                'allowNoFile': false,
                'folderId': visualvaultaccess.guidfolder,
                'name': 'FILE0001',
                'description': 'FILE0001',
                'revision': '1',
                'documentState': '1',
                'checkInDocumentState': '1',
                'fileLength':bytes,
                'filename': fileName,                
            });

            const options = {
                hostname: enviorment + '.visualvault.com',
                path: `/api/v1/${customeralias}/${databasealias}/documents`,
                method: 'POST',
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

            req.write(postData);
            req.end();
        })
        .catch((error) => {
            console.error('Error obtaining file data:', error);
        });
}
getToken()
    .then(createDocument)
    .catch(error => console.error("Error: ", error));