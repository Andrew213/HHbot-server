import { ErrorRequestHandler, RequestHandler, Router } from "express";
import cookieParserMiddleware from "cookie-parser";
import auth from "../middlewares/auth";

const cookieParser: RequestHandler = cookieParserMiddleware();

const middlewares: Array<RequestHandler | ErrorRequestHandler> = [
  cookieParser,
  auth,
];

export function appRoutes(router: Router) {
  router.get("*", middlewares);
}
