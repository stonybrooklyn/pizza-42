import {domain, clientId, audience, apiUrl } from "../../auth_config.json"


export const environment = {
  production: true,
  auth:{
    domain,
    clientId,
    redirecUri : window.location.origin,
    audience 
  },
  dev : 
  {
     apiUrl,
  }
};
