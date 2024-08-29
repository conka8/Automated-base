"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const config_1 = require("./config");
const config_2 = require("./config/config");
const routes_1 = require("./routes");
const KeyRoute_1 = __importDefault(require("./routes/KeyRoute"));
const connect_1 = __importDefault(require("./db/connect"));
// Load environment variables from .env file
dotenv_1.default.config();
// Create an instance of the Express applications
const app = (0, express_1.default)();
// Set up Cross-Origin Resource Sharing (CORS) options
// Configure CORS to allow requests from your frontend domain
const whitelist = [config_2.FRONTEND_URL, config_2.BACKEND_URL];
console.log(config_2.FRONTEND_URL, config_2.BACKEND_URL, config_2.MONGO_URL);
const corsOptions = {
    origin: function (origin, callback) {
        if (whitelist.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        }
        else {
            callback(new Error("Not allowed by CORS"));
        }
    },
};
app.use(express_1.default.json());
// { extended: false }
app.use((0, cors_1.default)(corsOptions));
// Serve static files from the 'public' folder
app.use(express_1.default.static(path_1.default.join(__dirname, './public')));
// Parse incoming JSON requests using body-parser
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ limit: '50mb', extended: true }));
app.use(body_parser_1.default.json({ limit: '50mb' }));
app.use(body_parser_1.default.urlencoded({ limit: '50mb', extended: true }));
const server = http_1.default.createServer(app);
exports.io = new socket_io_1.Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});
// Define routes for different API endpoints
app.use("/api/v1/key", KeyRoute_1.default);
app.use("/api/v1/snipingbot/raydium", routes_1.RaydiumSnipingRoute);
// app.use("/api/tokens", TokenRouter);
// Define a route to check if the backend server is running
app.get("/", async (req, res) => {
    res.send("Backend Server is Running now!");
});
exports.io.on('connection', (socket) => {
    console.log('A user connected');
});
const start = async () => {
    try {
        await (0, connect_1.default)(config_2.MONGO_URL)
            .then(() => {
            console.log("DB connected");
        })
            .catch((err) => console.log(err));
        server.listen(config_1.BACKEND_PORT, () => {
            console.log(`Server is running on port ${config_1.BACKEND_PORT}`);
        });
    }
    catch (error) {
        console.log(error);
    }
};
start();
// Start the Express server to listen on the specified port
