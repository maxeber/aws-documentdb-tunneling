const MONGODB = require('mongodb')
const JOI = require('joi')
const DEBUG = require('debug')('mongodb-aws-documentdb-tunneling.local')

/**
 * Start mongodb in local.
 * @param {MongoDBLocalOptions} options
 * @returns {{message: string, client: MONGODB.MongoClient}}
 */
module.exports.connect = options => {

    const optionsValidation = JOI
        .object()
        .keys({
            env: JOI.string().allow(['dev']).required(),
            makeTunnel: JOI.boolean().allow(false).required(),
            documentdbEndpoint: JOI.string().required(),
            documentdbPort: JOI.number().required(),
        })
        .validate(options, { allowUnknown: true })
    if (optionsValidation.error) return Promise.reject(optionsValidation.error)

    /**
     * @type {MONGODB.MongoClientOptions} MongoDB connection options.
     */
    const mongodbOptions = {
        useNewUrlParser: true,
    }
    const uri = `mongodb://${options.documentdbEndpoint}:${options.documentdbPort}`

    DEBUG(`Connecting to ${uri}.`)

    return MONGODB.connect(uri)
        .then(
            client => Promise.resolve({
                message: 'Connected to local MongoDB.', client,
            })
        )
        .catch(
            error => Promise.reject({
                message: 'Error. Could not connect to local MongoDB.', error,
            })
        )
}

/**
 * @typedef MongoDBLocalOptions
 * @type {{
 *     env: 'dev',
 *     makeTunnel: false,
 *     documentdbClusterDbName: string,
 *     documentdbEndpoint: string,
 *     documentdbPort: number,
 * }}
 */
