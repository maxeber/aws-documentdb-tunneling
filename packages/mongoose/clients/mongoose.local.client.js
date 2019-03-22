const MONGOOSE = require('mongoose')
const JOI = require('joi')
const DEBUG = require('debug')('mongoose-aws-documentdb-tunneling.local')

/**
 * Start mongoose in local.
 * @param {MongooseLocalOptions} options
 */
module.exports.connect = options => {

    const optionsValidation = JOI
        .object()
        .keys({
            env: JOI.string().allow('local').required(),
            makeTunnel: JOI.boolean().allow(false).required(),
            documentdbClusterDbName: JOI.string().required(),
            documentdbEndpoint: JOI.string().required(),
            documentdbPort: JOI.number().required(),
        })
        .validate(options, { allowUnknown: true })
    if (optionsValidation.error) return Promise.reject(optionsValidation.error)

    /**
     * @type {MONGOOSE.ConnectionOptions} Mongoose connection options.
     */
    const mongooseOptions = {
        dbName: options.documentdbClusterDbName,
        useNewUrlParser: true,
        useCreateIndex: true,
    }
    const uri = `mongodb://${options.documentdbEndpoint}:${options.documentdbPort}`

    DEBUG(`Connecting to ${uri}.`)

    return MONGOOSE.connect(uri, mongooseOptions)
        .then(
            () => Promise.resolve('Connected to local MongoDB with Mongoose.')
        )
        .catch(
            error => Promise.reject({
                message: 'Error. Could not connect to local MongoDB with Mongoose.', error,
            })
        )
}

/**
 * @typedef MongooseLocalOptions
 * @type {{
 *     env: 'local',
 *     makeTunnel: false,
 *     documentdbClusterDbName: string,
 *     documentdbEndpoint: string,
 *     documentdbPort: number,
 * }}
 */
