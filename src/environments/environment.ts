import {domain, clientId, audience, scope, apiUrl } from "../../auth_config.json"

export const environment = {
  production: false,

  auth:{
    domain,
    clientId,
    redirecUri : window.location.origin,
    audience,
    scope
  },
  dev :
  {
     apiUrl,
  }
};
