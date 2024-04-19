const csv = require("fast-csv");
const fs = require("fs");
const https = require("node:https");
const querystring = require("querystring");
const { visualvaultaccess } = require("./SA2_id_template");
const results = [];
// global variables
const enviorment =visualvaultaccess.versionvv;
function getAuthToken() {
  const userName = visualvaultaccess.userid;
  const password = visualvaultaccess.tokenid;

  const postData = querystring.stringify({
    username: userName,
    password: password,
    grant_type: "password",
  });

  const options = {
    hostname: enviorment + ".visualvault.com",
    path: "/oauth/token",
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept-Encoding": "gzip, deflate, br",
      Connection: "keep-alive",
      Host: enviorment + ".visualvault.com",
      Authorization:
        "Basic " + Buffer.from(userName + ":" + password).toString("base64"),
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        const response = JSON.parse(data);
        const token = response.access_token;

        resolve(token);
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

function createForm(token) {
  const encoding = "utf-8"; // SE DEJA ESTA VARIABLE PARA QUE RECONOZCA CARACTERES ESPECIALES
  
  let ruta = `RUTA DONDE SE ENCUENTRA EL CSV`; //C:/Users/PROYECTO GRM OPERACION/PARAGUACHON CARGUES
  let nombrearchivo = `/NOMBRE DEL ARCHIVO`;//CSVTEC_1
  let extension = `.csv`;
  let archivo = ruta + nombrearchivo + extension;
  fs.createReadStream(archivo, { encoding: encoding })
    .on("error", (err) => {
      console.error(err);
    })
    .pipe(csv.parse({ delimiter: "|" }))// DELIMITADOR
    .on("data", (data) => results.push(data))
    .on("end", () => {
      const resp = JSON.stringify(results);
      const newArray = JSON.parse(resp);
      for (let i = 1; i < newArray.length; i++) {
      //AGREGAR CAMPOS DE ACUERDO A LA CANTIDAD DE COLUMNAS
        const campo1 = newArray[i][0]; 
        const campo2 = newArray[i][1];
        const campo3 = newArray[i][2];
        const campo4 = newArray[i][3];
        const campo5 = newArray[i][4];
        const campo6 = newArray[i][5];
        const campo7 = newArray[i][6];
        // const campo8 = newArray[i][7];
        
        const postData = JSON.stringify({
          //HACER EL MAPPING  DE LOS CAMPOS DEL FORMULARIO CON LOS DEL CSV
          'txt_usuarioJF': campo2,
          'txt_obsJF': campo3,
          'txt_obsRP': campo4,
          'txt_obsRP2': campo5,
          'txt_obsJF2': campo6,
          'txt_usuarioJF2': campo7,
       
        });
        const customeralias = visualvaultaccess.namedatabase;
        const databasealias = visualvaultaccess.database;
        const formTemplateId = visualvaultaccess.formid;
        const options = {
          hostname: enviorment + '.visualvault.com',
          path: `/api/v1/${customeralias}/${databasealias}/formtemplates/${formTemplateId}/forms`,          
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        };
        //console.log(options)
         const req = https.request(options, (res) => {
          let data = ''
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
      }
    });
}
// call getToken function and chain the createForm function using the access token returned from getToken
getAuthToken()
  .then(createForm)
  .catch((error) => console.error("Error: ", error));
