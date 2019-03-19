const MONGODB = require('mongodb')
const JOI = require('joi')

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

    return MONGODB.connect(
        `mongodb://${options.documentdbEndpoint}:${options.documentdbPort}`, mongodbOptions
    )
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
