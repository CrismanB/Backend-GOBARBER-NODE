const { Router } = require("express");
const multer = require("multer");
const multerConfig = require("./config/multer");

const UserController = require("./App/controllers/UserController");
const SessionController = require("./App/controllers/SessionController");
const FileController = require("./App/controllers/FileController");
const ProviderController = require("./App/controllers/ProviderController");
const AppointmentController = require("./App/controllers/AppointmentController");
const ScheduleController = require("./App/controllers/ScheduleController");
const NotificationsController = require("./App/controllers/NotificationsController");
const AvailableController = require("./App/controllers/AvailableController");

const routes = new Router();
const upload = multer(multerConfig);
const authMiddleware = require("./App/middlewares/auth");

routes.post("/users", UserController.store);
routes.post("/session", SessionController.store);

routes.use(authMiddleware);

routes.put("/users", UserController.update);

routes.get("/providers", ProviderController.index);
routes.get("/providers/:providerId/available", AvailableController.index);

routes.post("/appointment", AppointmentController.store);
routes.get("/appointment", AppointmentController.index);
routes.delete("/appointment/:id", AppointmentController.destroy);

routes.get("/schedule", ScheduleController.index);

routes.get("/notifications", NotificationsController.index);
routes.put("/notifications/:id", NotificationsController.update);

routes.post("/files", upload.single("file"), FileController.store);
module.exports = routes;
