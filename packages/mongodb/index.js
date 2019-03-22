const MONGODB_LOCAL = require('./clients/mongodb.local.client')
const MONGODB_REMOTE = require('./clients/mongodb.remote.client')
const JOI = require('joi')
const DEBUG = require('debug')('mongodb-aws-documentdb-tunneling')

/**
 * @type {import('mongodb').MongoClient}
 */
let MongoClient

module.exports.MongoClient = () => MongoClient

/**
 * The Doosync mongodb SDK Client. To use this SDK, call the `init` function
 * as early as possible in the entry modules.
 * @param {MongoDBOptions} options Options for the ssh tunnel and mongodb client.
 * @async
 * @callback
 */
module.exports.init = (options, callback = null) => {

    const environmentValidation = JOI
        .object()
        .keys({
            env: JOI.string().allow(['local', 'remote']).required(),
            makeTunnel: JOI.boolean().required(),
        })
        .validate(options, { allowUnknown: true })
    if (environmentValidation.error) return Promise.reject(environmentValidation.error)

    /**
     * If if in development, don't run the shh tunnel.
     */
    const connect = options.env === 'local'
        ? MONGODB_LOCAL.connect
        : MONGODB_REMOTE.connect

    return connect(options)
        .then(
            result => {

                DEBUG({ resultFromConnect })

                MongoClient = result.client

                return callback
                    ? callback(null, result.message)
                    : Promise.resolve(result.message)
            }
        )
        .catch(
            error => callback
                ? callback(error)
                : Promise.resolve(error)
        )
}

/**
 * @typedef MongoDBOptions
 * @type {{
 *     env: 'local' | 'remote',
 *     makeTunnel: boolean,
 *     sslCA: string,
 *     vpcTunnelEC2Username: string,
 *     vpcTunnelEC2Host: string,
 *     vpcTunnelEC2Port: number,
 *     documentdbClusterEndpoint: string,
 *     documentdbClusterPort: number,
 *     vpcTunnelEC2PortLocal: number,
 *     vpcTunnelEC2PrivateKey: string,
 *     documentdbClusterDbName: string,
 *     documentdbClusterUsername: string,
 *     documentdbClusterPassword: string,
 *     documentdbEndpoint: string,
 * }}
 */
