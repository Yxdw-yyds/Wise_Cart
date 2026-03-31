import os
import sys
import torch
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
import uvicorn

# 设置路径，确保可以正确加载 ccdrec 中的模块
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.dirname(SCRIPT_DIR)
os.chdir(BASE_DIR)
sys.path.append(BASE_DIR)

# 导入模型和工具类
try:
    from utils.configurator import Config
    from utils.dataset import RecDataset
    from utils.utils import get_model, init_seed
    from utils.dataloader import TrainDataLoader
except ImportError as e:
    print(f"导入模块失败: {e}")
    print(f"当前 Python 路径: {sys.path}")
    sys.exit(1)

app = FastAPI(title="CCDRec 推荐服务")

# 全局变量
model = None
dataset = None
config = None

class RecommendRequest(BaseModel):
    user_id: int
    top_k: int = 10

class RecommendResponse(BaseModel):
    user_id: int
    recommendations: List[int]

@app.on_event("startup")
async def startup_event():
    global model, dataset, config
    
    print(f"🚀 正在启动服务... 基础目录: {BASE_DIR}")
    
    # 初始化配置
    model_name = 'ccdrec'
    dataset_name = 'baby'
    config_dict = {
        'gpu_id': 0,
        'use_gpu': torch.cuda.is_available(),
        'state': 'INFO',
        'data_path': 'data/',  # 对应 models/CCDRec/data/
    }
    
    try:
        # 1. 加载配置 (会自动去 configs 目录下找)
        config = Config(model_name, dataset_name, config_dict)
        init_seed(config['seed'])
        
        # 2. 加载数据集
        print("📦 正在加载数据集...")
        dataset = RecDataset(config)
        
        # 3. 初始化模型结构 (需要 TrainDataLoader 来辅助初始化)
        train_dataset, _, _ = dataset.split()
        train_data = TrainDataLoader(config, train_dataset, batch_size=config['train_batch_size'], shuffle=True)
        train_data.pretrain_setup()
        
        model_class = get_model(config['model'])
        model = model_class(config, train_data).to(config['device'])
        
        # 4. 加载训练好的权重
        checkpoint_path = os.path.join(BASE_DIR, 'weights', 'model.pth')
        if os.path.exists(checkpoint_path):
            model.load_state_dict(torch.load(checkpoint_path, map_location=config['device']))
            print(f"✅ 成功加载模型权重: {checkpoint_path}")
        else:
            print(f"⚠️ 未找到权重文件: {checkpoint_path}，模型将以随机初始化状态运行。")
        
        model.eval()
        
        # 5. 执行一次性采样 (准备项目嵌入向量)
        print("🔄 正在执行模型采样...")
        with torch.no_grad():
            model.sample()
        print("✨ 模型就绪，可以接收推荐请求。")
        
    except Exception as e:
        print(f"❌ 启动失败: {e}")
        import traceback
        traceback.print_exc()

@app.get("/")
async def root():
    return {"message": "CCDRec Recommendation Service is running"}

@app.post("/recommend", response_model=RecommendResponse)
async def recommend(request: RecommendRequest):
    if model is None:
        raise HTTPException(status_code=503, detail="模型未加载或加载失败")
    
    try:
        user_id = request.user_id
        if user_id >= dataset.user_num or user_id < 0:
            raise HTTPException(status_code=400, detail=f"用户 ID {user_id} 不在合法范围内 (0-{dataset.user_num-1})")
        
        # 转换用户 ID 为 Tensor
        interaction = torch.LongTensor([user_id]).to(config['device'])
        
        with torch.no_grad():
            # 获取所有项目的推荐得分
            scores = model.full_sort_predict(interaction)
            # 获取前 K 个推荐的项目索引
            _, topk_index = torch.topk(scores, request.top_k, dim=-1)
            results = topk_index[0].cpu().tolist()
            
        return RecommendResponse(user_id=user_id, recommendations=results)
    
    except Exception as e:
        print(f"推荐接口出错: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
