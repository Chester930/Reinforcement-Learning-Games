from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# 匯入各子 app 的 router
from map_api import app as map_app
from train_api import app as train_app
from analysis_api import app as analysis_app
from settings_api import app as settings_app
from rules_api import app as rules_app

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 將各 app 的路由掛載到主 app
app.mount('/maps', map_app)
app.mount('/train', train_app)
app.mount('/analysis', analysis_app)
app.mount('/settings', settings_app)
app.mount('/rules', rules_app)

# 可加一個首頁健康檢查
@app.get('/')
def root():
    return {"message": "Reinforcement Learning API is running."} 