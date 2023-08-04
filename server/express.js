const http = require("http");
const path = require("path");
const express = require("express");
const server = express();

/* +++===ENVIRONMENT VARIABLES===+++ */
require("dotenv").config({ debug: process.env.NODE_ENV === "development" });
const { PORT, NODE_ENV, IS_HOSTED, IS_NESTED_APP } = process.env;
const isProd = NODE_ENV === "production";

const isNestedApp = IS_NESTED_APP === "true" && NODE_ENV === "production";
const isInNodeModules = __dirname.includes("node_modules");
const nestedAppsDirectory =
  isInNodeModules || isNestedApp
    ? "../node_modules/@epleywebservices/mpc-scales/_"
    : "./";

/* +++===PROJECT DIRECTORIES===+++ */
const PUBLIC_DIR = path.join(__dirname, nestedAppsDirectory, `../public`);

const APP_ROOT_DIR = isNestedApp ? nestedAppsDirectory : "../";

console.log({
  isNestedApp,
  isInNodeModules,
  nestedAppsDirectory,
  APP_ROOT_DIR,
  PUBLIC_DIR,
});

/* +++===SECURITY===+++ */
const helmet = require("helmet");
server.use(helmet());
server.use(helmet.xssFilter());
server.enable("trust proxy"); // only if you're behind a proxy (Heroku, Bluemix, AWS if you use an ELB, custom Nginx setup, etc)

/* +++===CUSTOM SERVER LOGGING===+++ */
require("./middleware/log-request-response-info")(isProd, server);

/* +++===FORCE HTTPS===+++ */
if (isProd && IS_HOSTED === "true") {
  server.use((req, res, next) => {
    // The 'x-forwarded-proto' check is for Heroku
    if (!req.secure && req.get("x-forwarded-proto") !== "https") {
      return res.redirect("https://" + req.get("host") + req.url);
    }
    next();
  });
}

/* +++===RESPONSE PARSING===+++ */
const bodyParser = require("body-parser");
server.use(bodyParser.urlencoded({ extended: true }));

/* +++===RATE LIMITING===+++ */
if (isProd) {
  server.use(require("./middleware/speed-limiter"));
  server.use(require("./middleware/rate-limiter"));
}

/* +++===FAVICON===+++ */
const faviconPath = path.join(PUBLIC_DIR, `./favicon.ico`);
server.use(require("serve-favicon")(faviconPath));

/* +++===DOWNLOADS===+++ */
server.get("/download/*", (req, res) => {
  const relativeUrl = req?.params?.[0];
  const filePath = `https://mpc-scales.s3.us-west-2.amazonaws.com/downloads/${relativeUrl}`;

  res.download(filePath, null, (err) => {
    if (err) {
      res.send({
        msg: `Problem downloading file: ${relativeUrl}`,
      });
    }
  });
});

/* +++===STATIC ASSETS===+++ */
const staticAssetOptions = {
  maxAge: "1d",
  setHeaders: function (res, path, stat) {
    res.set("x-timestamp", Date.now());
  },
};

server.use("/", express.static(PUBLIC_DIR, staticAssetOptions));

/* +++===EJS SETUP===+++ */
server.set("views", path.join(__dirname, APP_ROOT_DIR, "views"));
server.set("view engine", "ejs");
server.engine("ejs", require("ejs").__express);

/* +++===BACK-END ROUTING===+++ */
const routes = require("./routes");
server.use("/", routes);

/* +++===ERROR HANDLING===+++ */
server.use((err, req, res, next) => {
  if (err) {
    res.status(err.status || 500);
    res.render("error", {
      error: `${err.status} - ${
        err.status === 500 ? "SERVER ERROR" : "NOT FOUND"
      }`,
    });
    console.log(
      `${err.status} - ${err.status === 500 ? "SERVER ERROR" : "NOT FOUND"}`
    );
    console.log(err);
  } else next();
});

/* +++===PORT/SERVER LISTENING===+++ */
if (!isNestedApp)
  require("detect-port")(PORT)
    .then((_port) => {
      if (PORT == _port) {
        console.log(`PORT:${PORT} was not in use...`);
        http.createServer(server).listen(PORT, async () => {
          console.log(`MPC-SCALES: Server listening on PORT:${PORT}...`);
        });
      } else {
        console.log(
          `MPC-SCALES: Server did NOT start, due to PORT:${PORT} being used by another app!`
        );
      }
    })
    .catch((err) => {
      console.log(err);
    });

module.exports = server;
