'use strict'

const ELASTIC_SEARCH_LOCAL = require('./clients/elasticsearch.local.client')
const ELASTIC_SEARCH_REMOTE = require('./clients/elasticsearch.remote.client')
const JOI = require('joi')
const DEBUG = require('debug')('elasticsearch-aws-tunneling')

/**
 * @type {import('@elastic/elasticsearch').Client}
 */
let Client

/**
 * @type {() => import('@elastic/elasticsearch').Client}
 */
module.exports.Client = () => Client

/**
 * To use this SDK, call the `init` function as early as possible in the entry modules.
 * @param {ElasticsearchOptions} options Options for the SSH tunnel and `elasticsearch` client.
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

    const connect = options.env === 'local'
        ? ELASTIC_SEARCH_LOCAL.connect
        : ELASTIC_SEARCH_REMOTE.connect

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
 * @typedef ElasticsearchOptions
 * @type {{
 *     env: 'local' | 'remote',
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
