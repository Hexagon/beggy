import { Router } from "@oak/oak"
import { authRouter } from "./auth.ts"
import { adsRouter } from "./ads.ts"
import { pagesRouter } from "./pages.ts"

const router = new Router()

// Mount API routes
router.use(authRouter.routes())
router.use(authRouter.allowedMethods())
router.use(adsRouter.routes())
router.use(adsRouter.allowedMethods())

// Mount page routes last
router.use(pagesRouter.routes())
router.use(pagesRouter.allowedMethods())

export { router }
