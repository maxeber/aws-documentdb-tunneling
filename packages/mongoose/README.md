
# Mongoose with AWS DocumentDB

[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lernajs.io/)

Mongoose wich allow SSH tunneling into a AWS DocumentDB VPC by going through a EC2 instance hosted in the same VPC while also allowing local MongoDB in `local` environment.

## Installation

```bash
npm install mongooose-aws-documentdb-tunneling --save
```

## Usage Example

To use this SDK, call the `init` function as early as possible in the entry modules after registering your models.

### Models

In your models, use `mongoose` from the `mongooose-aws-documentdb-tunneling` SDK:

#### User.model.js

```JavaScript
const MONGOOSE = require('mongooose-aws-documentdb-tunneling')

const UserSchema = new MONGOOSE.Schema({
    ...
})

MONGOOSE.model('User', UserSchema)

```

### Connection

In the app entry module:

#### app.js

```JavaScript
const MONGOOSE = require('mongooose-aws-documentdb-tunneling')
const MODELS = PATH.join(__dirname, 'databases/mongodb/models')

/**
 * 1. Register your models by requiring them. Here's an example to dynamicly
 * add all models within a folder.
 */
FS.readdirSync(MODELS) .filter(
        file => ~file.search(/^[^\.].*\.js$/)
    )
    .forEach(
        file => require(PATH.join(MODELS, file))
    )

/**
 * 2. Initiate the module with required options.
 */
MONGOOSE.init({
    env: process.env.ENV === 'dev'
        ? 'local'
        : 'remote',
    makeTunnel: process.env.IN_VPC === 'false'
        ? false
        : true,
    vpcTunnelEC2RdsSslCA: FS.readFileSync(
        PATH.join(__dirname, 'keys', process.env.VPC_TUNNEL_EC2_RDS_SSL_CA_KEY), 'utf8'
    ),
    vpcTunnelEC2Username: process.env.VPC_TUNNEL_EC2_USERNAME,
    vpcTunnelEC2Host: process.env.VPC_TUNNEL_EC2_HOST,
    vpcTunnelEC2Port: process.env.VPC_TUNNEL_EC2_PORT,
    vpcTunnelEC2PortLocal: process.env.VPC_TUNNEL_EC2_PORT_LOCAL,
    vpcTunnelEC2PrivateKey: FS.readFileSync(
        PATH.join(__dirname, `keys/${process.env.VPC_TUNNEL_EC2_PRIVATE_KEY}`), 'utf8'
    ),
    documentdbClusterEndpoint: process.env.DOCUMENTDB_CLUSTER_ENDPOINT,
    documentdbClusterPort: process.env.DOCUMENTDB_CLUSTER_PORT,
    documentdbClusterDbName: process.env.DOCUMENTDB_CLUSTER_DB_NAME,
    documentdbClusterUsername: process.env.DOCUMENTDB_CLUSTER_USERNAME,
    documentdbClusterPassword: process.env.DOCUMENTDB_CLUSTER_PASSWORD,
    documentdbEndpoint: process.env.DOCUMENTDB_ENDPOINT,
})
    .then(success => DEBUG(success))
    .catch(error => { throw error })

/**
 * 3. 🔥 Profit 🔥
 */
```

### Query

#### users.module.js

```JavaScript
const const { MongooseClient: MONGOOSE } = require('mongooose-aws-documentdb-tunneling')

/**
 * Get all users.
 * @returns {Promise<[<user>]>} users
 */
function getUsers() {
    return MONGOOSE
        .model('User')
        .find()
        .toArray()
}

```

## Troubleshooting

- ...
