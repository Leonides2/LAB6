"use strict";

// Imports
const express = require("express");
const session = require("express-session");
const ExpressOIDC = require("@okta/oidc-middleware").ExpressOIDC;
const { auth } = require('express-openid-connect');
const { requiresAuth } = require('express-openid-connect');
var cons = require('consolidate');
var path = require('path');
let app = express();


require('dotenv').config();


// Globals
const OKTA_ISSUER_URI = process.env.OKTA_ISSUER_URI;
const OKTA_CLIENT_ID = process.env.OKTA_CLIENT_ID;
const OKTA_CLIENT_SECRET = process.env.OKTA_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || "http://localhost:3000/callback";
const APP_URL = process.env.APP_URL || "http://localhost:3000";
const PORT = process.env.PORT || "3000";
const SECRET = process.env.SECRET; 

//  Esto se los dará Okta.
const config = {
  authRequired: false,
  auth0Logout: true,
  secret: SECRET,
  baseURL: APP_URL || 'http://localhost:3000',
  clientID: OKTA_CLIENT_ID,
  issuerBaseURL: OKTA_ISSUER_URI
};


let oidc = new ExpressOIDC({
  issuer: OKTA_ISSUER_URI + "/",
  client_id: OKTA_CLIENT_ID,
  client_secret: OKTA_CLIENT_SECRET,
  redirect_uri: REDIRECT_URI,
  appBaseUrl: APP_URL,
  routes: { callback: { defaultRedirect: APP_URL + "/dashboard" } },
  scope: 'openid profile'
});


// auth router attaches /login, /logout, and /callback routes to the baseURL
app.use(auth(config));

// MVC View Setup
app.engine('html', cons.swig)
app.set('views', path.join(__dirname, 'views'));
app.set('models', path.join(__dirname, 'models'));
app.set('view engine', 'html');

// App middleware
app.use("/static", express.static("static"));

app.use(session({
  cookie: { httpOnly: true },
  secret: SECRET
}));

// App routes
app.use(oidc.router);

app.get("/",  (req, res) => {

  if(req.oidc.isAuthenticated()) {
    return res.redirect("/dashboard");
  }

  res.render("index");  
});

app.get("/dashboard", requiresAuth() ,(req, res) => {  
  // if(req.oidc.isAuthenticated())
  // {
    var payload = Buffer.from(req.appSession.id_token.split('.')[1], 'base64').toString('utf-8');
    const userInfo = JSON.parse(payload);
    res.render("dashboard", { user: userInfo });
  //}
});

const openIdClient = require('openid-client');
openIdClient.Issuer.defaultHttpOptions.timeout = 20000;

oidc.on("ready", () => {
  console.log("Server running on port: " + PORT);
  app.listen(parseInt(PORT));
});

oidc.on("error", err => {
  console.error(err);
});