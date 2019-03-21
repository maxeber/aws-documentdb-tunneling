const MONGODB = require('mongodb')
const { promisify } = require('util')
const TUNNEL = promisify(require('tunnel-ssh'))
const JOI = require('joi')
const DEBUG = require('debug')('mongodb.remote')

/**
 * Connect mongodb with AWS DocumentDB.
 * @param {MongoDBRemoteOptions} options
 * @returns {MONGODB.MongoClient}
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

    DEBUG(`Tunnel listening on port ${options.vpcTunnelEC2PortLocal}.`)

    /**
     * @type {MONGODB.MongoClientOptions} MongoDB connection options.
     */
    const mongoDBOptions = {
        useNewUrlParser: true,
        ssl: true,
        sslCA: options.vpcTunnelEC2RdsSslCA,
    }
    const {
        documentdbClusterUsername: user,
        documentdbClusterPassword: pass,
        documentdbEndpoint: endpoint,
        vpcTunnelEC2PortLocal: port,
    } = options
    const uri = `mongodb://${user}:${pass}@${endpoint}:${port}`

    return MONGODB.connect(uri, mongoDBOptions)
        .then(
            client => Promise.resolve({
                message: 'Connected to DocumentDB through our EC2 ssh tunnel with MongoDB.', client,
            })
        )
        .catch(
            error => Promise.reject({
                message: 'Error. Could not connect to DocumentDB through our EC2 ssh tunnel with MongoDB.', uri, error,
            })
        )
}

/**
 * Directly connet to the DocumentDB cluster. Works if your applications live in the same
 * in the same VPC as the DocumentDB cluster.
 * @param {MongoDBRemoteOptions} options
 */
async function _connect({
    documentdbClusterUsername: user,
    documentdbClusterPassword: pass,
    documentdbClusterEndpoint: endpoint,
    documentdbClusterPort: port,
    vpcTunnelEC2RdsSslCA: sslCA,
}) {

    /**
     * @type {MONGODB.MongoClientOptions} MongoDB connection options.
     */
    const mongoDBOptions = {
        useNewUrlParser: true,
        ssl: true,
        sslCA,
    }

    return MONGODB.connect(
        `mongodb://${user}:${pass}@${endpoint}:${port}`,
        mongoDBOptions,
    )
        .then(
            () => Promise.resolve('Connected to DocumentDB with MongoDB.')
        )
        .catch(
            error => Promise.reject({
                message: 'Error. Could not connect to DocumentDB with MongoDB.', error,
            })
        )
}


/**
 * @typedef MongoDBRemoteOptions
 * @type {{
 *     env: 'remote',
 *     makeTunnel: true | false,
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
