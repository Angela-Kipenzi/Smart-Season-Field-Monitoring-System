import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import fieldsRouter from "./fields";
import updatesRouter from "./updates";
import dashboardRouter from "./dashboard";
import exportsRouter from "./exports";
import invitationsRouter from "./invitations";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(fieldsRouter);
router.use(updatesRouter);
router.use(dashboardRouter);
router.use(exportsRouter);
router.use(invitationsRouter);

export default router;
