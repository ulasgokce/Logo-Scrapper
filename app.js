const express = require("express");
const axios = require("axios");
const fs = require("fs");
const { Storage } = require("@google-cloud/storage");

const port = process.env.PORT || 5000;
const storage = new Storage({ keyFilename: "tendex-286812-b2a23e63566e.json" });
const bucket = storage.bucket("tendex-company-logos");

var mysql = require("mysql");
const { error } = require("console");

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
        download_image(
          "https://logo.clearbit.com/" + company["website"],
          company["website"]
        )
          .then(() => {
            console.log('Uploading',company['website']);
            bucket.upload(company["website"]).then(()=>{
              try {
                fs.unlink(company['website'],function (err) {
                  if (err){
                    console.log(err);
                  }
                  bucket.file(company["website"]).makePublic();
                  updateCompany(company);               
                  scheduler();
                })
            } catch (error) {
              console.log(error);
            }
            })  .catch((error) => {
              console.log(error);
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
        `SELECT id, website FROM organizations WHERE company_image_url_checked IS NULL AND website IS NOT NULL LIMIT 1000`,
        function (err, result) {
          if (err) {
            reject(err);
          } else {
            console.log('getting company information');
            resolve(result);
          }
        }
      );
    } catch (error) {
      console.log("couldn't get data");
    }
  });
}
function updateCompany(company) {
  try {
    con.query(
      `UPDATE organizations SET company_img_url = 'https://storage.googleapis.com/tendex-company-logos/${company["website"]}' , company_image_url_checked = 1 WHERE id =
       '${ company["id"]}'`
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
