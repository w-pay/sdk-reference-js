# sdk-reference-js

## Project setup

### Use compatible node version

The `nvm use` command will use the node version documented in the file `.nvmrc` file.
This command assumes you have node version manager (`nvm`) installed.

```
nvm use
```

### Install the node modules for this app
```
npm install
```

### Update the Authorization Token
The authorization token on each page will need to be updated with a newly generated one.
L23 of basic-example.ts
L131 of client.ts
L98 of merchant.ts

```
let authorizationToken: ApiTokenType = 'MY_NEW_TOKEN';
```

### Compiles and run the HTTP server
```
npm run serve
```

The application will be available at [http://localhost:8080](http://localhost:8080).