import asyncio
import logging
from aiohttp import web
from aiogram import Bot, Dispatcher, Router
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.types import Message
from aiogram.filters import CommandStart, CommandObject

from config import BOT_TOKEN, SERVER_HOST, SERVER_PORT

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

bot = Bot(token=BOT_TOKEN, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
dp = Dispatcher()
router = Router()

# Хранилище связок token -> chat_id (в проде использовать Redis/DB)
user_tokens: dict[str, int] = {}


@router.message(CommandStart(deep_link=True))
async def cmd_start_with_token(message: Message, command: CommandObject):
    """Обработка /start с токеном привязки"""
    token = command.args
    if token:
        user_tokens[token] = message.chat.id
        logger.info(f"Привязан токен {token} к chat_id {message.chat.id}")
        await message.answer(
            "✅ <b>Telegram привязан!</b>\n\n"
            "Вернитесь в игру и выиграйте, чтобы получить промокод на скидку! 🎮✨"
        )
    else:
        await message.answer(
            "👋 Привет!\n\n"
            "Чтобы привязать Telegram, нажмите кнопку «Подключить Telegram» на сайте игры."
        )


@router.message(CommandStart())
async def cmd_start(message: Message):
    """Обработка /start без токена"""
    await message.answer(
        "👋 Привет!\n\n"
        "Чтобы привязать Telegram, нажмите кнопку «Подключить Telegram» на сайте игры."
    )


dp.include_router(router)


async def handle_game_result(request: web.Request) -> web.Response:
    """Обработка результата игры от фронтенда"""
    try:
        data = await request.json()
        token = data.get("token")
        result = data.get("result")
        promo_code = data.get("promoCode")

        if not token:
            return web.json_response({"error": "Token required"}, status=400)

        chat_id = user_tokens.get(token)
        if not chat_id:
            return web.json_response({"error": "Token not found", "connected": False}, status=404)

        if result == "win":
            message = f"🎉 <b>Победа!</b>\n\nПромокод выдан: <code>{promo_code}</code>"
        elif result == "lose":
            message = "😔 <b>Проигрыш</b>\n\nПопробуйте ещё раз!"
        elif result == "draw":
            message = "🤝 <b>Ничья</b>\n\nПопробуйте ещё раз!"
        else:
            return web.json_response({"error": "Invalid result"}, status=400)

        await bot.send_message(chat_id=chat_id, text=message)
        logger.info(f"Отправлено {result} для токена {token}")
        
        return web.json_response({"success": True})
    except Exception as e:
        logger.error(f"Ошибка: {e}")
        return web.json_response({"error": str(e)}, status=500)


async def check_connection(request: web.Request) -> web.Response:
    """Проверка привязки токена"""
    try:
        token = request.query.get("token")
        if not token:
            return web.json_response({"connected": False})
        
        connected = token in user_tokens
        return web.json_response({"connected": connected})
    except Exception as e:
        return web.json_response({"error": str(e)}, status=500)


async def health_check(request: web.Request) -> web.Response:
    """Health check для Render"""
    return web.json_response({"status": "ok"})


@web.middleware
async def cors_middleware(request: web.Request, handler):
    """CORS middleware"""
    if request.method == "OPTIONS":
        return web.Response(
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            }
        )
    
    response = await handler(request)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    return response


async def start_bot():
    """Запуск polling бота"""
    await dp.start_polling(bot)


async def start_http_server():
    """Запуск HTTP сервера"""
    app = web.Application(middlewares=[cors_middleware])
    app.router.add_post("/api/game-result", handle_game_result)
    app.router.add_get("/api/check-connection", check_connection)
    app.router.add_get("/health", health_check)
    app.router.add_options("/api/game-result", lambda r: web.Response())
    app.router.add_options("/api/check-connection", lambda r: web.Response())
    
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, SERVER_HOST, SERVER_PORT)
    
    logger.info(f"HTTP сервер: http://{SERVER_HOST}:{SERVER_PORT}")
    await site.start()


async def main():
    logger.info("Запуск бота и HTTP сервера...")
    await asyncio.gather(
        start_bot(),
        start_http_server(),
        asyncio.Event().wait()
    )


if __name__ == "__main__":
    asyncio.run(main())
