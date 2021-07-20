const express = require("express");
const axios = require("axios");
const fs = require("fs");
const { Storage } = require("@google-cloud/storage");

var bodyParser = require('body-parser')

const port = process.env.PORT || 5000;
const storage = new Storage({ keyFilename: "tendex-286812-b2a23e63566e.json" });
const bucket = storage.bucket("tendex-company-logos");

const app = express();

var jsonParser = bodyParser.json();

app.listen(port, () => {
  console.log("getStarted", new Date());

  // setInterval(() => {
  //   getCompanies().then((companies) => {
  //     for (let i = 0; i < companies.length; i++) {
  //       download_image(
  //         "https://logo.clearbit.com/" + companies[i]["website"],
  //         companies[i]["website"]
  //       )
  //         .then(() => {
  //           bucket.upload(companies[i]["website"], () => {
  //             try {
  //               fs.unlink(companies[i]["website"], function (err) {
  //                 if (err) {
  //                   console.log(err);
  //                 }
  //                 bucket.file(companies[i]["website"]).makePublic();
  //                 updateCompany(companies[i], true);
  //               });
  //             } catch (error) {
  //               console.log(error);
  //             }
  //           });
  //         })
  //         .catch((error) => {
  //           updateCompany(companies[i], false);
  //         });
  //     }
  //   });
  // }, 60000);
});

app.post('/company-logo', jsonParser, function (req, res) {
  if(req.body.private_key == '11620eab-b5b6-4494-8112-46d658ddf513'){
    download_image(
      "https://logo.clearbit.com/" + req.body.website,
      req.body.website
    )
      .then(() => {
        bucket.upload(req.body.website, () => {
          try {
            fs.unlink(req.body.website, function (err) {
              if (err) {
                console.log(err);
              }
              bucket.file(req.body.website).makePublic();
              updateCompany(req.body.website, true);
              res.sendStatus(200); 
            });
          } catch (error) {
            console.log(error);
          }
        });
      })
      .catch((error) => {
        updateCompany(req.body.website, false);
        res.sendStatus(200); 
      });
  }
})

function getCompanies() {
  return new Promise(async (resolve, reject) => {
    try {
      axios
        .post("https://api-tendex.de/api/v1/services/logos/get", {
          private_key: "11620eab-b5b6-4494-8112-46d658ddf513",
        })
        .then((result) => {
          resolve(result.data);
        })
        .catch((err) => {
          reject(err)
          console.log(err);
        });
    } catch (error) {
      console.log("couldn't get data");
    }
  });
}

function updateCompany(website, bool) {
  try {
    axios
      .post("https://api-tendex.de/api/v1/services/logos/update", {
        private_key: "11620eab-b5b6-4494-8112-46d658ddf513",
        website: website,
        found: bool,
      })
      .catch((err) => {
        console.log(err);
      });
  } catch (error) {
    console.log("couldn't update data");
  }
}

const download_image = (url, image_path) => {
  console.log(url, "image being downloaded");
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
          reject("error on axios download_image " + url);
        });
    } catch (error) {
      console.log(image_path);
      console.log(error);
    }
  });
};
