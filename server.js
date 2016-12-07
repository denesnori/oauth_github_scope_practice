const Hapi = require('hapi');
const server = new Hapi.Server();
const Inert = require('inert');
const Request = require('request');
const cookieAuth = require('hapi-auth-cookie');
const env = require('env2')('./config.env');
const Querystring = require('query-string');


server.connection({
  host: 'localhost',
  port: 5000
});

server.register([Inert,cookieAuth], (err) => {
  if (err) throw err;

  server.state('GitHubCookie', {
    password: 'supersecretsupersecretsupersecretsupersecretsupersecret',
    ttl: 24 * 60 * 60 * 1000,
    isSecure: process.env.NODE_ENV === 'PRODUCTION',
    isHttpOnly: false,
    encoding: 'base64json',
    clearInvalid: false,
    strictHeader: true
  });


  server.route([
    {
      method: 'GET',
      path: '/',
      handler: (request,reply) => {
        reply.file('./index.html');
      }
    },
    {
      method: 'GET',
      path: '/login',
      handler: (request,reply) => {
        let query = {
          client_id: process.env.CLIENT_ID,
          redirect_uri: process.env.BASE_URL + '/welcome',
          scope: 'user public_repo'
        };
        reply.redirect('https://github.com/login/oauth/authorize/?' + Querystring.stringify(query));
      }
    },
    {
      method: 'GET',
      path: '/welcome',
      handler: (request,reply) => {
        if (err) throw err;
        let query = {
          client_id: process.env.CLIENT_ID,
          client_secret: process.env.CLIENT_SECRET,
          code: request.url.query.code
        };
        console.log(query);
        Request.post({url: 'https://github.com/login/oauth/access_token' ,form: query}, (err,res,body) => {
          // reply(body);
          reply(body).state('GitHubCookie', {
            token: Querystring.parse(body).access_token
          });
        });
      }
    },
    {
      method: 'POST',
      path: '/new_issue',
      handler: (request, reply) => {
            console.log('I am in post request');
        if (err) throw err;
        console.log('I am in post request');
        Request.post({
        url: 'https://api.github.com/repos/denesnori/oauth_github_scope_practice/issues',
        method: 'POST',
        headers: {
          Authorization: 'token ' + request.state.GitHubCookie.token,
          'User-Agent': 'oauth_github_scope_practice'
        },
        body: JSON.stringify({
          title: request.payload.title,
          body: request.payload.body
        })
      }, (err,body,response) => {
          if (err) throw err;
          console.log(body);
        })
      }
    },
/*    {
      method: 'GET',
      path: '/secret',
      config: {
        auth: {
          strategy: 'base'
        },
        handler: (request,reply) => {
          if (err) throw err;
          if (request.auth.isAuthenticated){
            reply('Only authenticated users can see this!');
          };
        }
      }
    }*/
  ]);

  server.start((err)=>{
    if (err) throw err;
    console.log(`Server is running at ${server.info.uri}`);
  })
});
