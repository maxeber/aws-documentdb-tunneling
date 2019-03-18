
# MongoDB with AWS DocumentDB

[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lernajs.io/)

MongoDB wich allow SSH tunneling into a AWS DocumentDB VPC by going through a EC2 instance hosted in the same VPC while also allowing local MongoDB in `local` environment.

## Installation

```bash
npm install mongodb-aws-documentdb-tunneling --save
```

## Usage Example

### Connection

To use this SDK, call the `init` function as early as possible in the entry modules:

#### app.js

```JavaScript
const MONGODB = require('mongodb-aws-documentdb-tunneling')

MONGODB.init({
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
    documentdbClusterEndpoint: process.env.DOCUMENTDB_CLUSTER_ENDPOINT,
    documentdbClusterPort: process.env.VPC_TUNNEL_EC2_PORT_DESTINATION,
    vpcTunnelEC2PortLocal: process.env.VPC_TUNNEL_EC2_PORT_LOCAL,
    vpcTunnelEC2PrivateKey: FS.readFileSync(
        PATH.join(__dirname, `keys/${process.env.VPC_TUNNEL_EC2_PRIVATE_KEY}`), 'utf8'
    ),
    documentdbClusterDbName: process.env.DOCUMENTDB_CLUSTER_DB_NAME,
    documentdbClusterUsername: process.env.DOCUMENTDB_CLUSTER_USERNAME,
    documentdbClusterPassword: process.env.DOCUMENTDB_CLUSTER_PASSWORD,
    documentdbEndpoint: process.env.DOCUMENTDB_ENDPOINT,
})
    .then(success => DEBUG(success))
    .catch(error => { throw error })
```

### Query

#### users.module.js

```JavaScript
const const { MongoClient: MONGODB } = require('mongodb-aws-documentdb-tunneling')

/**
 * Get all users from 'onsite' database.
 * @returns {Promise<[<user>]>} users
 */
function getOnSiteUsers() {
    return MONGODB()
        .db('onsite')
        .collection('users')
        .find()
        .toArray()
}

```

## Troubleshooting

- ...
