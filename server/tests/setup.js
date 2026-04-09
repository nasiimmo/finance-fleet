const dotenv = require('dotenv')
dotenv.config()

process.env.NODE_ENV = 'test'
process.env.PORT = '8001'
process.env.JWT_SECRET = 'test_secret_key_for_jest'