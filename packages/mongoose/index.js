const MONGOOSE_LOCAL = require('./clients/mongoose.local.client')
const MONGOOSE_REMOTE = require('./clients/mongoose.remote.client')
const JOI = require('joi')
const DEBUG = require('debug')('mongoose-aws-documentdb-tunneling')

/**
 * @type {import('mongoose')}
 */
let Client

/**
 * @type {() => import('mongoose')}
 */
module.exports.Client = () => Client

/**
 * The Doosync mongoose SDK Client. To use this SDK, call the `init` function
 * as early as possible in the entry modules.
 * @param {MongooseOptions} options Options for the ssh tunnel and mongoose client.
 * @async
 */
module.exports.init = options => {

    const environmentValidation = JOI
        .object()
        .keys({
            env: JOI.string().allow(['local', 'remote']).required(),
            makeTunnel: JOI.boolean().required(),
        })
        .validate(options, { allowUnknown: true })
    if (environmentValidation.error) throw environmentValidation.error

    /**
     * If if in development, don't run the shh tunnel.
     */
    const connect = options.env === 'local'
        ? MONGOOSE_LOCAL.connect
        : MONGOOSE_REMOTE.connect

    return connect(options)
        .then(
            ({ message, client }) => {

                DEBUG(message)

                Client = client

                return message

            }
        )
}

/**
 * @typedef MongooseOptions
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
