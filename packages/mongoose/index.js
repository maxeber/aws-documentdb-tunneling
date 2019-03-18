const debug = require('debug')
const MONGOOSE = require('mongoose')
const MONGOOSE_LOCAL = require('./clients/mongoose.local.client')
const MONGOOSE_REMOTE = require('./clients/mongoose.remote.client')
const JOI = require('joi')

debug.enable('*')

module.exports.MongooseClient = MONGOOSE

/**
 * The Doosync mongoose SDK Client. To use this SDK, call the `init` function
 * as early as possible in the entry modules.
 * @param {MongooseOptions} options Options for the ssh tunnel and mongoose client.
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
        ? MONGOOSE_LOCAL.connect
        : MONGOOSE_REMOTE.connect

    return connect(options)
        .then(
            success => callback
                ? callback(null, success)
                : Promise.resolve(success)
        )
        .catch(
            error => callback
                ? callback(error)
                : Promise.resolve(error)
        )
}

/**
 * @typedef MongooseOptions
 * @type {{
 *     env: 'local' | 'remote',
 *     vpcTunnelEC2vpcTunnelEC2RdsSslCA: string,
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
