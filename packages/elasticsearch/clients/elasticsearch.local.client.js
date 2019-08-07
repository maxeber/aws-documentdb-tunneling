'use strict'

const { Client } = require('@elastic/elasticsearch')
const JOI = require('joi')
const HTTPError = require('node-http-error')
const DEBUG = require('debug')('elasticsearch-aws-tunneling.local')

/**
 * Connect elasticsearch with local node.
 * @param {ElasticsearchLocalOptions} options
 * @returns {{message: string, client: Client}}
 */
module.exports.connect = options => {

    DEBUG('Connecting to local Elasticsearch.')

    const optionsValidation = JOI
        .object()
        .keys({
            env: JOI.string().allow(['dev']).required(),
            makeTunnel: JOI.boolean().allow(false).required(),
            elasticsearchNodeEndpoint: JOI.string().required(),
            elasticsearchNodePort: JOI.number().required(),
        })
        .validate(options, { allowUnknown: true })
    if (optionsValidation.error) throw optionsValidation.error

    /**
     * @type {import '@elastic/elasticsearch'.ClientOptions}
     */
    const elasticsearchOptions = {
        node: `${options.elasticsearchNodeEndpoint}:${options.elasticsearchNodePort}`,
    }

    DEBUG(`Instatiating Elasticsearch client for node "${elasticsearchOptions.node}".`)

    try {
        const client = new Client(elasticsearchOptions)

        return Promise.resolve({
            message: 'Connected to local Elasticsearch.',
            client: client,
        })

    } catch (error) {
        return Promise.reject(
            new HTTPError(500, 'Error. Could not connect to local Elasticsearch.', { error, elasticsearchOptions })
        )
    }
}

/**
 * @typedef ElasticsearchLocalOptions
 * @type {{
 *     env: 'dev',
 *     makeTunnel: false,
 *     elasticsearchNodeEndpoint: string,
 *     elasticsearchNodePort: number,
 * }}
 */
