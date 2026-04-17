import os
import sys
from contextlib import asynccontextmanager
from typing import List, Optional

import torch
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.dirname(SCRIPT_DIR)
sys.path.append(BASE_DIR)

try:
    from utils.configurator import Config
    from utils.dataset import RecDataset
    from utils.utils import get_model, init_seed
    from utils.dataloader import TrainDataLoader
except ImportError as e:
    print(f"导入模块失败: {e}")
    print(f"当前 Python 路径: {sys.path}")
    sys.exit(1)


state = {
    "model": None,
    "dataset": None,
    "config": None,
    "user_history": {},
    "ready": False,
    "error": None,
}


def _build_user_history(train_dataset) -> dict:
    """从训练集构造用户历史交互字典，用于推荐时过滤已交互物品。"""
    history = {}
    df = train_dataset.df
    uid_field = train_dataset.uid_field
    iid_field = train_dataset.iid_field
    for uid, iid in zip(df[uid_field].values, df[iid_field].values):
        history.setdefault(int(uid), set()).add(int(iid))
    return history


def _init_model():
    model_name = 'ccdrec'
    dataset_name = 'baby'
    config_dict = {
        'gpu_id': 0,
        'use_gpu': torch.cuda.is_available(),
        'state': 'INFO',
        'data_path': os.path.join(BASE_DIR, 'data') + os.sep,
    }

    config = Config(model_name, dataset_name, config_dict)
    init_seed(config['seed'])

    print("📦 正在加载数据集...")
    dataset = RecDataset(config)

    train_dataset, _, _ = dataset.split()
    train_data = TrainDataLoader(
        config, train_dataset,
        batch_size=config['train_batch_size'], shuffle=True,
    )
    train_data.pretrain_setup()

    model_class = get_model(config['model'])
    model = model_class(config, train_data).to(config['device'])

    checkpoint_path = os.path.join(BASE_DIR, 'weights', 'model.pth')
    if os.path.exists(checkpoint_path):
        model.load_state_dict(torch.load(checkpoint_path, map_location=config['device']))
        print(f"✅ 成功加载模型权重: {checkpoint_path}")
    else:
        print(f"⚠️ 未找到权重文件: {checkpoint_path}，模型将以随机初始化状态运行。")

    model.eval()

    print("🔄 正在执行模型采样...")
    with torch.no_grad():
        model.sample()

    user_history = _build_user_history(train_dataset)

    state.update({
        "model": model,
        "dataset": dataset,
        "config": config,
        "user_history": user_history,
        "ready": True,
        "error": None,
    })
    print(f"✨ 模型就绪：user_num={dataset.user_num}, item_num={dataset.item_num}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"🚀 正在启动服务... 基础目录: {BASE_DIR}")
    try:
        _init_model()
    except Exception as e:
        import traceback
        traceback.print_exc()
        state["error"] = str(e)
        state["ready"] = False
    yield
    state["model"] = None
    state["dataset"] = None


app = FastAPI(title="CCDRec 推荐服务", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=False,
)


class RecommendRequest(BaseModel):
    user_id: int
    top_k: int = 10
    filter_history: bool = True


class RecommendResponse(BaseModel):
    user_id: int
    recommendations: List[int]
    scores: List[float]
    model: str = "ccdrec"


@app.get("/")
def root():
    return {"message": "CCDRec Recommendation Service is running", "ready": state["ready"]}


@app.get("/health")
def health():
    return {
        "ready": state["ready"],
        "error": state["error"],
        "user_num": state["dataset"].user_num if state["dataset"] is not None else None,
        "item_num": state["dataset"].item_num if state["dataset"] is not None else None,
    }


@app.post("/recommend", response_model=RecommendResponse)
def recommend(request: RecommendRequest):
    if not state["ready"] or state["model"] is None:
        raise HTTPException(status_code=503, detail=f"模型未就绪: {state['error']}")

    model = state["model"]
    dataset = state["dataset"]
    config = state["config"]
    user_history = state["user_history"]

    user_id = request.user_id
    top_k = max(1, request.top_k)

    if user_id < 0 or user_id >= dataset.user_num:
        raise HTTPException(
            status_code=400,
            detail=f"用户 ID {user_id} 不在合法范围 (0 ~ {dataset.user_num - 1})",
        )

    try:
        interaction = torch.LongTensor([user_id]).to(config['device'])
        with torch.no_grad():
            scores = model.full_sort_predict(interaction)
            if scores.dim() == 1:
                scores = scores.unsqueeze(0)

            if request.filter_history:
                hist = user_history.get(user_id)
                if hist:
                    idx = torch.tensor(list(hist), dtype=torch.long, device=scores.device)
                    scores[0, idx] = float('-inf')

            k = min(top_k, scores.shape[-1])
            topk_scores, topk_index = torch.topk(scores, k, dim=-1)

        return RecommendResponse(
            user_id=user_id,
            recommendations=topk_index[0].cpu().tolist(),
            scores=topk_scores[0].cpu().tolist(),
        )

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"推荐失败: {e}")


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
