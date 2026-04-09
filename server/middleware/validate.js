const Joi = require('joi')

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false })
  if (error) {
    return res.status(400).json({
      error: true,
      message: 'Validation failed',
      details: error.details.map(d => d.message),
    })
  }
  next()
}

const schemas = {
  register: Joi.object({
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(100).required(),
  }),
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
  createBooking: Joi.object({
    carId: Joi.number().integer().positive().required(),
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().required(),
  }),
  createEnquiry: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().optional().allow(''),
    message: Joi.string().min(10).max(2000).required(),
    carId: Joi.number().integer().optional(),
  }),
  createLeasing: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().min(10).max(20).required(),
    message: Joi.string().max(2000).optional().allow(''),
  }),
}

module.exports = { validate, schemas }