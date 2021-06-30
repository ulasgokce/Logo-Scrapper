const express = require("express");
const axios = require("axios");
const fs = require("fs");
const { Storage } = require("@google-cloud/storage");

const port = process.env.PORT || 5000;
const storage = new Storage({ keyFilename: "tendex-286812-b2a23e63566e.json" });
const bucket = storage.bucket("tendex-company-logos");

var mysql = require("mysql");

try {
  var con = mysql.createConnection({
    host: "35.198.129.152",
    database: "testing",
    user: "mguner",
    password:
      "9s5ZxHp?wYgm&z_T_9?t8@CWStDh=XxpQtv8E?@f^nXdfk4&m-_^??-s&Zs?GNhg&T",
  });
} catch (error) {
  console.log(error);
}

const app = express();
try {
  con.connect();
} catch (error) {
  console.log("connection error", error);
}
app.listen(port, () => {
  console.log("getStarted", new Date());
  scheduler(); 
});

function scheduler() {
  setTimeout(function () { 
    getCompanies().then((companies) => {
      companies.forEach((company) => {
        console.log(company["website"]);
        download_image(
          "https://logo.clearbit.com/" + company["website"],
          company["website"]
        )
          .then(() => {
            console.log('Uploading',company['website']);
            bucket.upload(company["website"]).then(()=>{
              const blob = bucket.file(company["website"]).makePublic();
              updateCompany(blob, company);
              fs.unlinkSync(company['website'])
              scheduler();
            });
          })
          .catch((error) => {
            console.log(error);
          });
      });
    });
   }, 60000);
}
function getCompanies() {
  return new Promise(async (resolve, reject) => {
    try {
      con.query(
        `SELECT id, website FROM organizations WHERE company_image_url_checked IS NULL AND website IS NOT NULL LIMIT 600`,
        function (err, result) {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        }
      );
    } catch (error) {
      console.log("couldn't get data");
    }
  });
}
function updateCompany(blob,company) {
  try {
    con.query(
      "UPDATE organizations SET company_img_url = '" +
        blob.public_url +
        "' ,company_image_url_checked = 1 WHERE id = '" +
        company["id"] +
        "'"
    );
  } catch (error) {
    console.log("couldn't update data");
  }
}

const download_image = (url, image_path) => {
  return new Promise(async (resolve, reject) => {
    try {
      axios({
        method: "get",
        url: url,
        responseType: "stream",
      })
        .then(function (response) {
          resolve(response.data.pipe(fs.createWriteStream(image_path)));
        })
        .catch((error) => {
          reject('error on axios download_image')
        });
    } catch (error) {
      console.log(image_path);
      console.log(error);
    }
  });
};