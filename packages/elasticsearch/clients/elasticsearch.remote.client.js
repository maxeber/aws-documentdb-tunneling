'use strict'

const { Client } = require('@elastic/elasticsearch')
const { promisify } = require('util')
const TUNNEL = promisify(require('tunnel-ssh'))
const JOI = require('joi')
const HTTPError = require('node-http-error')
const DEBUG = require('debug')('elasticsearch-aws-tunneling.remote')

/**
 * Connect elasticsearch with AWS Elasticsearch node.
 * @param {ElasticsearchRemoteOptions} options
 * @returns {Promise<Client>}
 * @async
 */
module.exports.connect = async options => {

    DEBUG('Connecting to remote Elasticsearch.')

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
    if (optionsValidation.error) throw optionsValidation.error

    return options.makeTunnel
        ? await _connectThroughSSHTunnel(options)
        : _connect(options)
}

/**
 * Make an SSH tunnel that forward calls to Elasticsearch to a EC2 instance that is
 * in the same VPC as the AWS Elasticsearch cluster.
 * @param {ElasticsearchRemoteOptions} options
 */
async function _connectThroughSSHTunnel(options) {

    DEBUG('Client is outside VPC, connecting to cluster through SSH tunnel.')

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
    if (tunnel instanceof Error) return Promise.reject(
        new HTTPError(500, 'Error. Could not create SSH tunnel.', { error: tunnel, options })
    )

    DEBUG(`Tunnel listening on port ${options.elasticsearchNodePort}.`)

    /**
     * @type {import '@elastic/elasticsearch'.ClientOptions} Elasticsearch client options.
     */
    const elasticsearchOptions = {
        node: `${options.elasticsearchNodeEndpoint}:${options.elasticsearchNodePort}`,
    }

    DEBUG(`Instatiating Elasticsearch client for node "${elasticsearchOptions.node}".`)

    try {
        const client = new Client(elasticsearchOptions)

        return Promise.resolve({
            message: 'Connected to remote Elasticsearch through our EC2 ssh tunnel.',
            client: client,
        })
    } catch (error) {
        return Promise.reject(
            new HTTPError(500, 'Error. Could not connect to remote Elasticsearch through our EC2 ssh tunnel..', { error, elasticsearchOptions })
        )
    }
}

/**
 * Directly connet to the Elasticsearch cluster. Works if your applications live in the same
 * in the same VPC as the cluster.
 * @param {ElasticsearchRemoteOptions} options
 */
function _connect({
    elasticsearchClusterEndpoint,
    elasticsearchClusterPort,
}) {

    DEBUG('Client is inside VPC, connecting directly to cluster.')

    /**
     * @type {import '@elastic/elasticsearch'.ClientOptions} Elasticsearch client options.
     */
    const elasticsearchOptions = {
        node: `${elasticsearchClusterEndpoint}:${elasticsearchClusterPort}`,
    }

    DEBUG(`Instatiating Elasticsearch client for node "${elasticsearchOptions.node}".`)

    try {
        const client = new Client(elasticsearchOptions)

        return Promise.resolve({
            message: 'Connected to remote Elasticsearch.',
            client: client,
        })

    } catch (error) {
        return Promise.reject(
            new HTTPError(500, 'Error. Could not connect to remote Elasticsearch.', { error, elasticsearchOptions })
        )
    }
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
 *     elasticsearchNodePort: number,
 * }}
 */
