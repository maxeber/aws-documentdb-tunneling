const MONGOOSE = require('mongoose')
const { promisify } = require('util')
const TUNNEL = promisify(require('tunnel-ssh'))
const JOI = require('joi')

/**
 * Connect mongoose with AWS DocumentDB.
 * @param {MongooseRemoteOptions} options
 */
module.exports.connect = async options => {

    const optionsValidation = JOI
        .object()
        .keys({
            env: JOI.string().allow('remote').required(),
            makeTunnel: JOI.boolean().required(),
            vpcTunnelEC2RdsSslCA: JOI.string().required(),
            vpcTunnelEC2Username: JOI.string().required(),
            vpcTunnelEC2Host: JOI.string().required(),
            vpcTunnelEC2Port: JOI.number().required(),
            vpcTunnelEC2PortLocal: JOI.number().required(),
            vpcTunnelEC2PrivateKey: JOI.string().required(),
            documentdbClusterEndpoint: JOI.string().required(),
            documentdbClusterPort: JOI.number().required(),
            documentdbClusterDbName: JOI.string().required(),
            documentdbClusterUsername: JOI.string().required(),
            documentdbClusterPassword: JOI.string().required(),
            documentdbEndpoint: JOI.string().required(),
            documentdbPort: JOI.number().required(),
        })
        .validate(options)
    if (optionsValidation.error) return Promise.reject(optionsValidation.error)

    return options.makeTunnel
        ? _connectThroughSSHTunnel(options)
        : _connect(options)
}

/**
 * Make an ssh tunnel that forward calls to DocumentDB to a EC2 instance that is
 * in the same VPC as the DocumentDB cluster.
 * @param {MongoDBRemoteOptions} options
 */
async function _connectThroughSSHTunnel(options) {

    const tunnelConfigurations = {
        username: options.vpcTunnelEC2Username,
        host: options.vpcTunnelEC2Host,
        port: options.vpcTunnelEC2Port,
        privateKey: options.vpcTunnelEC2PrivateKey,
        dstHost: options.documentdbClusterEndpoint,
        dstPort: options.documentdbClusterPort,
        localPort: options.vpcTunnelEC2PortLocal,
    }
    const tunnel = await TUNNEL(tunnelConfigurations)
        .catch(err => err)
    if (tunnel instanceof Error) return Promise.reject(tunnel)

    /**
     * @type {MONGOOSE.ConnectionOptions} Mongoose connection options.
     */
    const mongooseOptions = {
        dbName: options.documentdbClusterDbName,
        useNewUrlParser: true,
        useCreateIndex: true,
        ssl: true,
        sslCA: options.vpcTunnelEC2RdsSslCA,
        user: options.documentdbClusterUsername,
        pass: options.documentdbClusterPassword,
    }
    const {
        documentdbClusterUsername: user,
        documentdbClusterPassword: pass,
        documentdbEndpoint: endpoint,
        documentdbPort: port,
    } = options

    return MONGOOSE.connect(
        `mongodb://${user}:${pass}@${endpoint}:${port}`,
        mongooseOptions,
    )
        .then(
            () => Promise.resolve('Connected to DocumentDB through our EC2 ssh tunnel with Mongoose.')
        )
        .catch(
            error => Promise.reject({
                message: 'Error. Could not connect to DocumentDB through our EC2 ssh tunnel with Mongoose.', error,
            })
        )
}

/**
 * Directly connet to the DocumentDB cluster. Works if your applications live in the same
 * in the same VPC as the DocumentDB cluster.
 * @param {MongooseRemoteOptions} options
 */
async function _connect({
    documentdbClusterDbName: dbName,
    documentdbClusterUsername: user,
    documentdbClusterPassword: pass,
    documentdbClusterEndpoint: endpoint,
    documentdbClusterPort: port,
    vpcTunnelEC2RdsSslCA: sslCA,
}) {

    /**
     * @type {MONGOOSE.ConnectionOptions} Mongoose connection options.
     */
    const mongooseOptions = {
        dbName,
        useNewUrlParser: true,
        useCreateIndex: true,
        ssl: true,
        sslCA,
        user,
        pass,
    }

    return MONGOOSE.connect(
        `mongodb://${user}:${pass}@${endpoint}:${port}`,
        mongooseOptions,
    )
        .then(
            () => Promise.resolve('Connected to DocumentDB with Mongoose.')
        )
        .catch(
            error => Promise.reject({
                message: 'Error. Could not connect to DocumentDB with Mongoose.', error,
            })
        )
}

/**
 * @typedef MongooseRemoteOptions
 * @type {{
 *     env: 'remote',
 *     makeTunnel: boolean,
 *     vpcTunnelEC2RdsSslCA: string,
 *     vpcTunnelEC2Username: string,
 *     vpcTunnelEC2Host: string,
 *     vpcTunnelEC2Port: number,
 *     vpcTunnelEC2PortLocal: number,
 *     vpcTunnelEC2PrivateKey: string,
 *     documentdbClusterEndpoint: string,
 *     documentdbClusterPort: number,
 *     documentdbClusterDbName: string,
 *     documentdbClusterUsername: string,
 *     documentdbClusterPassword: string,
 *     documentdbEndpoint: string,
 *     documentdbPort: number,
 * }}
 */
