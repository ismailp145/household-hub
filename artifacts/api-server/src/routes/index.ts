import { Router, type IRouter } from "express";
import healthRouter from "./health";
import householdsRouter from "./households";

const router: IRouter = Router();

router.use(healthRouter);
router.use(householdsRouter);

export default router;
