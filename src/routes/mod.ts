import { Router } from "@oak/oak"
import { authRouter } from "./auth.ts"
import { adsRouter } from "./ads.ts"
import { messagesRouter } from "./messages.ts"
import { pagesRouter } from "./pages.ts"

const router = new Router()

// Mount API routes
router.use(authRouter.routes())
router.use(authRouter.allowedMethods())
router.use(adsRouter.routes())
router.use(adsRouter.allowedMethods())
router.use(messagesRouter.routes())
router.use(messagesRouter.allowedMethods())

// Mount page routes last
router.use(pagesRouter.routes())
router.use(pagesRouter.allowedMethods())

export { router }
