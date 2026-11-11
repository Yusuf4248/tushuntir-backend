import * as winston from "winston";

/**
 * Log files under logs/ unless LOG_TO_FILE=false (or NODE_ENV=production without LOG_TO_FILE):
 * hosts such as Render keep stdout, and their disk is wiped on restart.
 */
const logToFile =
  (process.env.LOG_TO_FILE?.trim() ||
    (process.env.NODE_ENV === "production" ? "false" : "true")) === "true";

export const winstonConfig = {
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({ all: true }),
        winston.format.label({ label: "ERP" }),
        winston.format.timestamp(),
        winston.format.printf(({ level, message, label, timestamp }) => {
          return `${timestamp} [${label}] ${level}: ${message}`;
        }),
      ),
    }),
    ...(logToFile
      ? [
          new winston.transports.File({
            filename: "logs/combine.log",
            level: "info",
            format: winston.format.combine(
              winston.format.label({ label: "ERP" }),
              winston.format.timestamp(),
              winston.format.json(),
            ),
          }),
          new winston.transports.File({
            filename: "logs/error.log",
            level: "error",
            format: winston.format.combine(
              winston.format.label({ label: "ERP" }),
              winston.format.timestamp(),
              winston.format.json(),
            ),
          }),
        ]
      : []),
  ],
};
