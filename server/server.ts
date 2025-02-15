import express, { NextFunction, Request, Response } from "express";
import axios from "axios";
import path from "path";
import ejs from "ejs";
import dotenv from "dotenv";
import { loadConfigFromEnv } from "./Config";
import createLogger from "./pino";
import BlaiseAPIRouter from "./BlaiseAPI";
import multer from "multer";
import * as profiler from "@google-cloud/profiler";
import BlaiseApiClient from "blaise-api-node-client";
import { newLoginHandler, Auth } from "blaise-login-react-server";

profiler.start({ logLevel: 4 }).catch((err: unknown) => {
    console.log(`Failed to start profiler: ${err}`);
});

const upload = multer();

const server = express();

server.use(upload.any());

axios.defaults.timeout = 10000;

const logger = createLogger();
server.use(logger);

if (process.env.NODE_ENV !== "production") {
    dotenv.config();
}

// where ever the react built package is
const buildFolder = "../build";

// load the .env variables in the server
const config = loadConfigFromEnv();

const auth = new Auth(config);
const blaiseApiClient = new BlaiseApiClient(config.BlaiseApiUrl);
const loginHandler = newLoginHandler(auth, blaiseApiClient);

// Health Check endpoint
server.get("/bum-ui/:version/health", async function (req: Request, res: Response) {
    console.log("Heath Check endpoint called");
    res.status(200).json({ healthy: true });
});

server.use("/", loginHandler);

// All Endpoints calling the Blaise API
server.use("/", BlaiseAPIRouter(config, auth, blaiseApiClient));


// treat the index.html as a template and substitute the values at runtime
server.set("views", path.join(__dirname, buildFolder));
server.engine("html", ejs.renderFile);
server.use(
    "/static",
    express.static(path.join(__dirname, `${buildFolder}/static`)),
);

server.get("/documents/users.csv", auth.Middleware, function (req: Request, res: Response) {
    res.download(path.join(__dirname, "../resources/users.csv"), (err) => {
        if (err) {
            res.status(500).send({
                message: "Could not download the file. " + err,
            });
        }
    });
});

server.get("*", function (req: Request, res: Response) {
    res.render("index.html", { CATI_DASHBOARD_URL: config.CatiDashboardUrl });
});

server.use(function (err: Error, req: Request, res: Response, next: NextFunction) {
    console.error(err.stack);
    res.render("../views/500.html", {});
});
export default server;
