const path = require('path');
require('dotenv').config({
    path: path.resolve('./.env'),
});

const nodemailer = require('nodemailer');
const hbs = require('handlebars');
const fs = require('fs');
const constants = require('../config/constants');

const transporter = nodemailer.createTransport({
    service: process.env.MAIL_SERVICE,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    }
});

module.exports = {
    /**
     * Triggers an email when a new user is registered
     * @param {string} email 
     * @param {string} pin
     * @param {string} type
     */
    sendRegistrationOTPEmail: async (email, pin, type) => {
        try {
            const subject = type === constants.emailType.register
                ? constants.email.verificationSubject : constants.email.resentOTPsubject;
            const finalTemplate = getTemplate(constants.emailTemplates.otp, { email: email, pin: pin });
            const info = await transporter.sendMail({
                from: process.env.TUTOR_MAIL,
                to: email,
                subject: subject,
                html: finalTemplate,
            });
            console.log(constants.email.messages.sent);
            console.log(info);
        } catch (error) {
            console.error(constants.email.messages.triggerError);
            console.error(error);
        }
    },

    /**
     * Triggers an email when student requests a tutor
     * @param {string} tutorMail 
     * @param {object} studentInfo student name, interests, mail 
     */
    sendTutorRequest: async (tutorMail, studentInfo) => {
        try {
            const finalTemplate = getTemplate(constants.emailTemplates.tutorRequest, {
                studentName: studentInfo.name,
                interests: studentInfo.interests,
                studentMail: studentInfo.mail
            });
            const info = await transporter.sendMail({
                from: process.env.TUTOR_MAIL,
                to: tutorMail,
                subject: constants.email.studentRequest,
                html: finalTemplate,
            });
            console.log(constants.email.messages.sent);
            console.log(info);
        } catch (error) {
            console.error(constants.email.messages.triggerError);
            console.error(error);
        }
    }
}

/**
 * Returns file path for the given HTML template
 * @param {string} fileName 
 * @returns filepath
 */
const getTemplatePath = (fileName) => {
    return path.resolve(__dirname, '../../', 'public/views', fileName);
}

/**
 * Generates html template to email trigger
 * @param {string} template HTML filename
 * @param {object} context options
 * @returns html file
 */
const getTemplate = (template, context) => {
    const file = fs.readFileSync(getTemplatePath(`${template}.html`), { encoding: 'utf-8' });
    if (template === constants.emailTemplates.otp) {
        const template = hbs.compile(file);
        const variables = {
            email: context.email,
            otp: context.pin,
        }
        return template(variables);
    }
    if (template === constants.emailTemplates.tutorRequest) {
        const template = hbs.compile(file);
        const variables = {
            student_name: context.studentName,
            interests: context.interests,
            student_mail: context.studentMail
        };
        return template(variables);
    }
}