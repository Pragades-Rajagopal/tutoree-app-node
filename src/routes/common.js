const Router = require('express').Router();
const userComponent = require('../components/User');

Router.post('/user', userComponent.addUser);

module.exports = Router;