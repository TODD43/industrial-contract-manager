import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import companiesRouter from "./companies.js";
import suppliersRouter from "./suppliers.js";
import usersRouter from "./users.js";
import contractsRouter from "./contracts.js";
import documentsRouter from "./documents.js";
import auditRouter from "./audit.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/companies", companiesRouter);
router.use("/suppliers", suppliersRouter);
router.use("/users", usersRouter);
router.use("/contracts", contractsRouter);
router.use("/documents", documentsRouter);
router.use("/audit", auditRouter);

export default router;
