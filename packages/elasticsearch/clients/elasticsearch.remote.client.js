'use strict'

const { Client } = require('@elastic/elasticsearch')
const { promisify } = require('util')
const TUNNEL = promisify(require('tunnel-ssh'))
const JOI = require('joi')
const DEBUG = require('debug')('elasticsearch-aws-tunneling.remote')

/**
 * Connect elasticsearch with AWS Elasticsearch node.
 * @param {ElasticsearchRemoteOptions} options
 * @returns {Promise<Client>}
 * @async
 */
module.exports.connect = async options => {

    const optionsValidation = JOI
        .object()
        .keys({
            env: JOI.string().allow('remote').required(),
            makeTunnel: JOI.boolean().required(),
            sslCA: JOI.string().required(),
            vpcTunnelEC2Username: JOI.string().required(),
            vpcTunnelEC2Host: JOI.string().required(),
            vpcTunnelEC2Port: JOI.number().required(),
            vpcTunnelEC2PrivateKey: JOI.string().required(),
            elasticsearchClusterEndpoint: JOI.string().required(),
            elasticsearchClusterPort: JOI.number().required(),
            elasticsearchNodeEndpoint: JOI.string().required(),
            elasticsearchNodePort: JOI.string().required(),
        })
        .validate(options)
    if (optionsValidation.error) return Promise.reject(optionsValidation.error)

    const client = options.makeTunnel
        ? await _connectThroughSSHTunnel(options)
        : _connect(options)

    return Promise.resolve(client)
}

/**
 * Make an SSH tunnel that forward calls to Elasticsearch to a EC2 instance that is
 * in the same VPC as the AWS Elasticsearch cluster.
 * @param {ElasticsearchRemoteOptions} options
 */
async function _connectThroughSSHTunnel(options) {

    /**
     * @type {import 'tunnel-ssh'.Config}
     */
    const tunnelConfigurations = {
        username: options.vpcTunnelEC2Username,
        host: options.vpcTunnelEC2Host,
        port: options.vpcTunnelEC2Port,
        privateKey: options.vpcTunnelEC2PrivateKey,
        dstHost: options.elasticsearchClusterEndpoint,
        dstPort: options.elasticsearchClusterPort,
        localPort: options.elasticsearchNodePort,
    }
    const tunnel = await TUNNEL(tunnelConfigurations)
        .catch(err => err)
    if (tunnel instanceof Error) return Promise.reject(tunnel)

    DEBUG(`Tunnel listening on port ${options.elasticsearchNodePort}.`)

    /**
     * @type {import '@elastic/elasticsearch'.ClientOptions} Elasticsearch client options.
     */
    const elasticsearchOptions = {
        node: `${options.elasticsearchNodeEndpoint}:${options.elasticsearchNodePort}`,
    }

    DEBUG(`Instatiating Elasticsearch client for node "${elasticsearchOptions.node}".`)

    return Promise.resolve(
        new Client(elasticsearchOptions)
    )
}

/**
 * Directly connet to the Elasticsearch cluster. Works if your applications live in the same
 * in the same VPC as the cluster.
 * @param {ElasticsearchRemoteOptions} options
 */
function _connect({
    elasticsearchClusterEndpoint: endpoint,
    elasticsearchClusterPort: port,
}) {

    /**
     * @type {import '@elastic/elasticsearch'.ClientOptions} Elasticsearch client options.
     */
    const elasticsearchOptions = {
        node: `${endpoint}:${port}`,
    }

    DEBUG(`Instatiating Elasticsearch client for node "${elasticsearchOptions.node}".`)

    return Promise.resolve(
        new Client(elasticsearchOptions)
    )
}

/**
 * @typedef ElasticsearchRemoteOptions
 * @type {{
 *     env: 'remote',
 *     makeTunnel: boolean,
 *     sslCA: string,
 *     vpcTunnelEC2Username: string,
 *     vpcTunnelEC2Host: string,
 *     vpcTunnelEC2Port: number,
 *     vpcTunnelEC2PrivateKey: string,
 *     elasticsearchClusterEndpoint: string,
 *     elasticsearchClusterPort: number,
 *     elasticsearchNodeEndpoint: string,
 *     elasticsearchNodePort: string,
 * }}
 */
