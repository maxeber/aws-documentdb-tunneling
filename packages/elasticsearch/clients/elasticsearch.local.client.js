'use strict'

const { Client } = require('@elastic/elasticsearch')
const JOI = require('joi')
const DEBUG = require('debug')('elasticsearch-aws-tunneling.local')

/**
 * Connect elasticsearch with local node.
 * @param {ElasticsearchLocalOptions} options
 * @returns {{message: string, client: Client}}
 */
module.exports.connect = options => {

    const optionsValidation = JOI
        .object()
        .keys({
            env: JOI.string().allow(['dev']).required(),
            makeTunnel: JOI.boolean().allow(false).required(),
            elasticsearchNodeEndpoint: JOI.string().required(),
            elasticsearchNodePort: JOI.number().required(),
        })
        .validate(options, { allowUnknown: true })
    if (optionsValidation.error) return Promise.reject(optionsValidation.error)

    /**
     * @type {import '@elastic/elasticsearch'.ClientOptions}
     */
    const elasticsearchOptions = {
        node: `https://${options.elasticsearchNodeEndpoint}:${options.elasticsearchNodePort}`,
    }

    DEBUG(`Instatiating Elasticsearch client for node "${elasticsearchOptions.node}".`)

    return new Client(options)
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
