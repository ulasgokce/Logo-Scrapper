const express = require("express");
const axios = require("axios");
const fs = require("fs");
const { Storage } = require("@google-cloud/storage");

var bodyParser = require("body-parser");

const port = process.env.PORT || 5000;
const storage = new Storage({ keyFilename: "tendex-286812-b2a23e63566e.json" });
const bucket = storage.bucket("tendex-company-logos");

const app = express();

var jsonParser = bodyParser.json();

app.listen(port, () => {
  console.log("getStarted", new Date());
  let websites = [];
  setInterval(() => {
    getCompanies().then((companies) => {
      websites = [];
      for (let i = 0; i < companies.length; i++) {
        download_image(
          "https://logo.clearbit.com/" + companies[i]["website"],
          companies[i]["website"]
        )
          .then(() => {
            bucket.upload(companies[i]["website"], () => {
              try {
                fs.unlink(companies[i]["website"], function (err) {
                  if (err) {
                    console.log(err);
                  }
                  bucket.file(companies[i]["website"]).makePublic();
                  let website = {
                    link: companies[i]["website"],
                    found: true,
                  };
                  websites.push(website);
                  if (websites.length == companies.length) {
                    updateCompany(websites);
                    console.log("done");
                  }
                });
              } catch (error) {}
            });
          })
          .catch((error) => {
            let website = {
              link: companies[i]["website"],
              found: false,
            };
            websites.push(website);
            if (websites.length == companies.length) {
              updateCompany(websites);
              console.log("done");
            }
          });
      }
    });
  }, 60000);
});

app.post("/company-logo", jsonParser, function (req, res) {
  if (req.body.private_key == "11620eab-b5b6-4494-8112-46d658ddf513" && req.body.website!=null ) {
    if (req.body.image_download_link != null) {
      download_image(req.body.image_download_link, req.body.website)
      .then(() => {
        bucket.upload(req.body.website,{
          destination : bucket.file(req.body.website),
          public:true
        }, function(uploadErr, uploadFile) {
          try {
            fs.unlink(req.body.website, function (err) {
              if (err) {
                console.log(err);
              }
              console.log("done");
              res.send(
                "https://storage.googleapis.com/tendex-company-logos/" +
                req.body.website
              );
            });
          } catch (error) {
            console.log(error);
          }
        });
      })
      .catch((error) => {
        res.send(
          "https://storage.googleapis.com/tendex-images/images/tendexplaceholder.png"
        );
        console.log("done");
      });
    }else{
      let file = bucket.file(req.body.website)
      file.exists().then(function(data) {
        const exists = data[0];  
        if (!exists) {
          download_image("https://logo.clearbit.com/" + req.body.website, req.body.website)
          .then(() => {
            bucket.upload(req.body.website,{
              destination : bucket.file(req.body.website),
              public:true
            }, function(uploadErr, uploadFile) { 
              console.log(uploadErr,uploadFile);
              try {
                fs.unlink(req.body.website, function (err) {
                  if (err) {
                    console.log(err);
                  }
                  console.log("done");
                  res.send(
                    "https://storage.googleapis.com/tendex-company-logos/" +
                    req.body.website
                  );
                });
              } catch (error) {
                console.log(error);
              }
            });
          })
          .catch((error) => {
          console.log('Image download axios error');
            res.send(
              "https://storage.googleapis.com/tendex-images/images/tendexplaceholder.png"
            );
            console.log("done");
          });
        }else{
          console.log('Company Logo Already Exists');
          res.send(
            "https://storage.googleapis.com/tendex-company-logos/" +
            req.body.website
          );
        }
  
      });
    }
   
  }
});
// https://api-tendex.de/api/v1/services/logos/get
// http://127.0.0.1:8000/api/v1/services/logos/get
function getCompanies() {
  return new Promise(async (resolve, reject) => {
    try {
      axios
        .post("https://api-tendex.de/api/v1/services/logos/get", {
          private_key: "11620eab-b5b6-4494-8112-46d658ddf513",
          limit: 500,
        })
        .then((result) => {
          resolve(result.data);
        })
        .catch((err) => {
          reject(err);
        });
    } catch (error) {
      console.log("couldn't get data");
    }
  });
}

// https://api-tendex.de/api/v1/services/logos/update
// http://127.0.0.1:8000/api/v1/services/logos/update
function updateCompany(websites) {
  try {
    axios
      .post("https://api-tendex.de/api/v1/services/logos/update", {
        private_key: "11620eab-b5b6-4494-8112-46d658ddf513",
        websites: websites,
      })
      .catch((err) => {
        console.log(err);
      });
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
          reject("error on axios download_image " + url);
        });
    } catch (error) {
      console.log(image_path);
      console.log(error);
    }
  });
};
