const winston = require('winston');
require('winston-daily-rotate-file');
const path = require('path');

let logDir = path.join(__dirname, '../appLogs/');
console.log('logdir::', logDir);
logDir = path.join(__dirname, '../appLogs/');

const jsonLogFileFormat = winston.format.combine(
  winston.format.errors({ stack: true }),
  winston.format.timestamp(),
  winston.format.prettyPrint(),
  winston.format.splat(),

);
exports.logger = winston.createLogger({
  level: 'info',
  format: jsonLogFileFormat,
  transports: [
    new winston.transports.DailyRotateFile({
      filename: path.join(logDir, 'scrapper-error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '10m',
      level: 'error',
    }),
    new winston.transports.DailyRotateFile({
      filename: path.join(logDir, 'scrapper-combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '10m',
    }),
    new winston.transports.Console({ colorize: true }),
  ],
});
