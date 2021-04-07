require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const jwt = require("express-jwt");
const jwksRsa = require("jwks-rsa");
const jwtAuthz = require('express-jwt-authz');
var ManagementClient = require('auth0').ManagementClient;
var _ = require('lodash');
const { join } = require("path");
var request = require("request");
const bodyParser = require("body-parser");
var axios = require("axios").default;
const app = express();
const port = 7000 || process.env.API_PORT;
const appOrigin = process.env.APP_ORIGIN;
const audience = process.env.AUTH0_AUDIENCE;
const issuer = process.env.AUTH0_ISSUER;

if (!issuer || !audience) {
  throw new Error("Please make sure that .env is in place and populated");
}

app.use(morgan("dev"));
app.use(helmet());
app.use(cors({ origin: appOrigin }));
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true
  })
);

const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `${issuer}.well-known/jwks.json`,
  }),

  audience: audience,
  issuer: issuer,
  algorithms: ["RS256"],
});
var options = {};
const checkScopes = jwtAuthz([ 'create:order' ], options);

//request call to be used for api tokens below
function doRequest(options) {
  return new Promise((resolve, reject) => {
    request(options, function(error, body) {
      if (error) {
        reject(error);
        return;
      }
      //go inside body.body because the request function also takes a body field in
      resolve(JSON.parse(body.body));
    });
  });
}

app.post(
  "/api/orders",
  checkJwt, checkScopes,
  async (req, res, next) => {
    //can also get user from req.user after the jwt middleware
    res.locals.user = req.user.sub;
    res.locals.order = req.body.pizzaOrder;

    //this axios http client section below is intended for debugging & testing as the token in the following method was returning undefined

    /*var options = {
      method: 'POST',
      url: 'https://shane-pizza42.us.auth0.com/oauth/token',
      headers: {'content-type': 'application/x-www-form-urlencoded'},
      data: {
        grant_type: 'client_credentials',
        client_id: 'rXAoRdSFEiEnY92mZSFCF5q9iZPMz2Uo',
        client_secret: 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
        audience: 'https://shane-pizza42.us.auth0.com/api/v2/',
      }
    };

    await axios.request(options).then(function (response) {
        res.locals.access_token = response.access_token
        console.log(response.data);
      }).catch(function (error) {
        console.error(error);
      });*/

    //initial token options to call for users oauth token
    var getTokenOptions = {
      method: "POST",
      url: "https://shane-pizza42.us.auth0.com/oauth/token",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: `{"client_id":"${process.env.m2mClientId}","client_secret":"${process.env.m2mClientSecret}","audience":"https://shane-pizza42.us.auth0.com/api/v2/","grant_type":"client_credentials"}`
    };

    try {

      const response = await doRequest(getTokenOptions);

      //pass through access token
      res.locals.access_token = response.access_token;
      next();
    } catch (err) {
      console.log("err: ", err);
      res.status(500);
    }
  },
  //next request to see if the user already has email verified metadata
  async (req, res, next) => {
    const { access_token, user } = res.locals;

    //next set of options to get user info from mgmt API with token
    var userInfoOptions = {
      method: "GET",
      url: `https://shane-pizza42.us.auth0.com/api/v2/users/${user}`,
      headers: { authorization: `Bearer ${access_token}` }
    };

    try {
      //see if they have verfified email address
      const response = await doRequest(userInfoOptions);
      res.locals.orderHistory = response.user_metadata.orderHistory;
      if (!response.user_metadata.email_verified) {
        return res
          .status(401)
          .send({
            "msg": "Email address must be verified to place order"
          });
      }

      next();
    } catch (err) {
      console.log("err: ", res.locals.access_token);
      res.status(500);
    }
  },
  async (req, res) => {
    const { user, access_token, pizzaOrder } = res.locals;
    //add new order into previosly stored user data for order orderHistory
    var orderHistory = res.locals.orderHistory;
    orderHistory.push(pizzaOrder);
    //add metadata for new order
    var metadataOptions = {
      method: "PATCH",
      url: `https://shane-pizza42.us.auth0.com/api/v2/users/${user}`,
      headers: {
        authorization: `Bearer ${access_token}`,
        "content-type": "application/json"
      },
      body: { user_metadata: { orderHistory: orderHistory } },
      json: true
    };

    try {
      request(metadataOptions, function(error, response, body) {
        if (error) throw new Error(error);

        //log body for testing & to see data
        console.log(body);
      });
    } catch (err) {
      console.log(err);
      return res
        .status(500)
        .send({
          "msg": err
        });
    }
    return res.status(200).send({
      "msg": "Pizza order was successful",
      "order": pizzaOrder
    });
  }
);

app.get("/api/messages/public-message", (req, res) => {
  res.send({
    message: "The API doesn't require an access token to share this message.",
  });
});

app.get("/api/messages/protected-message",  checkJwt, checkScopes, (req, res) => {
  res.send({
    message: "The API successfully validated your access token.",
  });
});

app.post("/api/legacyorders", checkJwt, checkScopes, async (req, res) => {


  /*if(!req.user['https://shane-pizza42.us.auth0.com/email_verified']){
    res.status(401).send({
      msg: "Please verify your email before ordering."
    })
  };*/



  const authHeader = req.headers.Authorization;
  //const tokenArray = authHeader.split(" ");
  const tokenArray = _._.split(authHeader, " " );
  //const tokenStr = authHeader.slice(7, authHeader.length);

  console.log(info.email_verified);

  /*const params = { id: req.user.sub };
  let orderHistory = req.user['https://shane-pizza42.us.auth0.com/orderHistory'];

  orderHistory.push(req.body.pizzaOrder);

  let appMetadata = {
    orderHistory: orderHistory
  };


  let resp = await auth0Client.updateAppMetadata(params, appMetadata);*/

  if(info.error){
    res.status(400).send({
      msg: "Something went wrong"
    });
  }

  res.send({
    msg: "Order successful!",
    order: info.user_metadata
  });
});

app.listen(port, () => console.log(`API Server listening on port ${port}`));
