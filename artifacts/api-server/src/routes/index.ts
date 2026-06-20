import { Router, type IRouter } from "express";
import { requireAuth } from "../lib/authMiddleware";
import healthRouter from "./health";
import dashboardRouter from "./dashboard";
import productsRouter from "./products";
import ordersRouter from "./orders";
import dealersRouter from "./dealers";
import inventoryRouter from "./inventory";
import marketingRouter from "./marketing";
import crmRouter from "./crm";
import supportRouter from "./support";
import blogsRouter from "./blogs";
import storageRouter from "./storage";
import homepageRouter from "./homepage";

const router: IRouter = Router();

router.use(healthRouter);
router.use(requireAuth);
router.use(dashboardRouter);
router.use(productsRouter);
router.use(ordersRouter);
router.use(dealersRouter);
router.use(inventoryRouter);
router.use(marketingRouter);
router.use(crmRouter);
router.use(supportRouter);
router.use(blogsRouter);
router.use(storageRouter);
router.use(homepageRouter);

export default router;
